import { v4 as uuidv4 } from 'uuid';
import { database } from '../database/database';
import { logger } from '../utils/logger';

/**
 * 配置服务类
 * 提供配置的CRUD操作
 */
export class ConfigService {
  private static instance: ConfigService;

  private constructor() {}

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  // ==================== 系统配置 ====================

  /**
   * 获取所有系统配置
   */
  public getAllSystemConfigs() {
    try {
      const sql = 'SELECT * FROM system_configs WHERE is_active = 1 ORDER BY category, config_key';
      return database.all(sql);
    } catch (error) {
      logger.error('获取系统配置失败', error);
      throw error;
    }
  }

  /**
   * 根据键获取系统配置
   */
  public getSystemConfigByKey(key: string) {
    try {
      const sql = 'SELECT * FROM system_configs WHERE config_key = ? AND is_active = 1';
      return database.get(sql, [key]);
    } catch (error) {
      logger.error('获取系统配置失败', { key, error });
      throw error;
    }
  }

  /**
   * 创建或更新系统配置
   */
  public upsertSystemConfig(config: any, userId: string) {
    try {
      const db = database.getConnection();

      const transaction = db.transaction(() => {
        const existing = this.getSystemConfigByKey(config.config_key);

        if (existing) {
          // 更新
          const oldData = JSON.stringify(existing);
          const newData = JSON.stringify(config);

          const updateSql = `
            UPDATE system_configs
            SET config_value = ?,
                category = ?,
                description = ?,
                updated_by = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE config_key = ?
          `;

          db.prepare(updateSql).run(
            config.config_value,
            config.category,
            config.description,
            userId,
            config.config_key
          );

          // 记录历史
          this.recordConfigHistory('system', existing.id, oldData, newData, '更新配置', userId);
        } else {
          // 创建
          const insertSql = `
            INSERT INTO system_configs (
              id, config_key, config_value, config_type, category, description, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `;

          const newId = uuidv4();
          db.prepare(insertSql).run(
            newId,
            config.config_key,
            config.config_value,
            config.config_type || 'system',
            config.category,
            config.description,
            userId
          );

          // 记录历史
          this.recordConfigHistory('system', newId, null, JSON.stringify(config), '创建配置', userId);
        }

        return this.getSystemConfigByKey(config.config_key);
      });

      return transaction();
    } catch (error) {
      logger.error('保存系统配置失败', error);
      throw error;
    }
  }

  /**
   * 删除系统配置
   */
  public deleteSystemConfig(key: string, userId: string) {
    try {
      const existing = this.getSystemConfigByKey(key);
      if (!existing) {
        throw new Error('配置不存在');
      }

      const updateSql = 'UPDATE system_configs SET is_active = 0, updated_by = ? WHERE config_key = ?';
      database.run(updateSql, [userId, key]);

      // 记录历史
      this.recordConfigHistory('system', existing.id, JSON.stringify(existing), null, '删除配置', userId);

      return { success: true };
    } catch (error) {
      logger.error('删除系统配置失败', { key, error });
      throw error;
    }
  }

  // ==================== 工程分类配置 ====================

  /**
   * 获取所有工程分类
   */
  public getAllEngineeringClasses() {
    try {
      const sql = 'SELECT * FROM engineering_classes WHERE is_active = 1 ORDER BY display_order, class_level';
      return database.all(sql);
    } catch (error) {
      logger.error('获取工程分类失败', error);
      throw error;
    }
  }

  /**
   * 根据级别获取工程分类
   */
  public getEngineeringClassByLevel(level: number) {
    try {
      const sql = 'SELECT * FROM engineering_classes WHERE class_level = ? AND is_active = 1';
      return database.get(sql, [level]);
    } catch (error) {
      logger.error('获取工程分类失败', { level, error });
      throw error;
    }
  }

