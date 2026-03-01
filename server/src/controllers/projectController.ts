import { Request, Response } from 'express';
import { projectService, ProjectStatus } from '../services/projectService';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

/**
 * 项目控制器
 * 负责项目相关的 API 请求处理
 */
export class ProjectController {
  /**
   * 获取项目详情
   */
  public getProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const project = await projectService.getProjectById(id);

      if (!project) {
        const response: ApiResponse = {
          success: false,
          error: '项目不存在'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: project,
        message: '获取项目详情成功'
      };

      res.json(response);
    } catch (error) {
      logger.error('获取项目详情失败', error);
      const response: ApiResponse = {
        success: false,
        error: '获取项目详情失败'
      };
      res.status(500).json(response);
    }
  };

  /**
   * 根据业务流水号获取项目
   */
  public getProjectByBusinessNo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { no } = req.params;

      const project = await projectService.getProjectByBusinessNo(no);

      if (!project) {
        const response: ApiResponse = {
          success: false,
          error: '项目不存在'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: project,
        message: '获取项目详情成功'
      };

      res.json(response);
    } catch (error) {
      logger.error('根据业务流水号获取项目失败', error);
      const response: ApiResponse = {
        success: false,
        error: '获取项目详情失败'
      };
      res.status(500).json(response);
    }
  };

  /**
   * 更新项目状态
   */
  public updateProjectStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(ProjectStatus).includes(status)) {
        const response: ApiResponse = {
          success: false,
          error: '无效的项目状态'
        };
        res.status(400).json(response);
        return;
      }

      await projectService.updateProjectStatus(id, status as ProjectStatus);

      const response: ApiResponse = {
        success: true,
        message: '更新项目状态成功'
      };

      res.json(response);
    } catch (error) {
      logger.error('更新项目状态失败', error);
      const response: ApiResponse = {
        success: false,
        error: '更新项目状态失败'
      };
      res.status(500).json(response);
    }
  };

  /**
   * 获取项目完整信息（包括历史数据详情）
   */
  public getProjectFullInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const fullInfo = await projectService.getProjectFullInfo(id);

      if (!fullInfo) {
        const response: ApiResponse = {
          success: false,
          error: '项目不存在'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: fullInfo,
        message: '获取项目完整信息成功'
      };

      res.json(response);
    } catch (error) {
      logger.error('获取项目完整信息失败', error);
      const response: ApiResponse = {
        success: false,
        error: '获取项目完整信息失败'
      };
      res.status(500).json(response);
    }
  };

  /**
   * 创建新项目（手动创建）
   */
  public createProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectName, source, sourceFileName, createdBy } = req.body;

      if (!projectName) {
        const response: ApiResponse = {
          success: false,
          error: '项目名称不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const project = await projectService.createProject(
        projectName,
        source,
        sourceFileName,
        createdBy
      );

      const response: ApiResponse = {
        success: true,
        data: project,
        message: '创建项目成功'
      };

      res.json(response);
    } catch (error) {
      logger.error('创建项目失败', error);
      const response: ApiResponse = {
        success: false,
        error: '创建项目失败'
      };
      res.status(500).json(response);
    }
  };
}

export const projectController = new ProjectController();
