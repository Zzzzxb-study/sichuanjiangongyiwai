import { PDFDocument, rgb } from 'pdf-lib';
import * as Fontkit from '@pdf-lib/fontkit';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

/**
 * PDF导出服务
 * 负责生成报价单PDF并合并条款PDF
 */
export class PDFExportService {
  private clauseFilesDir: string;
  private fontBuffer: Buffer | null = null;

  constructor() {
    // 条款PDF文件所在目录（client/public/assets/clauses）
    // 从 server/src/services 到 client/public/assets/clauses 需要向上三级
    this.clauseFilesDir = path.join(__dirname, '../../../client/public/assets/clauses');
  }

  /**
   * 获取支持中文的字体
   */
  private async getChineseFont(): Promise<Buffer> {
    if (this.fontBuffer) {
      return this.fontBuffer;
    }

    // 尝试从多个可能的路径获取中文字体
    const fontPaths = [
      'C:\\Windows\\Fonts\\simhei.ttf',  // Windows 黑体
      'C:\\Windows\\Fonts\\simsun.ttc',  // Windows 宋体
      '/System/Library/Fonts/PingFang.ttc',  // macOS 苹方
      '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',  // Linux 中文字体
    ];

    for (const fontPath of fontPaths) {
      try {
        const buffer = await fs.readFile(fontPath);
        logger.info(`成功加载字体文件: ${fontPath}`);
        this.fontBuffer = buffer;
        return buffer;
      } catch (error) {
        // 继续尝试下一个字体
        continue;
      }
    }

    throw new Error('无法找到可用的中文字体文件');
  }

  /**
   * 导出完整报价PDF（包含报价详情页和条款附件）
   * @param planData 方案数据
   * @param selectedInsurances 选中的险种列表
   * @returns PDF文件的Buffer
   */
  async exportQuoteWithClauses(
    planData: any,
    selectedInsurances: string[]
  ): Promise<Buffer> {
    try {
      logger.info('开始生成报价PDF', { planId: planData.id, selectedInsurances });

      // 1. 生成报价详情页PDF
      const quotePdf = await this.generateQuotePDF(planData);

      // 2. 加载选中的条款PDF
      const clausePdfs = await this.loadSelectedClauses(selectedInsurances);

      // 3. 合并所有PDF
      const finalPdf = await this.mergePDFs([quotePdf, ...clausePdfs]);

      logger.info('报价PDF生成成功', { planId: planData.id });
      return finalPdf;
    } catch (error) {
      logger.error('生成报价PDF失败', error);
      throw error;
    }
  }

