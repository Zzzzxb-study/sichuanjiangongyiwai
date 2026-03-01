import { logger } from '../utils/logger';
import { database } from '../database/database';

export interface PricingPlanQueryParams {
  keyword?: string;
  projectId?: string;
  isFavorite?: number;
  offset?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 报价方案服务
 * 负责保存和查询用户的报价方案
 */
export class PricingPlanService {

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 创建报价方案
   */
  public async create(plan: any): Promise<void> {
    try {
      const sql = `
        INSERT INTO pricing_plans (
          id, project_id, plan_name, plan_description, project_name, contractor, project_location,
          main_params, medical_params, allowance_params, acute_disease_params, plateau_disease_params,
          calculation_result, total_premium,
          created_at, updated_at, created_by, tags, is_favorite
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      database.run(sql, [
        plan.id,
        plan.projectId || null,
        plan.planName,
        plan.planDescription,
        plan.projectName || null,
        plan.contractor || null,
        plan.projectLocation || null,
        plan.mainParams,
        plan.medicalParams,
        plan.allowanceParams,
        plan.acuteDiseaseParams,
        plan.plateauDiseaseParams,
        plan.calculationResult,
        plan.totalPremium,
        plan.createdAt,
        plan.updatedAt,
        plan.createdBy,
        plan.tags,
        plan.isFavorite
      ]);

      logger.info('保存报价方案成功', {
        id: plan.id,
        planName: plan.planName,
        projectName: plan.projectName,
        projectId: plan.projectId,
        totalPremium: plan.totalPremium
      });

    } catch (error) {
      logger.error('创建报价方案失败', error);
      throw new Error('创建报价方案失败');
    }
  }

  /**
   * 查询报价方案列表
   */
  public async query(params: PricingPlanQueryParams): Promise<{ data: any[]; total: number }> {
    try {
      const {
        keyword,
        projectId,
        isFavorite,
        offset = 0,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = params;

      // 构建查询条件
      const conditions: string[] = [];
      const queryParams: any[] = [];

      if (keyword) {
        conditions.push('plan_name LIKE ?');
        queryParams.push(`%${keyword}%`);
      }

      if (projectId) {
        conditions.push('project_id = ?');
        queryParams.push(projectId);
      }

      if (isFavorite !== undefined) {
        conditions.push('is_favorite = ?');
        queryParams.push(isFavorite);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // 查询总数
      const countSql = `SELECT COUNT(*) as count FROM pricing_plans ${whereClause}`;
      const countResult = database.get<{ count: number }>(countSql, queryParams);
      const total = countResult?.count || 0;

      // 查询数据
      const dataSql = `
        SELECT * FROM pricing_plans
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `;

      const rows = database.all<any>(dataSql, [...queryParams, limit, offset]);

      return {
        data: rows,
        total
      };

    } catch (error) {
      logger.error('查询报价方案列表失败', error);
      throw new Error('查询报价方案列表失败');
    }
  }

  /**
   * 根据项目 ID 获取报价方案列表
   * @param projectId 项目 ID
   * @returns 报价方案列表
   */
  public async getPlansByProjectId(projectId: string): Promise<any[]> {
    try {
      const sql = `
        SELECT * FROM pricing_plans
        WHERE project_id = ?
        ORDER BY created_at DESC
      `;

      const rows = database.all<any>(sql, [projectId]);

      logger.info('查询项目报价方案成功', { projectId, count: rows.length });

      return rows;
    } catch (error) {
      logger.error('查询项目报价方案失败', { projectId, error });
      throw new Error('查询项目报价方案失败');
    }
  }

  /**
   * 根据ID查询方案详情
   */
  public async findById(id: string): Promise<any | null> {
    try {
      const sql = 'SELECT * FROM pricing_plans WHERE id = ?';
      const row = database.get<any>(sql, [id]);

      if (!row) {
        return null;
      }

      return row;

    } catch (error) {
      logger.error('查询方案详情失败', error);
      throw new Error('查询方案详情失败');
    }
  }

  /**
   * 更新方案
   */
  public async update(id: string, updates: any): Promise<void> {
    try {
      const setClause = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');

      const values = Object.values(updates);
      const sql = `UPDATE pricing_plans SET ${setClause} WHERE id = ?`;

      database.run(sql, [...values, id]);

      logger.info('更新报价方案成功', { id });

    } catch (error) {
      logger.error('更新报价方案失败', error);
      throw new Error('更新报价方案失败');
    }
  }

  /**
   * 删除方案
   */
  public async delete(id: string): Promise<void> {
    try {
      const sql = 'DELETE FROM pricing_plans WHERE id = ?';
      database.run(sql, [id]);

      logger.info('删除报价方案成功', { id });

    } catch (error) {
      logger.error('删除报价方案失败', error);
      throw new Error('删除报价方案失败');
    }
  }

  /**
   * 获取所有收藏的方案
   */
  public async getFavorites(): Promise<any[]> {
    try {
      const sql = `
        SELECT * FROM pricing_plans
        WHERE is_favorite = 1
        ORDER BY created_at DESC
      `;

      const rows = database.all<any>(sql);
      return rows;

    } catch (error) {
      logger.error('获取收藏方案失败', error);
      throw new Error('获取收藏方案失败');
    }
  }
}
