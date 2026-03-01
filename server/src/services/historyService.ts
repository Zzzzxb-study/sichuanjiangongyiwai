import {
  ProjectInfo,
  PremiumCalculationResult,
  HistoricalData,
  HistoryQueryParams,
  ProjectType,
  EngineeringClass
} from '../types';
import { logger } from '../utils/logger';
import { database } from '../database/database';

/**
 * 历史承保数据服务
 * 负责保存和查询历史承保记录，提供费率推荐功能
 * 现在使用SQLite持久化存储
 */
export class HistoryService {
  /**
   * 保存计算历史记录
   * @param projectInfo 项目信息
   * @param premiumResult 保费计算结果
   * @param projectId 项目 ID（可选，用于关联项目）
   * @returns 保存的历史记录ID
   */
  public async saveCalculationHistory(
    projectInfo: ProjectInfo,
    premiumResult: PremiumCalculationResult,
    projectId?: string
  ): Promise<string> {
    try {
      const id = this.generateId();
      const now = new Date();

      // 处理日期字段：可能是Date对象或字符串
      const signingDate = projectInfo.signingDate
        ? (projectInfo.signingDate instanceof Date
            ? projectInfo.signingDate
            : new Date(projectInfo.signingDate))
        : null;

      const startDate = projectInfo.startDate instanceof Date
        ? projectInfo.startDate
        : new Date(projectInfo.startDate);

      const endDate = projectInfo.endDate instanceof Date
        ? projectInfo.endDate
        : new Date(projectInfo.endDate);

      // 验证日期是否有效
      if (isNaN(startDate.getTime())) {
        throw new Error('无效的开始日期');
      }
      if (isNaN(endDate.getTime())) {
        throw new Error('无效的结束日期');
      }

      const sql = `
        INSERT INTO historical_data (
          id, project_id, project_name, project_type, engineering_class,
          total_cost, total_area, contract_type, company_qualification,
          management_level, address, construction_unit,
          signing_date, start_date, end_date, total_premium,
          project_info_full, premium_details,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      database.run(sql, [
        id,
        projectId || null,
        projectInfo.projectName,
        projectInfo.projectType,
        projectInfo.engineeringClass,
        projectInfo.totalCost || null,
        projectInfo.totalArea || null,
        projectInfo.contractType,
        projectInfo.companyQualification,
        projectInfo.managementLevel,
        projectInfo.address,
        projectInfo.constructionUnit,
        signingDate ? signingDate.toISOString() : null,
        startDate.toISOString(),
        endDate.toISOString(),
        premiumResult.totalPremium,
        JSON.stringify(projectInfo),
        JSON.stringify(premiumResult),
        now.toISOString(),
        now.toISOString(),
      ]);

      logger.info('保存计算历史记录', {
        id,
        projectName: projectInfo.projectName,
        totalPremium: premiumResult.totalPremium,
        projectId
      });

      return id;
    } catch (error) {
      logger.error('保存历史记录失败', error);
      throw new Error('保存历史记录失败');
    }
  }

  /**
   * 查找相似项目
   * @param projectInfo 当前项目信息
   * @returns 相似项目列表
   */
  public async findSimilarProjects(projectInfo: ProjectInfo): Promise<HistoricalData[]> {
    try {
      // 查询所有历史记录（后续可以优化为按条件筛选）
      const sql = 'SELECT * FROM historical_data ORDER BY created_at DESC LIMIT 100';
      const rows = database.all<any>(sql);

      // 转换为HistoricalData格式
      const historicalData: HistoricalData[] = rows.map(row => ({
        id: row.id,
        projectInfo: JSON.parse(row.project_info_full),
        premiumResult: JSON.parse(row.premium_details),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      // 计算相似度并筛选
      const similarProjects = historicalData.filter(record => {
        const similarity = this.calculateSimilarity(projectInfo, record.projectInfo);
        return similarity >= 0.6; // 相似度阈值60%
      });

      // 按相似度排序
      similarProjects.sort((a, b) => {
        const similarityA = this.calculateSimilarity(projectInfo, a.projectInfo);
        const similarityB = this.calculateSimilarity(projectInfo, b.projectInfo);
        return similarityB - similarityA;
      });

      logger.info('查找相似项目', {
        currentProject: projectInfo.projectName,
        foundCount: similarProjects.length
      });

      return similarProjects.slice(0, 20); // 返回最相似的20个项目
    } catch (error) {
      logger.error('查找相似项目失败', error);
      return [];
    }
  }

  /**
   * 计算项目相似度
   * @param project1 项目1
   * @param project2 项目2
   * @returns 相似度分数 (0-1)
   */
  private calculateSimilarity(project1: ProjectInfo, project2: ProjectInfo): number {
    let score = 0;
    let totalWeight = 0;

    // 项目性质权重：30%
    if (project1.projectType === project2.projectType) {
      score += 0.3;
    }
    totalWeight += 0.3;

    // 工程分类权重：25%
    if (project1.engineeringClass === project2.engineeringClass) {
      score += 0.25;
    }
    totalWeight += 0.25;

    // 造价/面积相似度权重：20%
    if (project1.projectType === ProjectType.NON_RURAL && project1.totalCost && project2.totalCost) {
      const costSimilarity = this.calculateNumericSimilarity(project1.totalCost, project2.totalCost);
      score += 0.2 * costSimilarity;
    } else if (project1.projectType === ProjectType.RURAL && project1.totalArea && project2.totalArea) {
      const areaSimilarity = this.calculateNumericSimilarity(project1.totalArea, project2.totalArea);
      score += 0.2 * areaSimilarity;
    }
    totalWeight += 0.2;

    // 合同类型权重：10%
    if (project1.contractType === project2.contractType) {
      score += 0.1;
    }
    totalWeight += 0.1;

    // 企业资质权重：10%
    if (project1.companyQualification === project2.companyQualification) {
      score += 0.1;
    }
    totalWeight += 0.1;

    // 地区相似度权重：5%
    if (this.isLocationSimilar(project1.address, project2.address)) {
      score += 0.05;
    }
    totalWeight += 0.05;

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * 计算数值相似度
   * @param value1 数值1
   * @param value2 数值2
   * @returns 相似度分数 (0-1)
   */
  private calculateNumericSimilarity(value1: number, value2: number): number {
    const ratio = Math.min(value1, value2) / Math.max(value1, value2);
    return ratio;
  }

  /**
   * 判断地区是否相似
   * @param address1 地址1
   * @param address2 地址2
   * @returns 是否相似
   */
  private isLocationSimilar(address1: string, address2: string): boolean {
    // 简单的地区匹配逻辑，实际应使用更复杂的地理位置匹配
    const city1 = this.extractCity(address1);
    const city2 = this.extractCity(address2);
    return city1 === city2;
  }

  /**
   * 从地址中提取城市名称
   * @param address 完整地址
   * @returns 城市名称
   */
  private extractCity(address: string): string {
    // 简化的城市提取逻辑
    const cityMatch = address.match(/(\w+市)/);
    return cityMatch ? cityMatch[1] : '';
  }

  /**
   * 查询历史数据
   * @param params 查询参数
   * @returns 历史数据列表
   */
  public async queryHistory(params: HistoryQueryParams): Promise<{
    data: HistoricalData[];
    total: number;
  }> {
    try {
      // 构建查询条件
      const conditions: string[] = [];
      const queryParams: any[] = [];

      if (params.projectType) {
        conditions.push('project_type = ?');
        queryParams.push(params.projectType);
      }

      if (params.engineeringClass) {
        conditions.push('engineering_class = ?');
        queryParams.push(params.engineeringClass);
      }

      if (params.costRange) {
        const [minCost, maxCost] = params.costRange;
        conditions.push('total_cost >= ? AND total_cost <= ?');
        queryParams.push(minCost, maxCost);
      }

      if (params.areaRange) {
        const [minArea, maxArea] = params.areaRange;
        conditions.push('total_area >= ? AND total_area <= ?');
        queryParams.push(minArea, maxArea);
      }

      if (params.dateRange) {
        const [startDate, endDate] = params.dateRange;
        conditions.push('created_at >= ? AND created_at <= ?');
        queryParams.push(startDate.toISOString(), endDate.toISOString());
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // 查询总数
      const countSql = `SELECT COUNT(*) as count FROM historical_data ${whereClause}`;
      const countResult = database.get<{ count: number }>(countSql, queryParams);
      const total = countResult?.count || 0;

      // 分页查询
      const offset = params.offset || 0;
      const limit = params.limit || 20;
      const dataSql = `
        SELECT * FROM historical_data
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const rows = database.all<any>(dataSql, [...queryParams, limit, offset]);

      // 转换为HistoricalData格式
      const data: HistoricalData[] = rows.map(row => ({
        id: row.id,
        projectInfo: JSON.parse(row.project_info_full),
        premiumResult: JSON.parse(row.premium_details),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      logger.info('查询历史数据', {
        total,
        returned: data.length,
        filters: params
      });

      return { data, total };
    } catch (error) {
      logger.error('查询历史数据失败', error);
      throw new Error('查询历史数据失败');
    }
  }

  /**
   * 获取费率统计信息
   * @param projectType 项目性质
   * @param engineeringClass 工程分类
   * @returns 统计信息
   */
  public async getRateStatistics(
    projectType?: ProjectType,
    engineeringClass?: EngineeringClass
  ): Promise<{
    averagePremium: number;
    minPremium: number;
    maxPremium: number;
    projectCount: number;
    premiumDistribution: Array<{ range: string; count: number }>;
  }> {
    try {
      // 构建查询条件
      const conditions: string[] = [];
      const queryParams: any[] = [];

      if (projectType) {
        conditions.push('project_type = ?');
        queryParams.push(projectType);
      }

      if (engineeringClass) {
        conditions.push('engineering_class = ?');
        queryParams.push(engineeringClass);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // 查询统计数据
      const sql = `
        SELECT
          COUNT(*) as count,
          AVG(total_premium) as avg_premium,
          MIN(total_premium) as min_premium,
          MAX(total_premium) as max_premium
        FROM historical_data
        ${whereClause}
      `;

      const result = database.get<{
        count: number;
        avg_premium: number;
        min_premium: number;
        max_premium: number;
      }>(sql, queryParams);

      if (!result || result.count === 0) {
        return {
          averagePremium: 0,
          minPremium: 0,
          maxPremium: 0,
          projectCount: 0,
          premiumDistribution: []
        };
      }

      // 查询所有保费用于计算分布
      const premiumsSql = `
        SELECT total_premium FROM historical_data
        ${whereClause}
        ORDER BY total_premium
      `;
      const premiumRows = database.all<{ total_premium: number }>(premiumsSql, queryParams);
      const premiums = premiumRows.map(r => r.total_premium);

      // 计算保费分布
      const premiumDistribution = this.calculatePremiumDistribution(premiums);

      return {
        averagePremium: Math.round(result.avg_premium),
        minPremium: result.min_premium,
        maxPremium: result.max_premium,
        projectCount: result.count,
        premiumDistribution
      };
    } catch (error) {
      logger.error('获取费率统计失败', error);
      throw new Error('获取费率统计失败');
    }
  }

  /**
   * 计算保费分布
   * @param premiums 保费数组
   * @returns 分布统计
   */
  private calculatePremiumDistribution(premiums: number[]): Array<{ range: string; count: number }> {
    const ranges = [
      { min: 0, max: 1000, label: '0-1000元' },
      { min: 1000, max: 5000, label: '1000-5000元' },
      { min: 5000, max: 10000, label: '5000-10000元' },
      { min: 10000, max: 50000, label: '10000-50000元' },
      { min: 50000, max: Infinity, label: '50000元以上' }
    ];

    return ranges.map(range => ({
      range: range.label,
      count: premiums.filter(p => p >= range.min && p < range.max).length
    }));
  }

  /**
   * 生成唯一ID
   * @returns 唯一标识符
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 清理过期数据
   * @param daysToKeep 保留天数
   */
  public async cleanupExpiredData(daysToKeep: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const sql = 'DELETE FROM historical_data WHERE created_at < ?';
      const result = database.run(sql, [cutoffDate.toISOString()]);

      const removedCount = result.changes || 0;

      logger.info('清理过期数据', {
        removedCount,
        cutoffDate
      });

      return removedCount;
    } catch (error) {
      logger.error('清理过期数据失败', error);
      throw new Error('清理过期数据失败');
    }
  }

  /**
   * 删除单条历史记录
   * @param id 记录ID
   * @returns 是否删除成功
   */
  public async deleteRecord(id: string): Promise<boolean> {
    try {
      const sql = 'DELETE FROM historical_data WHERE id = ?';
      const result = database.run(sql, [id]);

      const success = (result.changes || 0) > 0;

      if (success) {
        logger.info('删除历史记录成功', { id });
      } else {
        logger.warn('历史记录不存在', { id });
      }

      return success;
    } catch (error) {
      logger.error('删除历史记录失败', error);
      throw new Error('删除历史记录失败');
    }
  }

  /**
   * 批量删除历史记录
   * @param ids 记录ID列表
   * @returns 删除成功的数量
   */
  public async batchDeleteRecords(ids: string[]): Promise<number> {
    try {
      let deletedCount = 0;

      for (const id of ids) {
        const sql = 'DELETE FROM historical_data WHERE id = ?';
        const result = database.run(sql, [id]);
        if ((result.changes || 0) > 0) {
          deletedCount++;
        }
      }

      logger.info('批量删除历史记录', {
        totalRequested: ids.length,
        deletedCount
      });

      return deletedCount;
    } catch (error) {
      logger.error('批量删除历史记录失败', error);
      throw new Error('批量删除历史记录失败');
    }
  }
}