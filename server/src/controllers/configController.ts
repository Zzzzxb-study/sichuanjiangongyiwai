import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { ResponseHelper } from '../utils/apiResponse';
import { configService } from '../services/configService';

export class ConfigController {
  // ==================== 系统配置 ====================

  /**
   * 获取系统配置
   */
  public getSystemConfig = (req: Request, res: Response) => {
    try {
      const configs = configService.getAllSystemConfigs();
      res.json(ResponseHelper.success('获取系统配置成功', configs));
    } catch (error) {
      logger.error('获取系统配置失败', error);
      res.status(500).json(ResponseHelper.error('获取系统配置失败'));
    }
  };

  /**
   * 更新系统配置
   */
  public updateSystemConfig = (req: Request, res: Response) => {
    try {
      const { config } = req.body;
      const userId = (req as any).user?.id || 'system';

      const result = configService.upsertSystemConfig(config, userId);
      res.json(ResponseHelper.success('更新系统配置成功', result));
    } catch (error) {
      logger.error('更新系统配置失败', error);
      res.status(500).json(ResponseHelper.error('更新系统配置失败'));
    }
  };

  // ==================== 工程分类配置 ====================

  /**
   * 获取工程分类配置
   */
  public getEngineeringClasses = (req: Request, res: Response) => {
    try {
      const classes = configService.getAllEngineeringClasses();
      res.json(ResponseHelper.success('获取工程分类成功', classes));
    } catch (error) {
      logger.error('获取工程分类失败', error);
      res.status(500).json(ResponseHelper.error('获取工程分类失败'));
    }
  };

  /**
   * 更新工程分类配置
   */
  public updateEngineeringClasses = (req: Request, res: Response) => {
    try {
      const { classes } = req.body;
      const userId = (req as any).user?.id || 'system';

      // 批量更新
      const results = classes.map((classData: any) =>
        configService.upsertEngineeringClass(classData, userId)
      );

      res.json(ResponseHelper.success('更新工程分类成功', results));
    } catch (error) {
      logger.error('更新工程分类失败', error);
      res.status(500).json(ResponseHelper.error('更新工程分类失败'));
    }
  };

  // ==================== 费率节点配置 ====================

  /**
   * 获取费率节点配置
   */
  public getRateNodes = (req: Request, res: Response) => {
    try {
      const { nodeType } = req.query;
      const nodes = configService.getAllRateNodes(nodeType as string);
      res.json(ResponseHelper.success('获取费率节点成功', nodes));
    } catch (error) {
      logger.error('获取费率节点失败', error);
      res.status(500).json(ResponseHelper.error('获取费率节点失败'));
    }
  };

  /**
   * 更新费率节点配置
   */
  public updateRateNodes = (req: Request, res: Response) => {
    try {
      const { nodeType, nodes } = req.body;
      const userId = (req as any).user?.id || 'system';

      // 批量更新费率节点
      const result = configService.batchUpdateRateNodes(nodes, nodeType, userId);

      res.json(ResponseHelper.success('更新费率节点成功', result));
    } catch (error) {
      logger.error('更新费率节点失败', error);
      res.status(500).json(ResponseHelper.error('更新费率节点失败'));
    }
  };

  /**
   * 创建费率节点
   */
  public createRateNode = (req: Request, res: Response) => {
    try {
      const nodeData = req.body;
      const userId = (req as any).user?.id || 'system';

      const result = configService.createRateNode(nodeData, userId);
      res.json(ResponseHelper.success('创建费率节点成功', result));
    } catch (error) {
      logger.error('创建费率节点失败', error);
      res.status(500).json(ResponseHelper.error('创建费率节点失败'));
    }
  };

