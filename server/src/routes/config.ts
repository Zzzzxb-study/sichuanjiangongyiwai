import { Router } from 'express';
import { ConfigController } from '../controllers/configController';

const router = Router();
const configController = new ConfigController();

/**
 * 获取系统配置
 * GET /api/config/system
 */
router.get('/system', configController.getSystemConfig);

/**
 * 更新系统配置
 * PUT /api/config/system
 */
router.put('/system', configController.updateSystemConfig);

/**
 * 获取工程分类配置
 * GET /api/config/engineering-classes
 */
router.get('/engineering-classes', configController.getEngineeringClasses);

/**
 * 更新工程分类配置
 * PUT /api/config/engineering-classes
 */
router.put('/engineering-classes', configController.updateEngineeringClasses);

/**
 * 获取费率节点配置
 * GET /api/config/rate-nodes
 */
router.get('/rate-nodes', configController.getRateNodes);

/**
 * 更新费率节点配置
 * PUT /api/config/rate-nodes
 */
router.put('/rate-nodes', configController.updateRateNodes);

/**
 * 获取AI服务配置
 * GET /api/config/ai-services
 */
router.get('/ai-services', configController.getAIServicesConfig);

/**
 * 更新AI服务配置
 * PUT /api/config/ai-services
 */
router.put('/ai-services', configController.updateAIServicesConfig);

/**
 * 测试AI服务连接
 * POST /api/config/test-ai-connection
 */
router.post('/test-ai-connection', configController.testAIConnection);

/**
 * 获取系统状态
 * GET /api/config/status
 */
router.get('/status', configController.getSystemStatus);

/**
 * 备份系统配置
 * POST /api/config/backup
 */
router.post('/backup', configController.backupConfig);

/**
 * 恢复系统配置
 * POST /api/config/restore
 */
router.post('/restore', configController.restoreConfig);

// ==================== 费率节点 CRUD ====================

/**
 * 创建费率节点
 * POST /api/config/rate-nodes
 */
router.post('/rate-nodes', configController.createRateNode);

/**
 * 更新单个费率节点
 * PUT /api/config/rate-nodes/:id
 */
router.put('/rate-nodes/:id', configController.updateRateNode);

/**
 * 删除费率节点
 * DELETE /api/config/rate-nodes/:id
 */
router.delete('/rate-nodes/:id', configController.deleteRateNode);

// ==================== UI 布局配置 ====================

/**
 * 获取页面布局
 * GET /api/config/pages/:pageName/layout
 */
router.get('/pages/:pageName/layout', configController.getPageLayout);

/**
 * 更新页面布局
 * POST /api/config/pages/:pageName/layout
 */
router.post('/pages/:pageName/layout', configController.updatePageLayout);

// ==================== 配置历史 ====================

/**
 * 获取配置变更历史
 * GET /api/config/history/:configType/:configId
 */
router.get('/history/:configType/:configId', configController.getConfigHistory);

/**
 * 获取最近配置变更
 * GET /api/config/history/recent
 */
router.get('/history/recent', configController.getRecentConfigHistory);

// ==================== 公司业务分类管理 ====================

/**
 * 获取所有业务分类
 * GET /api/config/business-classifications
 */
router.get('/business-classifications', configController.getBusinessClassifications);

/**
 * 更新业务分类
 * PUT /api/config/business-classifications/:id
 */
router.put('/business-classifications/:id', configController.updateBusinessClassification);

/**
 * 根据工程类型匹配业务分类
 * POST /api/config/match-business-classification
 */
router.post('/match-business-classification', configController.matchBusinessClassification);

export default router;