  /**
   * 创建或更新工程分类
   */
  public upsertEngineeringClass(classData: any, userId: string) {
    try {
      const db = database.getConnection();

      const transaction = db.transaction(() => {
        const existing = classData.id
          ? db.prepare('SELECT * FROM engineering_classes WHERE id = ?').get(classData.id)
          : this.getEngineeringClassByLevel(classData.class_level);

        if (existing) {
          // 更新
          const oldData = JSON.stringify(existing);
          const newData = JSON.stringify(classData);

          const updateSql = `
            UPDATE engineering_classes
            SET class_name = ?,
                description = ?,
                keywords = ?,
                risk_level = ?,
                k3_labor = ?,
                k4_range_min = ?,
                k4_range_max = ?,
                examples = ?,
                display_order = ?,
                updated_by = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `;

          db.prepare(updateSql).run(
            classData.class_name,
            classData.description,
            JSON.stringify(classData.keywords || []),
            classData.risk_level,
            classData.k3_labor,
            classData.k4_range_min,
            classData.k4_range_max,
            JSON.stringify(classData.examples || []),
            classData.display_order || 0,
            userId,
            existing.id
          );

          // 记录历史
          this.recordConfigHistory('engineering', existing.id, oldData, newData, '更新工程分类', userId);
        } else {
          // 创建
          const insertSql = `
            INSERT INTO engineering_classes (
              id, class_level, class_name, description, keywords, risk_level,
              k3_labor, k4_range_min, k4_range_max, examples, display_order, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const newId = uuidv4();
          db.prepare(insertSql).run(
            newId,
            classData.class_level,
            classData.class_name,
            classData.description,
            JSON.stringify(classData.keywords || []),
            classData.risk_level,
            classData.k3_labor,
            classData.k4_range_min,
            classData.k4_range_max,
            JSON.stringify(classData.examples || []),
            classData.display_order || 0,
            userId
          );

          // 记录历史
          this.recordConfigHistory('engineering', newId, null, JSON.stringify(classData), '创建工程分类', userId);
        }

        return classData.id ? this.getEngineeringClassByLevel(classData.class_level) : this.getAllEngineeringClasses().find(c => c.id === classData.id);
      });

      return transaction();
    } catch (error) {
      logger.error('保存工程分类失败', error);
      throw error;
    }
  }

  // ==================== 费率节点配置 ====================

  /**
   * 获取所有费率节点
   */
  public getAllRateNodes(nodeType?: string) {
    try {
      let sql = 'SELECT * FROM rate_nodes';
      const params: any[] = [];

      if (nodeType) {
        sql += ' WHERE node_type = ?';
        params.push(nodeType);
      }

      sql += ' ORDER BY node_type, display_order, node_value';
      return database.all(sql, params);
    } catch (error) {
      logger.error('获取费率节点失败', error);
      throw error;
    }
  }

  /**
   * 创建费率节点
   */
  public createRateNode(nodeData: any, userId: string) {
    try {
      const newId = uuidv4();
      const sql = `
        INSERT INTO rate_nodes (
          id, node_type, node_value, factor, display_order, created_by
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      database.run(sql, [
        newId,
        nodeData.node_type,
        nodeData.node_value,
        nodeData.factor,
        nodeData.display_order || 0,
        userId,
      ]);

      // 记录历史
      this.recordConfigHistory('rate', newId, null, JSON.stringify(nodeData), '创建费率节点', userId);

      return { id: newId, ...nodeData };
    } catch (error) {
      logger.error('创建费率节点失败', error);
      throw error;
    }
  }

  /**
   * 更新费率节点
   */
  public updateRateNode(id: string, nodeData: any, userId: string) {
    try {
      const existing = database.get('SELECT * FROM rate_nodes WHERE id = ?', [id]);
      if (!existing) {
        throw new Error('费率节点不存在');
      }

      const oldData = JSON.stringify(existing);
      const newData = JSON.stringify(nodeData);

      const sql = `
        UPDATE rate_nodes
        SET node_type = ?,
            node_value = ?,
            factor = ?,
            display_order = ?,
            updated_by = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      database.run(sql, [
        nodeData.node_type,
        nodeData.node_value,
        nodeData.factor,
        nodeData.display_order,
        userId,
        id,
      ]);

      // 记录历史
      this.recordConfigHistory('rate', id, oldData, newData, '更新费率节点', userId);

      return { id, ...nodeData };
    } catch (error) {
      logger.error('更新费率节点失败', error);
      throw error;
    }
  }

  /**
   * 删除费率节点
   */
  public deleteRateNode(id: string, userId: string) {
    try {
      const existing = database.get('SELECT * FROM rate_nodes WHERE id = ?', [id]);
      if (!existing) {
        throw new Error('费率节点不存在');
      }

      database.run('DELETE FROM rate_nodes WHERE id = ?', [id]);

      // 记录历史
      this.recordConfigHistory('rate', id, JSON.stringify(existing), null, '删除费率节点', userId);

      return { success: true };
    } catch (error) {
      logger.error('删除费率节点失败', error);
      throw error;
    }
  }

  /**
   * 批量更新费率节点
   */
  public batchUpdateRateNodes(nodes: any[], nodeType: string, userId: string) {
    try {
      const db = database.getConnection();

      // 使用 better-sqlite3 的事务 API
      const transaction = db.transaction(() => {
        // 删除旧节点
        db.prepare('DELETE FROM rate_nodes WHERE node_type = ?').run(nodeType);

        // 插入新节点
        const insertSql = `
          INSERT INTO rate_nodes (
            id, node_type, node_value, factor, display_order, created_by
          ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        const stmt = db.prepare(insertSql);

        nodes.forEach((node) => {
          stmt.run(uuidv4(), nodeType, node.node_value, node.factor, node.display_order, userId);
        });

        // 记录历史
        this.recordConfigHistory(
          'rate',
          nodeType,
          null,
          JSON.stringify(nodes),
          `批量更新${nodeType}节点`,
          userId
        );

        return { success: true, count: nodes.length };
      });

      return transaction();
    } catch (error) {
      logger.error('批量更新费率节点失败', error);
      throw error;
    }
  }

  // ==================== UI布局配置 ====================

  /**
   * 获取页面UI布局
   */
  public getPageLayouts(pageName: string) {
    try {
      const sql = `
        SELECT * FROM ui_layouts
        WHERE page_name = ? AND is_visible = 1
        ORDER BY display_order
      `;
      return database.all(sql, [pageName]);
    } catch (error) {
      logger.error('获取页面布局失败', { pageName, error });
      throw error;
    }
  }

  /**
   * 更新UI布局
   */
  public updateUILayout(layoutData: any, userId: string) {
    try {
      const existing = database.get('SELECT * FROM ui_layouts WHERE id = ?', [layoutData.id]);

      if (existing) {
        // 更新
        const sql = `
          UPDATE ui_layouts
          SET layout_config = ?,
              style_config = ?,
              is_visible = ?,
              display_order = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;

        database.run(sql, [
          JSON.stringify(layoutData.layout_config || {}),
          JSON.stringify(layoutData.style_config || {}),
          layoutData.is_visible !== undefined ? layoutData.is_visible : 1,
          layoutData.display_order || 0,
          layoutData.id,
        ]);

        return { ...layoutData };
      } else {
        // 创建
        const newId = uuidv4();
        const sql = `
          INSERT INTO ui_layouts (
            id, page_name, component_name, layout_config, style_config, is_visible, display_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        database.run(sql, [
          newId,
          layoutData.page_name,
          layoutData.component_name,
          JSON.stringify(layoutData.layout_config || {}),
          JSON.stringify(layoutData.style_config || {}),
          layoutData.is_visible !== undefined ? layoutData.is_visible : 1,
          layoutData.display_order || 0,
        ]);

        return { id: newId, ...layoutData };
      }
    } catch (error) {
      logger.error('更新UI布局失败', error);
      throw error;
    }
  }

  // ==================== 配置历史 ====================

  /**
   * 记录配置变更历史
   */
  private recordConfigHistory(
    configType: string,
    configId: string,
    oldValue: string | null,
    newValue: string | null,
    reason: string,
    changedBy: string
  ) {
    try {
      const sql = `
        INSERT INTO config_history (
          id, config_type, config_id, old_value, new_value, change_reason, changed_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      database.run(sql, [uuidv4(), configType, configId, oldValue, newValue, reason, changedBy]);
    } catch (error) {
      logger.error('记录配置历史失败', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 获取配置变更历史
   */
  public getConfigHistory(configType: string, configId: string, limit = 50) {
    try {
      const sql = `
        SELECT * FROM config_history
        WHERE config_type = ? AND config_id = ?
        ORDER BY changed_at DESC
        LIMIT ?
      `;
      return database.all(sql, [configType, configId, limit]);
    } catch (error) {
      logger.error('获取配置历史失败', error);
      throw error;
    }
  }

  /**
   * 获取最近的配置变更
   */
  public getRecentConfigHistory(limit = 100) {
    try {
      const sql = `
        SELECT * FROM config_history
        ORDER BY changed_at DESC
        LIMIT ?
      `;
      return database.all(sql, [limit]);
    } catch (error) {
      logger.error('获取最近配置历史失败', error);
      throw error;
    }
  }

  // ==================== 公司业务分类管理 ====================

  /**
   * 获取所有业务分类
   */
  public getAllBusinessClassifications() {
    try {
      const sql = 'SELECT * FROM company_business_classification ORDER BY display_order ASC';
      return database.all(sql);
    } catch (error) {
      logger.error('获取业务分类失败', error);
      throw error;
    }
  }

  /**
   * 根据分类等级获取业务分类
   */
  public getBusinessClassificationByLevel(level: string) {
    try {
      const sql = 'SELECT * FROM company_business_classification WHERE category_level = ?';
      return database.get(sql, [level]);
    } catch (error) {
      logger.error('获取业务分类失败', error);
      throw error;
    }
  }

  /**
   * 根据工程类型匹配业务分类
   * @param projectType 工程类型描述
   * @returns 匹配的业务分类，如果未匹配到返回null
   */
  public matchBusinessClassification(projectType: string): any | null {
    try {
      // 获取所有业务分类
      const allClassifications = this.getAllBusinessClassifications();

      logger.info('开始匹配业务分类', { projectType, count: allClassifications.length });

      // 标准化工程类型描述
      const normalizedProjectType = projectType.trim();

      // 提取核心关键词（2-4字的词）
      const extractCoreKeywords = (text: string): string[] => {
        const keywords: string[] = [];
        // 常见工程关键词列表
        const commonKeywords = [
          '住宅', '小区', '小区建设', '房建', '装修', '装饰', '环保', '绿化',
          '道路', '市政', '管网', '供水', '排水', '污水', '燃气', '热力',
          '电力', '电信', '桥梁', '隧道', '地铁', '铁路', '公路', '高速',
          '机场', '港口', '码头', '水利', '水电', '光伏', '风电', '矿山',
          '钢铁', '化工', '石油', '场馆', '体育馆', '医院', '学校', '商场',
          '写字楼', '办公楼', '厂房', '园区', '工业园', '基础设施', '设施',
          '改造', '扩建', '新建', '维修', '养护', '安装', '拆除', '爆破',
          '基坑', '边坡', '地基', '基础', '钢结构', '幕墙', '电梯', '消防'
        ];

        for (const keyword of commonKeywords) {
          if (text.includes(keyword)) {
            keywords.push(keyword);
          }
        }

        // 也提取2-4字的连续词
        for (let i = 0; i < text.length - 1; i++) {
          for (let len = 4; len >= 2; len--) {
            if (i + len <= text.length) {
              const word = text.substr(i, len);
              if (!keywords.includes(word) && word.length >= 2 && word.length <= 4) {
                // 排除一些无意义的词
                if (!['市的', '工程', '项目', '建设', '设计', '施工', '一体化', '标段'].includes(word)) {
                  keywords.push(word);
                }
              }
            }
          }
        }

        return [...new Set(keywords)]; // 去重
      };

      const projectCoreKeywords = extractCoreKeywords(normalizedProjectType);
      logger.info('项目核心关键词', { keywords: projectCoreKeywords.slice(0, 10) });

      // 同义词映射
      const synonymMap: Record<string, string[]> = {
        '管网': ['管道', '管线', '供水管网', '排水管网'],
        '道路': ['公路', '市政道路', '街道', '道路工程'],
        '房建': ['房屋建筑', '建筑', '房建工程', '土建'],
        '装修': ['装饰', '室内装修', '装饰装修'],
        '桥梁': ['桥', '桥梁工程', '高架桥'],
        '隧道': ['隧洞', '地铁隧道', '公路隧道'],
      };

      // 获取同义词
      const getSynonyms = (word: string): string[] => {
        const synonyms: string[] = [word];
        for (const [key, values] of Object.entries(synonymMap)) {
          if (values.includes(word)) {
            synonyms.push(key);
          }
          if (key === word) {
            synonyms.push(...values);
          }
        }
        return [...new Set(synonyms)];
      };

      // 计算匹配分数
      let bestMatch: any = null;
      let bestScore = 0;

      // 遍历每个业务分类
      for (const classification of allClassifications) {
        const businessTypes = JSON.parse(classification.business_types || '[]');
        const examples = JSON.parse(classification.examples || '[]');
        const allMatchItems = [...businessTypes, ...examples];

        let classificationScore = 0;
        let matchedItem = '';

        for (const matchItem of allMatchItems) {
          const itemCoreKeywords = extractCoreKeywords(matchItem);

          let itemScore = 0;

          // 策略1：完全匹配（最高分）
          if (normalizedProjectType.includes(matchItem) || matchItem.includes(normalizedProjectType)) {
            itemScore += 100;
            matchedItem = matchItem;
          }

          // 策略2：核心关键词匹配
          for (const pKeyword of projectCoreKeywords) {
            const pSynonyms = getSynonyms(pKeyword);

            for (const iKeyword of itemCoreKeywords) {
              const iSynonyms = getSynonyms(iKeyword);

              // 检查是否是同义词
              const hasSynonymMatch = pSynonyms.some((ps) =>
                iSynonyms.some((is) => ps === is || ps.includes(is) || is.includes(ps))
              );

              // 检查是否相互包含
              const hasContainsMatch = pKeyword.includes(iKeyword) || iKeyword.includes(pKeyword);

              if (hasSynonymMatch) {
                itemScore += 30; // 同义词匹配加分较高
                matchedItem = matchItem;
              } else if (hasContainsMatch && (pKeyword.length >= 2 || iKeyword.length >= 2)) {
                itemScore += 15; // 包含匹配加分
                matchedItem = matchItem;
              }
            }
          }

          // 策略3：项目名称包含匹配项的关键词
          for (const iKeyword of itemCoreKeywords) {
            if (normalizedProjectType.includes(iKeyword)) {
              itemScore += 10;
              matchedItem = matchItem;
            }
          }

          if (itemScore > classificationScore) {
            classificationScore = itemScore;
          }
        }

        // 记录最高分的分类
        if (classificationScore > bestScore && classificationScore >= 30) { // 至少30分才算匹配
          bestScore = classificationScore;
          bestMatch = {
            category_level: classification.category_level,
            category_name: classification.category_name,
            category_description: classification.category_description,
            underwriting_guide: classification.underwriting_guide,
            match_score: classificationScore,
          };
        }
      }

      if (bestMatch) {
        logger.info(`匹配成功: ${bestMatch.category_name}, 分数: ${bestMatch.match_score}`);
        return bestMatch;
      }

      // 如果未匹配到，返回null
      logger.info('未匹配到业务分类');
      return null;
    } catch (error) {
      logger.error('匹配业务分类失败', { projectType, error });
      return null;
    }
  }

  /**
   * 更新业务分类
   */
  public updateBusinessClassification(classification: any, userId: string) {
    try {
      const db = database.getConnection();
      const transaction = db.transaction(() => {
        const existing = db.prepare('SELECT * FROM company_business_classification WHERE id = ?').get(classification.id);

        const oldData = existing ? JSON.stringify(existing) : null;
        const newData = JSON.stringify(classification);

        const updateSql = `
          UPDATE company_business_classification
          SET category_name = ?,
              category_description = ?,
              risk_levels = ?,
              business_types = ?,
              examples = ?,
              underwriting_guide = ?,
              display_order = ?,
              updated_by = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;

        db.prepare(updateSql).run(
          classification.category_name,
          classification.category_description,
          JSON.stringify(classification.risk_levels || []),
          JSON.stringify(classification.business_types || []),
          JSON.stringify(classification.examples || []),
          classification.underwriting_guide || '',
          classification.display_order || 0,
          userId,
          classification.id
        );

        // 记录历史
        this.recordConfigHistory('business', classification.id, oldData, newData, '更新业务分类', userId);
      });

      return transaction();
    } catch (error) {
      logger.error('更新业务分类失败', error);
      throw error;
    }
  }
}

/**
 * 导出配置服务单例
 */
export const configService = ConfigService.getInstance();
