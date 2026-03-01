import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PricingPlanService } from '../services/pricingPlanService';
import { PDFExportService } from '../services/pdfExportService';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';
import fileUpload from 'express-fileupload';

export class PricingPlanController {
  private pricingPlanService: PricingPlanService;
  private pdfExportService: PDFExportService;

  constructor() {
    this.pricingPlanService = new PricingPlanService();
    this.pdfExportService = new PDFExportService();
  }

  /**
   * 保存报价方案
   * POST /api/pricing-plans
   */
  public savePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      // 调试日志：打印完整的请求信息
      logger.info('=== 收到保存方案请求 ===');
      logger.info('Content-Type:', req.get('Content-Type'));
      logger.info('Content-Length:', req.get('Content-Length'));
      logger.info('请求体 keys:', Object.keys(req.body));
      logger.info('完整请求体:', JSON.stringify(req.body, null, 2));

      const {
        planName,
        planDescription,
        projectName,
        contractor,
        projectLocation,
        mainParams,
        medicalParams,
        allowanceParams,
        acuteDiseaseParams,
        plateauDiseaseParams,
        calculationResult,
        tags,
        createdBy,
        projectId  // 添加 projectId
      } = req.body;

      // 验证必填字段
      if (!planName || !mainParams || !calculationResult) {
        const response: ApiResponse = {
          success: false,
          error: '缺少必填字段：planName, mainParams, calculationResult'
        };
        res.status(400).json(response);
        return;
      }