  /**
   * 生成报价详情页PDF
   * @param planData 方案数据
   * @returns PDF文档的Buffer
   */
  private async generateQuotePDF(planData: any): Promise<Buffer> {
    // 创建新PDF文档并注册字体
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(Fontkit);

    // 加载中文字体
    const chineseFontBuffer = await this.getChineseFont();
    const chineseFont = await pdfDoc.embedFont(chineseFontBuffer);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4尺寸
    const { height, width } = page.getSize();

    let yPosition = height - 50;
    const margin = 50;
    const lineHeight = 20;

    // 1. 标题
    page.drawText('建工意外险报价单', {
      x: width / 2 - 100,
      y: yPosition,
      size: 24,
      font: chineseFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 40;

    // 2. 方案名称
    page.drawText(`方案名称：${planData.planName || ''}`, {
      x: margin,
      y: yPosition,
      size: 14,
      font: chineseFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;

    // 3. 项目基本信息
    if (planData.projectName || planData.contractor || planData.projectLocation) {
      yPosition -= 10;
      page.drawText('项目信息', {
        x: margin,
        y: yPosition,
        size: 16,
        font: chineseFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPosition -= lineHeight;

      if (planData.projectName) {
        page.drawText(`项目名称：${planData.projectName}`, {
          x: margin,
          y: yPosition,
          size: 12,
          font: chineseFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }

      if (planData.contractor) {
        page.drawText(`施工方：${planData.contractor}`, {
          x: margin,
          y: yPosition,
          size: 12,
          font: chineseFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }

      if (planData.projectLocation) {
        page.drawText(`项目地点：${planData.projectLocation}`, {
          x: margin,
          y: yPosition,
          size: 12,
          font: chineseFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }
    }

    // 4. 保障内容和保费
    yPosition -= 10;
    page.drawText('保障内容及保费', {
      x: margin,
      y: yPosition,
      size: 16,
      font: chineseFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPosition -= lineHeight;

    const calculationResult = planData.calculationResult || {};

    // 主险
    if (planData.mainParams) {
      page.drawText(`主险 - 保额：¥${(planData.mainParams.coverageAmount || 0).toLocaleString()}  保费：¥${(calculationResult.mainInsurance?.premium || 0).toLocaleString()}`, {
        x: margin,
        y: yPosition,
        size: 12,
        font: chineseFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    }

    // 附加医疗保险
    if (planData.medicalParams && calculationResult.medicalInsurance) {
      page.drawText(`附加医疗保险 - 保额：¥${(planData.medicalParams.coverageAmount || 0).toLocaleString()}  保费：¥${calculationResult.medicalInsurance.premium.toLocaleString()}`, {
        x: margin,
        y: yPosition,
        size: 12,
        font: chineseFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    }

    // 住院津贴保险
    if (planData.allowanceParams && calculationResult.allowanceInsurance) {
      page.drawText(`住院津贴保险 - 日津贴：¥${planData.allowanceParams.dailyAmount || 0}  保费：¥${calculationResult.allowanceInsurance.premium.toLocaleString()}`, {
        x: margin,
        y: yPosition,
        size: 12,
        font: chineseFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    }

    // 急性病保险
    if (planData.acuteDiseaseParams && calculationResult.acuteDiseaseInsurance) {
      page.drawText(`突发急性病保险 - 保额：¥${(planData.acuteDiseaseParams.coverageAmount || 0).toLocaleString()}  保费：¥${calculationResult.acuteDiseaseInsurance.premium.toLocaleString()}`, {
        x: margin,
        y: yPosition,
        size: 12,
        font: chineseFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    }

    // 高原病保险
    if (planData.plateauDiseaseParams && calculationResult.plateauDiseaseInsurance) {
      page.drawText(`高原病保险 - 保费：¥${calculationResult.plateauDiseaseInsurance.premium.toLocaleString()}`, {
        x: margin,
        y: yPosition,
        size: 12,
        font: chineseFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    }

    // 5. 总保费
    yPosition -= 10;
    const totalPremium = calculationResult.totalPremium || 0;
    page.drawText(`总保费：¥${totalPremium.toLocaleString()}`, {
      x: margin,
      y: yPosition,
      size: 18,
      font: chineseFont,
      color: rgb(0.8, 0.2, 0.2),
    });
    yPosition -= lineHeight * 2;

    // 6. 日期和落款
    const currentDate = new Date().toLocaleDateString('zh-CN');
    page.drawText(`报价日期：${currentDate}`, {
      x: margin,
      y: yPosition,
      size: 12,
      font: chineseFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // 保存PDF为Buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * 加载选中的条款PDF文件
   * @param selectedInsurances 选中的险种列表
   * @returns 条款PDF文档的Buffer数组
   */
  private async loadSelectedClauses(selectedInsurances: string[]): Promise<Buffer[]> {
    const clausePdfs: Buffer[] = [];

    // 险种类型与文件名的映射
    const insuranceFileMap: Record<string, string> = {
      MAIN: 'main.pdf',
      MEDICAL: 'medical.pdf',
      ALLOWANCE: 'allowance.pdf',
      ACUTE_DISEASE: 'acute_disease.pdf',
      PLATEAU_DISEASE: 'plateau_disease.pdf',
    };

    for (const insuranceType of selectedInsurances) {
      const fileName = insuranceFileMap[insuranceType];
      if (!fileName) {
        logger.warn(`未找到险种 ${insuranceType} 对应的条款文件`);
        continue;
      }

      const filePath = path.join(this.clauseFilesDir, fileName);

      try {
        // 读取PDF文件
        const pdfBuffer = await fs.readFile(filePath);
        clausePdfs.push(pdfBuffer);
        logger.info(`成功加载条款文件：${fileName}`);
      } catch (error) {
        logger.error(`读取条款文件失败：${fileName}`, error);
        // 继续处理其他文件，不中断流程
      }
    }

    return clausePdfs;
  }

  /**
   * 合并多个PDF文档
   * @param pdfBuffers PDF文档的Buffer数组
   * @returns 合并后的PDF文档Buffer
   */
  private async mergePDFs(pdfBuffers: Buffer[]): Promise<Buffer> {
    if (pdfBuffers.length === 0) {
      throw new Error('没有PDF文档需要合并');
    }

    // 创建新的PDF文档
    const mergedPdf = await PDFDocument.create();

    for (const pdfBuffer of pdfBuffers) {
      try {
        // 加载PDF文档
        const pdf = await PDFDocument.load(pdfBuffer);
        // 复制所有页面
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        // 添加到合并文档
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      } catch (error) {
        logger.error('合并PDF时出错', error);
        // 继续处理其他文档
      }
    }

    // 保存合并后的PDF
    const mergedPdfBytes = await mergedPdf.save();
    return Buffer.from(mergedPdfBytes);
  }

  /**
   * 仅导出报价详情页PDF（不含条款）
   * @param planData 方案数据
   * @returns PDF文档的Buffer
   */
  async exportQuoteOnly(planData: any): Promise<Buffer> {
    try {
      const pdf = await this.generateQuotePDF(planData);
      logger.info('报价详情页PDF生成成功', { planId: planData.id });
      return pdf;
    } catch (error) {
      logger.error('生成报价详情页PDF失败', error);
      throw error;
    }
  }

  /**
   * 合并前端生成的第一页PDF与条款PDF
   * @param firstPagePdfBuffer 前端生成的第一页PDF Buffer
   * @param selectedInsurances 选中的险种列表
   * @returns 合并后的PDF Buffer
   */
  async mergeFirstPageWithClauses(
    firstPagePdfBuffer: Buffer,
    selectedInsurances: string[]
  ): Promise<Buffer> {
    try {
      logger.info('开始合并前端PDF与条款PDF', { selectedInsurances });

      // 1. 加载前端生成的第一页PDF
      const firstPagePdf = await PDFDocument.load(firstPagePdfBuffer);

      // 2. 加载选中的条款PDF
      const clausePdfs = await this.loadSelectedClauses(selectedInsurances);

      // 3. 合并所有PDF（第一页 + 条款PDF）
      const allPdfs = [firstPagePdfBuffer, ...clausePdfs];
      const finalPdf = await this.mergePDFs(allPdfs);

      logger.info('前端PDF与条款PDF合并成功');
      return finalPdf;
    } catch (error) {
      logger.error('合并PDF失败', error);
      throw error;
    }
  }
}
