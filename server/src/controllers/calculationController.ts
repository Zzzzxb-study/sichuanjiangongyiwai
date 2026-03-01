import { Request, Response } from 'express';
import { CalculationEngine } from '../services/calculationEngine';
import { HistoryService } from '../services/historyService';
import { logger } from '../utils/logger';
import {
  ProjectInfo,
  MainInsuranceParams,
  MedicalInsuranceParams,
  PlateauDiseaseParams,
  ApiResponse,
  PremiumCalculationResult
} from '../types';

export class CalculationController {
  private calculationEngine: CalculationEngine;
  private historyService: HistoryService;

  constructor() {
    this.calculationEngine = new CalculationEngine();
    this.historyService = new HistoryService();
  }

  /**
   * 计算保费
   */
  public calculatePremium = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectInfo, insuranceParams } = req.body;

      logger.info('开始计算保费', {
        projectName: projectInfo.projectName,
        projectType: projectInfo.projectType
      });

      // 执行保费计算
      const result = this.calculationEngine.calculateTotalPremium(
        projectInfo as ProjectInfo,
        insuranceParams
      );

      // 保存计算历史
      await this.historyService.saveCalculationHistory(projectInfo, result);

      const response: ApiResponse<PremiumCalculationResult> = {
        success: true,
        data: result,
        message: '保费计算成功'
      };

      logger.info('保费计算完成', {
        totalPremium: result.totalPremium,
        projectName: projectInfo.projectName
      });

      res.json(response);
    } catch (error) {
      logger.error('保费计算失败', error);

      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : '计算过程中发生未知错误'
      };

      res.status(400).json(response);
    }
  };

  /**
   * 获取费率配置
   */
  public getRateConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      // 返回系统费率配置信息
      const config = {
        engineeringClasses: {
          1: {
            name: '一类工程',
            description: '室内装修、普通住宅/厂房、市政道路（无桥隧）、园林/亮化工程',
            k3Labor: 4.0,
            k4Range: [0.80, 1.00]
          },
          2: {
            name: '二类工程',
            description: '火电/风电/港口、机电安装、城市轨道交通（非地下）、消防设施',
            k3Labor: 5.0,
            k4Range: [1.30, 1.50]
          },
          3: {
            name: '三类工程',
            description: '农村自建房、水利工程、公路（桥隧比 < 50%）、普通拆除工程',
            k3Labor: 6.0,
            k4Range: [1.80, 2.00]
          },
          4: {
            name: '四类工程',
            description: '高架桥、钢结构、公路（桥隧比 ≥ 50%）、爆破工程、地下隧道',
            k3Labor: 7.0,
            k4Range: [2.30, 2.50]
          }
        },
        qualificationFactors: {
          special: { name: '特级', factor: 0.9 },
          first: { name: '一级', factor: 0.95 },
          second: { name: '二级', factor: 1.0 },
          third: { name: '三级', factor: 1.1 },
          unclassified: { name: '不分等级', factor: 1.2 }
        },
        managementLevels: {
          sound: { name: '健全', range: [0.5, 0.9] },
          relatively_sound: { name: '较健全', range: [0.9, 1.2] },
          unsound: { name: '不健全', range: [1.2, 1.5] }
        },
        plateauRiskFactors: {
          personnel: {
            A: { name: '适应力强', factor: 0.8 },
            B: { name: '适应力中', factor: 1.0 },
            C: { name: '适应力差', factor: 1.2 }
          },
          region: {
            A: { name: '低海拔/医疗好', factor: 0.7 },
            B: { name: '中海拔', factor: 0.9 },
            C: { name: '高海拔/严酷环境', factor: 1.0 }
          }
        }
      };

      const response: ApiResponse = {
        success: true,
        data: config,
        message: '费率配置获取成功'
      };

      res.json(response);
    } catch (error) {
      logger.error('获取费率配置失败', error);

      const response: ApiResponse = {
        success: false,
        error: '获取费率配置失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 验证计算参数
   */
  public validateParameters = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectInfo, insuranceParams } = req.body;
      const errors: string[] = [];

      // 验证项目信息
      if (!projectInfo.projectName) {
        errors.push('项目名称不能为空');
      }

      if (projectInfo.projectType === 'rural' && !projectInfo.totalArea) {
        errors.push('农村项目必须提供总面积');
      }

      if (projectInfo.projectType === 'non_rural' && !projectInfo.totalCost) {
        errors.push('非农村项目必须提供总造价');
      }

      if (new Date(projectInfo.endDate) <= new Date(projectInfo.startDate)) {
        errors.push('竣工日期必须晚于开工日期');
      }

      // 验证K7、K8系数范围
      if (insuranceParams.main) {
        const { k7ManagementLevel, k8LossRecord } = insuranceParams.main;

        if (k7ManagementLevel < 0.5 || k7ManagementLevel > 1.5) {
          errors.push('K7管理水平系数必须在0.5-1.5范围内');
        }

        if (k8LossRecord < 0.5 || k8LossRecord > 1.2) {
          errors.push('K8损失记录系数必须在0.5-1.2范围内');
        }
      }

      const response: ApiResponse = {
        success: errors.length === 0,
        data: { isValid: errors.length === 0, errors },
        message: errors.length === 0 ? '参数验证通过' : '参数验证失败'
      };

      res.json(response);
    } catch (error) {
      logger.error('参数验证失败', error);

      const response: ApiResponse = {
        success: false,
        error: '参数验证过程中发生错误'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 获取历史费率推荐
   */
  public getRecommendedRates = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectInfo } = req.body;

      // 查询相似历史项目
      const similarProjects = await this.historyService.findSimilarProjects(projectInfo);

      if (similarProjects.length === 0) {
        const response: ApiResponse = {
          success: true,
          data: {
            hasRecommendation: false,
            message: '暂无相似历史项目数据'
          }
        };
        res.json(response);
        return;
      }

      // 计算推荐费率
      const totalPremiums = similarProjects.map(p => p.premiumResult.totalPremium);
      const avgPremium = totalPremiums.reduce((sum, p) => sum + p, 0) / totalPremiums.length;
      const minPremium = Math.min(...totalPremiums);
      const maxPremium = Math.max(...totalPremiums);

      const recommendation = {
        hasRecommendation: true,
        similarProjectsCount: similarProjects.length,
        recommendedPremium: Math.round(avgPremium),
        premiumRange: {
          min: minPremium,
          max: maxPremium
        },
        confidence: this.calculateConfidence(similarProjects.length),
        recentProjects: similarProjects.slice(0, 5).map(p => ({
          projectName: p.projectInfo.projectName,
          totalPremium: p.premiumResult.totalPremium,
          createdAt: p.createdAt
        }))
      };

      const response: ApiResponse = {
        success: true,
        data: recommendation,
        message: '费率推荐获取成功'
      };

      res.json(response);
    } catch (error) {
      logger.error('获取费率推荐失败', error);

      const response: ApiResponse = {
        success: false,
        error: '获取费率推荐失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 计算推荐置信度
   */
  private calculateConfidence(projectCount: number): number {
    if (projectCount >= 10) return 0.9;
    if (projectCount >= 5) return 0.7;
    if (projectCount >= 3) return 0.5;
    return 0.3;
  }
}