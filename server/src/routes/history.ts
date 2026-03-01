import { Router } from 'express';
import { HistoryController } from '../controllers/historyController';
import { validateSchema } from '../middleware/validation';
import Joi from 'joi';

const router = Router();
const historyController = new HistoryController();

// 查询参数验证模式
const queryHistorySchema = Joi.object({
  projectType: Joi.string().valid('rural', 'non_rural').optional(),
  engineeringClass: Joi.number().integer().min(1).max(4).optional(),
  costRange: Joi.array().items(Joi.number().positive()).length(2).optional(),
  areaRange: Joi.array().items(Joi.number().positive()).length(2).optional(),
  dateRange: Joi.array().items(Joi.date()).length(2).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const statisticsQuerySchema = Joi.object({
  projectType: Joi.string().valid('rural', 'non_rural').optional(),
  engineeringClass: Joi.number().integer().min(1).max(4).optional(),
  timeRange: Joi.string().valid('7d', '30d', '90d', '1y', 'all').default('30d')
});

/**
 * 查询历史承保数据
 * GET /api/history/records
 */
router.get('/records', validateSchema(queryHistorySchema), historyController.getHistoryRecords);

/**
 * 获取费率统计信息
 * GET /api/history/statistics
 */
router.get('/statistics', validateSchema(statisticsQuerySchema), historyController.getRateStatistics);

/**
 * 获取相似项目推荐
 * POST /api/history/similar
 */
router.post('/similar', historyController.getSimilarProjects);

/**
 * 获取费率趋势分析
 * GET /api/history/trends
 */
router.get('/trends', historyController.getRateTrends);

/**
 * 导出历史数据
 * POST /api/history/export
 */
router.post('/export', historyController.exportHistoryData);

/**
 * 删除历史记录
 * DELETE /api/history/:id
 */
router.delete('/:id', historyController.deleteHistoryRecord);

/**
 * 批量删除历史记录
 * POST /api/history/batch-delete
 */
router.post('/batch-delete', historyController.batchDeleteHistoryRecords);

/**
 * 批量导入历史数据
 * POST /api/history/import
 */
router.post('/import', historyController.importHistoryData);

/**
 * 获取数据质量报告
 * GET /api/history/quality-report
 */
router.get('/quality-report', historyController.getDataQualityReport);

export default router;