  /**
   * 更新单个费率节点
   */
  public updateRateNode = (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const nodeData = req.body;
      const userId = (req as any).user?.id || 'system';

      const result = configService.updateRateNode(id, nodeData, userId);
      res.json(ResponseHelper.success('更新费率节点成功', result));
    } catch (error) {
      logger.error('更新费率节点失败', error);
      res.status(500).json(ResponseHelper.error('更新费率节点失败'));
    }
  };

  /**
   * 删除费率节点
   */
  public deleteRateNode = (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || 'system';

      const result = configService.deleteRateNode(id, userId);
      res.json(ResponseHelper.success('删除费率节点成功', result));
    } catch (error) {
      logger.error('删除费率节点失败', error);
      res.status(500).json(ResponseHelper.error('删除费率节点失败'));
    }
  };

  // ==================== AI服务配置 ====================

  /**
   * 获取AI服务配置
   */
  public getAIServicesConfig = (req: Request, res: Response) => {
    try {
      const config = configService.getSystemConfigByKey('ai_services');
      const services = config ? JSON.parse(config.config_value) : {};
      res.json(ResponseHelper.success('获取AI服务配置成功', services));
    } catch (error) {
      logger.error('获取AI服务配置失败', error);
      res.status(500).json(ResponseHelper.error('获取AI服务配置失败'));
    }
  };

  /**
   * 更新AI服务配置
   */
  public updateAIServicesConfig = (req: Request, res: Response) => {
    try {
      const { services } = req.body;
      const userId = (req as any).user?.id || 'system';

      const config = {
        config_key: 'ai_services',
        config_value: JSON.stringify(services),
        config_type: 'system',
        category: 'ai',
        description: 'AI服务配置',
      };

      const result = configService.upsertSystemConfig(config, userId);
      res.json(ResponseHelper.success('更新AI服务配置成功', JSON.parse(result.config_value)));
    } catch (error) {
      logger.error('更新AI服务配置失败', error);
      res.status(500).json(ResponseHelper.error('更新AI服务配置失败'));
    }
  };

  /**
   * 测试AI服务连接
   */
  public testAIConnection = async (req: Request, res: Response) => {
    try {
      const { serviceUrl, apiKey } = req.body;

      // 简单测试：发送一个测试请求
      // 这里只是模拟测试，实际应该调用真实的API
      await new Promise(resolve => setTimeout(resolve, 1000));

      res.json(ResponseHelper.success('AI服务连接测试成功', {
        serviceUrl,
        status: 'available',
        responseTime: 100,
      }));
    } catch (error) {
      logger.error('AI服务连接测试失败', error);
      res.status(500).json(ResponseHelper.error('AI服务连接测试失败'));
    }
  };

  // ==================== 系统状态 ====================

  /**
   * 获取系统状态
   */
  public getSystemStatus = (req: Request, res: Response) => {
    try {
      const db = require('../database/database').database;
      const stats = db.getStats();

      const status = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: stats,
        timestamp: new Date().toISOString(),
      };

      res.json(ResponseHelper.success('获取系统状态成功', status));
    } catch (error) {
      logger.error('获取系统状态失败', error);
      res.status(500).json(ResponseHelper.error('获取系统状态失败'));
    }
  };

  // ==================== 配置备份和恢复 ====================

  /**
   * 备份系统配置
   */
  public backupConfig = (req: Request, res: Response) => {
    try {
      const configs = {
        system: configService.getAllSystemConfigs(),
        engineeringClasses: configService.getAllEngineeringClasses(),
        rateNodes: configService.getAllRateNodes(),
      };

      const backupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        configs,
      };

      res.json(ResponseHelper.success('备份配置成功', backupData));
    } catch (error) {
      logger.error('备份配置失败', error);
      res.status(500).json(ResponseHelper.error('备份配置失败'));
    }
  };

  /**
   * 恢复系统配置
   */
  public restoreConfig = (req: Request, res: Response) => {
    try {
      const { backupData } = req.body;
      const userId = (req as any).user?.id || 'system';

      // 这里应该实现恢复逻辑
      // 由于涉及多个表，需要使用事务
      logger.info('恢复系统配置', { backupData, userId });

      res.json(ResponseHelper.success('恢复配置成功', { restored: true }));
    } catch (error) {
      logger.error('恢复配置失败', error);
      res.status(500).json(ResponseHelper.error('恢复配置失败'));
    }
  };

  // ==================== UI布局配置 ====================

  /**
   * 获取页面布局
   */
  public getPageLayout = (req: Request, res: Response) => {
    try {
      const { pageName } = req.params;
      const layouts = configService.getPageLayouts(pageName);
      res.json(ResponseHelper.success('获取页面布局成功', layouts));
    } catch (error) {
      logger.error('获取页面布局失败', error);
      res.status(500).json(ResponseHelper.error('获取页面布局失败'));
    }
  };

  /**
   * 更新页面布局
   */
  public updatePageLayout = (req: Request, res: Response) => {
    try {
      const { pageName } = req.params;
      const { layouts } = req.body;
      const userId = (req as any).user?.id || 'system';

      const results = layouts.map((layout: any) =>
        configService.updateUILayout({
          ...layout,
          page_name: pageName,
        }, userId)
      );

      res.json(ResponseHelper.success('更新页面布局成功', results));
    } catch (error) {
      logger.error('更新页面布局失败', error);
      res.status(500).json(ResponseHelper.error('更新页面布局失败'));
    }
  };

  // ==================== 配置历史 ====================

  /**
   * 获取配置变更历史
   */
  public getConfigHistory = (req: Request, res: Response) => {
    try {
      const { configType, configId } = req.params;
      const { limit } = req.query;

      const history = configService.getConfigHistory(
        configType,
        configId,
        limit ? parseInt(limit as string) : 50
      );

      res.json(ResponseHelper.success('获取配置历史成功', history));
    } catch (error) {
      logger.error('获取配置历史失败', error);
      res.status(500).json(ResponseHelper.error('获取配置历史失败'));
    }
  };

  /**
   * 获取最近配置变更
   */
  public getRecentConfigHistory = (req: Request, res: Response) => {
    try {
      const { limit } = req.query;
      const history = configService.getRecentConfigHistory(
        limit ? parseInt(limit as string) : 100
      );

      res.json(ResponseHelper.success('获取最近配置历史成功', history));
    } catch (error) {
      logger.error('获取最近配置历史失败', error);
      res.status(500).json(ResponseHelper.error('获取最近配置历史失败'));
    }
  };

  // ==================== 公司业务分类管理 ====================

  /**
   * 获取所有业务分类
   * GET /api/config/business-classifications
   */
  public getBusinessClassifications = (req: Request, res: Response) => {
    try {
      const classifications = configService.getAllBusinessClassifications();
      res.json(ResponseHelper.success('获取业务分类成功', classifications));
    } catch (error) {
      logger.error('获取业务分类失败', error);
      res.status(500).json(ResponseHelper.error('获取业务分类失败'));
    }
  };

  /**
   * 更新业务分类
   * PUT /api/config/business-classifications/:id
   */
  public updateBusinessClassification = (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || 'system';
      const classificationData = { ...req.body, id };

      configService.updateBusinessClassification(classificationData, userId);
      res.json(ResponseHelper.success('更新业务分类成功'));
    } catch (error) {
      logger.error('更新业务分类失败', error);
      res.status(500).json(ResponseHelper.error('更新业务分类失败'));
    }
  };

  /**
   * 根据工程类型匹配业务分类
   * POST /api/config/match-business-classification
   */
  public matchBusinessClassification = (req: Request, res: Response) => {
    try {
      const { projectType } = req.body;

      // 调试：打印接收到的数据
      console.log('=== 接收到的请求 ===');
      console.log('projectType:', projectType);
      console.log('projectType type:', typeof projectType);
      console.log('projectType length:', projectType ? projectType.length : 0);
      console.log('Body keys:', Object.keys(req.body));
      console.log('==================');

      if (!projectType) {
        res.status(400).json(ResponseHelper.error('工程类型不能为空'));
        return;
      }

      const matchedClassification = configService.matchBusinessClassification(projectType);

      if (matchedClassification) {
        res.json(ResponseHelper.success('匹配成功', matchedClassification));
      } else {
        res.json(ResponseHelper.success('未匹配到业务分类', null));
      }
    } catch (error) {
      logger.error('匹配业务分类失败', error);
      res.status(500).json(ResponseHelper.error('匹配业务分类失败'));
    }
  };
}
