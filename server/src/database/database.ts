import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import {
  CREATE_HISTORICAL_DATA_TABLE,
  CREATE_SYSTEM_CONFIGS_TABLE,
  CREATE_ENGINEERING_CLASSES_TABLE,
  CREATE_RATE_NODES_TABLE,
  CREATE_UI_LAYOUTS_TABLE,
  CREATE_CONFIG_HISTORY_TABLE,
  CREATE_RATE_RULES_TABLE,
  CREATE_COMPANY_BUSINESS_CLASSIFICATION_TABLE,
  CREATE_PRICING_PLANS_TABLE,
  CREATE_PROJECTS_TABLE,
  CREATE_INDEXES,
  DATABASE_VERSION,
  DATABASE_PATH,
  INIT_DEFAULT_DATA,
  MIGRATION_SQL,
} from './schema';

/**
 * SQLite数据库管理类
 * 提供数据库连接、初始化和基础操作
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database | null = null;
  private dbPath: string;

  private constructor(dbPath?: string) {
    this.dbPath = dbPath || DATABASE_PATH;
  }

  /**
   * 获取数据库单例实例
   */
  public static getInstance(dbPath?: string): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager(dbPath);
    }
    return DatabaseManager.instance;
  }

  /**
   * 连接数据库
   */
  public connect(): void {
    try {
      // 确保数据目录存在
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info('创建数据目录', { dir });
      }

      // 连接数据库
      this.db = new Database(this.dbPath);

      // 设置WAL模式（Write-Ahead Logging）
      // 提高并发性能
      this.db.pragma('journal_mode = WAL');

      // 设置同步模式为NORMAL（性能和安全的平衡）
      this.db.pragma('synchronous = NORMAL');

      // 设置缓存大小（10MB）
      this.db.pragma('cache_size = -10000');

      // 设置临时存储在内存中
      this.db.pragma('temp_store = MEMORY');

      logger.info('SQLite数据库连接成功', {
        path: this.dbPath,
        version: DATABASE_VERSION,
      });

      // 初始化数据库表结构
      this.initializeTables();
    } catch (error) {
      logger.error('数据库连接失败', error);
      throw new Error('数据库连接失败');
    }
  }

  /**
   * 初始化数据库表
   */
  private initializeTables(): void {
    if (!this.db) {
      throw new Error('数据库未连接');
    }

    try {
      // 启用外键约束
      this.db.pragma('foreign_keys = ON');

      // 创建所有表
      this.db.exec(CREATE_PROJECTS_TABLE);
      this.db.exec(CREATE_HISTORICAL_DATA_TABLE);
      this.db.exec(CREATE_SYSTEM_CONFIGS_TABLE);
      this.db.exec(CREATE_ENGINEERING_CLASSES_TABLE);
      this.db.exec(CREATE_RATE_NODES_TABLE);
      this.db.exec(CREATE_UI_LAYOUTS_TABLE);
      this.db.exec(CREATE_CONFIG_HISTORY_TABLE);
      this.db.exec(CREATE_RATE_RULES_TABLE);
      this.db.exec(CREATE_COMPANY_BUSINESS_CLASSIFICATION_TABLE);
      this.db.exec(CREATE_PRICING_PLANS_TABLE);

      logger.info('创建数据表成功');

      // 数据库迁移：添加新字段（如果不存在）
      this.migrateDatabase();

      // 创建索引
      CREATE_INDEXES.forEach((indexSql) => {
        this.db!.exec(indexSql);
      });
      logger.info('创建索引成功');

      // 初始化默认数据
      this.initDefaultData();
    } catch (error) {
      logger.error('初始化数据库表失败', error);
      throw new Error('初始化数据库表失败');
    }
  }

  /**
   * 数据库迁移
   * 添加新字段到现有表
   */
  private migrateDatabase(): void {
    if (!this.db) {
      throw new Error('数据库未连接');
    }

    try {
      // 检查 pricing_plans 表是否已有 project_name 字段
      const pricingTableInfo = this.db!.pragma('table_info(pricing_plans)') as Array<{ name: string }>;
      const pricingColumnNames = pricingTableInfo.map(col => col.name);

      // 添加新字段（如果不存在）
      if (!pricingColumnNames.includes('project_name')) {
        this.db!.exec('ALTER TABLE pricing_plans ADD COLUMN project_name TEXT');
        logger.info('添加字段: project_name');
      }
      if (!pricingColumnNames.includes('contractor')) {
        this.db!.exec('ALTER TABLE pricing_plans ADD COLUMN contractor TEXT');
        logger.info('添加字段: contractor');
      }
      if (!pricingColumnNames.includes('project_location')) {
        this.db!.exec('ALTER TABLE pricing_plans ADD COLUMN project_location TEXT');
        logger.info('添加字段: project_location');
      }

      // 迁移 project_id 字段（如果不存在）
      if (!pricingColumnNames.includes('project_id')) {
        this.db!.exec('ALTER TABLE pricing_plans ADD COLUMN project_id TEXT');
        logger.info('添加字段: pricing_plans.project_id');
      }

      // 检查 historical_data 表是否有所有需要的字段
      const historyTableInfo = this.db!.pragma('table_info(historical_data)') as Array<{ name: string }>;
      const historyColumnNames = historyTableInfo.map(col => col.name);

      if (!historyColumnNames.includes('project_id')) {
        this.db!.exec('ALTER TABLE historical_data ADD COLUMN project_id TEXT');
        logger.info('添加字段: historical_data.project_id');
      }

      if (!historyColumnNames.includes('signing_date')) {
        this.db!.exec('ALTER TABLE historical_data ADD COLUMN signing_date TEXT');
        logger.info('添加字段: historical_data.signing_date');
      }

      logger.info('数据库迁移完成');
    } catch (error) {
      // 如果字段已存在或其他错误，忽略
      logger.info('数据库迁移完成或跳过', { error });
    }
  }

  /**
   * 初始化默认数据
   */
  private initDefaultData(): void {
    if (!this.db) {
      throw new Error('数据库未连接');
    }

    try {
      // 检查系统配置是否已初始化
      const configCount = this.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM system_configs'
      )?.count || 0;

      if (configCount > 0) {
        logger.info('默认数据已存在，跳过系统配置初始化');
      } else {
        // 插入默认系统配置
        const insertSystemConfig = this.db.prepare(`
          INSERT INTO system_configs (
            id, config_key, config_value, config_type, category, description
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        INIT_DEFAULT_DATA.systemConfigs.forEach((config) => {
          insertSystemConfig.run(
            config.id,
            config.config_key,
            config.config_value,
            config.config_type,
            config.category,
            config.description
          );
        });
      }

      // 检查工程分类是否已初始化
      const engineeringClassCount = this.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM engineering_classes'
      )?.count || 0;

      if (engineeringClassCount > 0) {
        logger.info('工程分类数据已存在，跳过初始化');
      } else {
        // 插入默认工程分类
        const insertEngineeringClass = this.db.prepare(`
          INSERT INTO engineering_classes (
            id, class_level, class_name, description, keywords, risk_level,
            k3_labor, k4_range_min, k4_range_max, examples, display_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        INIT_DEFAULT_DATA.engineeringClasses.forEach((classData) => {
          insertEngineeringClass.run(
            classData.id,
            classData.class_level,
            classData.class_name,
            classData.description,
            classData.keywords,
            classData.risk_level,
            classData.k3_labor,
            classData.k4_range_min,
            classData.k4_range_max,
            classData.examples,
            classData.display_order
          );
        });
      }

      // 检查费率节点是否已初始化
      const rateNodeCount = this.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM rate_nodes'
      )?.count || 0;

      if (rateNodeCount > 0) {
        logger.info('费率节点数据已存在，跳过初始化');
      } else {
        // 插入默认费率节点
        const insertRateNode = this.db.prepare(`
          INSERT INTO rate_nodes (
            id, node_type, node_value, factor, display_order
          ) VALUES (?, ?, ?, ?, ?)
        `);

        INIT_DEFAULT_DATA.rateNodes.forEach((node) => {
          insertRateNode.run(
            node.id,
            node.node_type,
            node.node_value,
            node.factor,
            node.display_order
          );
        });
      }

      // 检查公司业务分类是否已初始化
      const businessClassificationCount = this.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM company_business_classification'
      )?.count || 0;

      if (businessClassificationCount > 0) {
        logger.info('公司业务分类数据已存在，跳过初始化');
      } else {
        logger.info('开始初始化公司业务分类数据');
        // 插入默认公司业务分类
        const insertBusinessClassification = this.db.prepare(`
          INSERT INTO company_business_classification (
            id, category_level, category_name, category_description, risk_levels,
            business_types, examples, underwriting_guide, display_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        INIT_DEFAULT_DATA.businessClassifications.forEach((classification) => {
          insertBusinessClassification.run(
            classification.id,
            classification.category_level,
            classification.category_name,
            classification.category_description,
            classification.risk_levels,
            classification.business_types,
            classification.examples,
            classification.underwriting_guide,
            classification.display_order
          );
        });
        logger.info('公司业务分类初始化完成');
      }

      logger.info('初始化默认数据成功');
    } catch (error) {
      logger.error('初始化默认数据失败', error);
      // 不抛出错误，允许系统继续运行
    }
  }

  /**
   * 获取数据库连接
   */
  public getConnection(): Database.Database {
    if (!this.db) {
      throw new Error('数据库未连接，请先调用connect()方法');
    }
    return this.db;
  }

  /**
   * 执行查询（返回多行）
   */
  public all<T = any>(sql: string, params: any[] = []): T[] {
    try {
      const stmt = this.getConnection().prepare(sql);
      return stmt.all(...params) as T[];
    } catch (error) {
      logger.error('查询失败', { sql, params, error });
      throw error;
    }
  }

  /**
   * 执行查询（返回单行）
   */
  public get<T = any>(sql: string, params: any[] = []): T | undefined {
    try {
      const stmt = this.getConnection().prepare(sql);
      return stmt.get(...params) as T | undefined;
    } catch (error) {
      logger.error('查询失败', { sql, params, error });
      throw error;
    }
  }

  /**
   * 执行插入/更新/删除
   */
  public run(sql: string, params: any[] = []): Database.RunResult {
    try {
      const stmt = this.getConnection().prepare(sql);
      return stmt.run(...params);
    } catch (error) {
      logger.error('执行失败', { sql, params, error });
      throw error;
    }
  }

  /**
   * 开始事务
   */
  public beginTransaction(): void {
    this.getConnection().exec('BEGIN TRANSACTION');
  }

  /**
   * 提交事务
   */
  public commit(): void {
    this.getConnection().exec('COMMIT');
  }

  /**
   * 回滚事务
   */
  public rollback(): void {
    this.getConnection().exec('ROLLBACK');
  }

  /**
   * 在事务中执行操作
   */
  public transaction<T>(fn: () => T): T {
    const db = this.getConnection();
    const trans = db.transaction(fn);
    return trans();
  }

  /**
   * 关闭数据库连接
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.info('数据库连接已关闭');
    }
  }

  /**
   * 获取数据库统计信息
   */
  public getStats(): {
    totalRecords: number;
    databaseSize: number;
    version: number;
  } {
    const totalRecords = this.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM historical_data'
    )?.count || 0;

    const stats = this.db!.pragma('cache_size', { simple: true });

    return {
      totalRecords,
      databaseSize: fs.statSync(this.dbPath).size,
      version: DATABASE_VERSION,
    };
  }

  /**
   * 备份数据库
   */
  public backup(backupPath: string): void {
    try {
      // 确保备份目录存在
      const dir = path.dirname(backupPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 关闭当前连接
      this.close();

      // 复制数据库文件
      fs.copyFileSync(this.dbPath, backupPath);

      // 重新连接
      this.connect();

      logger.info('数据库备份成功', { backupPath });
    } catch (error) {
      // 确保重新连接
      this.connect();
      logger.error('数据库备份失败', error);
      throw new Error('数据库备份失败');
    }
  }

  /**
   * 清空所有数据（危险操作）
   */
  public clearAll(): void {
    try {
      this.getConnection().exec('DELETE FROM historical_data');
      logger.warn('已清空所有历史数据');
    } catch (error) {
      logger.error('清空数据失败', error);
      throw new Error('清空数据失败');
    }
  }

  /**
   * 迁移现有数据到项目追踪机制
   * 为所有没有 project_id 的历史记录创建对应的项目
   */
  public migrateExistingData(): { migrated: number; errors: string[] } {
    if (!this.db) {
      throw new Error('数据库未连接');
    }

    const errors: string[] = [];
    let migrated = 0;

    try {
      // 获取所有没有 project_id 的历史数据
      const records = this.all<any>(
        'SELECT * FROM historical_data WHERE project_id IS NULL'
      );

      logger.info(`开始迁移 ${records.length} 条历史记录`);

      for (const record of records) {
        try {
          // 1. 生成 UUID
          const projectId = uuidv4();

          // 2. 根据记录的创建日期生成业务流水号
          const createdAt = new Date(record.created_at);
          const dateStr = createdAt.toISOString().slice(0, 10).replace(/-/g, '');

          // 查询当天已有的项目数量
          const count = this.get<{ count: number }>(
            `SELECT COUNT(*) as count FROM projects WHERE business_no LIKE ?`,
            [`SCJG-${dateStr}-%`]
          )?.count || 0;

          // 生成序号（4位，从0001开始）
          const sequence = String(count + 1).padStart(4, '0');
          const businessNo = `SCJG-${dateStr}-${sequence}`;

          // 3. 创建项目记录（状态设为 completed，因为这是已完成的历史项目）
          this.run(`
            INSERT INTO projects (
              project_id, business_no, project_name, status, source,
              created_at, updated_at
            ) VALUES (?, ?, ?, 'completed', 'migration', ?, ?)
          `, [projectId, businessNo, record.project_name, record.created_at, record.created_at]);

          // 4. 更新 historical_data 表，关联 project_id
          this.run(`
            UPDATE historical_data SET project_id = ? WHERE id = ?
          `, [projectId, record.id]);

          // 5. 如果该记录有关联的报价方案，也需要更新
          const relatedPlans = this.all<any>(
            'SELECT * FROM pricing_plans WHERE project_name = ? AND project_id IS NULL',
            [record.project_name]
          );

          for (const plan of relatedPlans) {
            this.run(`
              UPDATE pricing_plans SET project_id = ? WHERE id = ?
            `, [projectId, plan.id]);
          }

          migrated++;
        } catch (error) {
          const errorMsg = `迁移记录 ${record.id} 失败: ${error instanceof Error ? error.message : '未知错误'}`;
          logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      logger.info('数据迁移完成', { migrated, errors: errors.length });
    } catch (error) {
      logger.error('数据迁移失败', error);
      throw new Error('数据迁移失败');
    }

    return { migrated, errors };
  }
}

/**
 * 导出数据库单例
 */
export const database = DatabaseManager.getInstance();
 
