import { Request, Response } from 'express';
import { HistoryService } from '../services/historyService';
import { logger } from '../utils/logger';
import {
  ApiResponse,
  HistoricalData,
  HistoryQueryParams,
  ProjectType,
  EngineeringClass,
  ProjectInfo
} from '../types';

export class HistoryController {
  private historyService: HistoryService;

  constructor() {
    this.historyService = new HistoryService();
  }

  /**
   * 获取历史承保记录
   */
  public getHistoryRecords = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        projectType,
        engineeringClass,
        costRange,
        areaRange,
        dateRange,
        page = 1,
        limit = 20
      } = req.query;

      const queryParams: HistoryQueryParams = {
        projectType: projectType as ProjectType,
        engineeringClass: engineeringClass ? parseInt(engineeringClass as string) as EngineeringClass : undefined,
        costRange: costRange ? JSON.parse(costRange as string) as [number, number] : undefined,
        areaRange: areaRange ? JSON.parse(areaRange as string) as [number, number] : undefined,
        dateRange: dateRange ? (dateRange as string[]).map(d => new Date(d)) as [Date, Date] : undefined,
        offset: (parseInt(page as string) - 1) * parseInt(limit as string),
        limit: parseInt(limit as string)
      };

      const result = await this.historyService.queryHistory(queryParams);

      const response: ApiResponse = {
        success: true,
        data: {
          records: result.data,
          pagination: {
            current: parseInt(page as string),
            pageSize: parseInt(limit as string),
            total: result.total,
            totalPages: Math.ceil(result.total / parseInt(limit as string))
          }
        },
        message: '历史记录查询成功'
      };

      res.json(response);

    } catch (error) {
      logger.error('查询历史记录失败', error);

      const response: ApiResponse = {
        success: false,
        error: '查询历史记录失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 获取费率统计信息
   */
  public getRateStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectType, engineeringClass, timeRange = '30d' } = req.query;

      const statistics = await this.historyService.getRateStatistics(
        projectType as ProjectType,
        engineeringClass ? parseInt(engineeringClass as string) as EngineeringClass : undefined
      );

      // 根据时间范围过滤数据（简化实现）
      const timeRangeStats = this.filterStatisticsByTimeRange(statistics, timeRange as string);

      const response: ApiResponse = {
        success: true,
        data: {
          ...timeRangeStats,
          timeRange,
          generatedAt: new Date().toISOString()
        },
        message: '费率统计获取成功'
      };

      res.json(response);

    } catch (error) {
      logger.error('获取费率统计失败', error);

      const response: ApiResponse = {
        success: false,
        error: '获取费率统计失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 获取相似项目推荐
   */
  public getSimilarProjects = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectInfo } = req.body;

      if (!projectInfo) {
        res.status(400).json({
          success: false,
          error: '项目信息不能为空'
        });
        return;
      }

      const similarProjects = await this.historyService.findSimilarProjects(projectInfo as ProjectInfo);

      // 计算推荐费率
      const recommendation = this.calculateRecommendation(similarProjects);

      const response: ApiResponse = {
        success: true,
        data: {
          similarProjects: similarProjects.slice(0, 10), // 返回前10个最相似的项目
          recommendation,
          totalSimilarCount: similarProjects.length
        },
        message: '相似项目推荐获取成功'
      };

      res.json(response);

    } catch (error) {
      logger.error('获取相似项目推荐失败', error);

      const response: ApiResponse = {
        success: false,
        error: '获取相似项目推荐失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 获取费率趋势分析
   */
  public getRateTrends = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectType, engineeringClass, period = 'monthly' } = req.query;

      // 查询历史数据
      const queryParams: HistoryQueryParams = {
        projectType: projectType as ProjectType,
        engineeringClass: engineeringClass ? parseInt(engineeringClass as string) as EngineeringClass : undefined,
        limit: 1000 // 获取足够的数据进行趋势分析
      };

      const result = await this.historyService.queryHistory(queryParams);

      // 分析趋势
      const trends = this.analyzeTrends(result.data, period as string);

      const response: ApiResponse = {
        success: true,
        data: {
          trends,
          period,
          dataPoints: result.data.length,
          analysisDate: new Date().toISOString()
        },
        message: '费率趋势分析完成'
      };

      res.json(response);

    } catch (error) {
      logger.error('费率趋势分析失败', error);

      const response: ApiResponse = {
        success: false,
        error: '费率趋势分析失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 导出历史数据
   */
  public exportHistoryData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { format = 'json', filters } = req.body;

      const queryParams: HistoryQueryParams = {
        ...filters,
        limit: 10000 // 导出时获取更多数据
      };

      const result = await this.historyService.queryHistory(queryParams);

      let exportData: any;
      let contentType: string;
      let filename: string;

      switch (format) {
        case 'csv':
          exportData = this.convertToCSV(result.data);
          contentType = 'text/csv';
          filename = `history_export_${Date.now()}.csv`;
          break;
        case 'excel':
          // 这里应该使用实际的Excel生成库
          exportData = JSON.stringify(result.data, null, 2);
          contentType = 'application/json';
          filename = `history_export_${Date.now()}.json`;
          break;
        default:
          exportData = JSON.stringify(result.data, null, 2);
          contentType = 'application/json';
          filename = `history_export_${Date.now()}.json`;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);

      logger.info('历史数据导出完成', {
        format,
        recordCount: result.data.length,
        filename
      });

    } catch (error) {
      logger.error('导出历史数据失败', error);

      const response: ApiResponse = {
        success: false,
        error: '导出历史数据失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 删除历史记录
   */
  public deleteHistoryRecord = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: '记录ID不能为空'
        });
        return;
      }

      const success = await this.historyService.deleteRecord(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: '记录不存在或已删除'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: '历史记录删除成功'
      };

      res.json(response);

    } catch (error) {
      logger.error('删除历史记录失败', error);

      const response: ApiResponse = {
        success: false,
        error: '删除历史记录失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 批量删除历史记录
   */
  public batchDeleteHistoryRecords = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          error: '记录ID列表不能为空'
        });
        return;
      }

      const deletedCount = await this.historyService.batchDeleteRecords(ids);

      const response: ApiResponse = {
        success: true,
        data: {
          deletedCount,
          totalRequested: ids.length
        },
        message: `成功删除 ${deletedCount} 条记录`
      };

      res.json(response);

    } catch (error) {
      logger.error('批量删除历史记录失败', error);

      const response: ApiResponse = {
        success: false,
        error: '批量删除历史记录失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 批量导入历史数据
   */
  public importHistoryData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { data, format = 'json' } = req.body;

      logger.info('=== 收到历史数据导入请求 ===');
      logger.info('数据格式:', format);
      logger.info('数据条数:', data?.length);
      logger.info('数据样本:', data?.[0] ? JSON.stringify(data[0], null, 2) : '无');

      if (!data || !Array.isArray(data)) {
        logger.error('导入数据格式不正确:', { data, type: typeof data });
        res.status(400).json({
          success: false,
          error: '导入数据格式不正确'
        });
        return;
      }

      let importedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const record = data[i];
        try {
          // 验证数据格式
          if (this.validateImportRecord(record)) {
            logger.info(`正在导入第 ${i + 1}/${data.length} 条记录:`, {
              projectName: record.projectInfo?.projectName,
              engineeringClass: record.projectInfo?.engineeringClass,
              startDate: record.projectInfo?.startDate,
            });

            await this.historyService.saveCalculationHistory(
              record.projectInfo,
              record.premiumResult
            );
            importedCount++;
            logger.info(`第 ${i + 1} 条记录导入成功`);
          } else {
            errorCount++;
            const errorMsg = `记录 ${i + 1} 格式不正确`;
            logger.error(errorMsg, { record });
            errors.push(errorMsg);
          }
        } catch (error) {
          errorCount++;
          const errorMsg = `导入记录 ${i + 1} 失败: ${error instanceof Error ? error.message : '未知错误'}`;
          logger.error(errorMsg, { error, record });
          errors.push(errorMsg);
        }
      }

      logger.info('=== 历史数据导入完成 ===', {
        totalProcessed: data.length,
        importedCount,
        errorCount,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          importedCount,
          errorCount,
          errors: errors.slice(0, 10), // 只返回前10个错误
          totalProcessed: data.length
        },
        message: `数据导入完成，成功导入 ${importedCount} 条记录`
      };

      res.json(response);

    } catch (error) {
      logger.error('批量导入数据失败', error);

      const response: ApiResponse = {
        success: false,
        error: '批量导入数据失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 获取数据质量报告
   */
  public getDataQualityReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.historyService.queryHistory({ limit: 10000 });
      const qualityReport = this.generateDataQualityReport(result.data);

      const response: ApiResponse = {
        success: true,
        data: qualityReport,
        message: '数据质量报告生成成功'
      };

      res.json(response);

    } catch (error) {
      logger.error('生成数据质量报告失败', error);

      const response: ApiResponse = {
        success: false,
        error: '生成数据质量报告失败'
      };

      res.status(500).json(response);
    }
  };

  /**
   * 根据时间范围过滤统计数据
   */
  private filterStatisticsByTimeRange(statistics: any, timeRange: string): any {
    // 简化实现，实际应该根据时间范围重新计算统计数据
    return {
      ...statistics,
      timeRange,
      note: `基于最近${timeRange}的数据统计`
    };
  }

  /**
   * 计算推荐费率
   */
  private calculateRecommendation(similarProjects: HistoricalData[]): {
    recommendedPremium: number;
    confidence: number;
    range: { min: number; max: number };
    basis: string;
  } {
    if (similarProjects.length === 0) {
      return {
        recommendedPremium: 0,
        confidence: 0,
        range: { min: 0, max: 0 },
        basis: '无相似项目数据'
      };
    }

    const premiums = similarProjects.map(p => p.premiumResult.totalPremium);
    const avgPremium = premiums.reduce((sum, p) => sum + p, 0) / premiums.length;
    const minPremium = Math.min(...premiums);
    const maxPremium = Math.max(...premiums);

    // 计算置信度
    let confidence = 0.5;
    if (similarProjects.length >= 10) confidence = 0.9;
    else if (similarProjects.length >= 5) confidence = 0.7;
    else if (similarProjects.length >= 3) confidence = 0.6;

    return {
      recommendedPremium: Math.round(avgPremium),
      confidence,
      range: { min: minPremium, max: maxPremium },
      basis: `基于${similarProjects.length}个相似项目的平均费率`
    };
  }

  /**
   * 分析费率趋势
   */
  private analyzeTrends(data: HistoricalData[], period: string): {
    trendData: Array<{ period: string; averagePremium: number; count: number }>;
    trendDirection: 'up' | 'down' | 'stable';
    changeRate: number;
  } {
    // 按时间分组数据
    const groupedData = this.groupDataByPeriod(data, period);

    // 计算趋势方向
    const trendData = Object.entries(groupedData).map(([period, records]) => ({
      period,
      averagePremium: Math.round(
        records.reduce((sum, r) => sum + r.premiumResult.totalPremium, 0) / records.length
      ),
      count: records.length
    }));

    // 计算变化率
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    let changeRate = 0;

    if (trendData.length >= 2) {
      const firstPeriod = trendData[0].averagePremium;
      const lastPeriod = trendData[trendData.length - 1].averagePremium;
      changeRate = ((lastPeriod - firstPeriod) / firstPeriod) * 100;

      if (changeRate > 5) trendDirection = 'up';
      else if (changeRate < -5) trendDirection = 'down';
    }

    return {
      trendData,
      trendDirection,
      changeRate: Math.round(changeRate * 100) / 100
    };
  }

  /**
   * 按时间周期分组数据
   */
  private groupDataByPeriod(data: HistoricalData[], period: string): Record<string, HistoricalData[]> {
    const grouped: Record<string, HistoricalData[]> = {};

    data.forEach(record => {
      let key: string;
      const date = record.createdAt;

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(record);
    });

    return grouped;
  }

  /**
   * 转换为CSV格式
   */
  private convertToCSV(data: HistoricalData[]): string {
    if (data.length === 0) return '';

    const headers = [
      '项目名称', '项目性质', '工程分类', '总造价(万元)', '总面积(㎡)',
      '开工日期', '竣工日期', '施工单位', '主险保费', '总保费', '创建时间'
    ];

    const rows = data.map(record => [
      record.projectInfo.projectName,
      record.projectInfo.projectType === 'rural' ? '农村项目' : '非农村项目',
      record.projectInfo.engineeringClass,
      record.projectInfo.totalCost || '',
      record.projectInfo.totalArea || '',
      record.projectInfo.startDate?.toISOString().split('T')[0] || '',
      record.projectInfo.endDate?.toISOString().split('T')[0] || '',
      record.projectInfo.constructionUnit,
      record.premiumResult.mainInsurance,
      record.premiumResult.totalPremium,
      record.createdAt.toISOString()
    ]);

    return [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }

  /**
   * 验证导入记录格式
   */
  private validateImportRecord(record: any): boolean {
    return (
      record &&
      record.projectInfo &&
      record.premiumResult &&
      typeof record.projectInfo.projectName === 'string' &&
      typeof record.premiumResult.totalPremium === 'number'
    );
  }

  /**
   * 生成数据质量报告
   */
  private generateDataQualityReport(data: HistoricalData[]): {
    totalRecords: number;
    completenessScore: number;
    qualityIssues: string[];
    recommendations: string[];
    dataDistribution: any;
  } {
    const totalRecords = data.length;
    let completeRecords = 0;
    const qualityIssues: string[] = [];
    const recommendations: string[] = [];

    // 检查数据完整性
    data.forEach(record => {
      let isComplete = true;

      if (!record.projectInfo.projectName || record.projectInfo.projectName === '未知项目') {
        isComplete = false;
      }

      if (!record.projectInfo.address) {
        isComplete = false;
      }

      if (!record.projectInfo.constructionUnit) {
        isComplete = false;
      }

      if (!record.projectInfo.totalCost && !record.projectInfo.totalArea) {
        isComplete = false;
      }

      if (isComplete) {
        completeRecords++;
      }
    });

    const completenessScore = totalRecords > 0 ? (completeRecords / totalRecords) * 100 : 0;

    // 生成质量问题和建议
    if (completenessScore < 80) {
      qualityIssues.push('数据完整性较低');
      recommendations.push('建议完善项目基本信息的录入');
    }

    if (totalRecords < 100) {
      qualityIssues.push('历史数据量不足');
      recommendations.push('建议积累更多历史数据以提高推荐准确性');
    }

    // 数据分布统计
    const dataDistribution = {
      byProjectType: this.getDistribution(data, 'projectInfo.projectType'),
      byEngineeringClass: this.getDistribution(data, 'projectInfo.engineeringClass'),
      byTimeRange: this.getTimeDistribution(data)
    };

    return {
      totalRecords,
      completenessScore: Math.round(completenessScore * 100) / 100,
      qualityIssues,
      recommendations,
      dataDistribution
    };
  }

  /**
   * 获取字段分布统计
   */
  private getDistribution(data: HistoricalData[], fieldPath: string): Record<string, number> {
    const distribution: Record<string, number> = {};

    data.forEach(record => {
      const value = this.getNestedValue(record, fieldPath);
      const key = String(value || 'unknown');
      distribution[key] = (distribution[key] || 0) + 1;
    });

    return distribution;
  }

  /**
   * 获取时间分布统计
   */
  private getTimeDistribution(data: HistoricalData[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    data.forEach(record => {
      const month = `${record.createdAt.getFullYear()}-${String(record.createdAt.getMonth() + 1).padStart(2, '0')}`;
      distribution[month] = (distribution[month] || 0) + 1;
    });

    return distribution;
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}