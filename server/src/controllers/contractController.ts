import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { ContractParsingService } from '../services/contractParsingService';
import { HistoryService } from '../services/historyService';
import { logger } from '../utils/logger';
import {
  ApiResponse,
  ContractParseResult,
  EngineeringClass,
  ProjectType,
  ProjectInfo,
  ContractType,
  CompanyQualification,
  ManagementLevel,
  PremiumCalculationResult
} from '../types';

export class ContractController {
  private contractParsingService: ContractParsingService;
  private historyService: HistoryService;
  private parseHistory: Array<{
    id: string;
    fileName: string;
    parseResult: ContractParseResult;
    createdAt: Date;
  }> = [];

  constructor() {
    this.contractParsingService = new ContractParsingService();
    this.historyService = new HistoryService();
  }

  /**
   * 解析合同文件
   */
  public parseContract = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: '请上传合同文件'
        });
        return;
      }

      const { originalname, path: filePath } = req.file;

      logger.info('开始解析合同', {
        fileName: originalname,
        fileSize: req.file.size,
        filePath
      });

      // 执行合同解析
      const { parseResult, projectId, businessNo } = await this.contractParsingService.parseContract(filePath, originalname);

      // 保存解析结果到数据库历史表
      try {
        // 构建项目信息
        const projectInfo: ProjectInfo = {
          projectName: parseResult.projectName,
          projectType: parseResult.totalArea ? ProjectType.RURAL : ProjectType.NON_RURAL,
          engineeringClass: parseResult.engineeringClass || EngineeringClass.CLASS_TWO,
          totalCost: parseResult.totalCost || undefined,
          totalArea: parseResult.totalArea || undefined,
          contractType: ContractType.GENERAL,
          companyQualification: CompanyQualification.SECOND,
          managementLevel: ManagementLevel.RELATIVELY_SOUND,
          startDate: parseResult.startDate || new Date(),
          endDate: parseResult.endDate || new Date(),
          constructionUnit: parseResult.constructionUnit,
          address: parseResult.address
        };

        // 构建保费计算结果（暂时使用默认值）
        const premiumResult: PremiumCalculationResult = {
          mainInsurance: 0,
          medicalInsurance: 0,
          allowanceInsurance: 0,
          acuteDiseaseInsurance: 0,
          plateauDiseaseInsurance: 0,
          totalPremium: 0,
          calculationDetails: {
            basePremium: 0,
            adjustmentFactors: {
              k1: 1,
              k2: 1,
              k3: 1,
              k4: 1,
              k5: 1,
              k6: 1,
              k7: 1,
              k8: 1
            }
          }
        };

        // 保存到历史数据表
        await this.historyService.saveCalculationHistory(
          projectInfo,
          premiumResult,
          projectId
        );

        logger.info('合同解析数据已保存到历史表', {
          projectId,
          projectName: parseResult.projectName,
          constructionUnit: parseResult.constructionUnit,
          address: parseResult.address
        });
      } catch (error) {
        logger.error('保存历史数据失败', error);
        // 不影响解析流程，继续执行
      }

      // 保存解析历史（内存）
      const historyRecord = {
        id: this.generateId(),
        fileName: originalname,
        parseResult,
        projectId,
        businessNo,
        createdAt: new Date()
      };
      this.parseHistory.unshift(historyRecord);

      // 清理上传的文件
      this.cleanupFile(filePath);

      // 增强解析结果
      const enhancedResult = {
        ...this.enhanceParseResult(parseResult),
        projectId,
        businessNo
      };

      const response: ApiResponse<typeof enhancedResult> = {
        success: true,
        data: enhancedResult,
        message: '合同解析成功'
      };

      logger.info('合同解析完成', {
        fileName: originalname,
        projectName: parseResult.projectName,
        confidence: parseResult.confidence,
        projectId,
        businessNo
      });

      res.json(response);

    } catch (error) {
      logger.error('合同解析失败', error);

      // 清理上传的文件
      if (req.file?.path) {
        this.cleanupFile(req.file.path);
      }

      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : '合同解析失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 获取解析历史
   */
  public getParseHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;

      const paginatedHistory = this.parseHistory.slice(startIndex, endIndex);

      const response: ApiResponse = {
        success: true,
        data: {
          history: paginatedHistory,
          pagination: {
            current: pageNum,
            pageSize: limitNum,
            total: this.parseHistory.length,
            totalPages: Math.ceil(this.parseHistory.length / limitNum)
          }
        },
        message: '获取解析历史成功'
      };

      res.json(response);

    } catch (error) {
      logger.error('获取解析历史失败', error);

      const response: ApiResponse = {
        success: false,
        error: '获取解析历史失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 重新解析合同
   */
  public reparseContract = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const historyRecord = this.parseHistory.find(record => record.id === id);
      if (!historyRecord) {
        res.status(404).json({
          success: false,
          error: '解析记录不存在'
        });
        return;
      }

      // 这里简化处理，实际应该重新调用解析服务
      // 由于原文件已被清理，这里返回原解析结果
      const response: ApiResponse<ContractParseResult> = {
        success: true,
        data: historyRecord.parseResult,
        message: '重新解析完成'
      };

      res.json(response);

    } catch (error) {
      logger.error('重新解析失败', error);

      const response: ApiResponse = {
        success: false,
        error: '重新解析失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 删除解析记录
   */
  public deleteParseRecord = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const index = this.parseHistory.findIndex(record => record.id === id);
      if (index === -1) {
        res.status(404).json({
          success: false,
          error: '解析记录不存在'
        });
        return;
      }

      this.parseHistory.splice(index, 1);

      const response: ApiResponse = {
        success: true,
        message: '删除解析记录成功'
      };

      res.json(response);

    } catch (error) {
      logger.error('删除解析记录失败', error);

      const response: ApiResponse = {
        success: false,
        error: '删除解析记录失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 获取工程分类建议
   */
  public getEngineeringClassification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectName, address } = req.body;

      if (!projectName) {
        res.status(400).json({
          success: false,
          error: '项目名称不能为空'
        });
        return;
      }

      const recommendedClass = this.contractParsingService.recommendEngineeringClass(
        projectName,
        address || ''
      );

      const projectType = this.contractParsingService.determineProjectType(
        projectName,
        address || ''
      );

      const response: ApiResponse = {
        success: true,
        data: {
          recommendedClass,
          projectType,
          classificationDetails: this.getClassificationDetails(),
          confidence: recommendedClass ? 0.8 : 0.3
        },
        message: '工程分类建议获取成功'
      };

      res.json(response);

    } catch (error) {
      logger.error('获取工程分类建议失败', error);

      const response: ApiResponse = {
        success: false,
        error: '获取工程分类建议失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 检测高原地区
   */
  public checkHighAltitude = async (req: Request, res: Response): Promise<void> => {
    try {
      const { address } = req.body;

      if (!address) {
        res.status(400).json({
          success: false,
          error: '地址信息不能为空'
        });
        return;
      }

      const isHighAltitude = this.contractParsingService.isHighAltitudeRegion(address);

      const response: ApiResponse = {
        success: true,
        data: {
          isHighAltitude,
          address,
          recommendation: isHighAltitude ? '建议勾选高原病附加险' : '无需高原病附加险',
          riskLevel: isHighAltitude ? 'high' : 'normal'
        },
        message: '高原地区检测完成'
      };

      res.json(response);

    } catch (error) {
      logger.error('高原地区检测失败', error);

      const response: ApiResponse = {
        success: false,
        error: '高原地区检测失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 增强解析结果
   * @param parseResult 原始解析结果
   * @returns 增强后的解析结果
   */
  private enhanceParseResult(parseResult: ContractParseResult) {
    const enhanced = {
      ...parseResult,
      recommendations: {
        projectType: this.contractParsingService.determineProjectType(
          parseResult.projectName,
          parseResult.address
        ),
        suggestedClass: parseResult.engineeringClass ||
          this.contractParsingService.recommendEngineeringClass(
            parseResult.projectName,
            parseResult.address
          ),
        isHighAltitude: this.contractParsingService.isHighAltitudeRegion(parseResult.address)
      },
      validationResults: this.validateParseResult(parseResult)
    };

    return enhanced;
  }

  /**
   * 验证解析结果
   * @param parseResult 解析结果
   * @returns 验证结果
   */
  private validateParseResult(parseResult: ContractParseResult): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // 必填字段检查
    if (!parseResult.projectName || parseResult.projectName === '未知项目') {
      errors.push('项目名称缺失或无法识别');
    }

    if (!parseResult.address) {
      warnings.push('工程地址信息不完整');
    }

    if (!parseResult.constructionUnit) {
      warnings.push('施工单位信息缺失');
    }

    // 数据逻辑检查
    if (parseResult.startDate && parseResult.endDate) {
      if (parseResult.startDate >= parseResult.endDate) {
        errors.push('开工日期不能晚于或等于竣工日期');
      }
    }

    if (parseResult.totalCost && parseResult.totalCost <= 0) {
      errors.push('项目造价数据异常');
    }

    if (parseResult.totalArea && parseResult.totalArea <= 0) {
      errors.push('项目面积数据异常');
    }

    // 置信度检查
    if (parseResult.confidence < 0.5) {
      warnings.push('解析置信度较低，建议人工核实');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * 获取工程分类详情
   * @returns 分类详情
   */
  private getClassificationDetails() {
    return {
      [EngineeringClass.CLASS_ONE]: {
        name: '一类工程',
        description: '室内装修、普通住宅/厂房、市政道路（无桥隧）、园林/亮化工程',
        riskLevel: 'low',
        examples: ['室内装修', '住宅建设', '园林绿化', '市政道路']
      },
      [EngineeringClass.CLASS_TWO]: {
        name: '二类工程',
        description: '火电/风电/港口、机电安装、城市轨道交通（非地下）、消防设施',
        riskLevel: 'medium',
        examples: ['电力工程', '港口建设', '机电安装', '消防设施']
      },
      [EngineeringClass.CLASS_THREE]: {
        name: '三类工程',
        description: '农村自建房、水利工程、公路（桥隧比<50%）、普通拆除工程',
        riskLevel: 'medium-high',
        examples: ['农村建房', '水利设施', '公路建设', '拆除工程']
      },
      [EngineeringClass.CLASS_FOUR]: {
        name: '四类工程',
        description: '高架桥、钢结构、公路（桥隧比≥50%）、爆破工程、地下隧道',
        riskLevel: 'high',
        examples: ['桥梁建设', '钢结构工程', '隧道工程', '爆破作业']
      }
    };
  }

  /**
   * 清理上传的文件
   * @param filePath 文件路径
   */
  private cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info('清理上传文件', { filePath });
      }
    } catch (error) {
      logger.error('清理文件失败', { filePath, error });
    }
  }

  /**
   * 生成唯一ID
   * @returns 唯一标识符
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}