      // 辅助函数：处理可选字段，空字符串转为null，非空字符串保留原值
      const processOptionalField = (value: string | undefined | null): string | null => {
        if (value === undefined || value === null) return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      // 调试日志：打印接收到的 projectId
      logger.info('=== 保存方案调试信息 ===');
      logger.info('接收到的 projectId:', projectId);
      logger.info('projectId 类型:', typeof projectId);
      logger.info('projectId 是否为空:', !projectId);

      const plan = {
        id: uuidv4(),
        projectId: projectId && typeof projectId === 'string' && projectId.trim().length > 0 ? projectId.trim() : null,  // 修复：确保 projectId 是有效的非空字符串
        planName,
        planDescription: processOptionalField(planDescription),
        projectName: processOptionalField(projectName),
        contractor: processOptionalField(contractor),
        projectLocation: processOptionalField(projectLocation),
        mainParams: JSON.stringify(mainParams),
        medicalParams: medicalParams ? JSON.stringify(medicalParams) : null,
        allowanceParams: allowanceParams ? JSON.stringify(allowanceParams) : null,
        acuteDiseaseParams: acuteDiseaseParams ? JSON.stringify(acuteDiseaseParams) : null,
        plateauDiseaseParams: plateauDiseaseParams ? JSON.stringify(plateauDiseaseParams) : null,
        calculationResult: JSON.stringify(calculationResult),
        totalPremium: calculationResult.totalPremium || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: createdBy || 'system',
        tags: tags ? JSON.stringify(tags) : null,
        isFavorite: 0
      };

      logger.info('准备保存的方案数据 projectId:', plan.projectId);
      logger.info('========================');

      await this.pricingPlanService.create(plan);

      const response: ApiResponse = {
        success: true,
        data: { id: plan.id },
        message: '方案保存成功'
      };

      res.json(response);

    } catch (error) {
      logger.error('保存报价方案失败', error);

      const response: ApiResponse = {
        success: false,
        error: '保存报价方案失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 获取方案列表
   * GET /api/pricing-plans
   */
  public getPlans = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        keyword,
        isFavorite,
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const result = await this.pricingPlanService.query({
        keyword: keyword as string,
        isFavorite: isFavorite === 'true' ? 1 : undefined,
        offset: (parseInt(page as string) - 1) * parseInt(limit as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC'
      });

      const response: ApiResponse = {
        success: true,
        data: {
          records: result.data.map((plan: any) => ({
            id: plan.id,
            projectId: plan.project_id,
            planName: plan.plan_name,
            planDescription: plan.plan_description,
            projectName: plan.project_name,
            contractor: plan.contractor,
            projectLocation: plan.project_location,
            mainParams: plan.main_params ? JSON.parse(plan.main_params) : null,
            medicalParams: plan.medical_params ? JSON.parse(plan.medical_params) : null,
            allowanceParams: plan.allowance_params ? JSON.parse(plan.allowance_params) : null,
            acuteDiseaseParams: plan.acute_disease_params ? JSON.parse(plan.acute_disease_params) : null,
            plateauDiseaseParams: plan.plateau_disease_params ? JSON.parse(plan.plateau_disease_params) : null,
            calculationResult: plan.calculation_result ? JSON.parse(plan.calculation_result) : null,
            totalPremium: plan.total_premium,
            createdAt: plan.created_at,
            updatedAt: plan.updated_at,
            createdBy: plan.created_by,
            tags: plan.tags ? JSON.parse(plan.tags) : [],
            isFavorite: plan.is_favorite === 1
          })),
          pagination: {
            current: parseInt(page as string),
            pageSize: parseInt(limit as string),
            total: result.total,
            totalPages: Math.ceil(result.total / parseInt(limit as string))
          }
        },
        message: '查询方案列表成功'
      };

      res.json(response);

    } catch (error) {
      logger.error('查询方案列表失败', error);

      const response: ApiResponse = {
        success: false,
        error: '查询方案列表失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 获取方案详情
   * GET /api/pricing-plans/:id
   */
  public getPlanDetail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const plan = await this.pricingPlanService.findById(id);

      if (!plan) {
        const response: ApiResponse = {
          success: false,
          error: '方案不存在'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          id: plan.id,
          projectId: plan.project_id,
          planName: plan.plan_name,
          planDescription: plan.plan_description,
          projectName: plan.project_name,
          contractor: plan.contractor,
          projectLocation: plan.project_location,
          mainParams: plan.main_params ? JSON.parse(plan.main_params) : null,
          medicalParams: plan.medical_params ? JSON.parse(plan.medical_params) : null,
          allowanceParams: plan.allowance_params ? JSON.parse(plan.allowance_params) : null,
          acuteDiseaseParams: plan.acute_disease_params ? JSON.parse(plan.acute_disease_params) : null,
          plateauDiseaseParams: plan.plateau_disease_params ? JSON.parse(plan.plateau_disease_params) : null,
          calculationResult: plan.calculation_result ? JSON.parse(plan.calculation_result) : null,
          totalPremium: plan.total_premium,
          createdAt: plan.created_at,
          updatedAt: plan.updated_at,
          createdBy: plan.created_by,
          tags: plan.tags ? JSON.parse(plan.tags) : [],
          isFavorite: plan.is_favorite === 1
        }
      };

      res.json(response);

    } catch (error) {
      logger.error('获取方案详情失败', error);

      const response: ApiResponse = {
        success: false,
        error: '获取方案详情失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 删除方案
   * DELETE /api/pricing-plans/:id
   */
  public deletePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.pricingPlanService.delete(id);

      const response: ApiResponse = {
        success: true,
        message: '方案删除成功'
      };

      res.json(response);

    } catch (error) {
      logger.error('删除方案失败', error);

      const response: ApiResponse = {
        success: false,
        error: '删除方案失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 更新方案
   * PUT /api/pricing-plans/:id
   */
  public updatePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        planName,
        planDescription,
        projectName,
        contractor,
        projectLocation,
        mainParams,
        medicalParams,
        allowanceParams,
        acuteDiseaseParams,
        plateauDiseaseParams,
        calculationResult,
        tags,
        isFavorite
      } = req.body;

      logger.info('更新方案请求', { id, body: req.body });

      // 辅助函数：处理可选字段，空字符串转为null，非空字符串保留原值
      const processOptionalField = (value: string | undefined | null): string | null => {
        if (value === undefined || value === null) return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      const updates: any = {
        updated_at: new Date().toISOString()
      };

      // 基本字段
      if (planName !== undefined) updates.plan_name = planName;
      if (planDescription !== undefined) {
        updates.plan_description = processOptionalField(planDescription);
      }

      // 项目信息字段 - 使用processOptionalField处理
      if (projectName !== undefined) {
        updates.project_name = processOptionalField(projectName);
      }
      if (contractor !== undefined) {
        updates.contractor = processOptionalField(contractor);
      }
      if (projectLocation !== undefined) {
        updates.project_location = processOptionalField(projectLocation);
      }

      // 参数字段
      if (mainParams !== undefined) updates.main_params = JSON.stringify(mainParams);
      if (medicalParams !== undefined) updates.medical_params = medicalParams ? JSON.stringify(medicalParams) : null;
      if (allowanceParams !== undefined) updates.allowance_params = allowanceParams ? JSON.stringify(allowanceParams) : null;
      if (acuteDiseaseParams !== undefined) updates.acute_disease_params = acuteDiseaseParams ? JSON.stringify(acuteDiseaseParams) : null;
      if (plateauDiseaseParams !== undefined) updates.plateau_disease_params = plateauDiseaseParams ? JSON.stringify(plateauDiseaseParams) : null;
      if (calculationResult !== undefined) {
        updates.calculation_result = JSON.stringify(calculationResult);
        updates.total_premium = calculationResult.totalPremium || 0;
      }

      // 其他字段
      if (tags !== undefined) updates.tags = tags ? JSON.stringify(tags) : null;
      if (isFavorite !== undefined) updates.is_favorite = isFavorite ? 1 : 0;

      logger.info('更新数据', { id, updates });

      await this.pricingPlanService.update(id, updates);

      const response: ApiResponse = {
        success: true,
        message: '方案更新成功'
      };

      res.json(response);

    } catch (error) {
      logger.error('更新方案失败', error);

      const response: ApiResponse = {
        success: false,
        error: '更新方案失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 切换收藏状态
   * PATCH /api/pricing-plans/:id/favorite
   */
  public toggleFavorite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const plan = await this.pricingPlanService.findById(id);

      if (!plan) {
        const response: ApiResponse = {
          success: false,
          error: '方案不存在'
        };
        res.status(404).json(response);
        return;
      }

      // 修复：使用数据库字段名 is_favorite（下划线命名）
      const newFavoriteStatus = plan.is_favorite ? 0 : 1;

      logger.info('切换收藏状态', { id, oldStatus: plan.is_favorite, newStatus: newFavoriteStatus });

      await this.pricingPlanService.update(id, {
        is_favorite: newFavoriteStatus,
        updated_at: new Date().toISOString()
      });

      const response: ApiResponse = {
        success: true,
        data: { isFavorite: newFavoriteStatus === 1 },
        message: '收藏状态更新成功'
      };

      res.json(response);

    } catch (error) {
      logger.error('切换收藏状态失败', error);

      const response: ApiResponse = {
        success: false,
        error: '切换收藏状态失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 导出报价PDF（包含报价详情页和条款附件）
   * POST /api/pricing-plans/:id/export-pdf
   */
  public exportPDF = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { includeClauses = 'true' } = req.query;

      // 获取方案详情
      const plan = await this.pricingPlanService.findById(id);
      if (!plan) {
        res.status(404).json({
          success: false,
          error: '方案不存在'
        });
        return;
      }

      // 构建方案数据
      const planData = {
        id: plan.id,
        planName: plan.plan_name,
        projectName: plan.project_name,
        contractor: plan.contractor,
        projectLocation: plan.project_location,
        mainParams: plan.main_params ? JSON.parse(plan.main_params) : null,
        medicalParams: plan.medical_params ? JSON.parse(plan.medical_params) : null,
        allowanceParams: plan.allowance_params ? JSON.parse(plan.allowance_params) : null,
        acuteDiseaseParams: plan.acute_disease_params ? JSON.parse(plan.acute_disease_params) : null,
        plateauDiseaseParams: plan.plateau_disease_params ? JSON.parse(plan.plateau_disease_params) : null,
        calculationResult: plan.calculation_result ? JSON.parse(plan.calculation_result) : null,
      };

      // 确定选中的险种
      const selectedInsurances: string[] = [];
      if (planData.mainParams) selectedInsurances.push('MAIN');
      if (planData.medicalParams) selectedInsurances.push('MEDICAL');
      if (planData.allowanceParams) selectedInsurances.push('ALLOWANCE');
      if (planData.acuteDiseaseParams) selectedInsurances.push('ACUTE_DISEASE');
      if (planData.plateauDiseaseParams) selectedInsurances.push('PLATEAU_DISEASE');

      // 生成PDF
      let pdfBuffer: Buffer;
      if (includeClauses === 'true') {
        // 包含条款的完整报价单
        pdfBuffer = await this.pdfExportService.exportQuoteWithClauses(planData, selectedInsurances);
      } else {
        // 仅报价详情页
        pdfBuffer = await this.pdfExportService.exportQuoteOnly(planData);
      }

      // 设置响应头
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(planData.planName || '报价单')}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // 发送PDF文件
      res.send(pdfBuffer);

      logger.info('PDF导出成功', { planId: id, includeClauses });
    } catch (error) {
      logger.error('导出PDF失败', error);
      res.status(500).json({
        success: false,
        error: '导出PDF失败'
      });
    }
  };

  /**
   * 合并前端生成的第一页PDF与条款PDF
   * POST /api/pricing-plans/:id/export-pdf-merged
   */
  public exportPDFMerged = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // 获取方案详情
      const plan = await this.pricingPlanService.findById(id);
      if (!plan) {
        res.status(404).json({
          success: false,
          error: '方案不存在'
        });
        return;
      }

      // 获取前端上传的第一页PDF
      const files = req.files as fileUpload.FileArray;
      if (!files || !files.firstPage) {
        res.status(400).json({
          success: false,
          error: '缺少第一页PDF文件'
        });
        return;
      }

      // 处理文件上传（使用 express-fileupload）
      let firstPageBuffer: Buffer;
      const firstPageFile = files.firstPage;

      if (Array.isArray(firstPageFile)) {
        firstPageBuffer = firstPageFile[0].data;
      } else {
        firstPageBuffer = firstPageFile.data;
      }

      // 确定选中的险种
      const selectedInsurances: string[] = [];
      if (plan.main_params) {
        try {
          const mainParams = JSON.parse(plan.main_params);
          if (mainParams) selectedInsurances.push('MAIN');
        } catch (e) {
          selectedInsurances.push('MAIN');
        }
      }
      if (plan.medical_params) selectedInsurances.push('MEDICAL');
      if (plan.allowance_params) selectedInsurances.push('ALLOWANCE');
      if (plan.acute_disease_params) selectedInsurances.push('ACUTE_DISEASE');
      if (plan.plateau_disease_params) selectedInsurances.push('PLATEAU_DISEASE');

      // 合并PDF
      const mergedPdfBuffer = await this.pdfExportService.mergeFirstPageWithClauses(
        firstPageBuffer,
        selectedInsurances
      );

      // 设置响应头
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(plan.plan_name || '报价单')}.pdf"`);
      res.setHeader('Content-Length', mergedPdfBuffer.length);

      // 发送PDF文件
      res.send(mergedPdfBuffer);

      logger.info('高保真PDF导出成功', { planId: id });
    } catch (error) {
      logger.error('导出高保真PDF失败', error);
      res.status(500).json({
        success: false,
        error: '导出PDF失败'
      });
    }
  };
}
