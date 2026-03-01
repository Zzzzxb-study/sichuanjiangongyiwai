import { Router } from 'express';
import { CalculationController } from '../controllers/calculationController';
import { validateCalculationRequest } from '../middleware/validation';

const router = Router();
const calculationController = new CalculationController();

/**
 * 计算保费路由
 * POST /api/calculation/premium
 */
router.post('/premium', validateCalculationRequest, calculationController.calculatePremium);

/**
 * 获取费率表配置
 * GET /api/calculation/rate-config
 */
router.get('/rate-config', calculationController.getRateConfig);

/**
 * 验证计算参数
 * POST /api/calculation/validate
 */
router.post('/validate', calculationController.validateParameters);

/**
 * 获取历史费率推荐
 * POST /api/calculation/recommend
 */
router.post('/recommend', calculationController.getRecommendedRates);

export default router;