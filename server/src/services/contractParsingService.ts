import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import pdf2pic from 'pdf2pic';
import {
  ContractParseResult,
  EngineeringClass,
  ProjectType
} from '../types';
import { logger } from '../utils/logger';
import { projectService, ProjectSource } from './projectService';

/**
 * AI合同解析服务
 * 负责从合同文件中提取关键信息，包括OCR和LLM处理
 */
export class ContractParsingService {
  private ocrApiKey: string;
  private llmApiKey: string;
  private ocrApiUrl: string;
  private llmApiUrl: string;
  private vlApiUrl: string;  // 多模态API URL
  private cachedAccessToken: string | null = null;
  private tokenExpiryTime: number = 0;

  constructor() {
    this.ocrApiKey = process.env.OCR_API_KEY || '';
    this.llmApiKey = process.env.LLM_API_KEY || '';
    this.ocrApiUrl = process.env.OCR_API_URL || 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic';
    this.llmApiUrl = process.env.LLM_API_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
    // 多模态API URL（用于qwen-vl-max）
    this.vlApiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
  }

  /**
   * 解析合同文件
   * @param filePath 文件路径
   * @param fileName 文件名
   * @returns 解析结果和项目信息
   */
  public async parseContract(filePath: string, fileName: string): Promise<{
    parseResult: ContractParseResult;
    projectId: string;
    businessNo: string;
  }> {
    try {
      logger.info('开始解析合同文件', { fileName });

      // 1. 提取文本内容（作为后备）
      const extractedText = await this.extractTextFromFile(filePath, fileName);

      // 2. 将PDF关键页转换为图片（前3页：封面、工程概况等）
      const keyPageImages = await this.convertPdfKeyPages(filePath, fileName);

      if (keyPageImages.length === 0) {
        // 如果图片转换失败，fallback到文本模式
        logger.warn('PDF转图片失败，使用文本模式');
        const parseResult = await this.analyzeContractWithLLM(extractedText);
        const validatedResult = this.validateAndCleanResult(parseResult, extractedText);
        const project = await projectService.createProject(
          validatedResult.projectName,
          ProjectSource.CONTRACT,
          fileName
        );
        return {
          parseResult: validatedResult,
          projectId: project.project_id,
          businessNo: project.business_no
        };
      }

      // 3. 使用Qwen-VL-Max多模态模型分析图片
      const parseResult = await this.analyzeContractWithVL(keyPageImages, extractedText);

      // 4. 后处理和验证
      const validatedResult = this.validateAndCleanResult(parseResult, extractedText);

      // 5. 创建项目记录
      const project = await projectService.createProject(
        validatedResult.projectName,
        ProjectSource.CONTRACT,
        fileName
      );

      logger.info('合同解析完成', {
        fileName,
        projectName: validatedResult.projectName,
        confidence: validatedResult.confidence,
        projectId: project.project_id,
        businessNo: project.business_no
      });

      return {
        parseResult: validatedResult,
        projectId: project.project_id,
        businessNo: project.business_no
      };

    } catch (error) {
      logger.error('合同解析失败', { fileName, error });
      throw new Error(`合同解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 从文件中提取文本内容
   * @param filePath 文件路径
   * @param fileName 文件名
   * @returns 提取的文本
   */
  private async extractTextFromFile(filePath: string, fileName: string): Promise<string> {
    const fileExtension = path.extname(fileName).toLowerCase();

    try {
      switch (fileExtension) {
        case '.pdf':
          return await this.extractTextFromPDF(filePath);
        case '.docx':
          return await this.extractTextFromDocx(filePath);
        case '.doc':
          // 对于老版本Word文档，可能需要额外处理
          throw new Error('暂不支持.doc格式，请转换为.docx格式');
        default:
          throw new Error(`不支持的文件格式: ${fileExtension}`);
      }
    } catch (error) {
      logger.error('文本提取失败', { fileName, error });
      throw error;
    }
  }

  /**
   * 从PDF文件提取文本
   * @param filePath PDF文件路径
   * @returns 提取的文本
   */
  private async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);

      let text = pdfData.text;

      // 降低OCR触发阈值，只在文本很少或明显乱码时才使用OCR
      // 从200降低到100，并提高乱码检测阈值
      if (text.length < 100 || this.isTextGarbled(text)) {
        logger.info(`PDF文本质量较差（长度: ${text.length}），尝试使用OCR`);
        text = await this.performOCR(filePath);
      } else {
        logger.info(`PDF文本提取成功，长度: ${text.length}字符`);
      }

      return text;
    } catch (error) {
      logger.error('PDF文本提取失败', error);
      // 如果PDF解析失败，尝试OCR
      logger.info('PDF解析失败，fallback到OCR');
      return await this.performOCR(filePath);
    }
  }

  /**
   * 从Word文档提取文本
   * @param filePath Word文档路径
   * @returns 提取的文本
   */
  private async extractTextFromDocx(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      logger.error('Word文档文本提取失败', error);
      throw new Error('Word文档解析失败');
    }
  }

  /**
   * 将PDF的关键页转换为图片
   * 只转换前3页（通常包含封面、工程概况等关键信息）
   * @param filePath PDF文件路径
   * @param fileName 文件名
   * @returns Base64编码的图片数组
   */
  private async convertPdfKeyPages(filePath: string, fileName: string): Promise<string[]> {
    const base64Images: string[] = [];
    const keyPages = [1, 2, 3];  // 只转换前3页

    try {
      logger.info(`开始转换PDF关键页为图片，文件: ${fileName}`);

      // 获取PDF总页数
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const totalPages = pdfData.numpages;

      logger.info(`PDF总页数: ${totalPages}，将转换关键页: ${keyPages.filter(p => p <= totalPages).join(', ')}`);

      // 配置pdf2pic
      const convert = pdf2pic.fromPath(filePath, {
        density: 150,           // 降低DPI加快转换（从300降到150）
        quality: 85,            // JPEG质量
        format: 'jpeg',         // 输出格式
        width: 1200,            // 限制宽度
        height: 1600            // 限制高度
      });

      // 转换关键页
      for (const pageNum of keyPages) {
        if (pageNum > totalPages) {
          logger.warn(`页面${pageNum}超出总页数${totalPages}，跳过`);
          continue;
        }

        try {
          const result = await convert(pageNum);
          // 转换为base64
          const base64 = (result as any).buffer.toString('base64');
          base64Images.push(base64);
          logger.info(`页面${pageNum}转换成功`);
        } catch (error) {
          logger.warn(`页面${pageNum}转换失败`, error);
          // 继续处理下一页
        }
      }

      logger.info(`PDF转图片完成，成功转换${base64Images.length}页`);
      return base64Images;

    } catch (error) {
      logger.error('PDF转图片失败', error);
      // 返回空数组，让调用者fallback到文本模式
      return [];
    }
  }

  /**
   * 执行OCR识别
   * @param filePath 文件路径
   * @returns OCR识别的文本
   */
  private async performOCR(filePath: string): Promise<string> {
    try {
      logger.info('开始OCR识别');
      const startTime = Date.now();

      // 这里使用百度OCR API作为示例
      const imageBase64 = fs.readFileSync(filePath, { encoding: 'base64' });

      const formData = new FormData();
      formData.append('image', imageBase64);

      const response = await axios.post(
        `${this.ocrApiUrl}?access_token=${await this.getBaiduAccessToken()}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 30000 // 30秒超时
        }
      );

      const elapsed = Date.now() - startTime;
      logger.info(`OCR识别完成，耗时: ${elapsed}ms`);

      if (response.data.words_result) {
        return response.data.words_result
          .map((item: any) => item.words)
          .join('\n');
      }

      throw new Error('OCR识别失败');
    } catch (error) {
      logger.error('OCR识别失败', error);
      throw new Error('OCR识别失败');
    }
  }

  /**
   * 获取百度API访问令牌（带缓存）
   * @returns 访问令牌
   */
  private async getBaiduAccessToken(): Promise<string> {
    try {
      // 检查缓存是否有效（提前5分钟刷新）
      const now = Date.now();
      if (this.cachedAccessToken && this.tokenExpiryTime > now + 300000) {
        return this.cachedAccessToken;
      }

      logger.info('获取新的百度访问令牌');
      const response = await axios.post(
        'https://aip.baidubce.com/oauth/2.0/token',
        null,
        {
          params: {
            grant_type: 'client_credentials',
            client_id: process.env.BAIDU_API_KEY,
            client_secret: process.env.BAIDU_SECRET_KEY
          },
          timeout: 10000 // 10秒超时
        }
      );

      const token = response.data.access_token;
      if (!token) {
        throw new Error('未能获取access_token');
      }

      this.cachedAccessToken = token;
      // token有效期30天（2592000000毫秒）
      this.tokenExpiryTime = now + 2592000000;

      logger.info('百度访问令牌已缓存');
      return token;
    } catch (error) {
      logger.error('获取百度访问令牌失败', error);
      throw new Error('获取OCR访问令牌失败');
    }
  }

  /**
   * 判断文本是否乱码
   * @param text 文本内容
   * @returns 是否乱码
   */
  private isTextGarbled(text: string): boolean {
    // 简单的乱码检测逻辑
    const chineseCharCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const totalCharCount = text.length;

    // 如果中文字符比例过低，可能是乱码
    return chineseCharCount / totalCharCount < 0.1;
  }

  /**
   * 使用Qwen-VL-Max多模态模型分析合同图片
   * @param base64Images Base64编码的图片数组
   * @param fallbackText 文本提取的后备内容
   * @returns 解析结果
   */
  private async analyzeContractWithVL(base64Images: string[], fallbackText: string): Promise<ContractParseResult> {
    try {
      logger.info('开始使用Qwen-VL-Max分析合同');
      const startTime = Date.now();

      // 构建多模态消息
      const imageContent = base64Images.map(base64 => ({
        image: `data:image/jpeg;base64,${base64}`
      }));

      const prompt = this.buildOptimizedVLPrompt();

      const response = await axios.post(
        this.vlApiUrl,
        {
          model: 'qwen-vl-max',
          input: {
            messages: [
              {
                role: 'system',
                content: '你是专业的建筑工程合同分析专家，擅长从合同文件中提取关键信息。'
              },
              {
                role: 'user',
                content: [
                  ...imageContent,
                  { text: prompt }
                ]
              }
            ]
          },
          parameters: {
            temperature: 0.01,      // ✅ 降低温度：提高确定性和准确性
            max_tokens: 1200,       // ✅ 减少输出token：加快响应速度
            top_p: 0.9,            // ✅ 降低采样范围
            top_k: 20              // ✅ 限制采样范围
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.llmApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000  // ✅ 30秒超时（从60秒降低）
        }
      );

      const elapsed = Date.now() - startTime;
      logger.info(`Qwen-VL-Max分析完成，耗时: ${elapsed}ms`);

      const analysisResult = response.data.output.text;
      return this.parseAnalysisResult(analysisResult, fallbackText);

    } catch (error) {
      logger.error('Qwen-VL-Max分析失败', error);
      throw new Error('合同智能分析失败');
    }
  }

  /**
   * 使用LLM分析合同内容
   * @param contractText 合同文本
   * @returns 解析结果
   */
  private async analyzeContractWithLLM(contractText: string): Promise<ContractParseResult> {
    try {
      logger.info('开始LLM分析合同');
      const startTime = Date.now();

      const prompt = this.buildAnalysisPrompt(contractText);

      const response = await axios.post(
        this.llmApiUrl,
        {
          model: 'qwen-turbo',
          input: {
            messages: [
              {
                role: 'system',
                content: '你是一个专业的建筑工程合同分析专家，擅长从合同文本中提取关键信息。'
              },
              {
                role: 'user',
                content: prompt
              }
            ]
          },
          parameters: {
            temperature: 0.1,
            max_tokens: 2000
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.llmApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60秒超时
        }
      );

      const elapsed = Date.now() - startTime;
      logger.info(`LLM分析完成，耗时: ${elapsed}ms`);

      const analysisResult = response.data.output.text;
      return this.parseAnalysisResult(analysisResult, contractText);

    } catch (error) {
      logger.error('LLM分析失败', error);
      throw new Error('合同智能分析失败');
    }
  }

  /**
   * 构建优化的多模态提示词
   * 更简洁，针对视觉模型优化
   * @returns 分析提示词
   */
  private buildOptimizedVLPrompt(): string {
    return `
请查看合同图片，快速提取以下关键信息，直接返回JSON格式：

重点关注：
1. 封面：项目名称、建设单位、施工单位
2. 工程概况：造价（万元）、面积（㎡）、工期（开工/竣工日期）、地址
3. 其他：工程分类（1-4类）

工程分类标准：
- 1类：室内装修、普通住宅/厂房、市政道路（无桥隧）、园林/亮化
- 2类：火电/风电/港口、机电安装、城市轨道交通（非地下）、消防设施
- 3类：农村自建房、水利工程、公路（桥隧比<50%）、普通拆除
- 4类：高架桥、钢结构、公路（桥隧比≥50%）、爆破工程、地下隧道

返回JSON（无推理过程，无额外说明）：
{
  "projectName": "项目名称或null",
  "totalCost": 造价数或null,
  "totalArea": 面积数或null,
  "startDate": "YYYY-MM-DD"或null,
  "endDate": "YYYY-MM-DD"或null,
  "address": "地址或null",
  "constructionUnit": "单位或null",
  "engineeringClass": 1-4或null,
  "confidence": 0.0-1.0
}

无法确定的信息填null，日期格式YYYY-MM-DD，造价单位万元。
`;
  }

  /**
   * 构建分析提示词
   * @param contractText 合同文本
   * @returns 分析提示词
   */
  private buildAnalysisPrompt(contractText: string): string {
    return `
请分析以下建筑工程合同，提取关键信息并以JSON格式返回：

合同内容：
${contractText.substring(0, 4000)} // 限制长度避免超出token限制

请提取以下信息：
1. 项目名称 (projectName)
2. 项目总造价 (totalCost) - 单位：万元
3. 项目总面积 (totalArea) - 单位：平方米
4. 开工日期 (startDate) - 格式：YYYY-MM-DD
5. 竣工日期 (endDate) - 格式：YYYY-MM-DD
6. 工程地址 (address)
7. 施工单位 (constructionUnit)
8. 工程分类 (engineeringClass) - 根据以下标准判断：
   - 1类：室内装修、普通住宅/厂房、市政道路（无桥隧）、园林/亮化工程
   - 2类：火电/风电/港口、机电安装、城市轨道交通（非地下）、消防设施
   - 3类：农村自建房、水利工程、公路（桥隧比<50%）、普通拆除工程
   - 4类：高架桥、钢结构、公路（桥隧比≥50%）、爆破工程、地下隧道

返回格式：
{
  "projectName": "项目名称",
  "totalCost": 数值或null,
  "totalArea": 数值或null,
  "startDate": "YYYY-MM-DD"或null,
  "endDate": "YYYY-MM-DD"或null,
  "address": "详细地址",
  "constructionUnit": "施工单位名称",
  "engineeringClass": 1-4的数字或null,
  "confidence": 0.0-1.0的置信度,
  "reasoning": "分析推理过程"
}

注意：
- 如果某项信息无法确定，请设置为null
- 置信度基于信息的明确程度和完整性
- 金额请转换为万元单位
- 日期请统一为YYYY-MM-DD格式
`;
  }

  /**
   * 解析LLM分析结果
   * @param analysisResult LLM返回的分析结果
   * @param originalText 原始文本
   * @returns 解析结果
   */
  private parseAnalysisResult(analysisResult: string, originalText: string): ContractParseResult {
    try {
      // 尝试提取JSON部分
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从分析结果中提取JSON');
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      return {
        projectName: parsedData.projectName || '未知项目',
        totalCost: parsedData.totalCost,
        totalArea: parsedData.totalArea,
        startDate: parsedData.startDate ? new Date(parsedData.startDate) : undefined,
        endDate: parsedData.endDate ? new Date(parsedData.endDate) : undefined,
        address: parsedData.address || '',
        constructionUnit: parsedData.constructionUnit || '',
        engineeringClass: parsedData.engineeringClass,
        confidence: parsedData.confidence || 0.5,
        extractedText: originalText
      };

    } catch (error) {
      logger.error('解析LLM结果失败', error);

      // 如果JSON解析失败，返回基础信息
      return {
        projectName: '解析失败',
        address: '',
        constructionUnit: '',
        confidence: 0.1,
        extractedText: originalText
      };
    }
  }

  /**
   * 验证和清理解析结果
   * @param result 原始解析结果
   * @param originalText 原始文本
   * @returns 验证后的结果
   */
  private validateAndCleanResult(result: ContractParseResult, originalText: string): ContractParseResult {
    // 验证日期逻辑
    if (result.startDate && result.endDate && result.startDate >= result.endDate) {
      logger.warn('日期逻辑错误，清除日期信息');
      result.startDate = undefined;
      result.endDate = undefined;
      result.confidence = Math.max(0.1, result.confidence - 0.2);
    }

    // 验证造价和面积
    if (result.totalCost && result.totalCost <= 0) {
      result.totalCost = undefined;
      result.confidence = Math.max(0.1, result.confidence - 0.1);
    }

    if (result.totalArea && result.totalArea <= 0) {
      result.totalArea = undefined;
      result.confidence = Math.max(0.1, result.confidence - 0.1);
    }

    // 验证工程分类
    if (result.engineeringClass && (result.engineeringClass < 1 || result.engineeringClass > 4)) {
      result.engineeringClass = undefined;
      result.confidence = Math.max(0.1, result.confidence - 0.1);
    }

    // 基于关键信息完整性调整置信度
    const keyFields = [
      result.projectName && result.projectName !== '未知项目',
      result.totalCost || result.totalArea,
      result.startDate,
      result.endDate,
      result.address,
      result.constructionUnit
    ];

    const completeness = keyFields.filter(Boolean).length / keyFields.length;
    result.confidence = Math.min(result.confidence, completeness);

    return result;
  }

  /**
   * 检测高原地区
   * @param address 地址信息
   * @returns 是否为高原地区
   */
  public isHighAltitudeRegion(address: string): boolean {
    const highAltitudeKeywords = [
      '西藏', '青海', '新疆', '甘肃', '四川阿坝', '四川甘孜',
      '云南迪庆', '拉萨', '格尔木', '玉树', '那曲', '阿里',
      '昌都', '林芝', '日喀则', '山南'
    ];

    return highAltitudeKeywords.some(keyword => address.includes(keyword));
  }

  /**
   * 智能推荐工程分类
   * @param projectName 项目名称
   * @param address 项目地址
   * @returns 推荐的工程分类
   */
  public recommendEngineeringClass(projectName: string, address: string): EngineeringClass | null {
    const text = (projectName + ' ' + address).toLowerCase();

    // 四类工程关键词
    const class4Keywords = ['桥', '隧道', '高架', '钢结构', '爆破', '地下', '架线'];
    if (class4Keywords.some(keyword => text.includes(keyword))) {
      return EngineeringClass.CLASS_FOUR;
    }

    // 三类工程关键词
    const class3Keywords = ['农村', '自建房', '水利', '公路', '拆除'];
    if (class3Keywords.some(keyword => text.includes(keyword))) {
      return EngineeringClass.CLASS_THREE;
    }

    // 二类工程关键词
    const class2Keywords = ['电力', '风电', '港口', '机电', '轨道', '消防'];
    if (class2Keywords.some(keyword => text.includes(keyword))) {
      return EngineeringClass.CLASS_TWO;
    }

    // 一类工程关键词
    const class1Keywords = ['装修', '住宅', '厂房', '市政', '园林', '亮化'];
    if (class1Keywords.some(keyword => text.includes(keyword))) {
      return EngineeringClass.CLASS_ONE;
    }

    return null;
  }

  /**
   * 判断项目性质
   * @param projectName 项目名称
   * @param address 项目地址
   * @returns 项目性质
   */
  public determineProjectType(projectName: string, address: string): ProjectType {
    const text = (projectName + ' ' + address).toLowerCase();

    const ruralKeywords = ['农村', '自建房', '村民', '农户', '乡村'];

    if (ruralKeywords.some(keyword => text.includes(keyword))) {
      return ProjectType.RURAL;
    }

    return ProjectType.NON_RURAL;
  }
}