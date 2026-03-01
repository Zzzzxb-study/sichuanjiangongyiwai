import { v4 as uuidv4 } from 'uuid';
import { database } from '../database/database';
import { logger } from '../utils/logger';

/**
 * 项目状态枚举
 */
export enum ProjectStatus {
  DRAFT = 'draft',           // 草稿
  PRICING = 'pricing',       // 报价中
  COMPLETED = 'completed',   // 已完成
  CANCELLED = 'cancelled',   // 已取消
}

/**
 * 项目来源枚举
 */
export enum ProjectSource {
  CONTRACT = 'contract',     // 合同解析
  MANUAL = 'manual',         // 手动创建
  IMPORT = 'import',         // 导入
  MIGRATION = 'migration',   // 数据迁移
}

/**
 * 项目信息接口
 */
export interface Project {
  project_id: string;
  business_no: string;
  project_name: string;
  status: ProjectStatus;
  source?: ProjectSource;
  source_file_name?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  notes?: string;
}

/**
 * 项目服务
 * 负责项目的创建、查询、更新等操作
 */
export class ProjectService {
  /**
   * 创建新项目
   * @param projectName 项目名称
   * @param source 项目来源
   * @param sourceFileName 源文件名
   * @param createdBy 创建人
   * @returns 创建的项目信息
   */
  public async createProject(
    projectName: string,
    source: ProjectSource = ProjectSource.MANUAL,
    sourceFileName?: string,
    createdBy?: string
  ): Promise<Project> {
    try {
      const projectId = uuidv4();
      const businessNo = this.generateBusinessNo();
      const now = new Date();

      const sql = `
        INSERT INTO projects (
          project_id, business_no, project_name, status, source,
          source_file_name, created_at, updated_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      database.run(sql, [
        projectId,
        businessNo,
        projectName,
        ProjectStatus.DRAFT,
        source,
        sourceFileName || null,
        now.toISOString(),
        now.toISOString(),
        createdBy || null,
      ]);

      logger.info('创建项目成功', {
        projectId,
        businessNo,
        projectName,
        source,
      });

      return {
        project_id: projectId,
        business_no: businessNo,
        project_name: projectName,
        status: ProjectStatus.DRAFT,
        source,
        source_file_name: sourceFileName,
        created_at: now,
        updated_at: now,
        created_by: createdBy,
      };
    } catch (error) {
      logger.error('创建项目失败', error);
      throw new Error('创建项目失败');
    }
  }

  /**
   * 根据 project_id 获取项目
   * @param projectId 项目 ID
   * @returns 项目信息
   */
  public async getProjectById(projectId: string): Promise<Project | null> {
    try {
      const sql = 'SELECT * FROM projects WHERE project_id = ?';
      const row = database.get<any>(sql, [projectId]);

      if (!row) {
        return null;
      }

      return this.mapRowToProject(row);
    } catch (error) {
      logger.error('获取项目失败', { projectId, error });
      throw new Error('获取项目失败');
    }
  }

  /**
   * 根据业务流水号获取项目
   * @param businessNo 业务流水号
   * @returns 项目信息
   */
  public async getProjectByBusinessNo(businessNo: string): Promise<Project | null> {
    try {
      const sql = 'SELECT * FROM projects WHERE business_no = ?';
      const row = database.get<any>(sql, [businessNo]);

      if (!row) {
        return null;
      }

      return this.mapRowToProject(row);
    } catch (error) {
      logger.error('根据业务流水号获取项目失败', { businessNo, error });
      throw new Error('获取项目失败');
    }
  }

  /**
   * 更新项目状态
   * @param projectId 项目 ID
   * @param status 新状态
   */
  public async updateProjectStatus(
    projectId: string,
    status: ProjectStatus
  ): Promise<void> {
    try {
      const now = new Date();
      const sql = `
        UPDATE projects
        SET status = ?, updated_at = ?
        WHERE project_id = ?
      `;

      database.run(sql, [status, now.toISOString(), projectId]);

      logger.info('更新项目状态', { projectId, status });
    } catch (error) {
      logger.error('更新项目状态失败', { projectId, status, error });
      throw new Error('更新项目状态失败');
    }
  }

  /**
   * 获取项目完整信息（包括历史数据详情）
   * @param projectId 项目 ID
   * @returns 项目完整信息（包含项目名称、施工方、地点等）
   */
  public async getProjectFullInfo(projectId: string): Promise<any | null> {
    try {
      // 首先获取项目基本信息
      const projectSql = 'SELECT * FROM projects WHERE project_id = ?';
      const projectRow = database.get<any>(projectSql, [projectId]);

      if (!projectRow) {
        return null;
      }

      // 尝试获取最新的历史数据
      const historySql = `
        SELECT * FROM historical_data
        WHERE project_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const historyRow = database.get<any>(historySql, [projectId]);

      // 合并返回数据
      return {
        project_id: projectRow.project_id,
        business_no: projectRow.business_no,
        project_name: projectRow.project_name,
        status: projectRow.status,
        source: projectRow.source,
        source_file_name: projectRow.source_file_name,
        created_at: projectRow.created_at,
        updated_at: projectRow.updated_at,
        created_by: projectRow.created_by,
        notes: projectRow.notes,
        // 从历史数据获取的信息
        contractor: historyRow?.construction_unit || null,  // 施工单位
        projectLocation: historyRow?.address || null,     // 项目地址
      };
    } catch (error) {
      logger.error('获取项目完整信息失败', { projectId, error });
      throw new Error('获取项目完整信息失败');
    }
  }

  /**
   * 生成业务流水号
   * 格式: SCJG-YYYYMMDD-序号
   * @returns 业务流水号
   */
  private generateBusinessNo(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

    // 使用事务确保查询和插入的原子性
    return database.transaction(() => {
      // 查询今天已有的项目数量
      const countResult = this.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM projects WHERE business_no LIKE ?`,
        [`SCJG-${dateStr}-%`]
      );

      const count = countResult?.count || 0;

      // 生成序号（4位，从0001开始）
      const sequence = String(count + 1).padStart(4, '0');

      return `SCJG-${dateStr}-${sequence}`;
    });
  }

  /**
   * 辅助方法：执行查询
   */
  private get<T = any>(sql: string, params: any[] = []): T | undefined {
    try {
      const stmt = database.getConnection().prepare(sql);
      return stmt.get(...params) as T | undefined;
    } catch (error) {
      logger.error('查询失败', { sql, params, error });
      throw error;
    }
  }

  /**
   * 获取指定日期的项目数量
   * @param dateStr 日期字符串 (YYYYMMDD)
   * @returns 项目数量
   */
  public getProjectCountByDate(dateStr: string): number {
    try {
      const result = database.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM projects WHERE business_no LIKE ?`,
        [`SCJG-${dateStr}-%`]
      );

      return result?.count || 0;
    } catch (error) {
      logger.error('获取项目数量失败', { dateStr, error });
      return 0;
    }
  }

  /**
   * 将数据库行映射为 Project 对象
   * @param row 数据库行
   * @returns Project 对象
   */
  private mapRowToProject(row: any): Project {
    return {
      project_id: row.project_id,
      business_no: row.business_no,
      project_name: row.project_name,
      status: row.status as ProjectStatus,
      source: row.source as ProjectSource,
      source_file_name: row.source_file_name,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      created_by: row.created_by,
      notes: row.notes,
    };
  }
}

// 导出单例
export const projectService = new ProjectService();
