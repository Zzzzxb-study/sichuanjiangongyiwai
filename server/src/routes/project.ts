import { Router } from 'express';
import { projectController } from '../controllers/projectController';

const router = Router();

/**
 * 项目路由
 * 前缀: /api/projects
 */

// 获取项目详情
router.get('/:id', projectController.getProject);

// 获取项目完整信息（包括施工方、地点等）
router.get('/:id/full', projectController.getProjectFullInfo);

// 根据业务流水号获取项目
router.get('/business-no/:no', projectController.getProjectByBusinessNo);

// 更新项目状态
router.put('/:id/status', projectController.updateProjectStatus);

// 创建新项目（手动创建）
router.post('/', projectController.createProject);

export default router;
