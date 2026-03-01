import { Router } from 'express';
import { PricingPlanController } from '../controllers/pricingPlanController';
import { validateSchema } from '../middleware/validation';
import Joi from 'joi';

const router = Router();
const pricingPlanController = new PricingPlanController();

// 保存方案验证模式
const savePlanSchema = Joi.object({
  planName: Joi.string().min(1).max(200).required(),
  planDescription: Joi.string().allow('', null).max(1000).optional(),
  projectName: Joi.string().allow('', null).max(500).optional(),
  contractor: Joi.string().allow('', null).max(500).optional(),
  projectLocation: Joi.string().allow('', null).max(500).optional(),
  mainParams: Joi.object().required(),
  medicalParams: Joi.object().optional(),
  allowanceParams: Joi.object().optional(),
  acuteDiseaseParams: Joi.object().optional(),
  plateauDiseaseParams: Joi.object().optional(),
  calculationResult: Joi.object().required(),
  tags: Joi.array().items(Joi.string()).optional(),
  createdBy: Joi.string().optional()
});

// 更新方案验证模式 - 允许空对象，至少需要一个字段
const updatePlanSchema = Joi.object({
  planName: Joi.string().min(1).max(200).optional(),
  planDescription: Joi.string().allow('', null).max(1000).optional(),
  projectName: Joi.string().allow('', null).max(500).optional(),
  contractor: Joi.string().allow('', null).max(500).optional(),
  projectLocation: Joi.string().allow('', null).max(500).optional(),
  mainParams: Joi.object().optional(),
  medicalParams: Joi.object().optional(),
  allowanceParams: Joi.object().optional(),
  acuteDiseaseParams: Joi.object().optional(),
  plateauDiseaseParams: Joi.object().optional(),
  calculationResult: Joi.object().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isFavorite: Joi.boolean().optional()
}).min(1);

/**
 * 保存报价方案
 * POST /api/pricing-plans
 */
router.post('/', validateSchema(savePlanSchema), pricingPlanController.savePlan);

/**
 * 获取方案列表
 * GET /api/pricing-plans
 * Query: keyword, isFavorite, page, limit, sortBy, sortOrder
 */
router.get('/', pricingPlanController.getPlans);

/**
 * 获取方案详情
 * GET /api/pricing-plans/:id
 */
router.get('/:id', pricingPlanController.getPlanDetail);

/**
 * 更新方案
 * PUT /api/pricing-plans/:id
 */
router.put('/:id', validateSchema(updatePlanSchema), pricingPlanController.updatePlan);

/**
 * 删除方案
 * DELETE /api/pricing-plans/:id
 */
router.delete('/:id', pricingPlanController.deletePlan);

/**
 * 切换收藏状态
 * PATCH /api/pricing-plans/:id/favorite
 */
router.patch('/:id/favorite', pricingPlanController.toggleFavorite);

/**
 * 导出报价PDF
 * GET /api/pricing-plans/:id/export-pdf
 * Query: includeClauses (boolean, default: true)
 */
router.get('/:id/export-pdf', pricingPlanController.exportPDF);

/**
 * 合并前端生成的第一页PDF与条款PDF
 * POST /api/pricing-plans/:id/export-pdf-merged
 * Body: firstPage (file) - 前端生成的第一页PDF文件
 */
router.post('/:id/export-pdf-merged', pricingPlanController.exportPDFMerged);

export default router;
