/**
 * SQLite数据库表结构定义
 * 用于四川建工意外险智能报价系统
 */

/**
 * 项目表
 * 统一管理所有项目的生命周期和关联关系
 */
export const CREATE_PROJECTS_TABLE = `
  CREATE TABLE IF NOT EXISTS projects (
    project_id TEXT PRIMARY KEY,           -- UUID (唯一标识)
    business_no TEXT UNIQUE NOT NULL,      -- 业务流水号 (SCJG-YYYYMMDD-序号)
    project_name TEXT NOT NULL,            -- 项目名称
    status TEXT DEFAULT 'draft',           -- 状态: draft/pricing/completed/cancelled
    source TEXT,                           -- 来源: contract/manual/import/migration
    source_file_name TEXT,                 -- 源文件名（如果来自合同解析）
    created_at DATETIME NOT NULL,          -- 创建时间
    updated_at DATETIME NOT NULL,          -- 更新时间
    created_by TEXT,                       -- 创建人
    notes TEXT                             -- 备注
  )
`;

/**
 * 历史承保数据表
 * 存储所有项目的历史保费计算记录
 */
export const CREATE_HISTORICAL_DATA_TABLE = `
  CREATE TABLE IF NOT EXISTS historical_data (
    id TEXT PRIMARY KEY,                    -- 唯一标识
    project_id TEXT,                        -- 项目ID (UUID，外键关联 projects 表)
    project_name TEXT NOT NULL,             -- 项目名称
    project_type TEXT NOT NULL,             -- 项目性质（造价型/面积型）
    engineering_class TEXT NOT NULL,        -- 工程分类
    total_cost REAL,                        -- 工程造价（元）
    total_area REAL,                        -- 建筑面积（㎡）
    contract_type TEXT NOT NULL,            -- 合同类型
    company_qualification TEXT NOT NULL,    -- 企业资质
    management_level TEXT NOT NULL,         -- 管理水平
    address TEXT NOT NULL,                  -- 项目地址
    construction_unit TEXT NOT NULL,        -- 施工单位
    signing_date TEXT,                      -- 签单日期
    start_date TEXT NOT NULL,               -- 开工日期
    end_date TEXT NOT NULL,                 -- 竣工日期
    total_premium REAL NOT NULL,            -- 总保费（元）
    project_info_full TEXT NOT NULL,        -- 完整项目信息（JSON格式）
    premium_details TEXT NOT NULL,          -- 保费详情（JSON格式）
    created_at DATETIME NOT NULL,           -- 创建时间
    updated_at DATETIME NOT NULL,           -- 更新时间
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE SET NULL
  )
`;

/**
 * 系统配置表
 * 存储系统级别的配置项
 */
export const CREATE_SYSTEM_CONFIGS_TABLE = `
  CREATE TABLE IF NOT EXISTS system_configs (
    id TEXT PRIMARY KEY,
    config_key TEXT UNIQUE NOT NULL,        -- 配置键
    config_value TEXT NOT NULL,             -- 配置值（JSON格式）
    config_type TEXT NOT NULL,              -- 配置类型：system/user/ui
    category TEXT,                          -- 分类
    description TEXT,                       -- 描述
    is_active INTEGER DEFAULT 1,            -- 是否启用
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_by TEXT
  )
`;

/**
 * 工程分类配置表
 * 存储工程分类及相关系数
 */
export const CREATE_ENGINEERING_CLASSES_TABLE = `
  CREATE TABLE IF NOT EXISTS engineering_classes (
    id TEXT PRIMARY KEY,
    class_level INTEGER NOT NULL UNIQUE,   -- 工程类别（1-4）
    class_name TEXT NOT NULL,               -- 类别名称
    description TEXT,                       -- 描述
    keywords TEXT,                          -- 关键词（JSON数组）
    risk_level TEXT,                        -- 风险等级
    k3_labor REAL,                          -- K3劳动系数
    k4_range_min REAL,                      -- K4范围最小值
    k4_range_max REAL,                      -- K4范围最大值
    examples TEXT,                          -- 示例（JSON数组）
    display_order INTEGER DEFAULT 0,        -- 显示顺序
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

/**
 * 费率节点配置表
 * 存储各类费率系数节点
 */
export const CREATE_RATE_NODES_TABLE = `
  CREATE TABLE IF NOT EXISTS rate_nodes (
    id TEXT PRIMARY KEY,
    node_type TEXT NOT NULL,                -- 节点类型：k1_cost, k2_area, m1, m2
    node_value REAL NOT NULL,               -- 节点值
    factor REAL NOT NULL,                   -- 系数
    display_order INTEGER DEFAULT 0,        -- 显示顺序
    effective_date DATETIME,                -- 生效日期
    expiry_date DATETIME,                   -- 失效日期
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

/**
 * UI布局配置表
 * 存储页面和组件的布局配置
 */
export const CREATE_UI_LAYOUTS_TABLE = `
  CREATE TABLE IF NOT EXISTS ui_layouts (
    id TEXT PRIMARY KEY,
    page_name TEXT NOT NULL,                -- 页面名称
    component_name TEXT NOT NULL,           -- 组件名称
    layout_config TEXT NOT NULL,            -- 布局配置（JSON）
    style_config TEXT,                      -- 样式配置（JSON）
    is_visible INTEGER DEFAULT 1,           -- 是否可见
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

/**
 * 配置变更历史表
 * 记录所有配置的变更历史
 */
export const CREATE_CONFIG_HISTORY_TABLE = `
  CREATE TABLE IF NOT EXISTS config_history (
    id TEXT PRIMARY KEY,
    config_type TEXT NOT NULL,              -- 配置类型：system/engineering/rate/ui
    config_id TEXT NOT NULL,                -- 配置ID
    old_value TEXT,                         -- 旧值（JSON）
    new_value TEXT NOT NULL,                -- 新值（JSON）
    change_reason TEXT,                     -- 变更原因
    changed_by TEXT NOT NULL,               -- 操作人
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

/**
 * 费率规则表
 * 存储费率规则定义
 */
export const CREATE_RATE_RULES_TABLE = `
  CREATE TABLE IF NOT EXISTS rate_rules (
    id TEXT PRIMARY KEY,
    rule_name TEXT NOT NULL,                -- 规则名称
    rule_type TEXT NOT NULL,                -- 规则类型：k1, k2, m1, m2
    rule_config TEXT NOT NULL,              -- 规则配置（JSON）
    is_active INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,             -- 优先级
    effective_date DATETIME,                -- 生效日期
    expiry_date DATETIME,                   -- 失效日期
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

/**
 * 公司业务分类表
 * 存储建工意外险的5个业务分类及其对应的建筑风险类型
 */
export const CREATE_COMPANY_BUSINESS_CLASSIFICATION_TABLE = `
  CREATE TABLE IF NOT EXISTS company_business_classification (
    id TEXT PRIMARY KEY,
    category_level TEXT NOT NULL UNIQUE,   -- 分类等级：encouraged(鼓励类)/general(一般类)/cautious(谨慎类)/restricted(限制类)/strictly_restricted(严格限制类)
    category_name TEXT NOT NULL,           -- 分类名称
    category_description TEXT,              -- 分类描述
    risk_levels TEXT NOT NULL,             -- 建筑风险等级列表（JSON数组）
    business_types TEXT NOT NULL,          -- 业务类型描述（JSON数组）
    examples TEXT,                         -- 示例项目（JSON数组）
    underwriting_guide TEXT,               -- 承保指引
    display_order INTEGER DEFAULT 0,       -- 显示顺序
    is_active INTEGER DEFAULT 1,           -- 是否启用
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_by TEXT
  )
`;

/**
 * 报价方案表
 * 存储用户保存的保费计算方案
 */
export const CREATE_PRICING_PLANS_TABLE = `
  CREATE TABLE IF NOT EXISTS pricing_plans (
    id TEXT PRIMARY KEY,
    project_id TEXT,                       -- 项目ID (UUID，外键关联 projects 表)
    plan_name TEXT NOT NULL,               -- 方案名称
    plan_description TEXT,                 -- 方案描述/备注
    project_name TEXT,                     -- 项目名称
    contractor TEXT,                       -- 施工方
    project_location TEXT,                 -- 项目地点
    main_params TEXT NOT NULL,             -- 主险参数（JSON格式）
    medical_params TEXT,                   -- 医疗保险参数（JSON格式）
    allowance_params TEXT,                 -- 住院津贴参数（JSON格式）
    acute_disease_params TEXT,             -- 急性病参数（JSON格式）
    plateau_disease_params TEXT,           -- 高原病参数（JSON格式）
    calculation_result TEXT NOT NULL,      -- 计算结果（JSON格式）
    total_premium REAL NOT NULL,           -- 总保费
    created_at DATETIME NOT NULL,          -- 创建时间
    updated_at DATETIME NOT NULL,          -- 更新时间
    created_by TEXT,                       -- 创建人
    tags TEXT,                             -- 标签（JSON数组）
    is_favorite INTEGER DEFAULT 0,         -- 是否收藏
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE SET NULL
  )
`;

/**
 * 创建索引
 * 加速常用的查询条件
 */
export const CREATE_INDEXES = [
  // 项目表索引
  'CREATE INDEX IF NOT EXISTS idx_project_business_no ON projects(business_no)',
  'CREATE INDEX IF NOT EXISTS idx_project_status ON projects(status)',
  'CREATE INDEX IF NOT EXISTS idx_project_created_at ON projects(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_project_source ON projects(source)',

  // 历史数据索引
  'CREATE INDEX IF NOT EXISTS idx_historical_project_id ON historical_data(project_id)',
  'CREATE INDEX IF NOT EXISTS idx_project_type ON historical_data(project_type)',
  'CREATE INDEX IF NOT EXISTS idx_engineering_class ON historical_data(engineering_class)',
  'CREATE INDEX IF NOT EXISTS idx_total_cost ON historical_data(total_cost)',
  'CREATE INDEX IF NOT EXISTS idx_total_area ON historical_data(total_area)',
  'CREATE INDEX IF NOT EXISTS idx_created_at ON historical_data(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_project_type_class ON historical_data(project_type, engineering_class)',

  // 系统配置索引
  'CREATE INDEX IF NOT EXISTS idx_config_key ON system_configs(config_key)',
  'CREATE INDEX IF NOT EXISTS idx_config_type ON system_configs(config_type)',
  'CREATE INDEX IF NOT EXISTS idx_config_category ON system_configs(category)',

  // 工程分类索引
  'CREATE INDEX IF NOT EXISTS idx_class_level ON engineering_classes(class_level)',
  'CREATE INDEX IF NOT EXISTS idx_risk_level ON engineering_classes(risk_level)',

  // 费率节点索引
  'CREATE INDEX IF NOT EXISTS idx_node_type ON rate_nodes(node_type)',
  'CREATE INDEX IF NOT EXISTS idx_node_value ON rate_nodes(node_value)',

  // UI布局索引
  'CREATE INDEX IF NOT EXISTS idx_page_name ON ui_layouts(page_name)',
  'CREATE INDEX IF NOT EXISTS idx_component_name ON ui_layouts(component_name)',

  // 配置历史索引
  'CREATE INDEX IF NOT EXISTS idx_config_type ON config_history(config_type)',
  'CREATE INDEX IF NOT EXISTS idx_config_id ON config_history(config_id)',
  'CREATE INDEX IF NOT EXISTS idx_changed_at ON config_history(changed_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_changed_by ON config_history(changed_by)',

  // 费率规则索引
  'CREATE INDEX IF NOT EXISTS idx_rule_type ON rate_rules(rule_type)',
  'CREATE INDEX IF NOT EXISTS idx_rule_active ON rate_rules(is_active)',

  // 公司业务分类索引
  'CREATE INDEX IF NOT EXISTS idx_category_level ON company_business_classification(category_level)',
  'CREATE INDEX IF NOT EXISTS idx_display_order ON company_business_classification(display_order)',

  // 报价方案索引
  'CREATE INDEX IF NOT EXISTS idx_pricing_project_id ON pricing_plans(project_id)',
  'CREATE INDEX IF NOT EXISTS idx_plan_name ON pricing_plans(plan_name)',
  'CREATE INDEX IF NOT EXISTS idx_total_premium ON pricing_plans(total_premium)',
  'CREATE INDEX IF NOT EXISTS idx_created_at ON pricing_plans(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_is_favorite ON pricing_plans(is_favorite)',
  'CREATE INDEX IF NOT EXISTS idx_created_by ON pricing_plans(created_by)',
];

/**
 * 初始化默认数据
 */
export const INIT_DEFAULT_DATA = {
  // 默认系统配置
  systemConfigs: [
    {
      id: 'config_001',
      config_key: 'system.version',
      config_value: JSON.stringify('1.0.0'),
      config_type: 'system',
      category: 'general',
      description: '系统版本号',
    },
    {
      id: 'config_002',
      config_key: 'system.max_file_size',
      config_value: JSON.stringify(52428800), // 50MB
      config_type: 'system',
      category: 'limits',
      description: '最大文件上传大小',
    },
    {
      id: 'config_003',
      config_key: 'system.ai_parsing_enabled',
      config_value: JSON.stringify(true),
      config_type: 'system',
      category: 'features',
      description: '启用 AI 合同解析',
    },
  ],

  // 默认工程分类
  engineeringClasses: [
    {
      id: 'class_001',
      class_level: 1,
      class_name: '一类工程',
      description: '室内装修、普通住宅/厂房、市政道路（无桥隧）、园林/亮化工程',
      keywords: JSON.stringify(['装修', '住宅', '厂房', '市政', '园林', '亮化']),
      risk_level: 'low',
      k3_labor: 4.0,
      k4_range_min: 0.80,
      k4_range_max: 1.00,
      examples: JSON.stringify([
        '室内装修工程',
        '普通住宅建设',
        '厂房建设',
        '市政道路（无桥隧）',
        '园林绿化工程',
        '亮化工程'
      ]),
      display_order: 1,
    },
    {
      id: 'class_002',
      class_level: 2,
      class_name: '二类工程',
      description: '火电/风电/港口、机电安装、城市轨道交通（非地下）、消防设施',
      keywords: JSON.stringify(['电力', '风电', '港口', '机电', '轨道', '消防']),
      risk_level: 'medium',
      k3_labor: 5.0,
      k4_range_min: 1.30,
      k4_range_max: 1.50,
      examples: JSON.stringify([
        '火电工程',
        '风电工程',
        '港口码头建设',
        '机电安装工程',
        '城市轨道交通（非地下）',
        '消防设施工程'
      ]),
      display_order: 2,
    },
    {
      id: 'class_003',
      class_level: 3,
      class_name: '三类工程',
      description: '农村自建房、水利工程、公路（桥隧比<50%）、普通拆除工程',
      keywords: JSON.stringify(['农村', '自建房', '水利', '公路', '拆除']),
      risk_level: 'medium-high',
      k3_labor: 6.0,
      k4_range_min: 1.80,
      k4_range_max: 2.00,
      examples: JSON.stringify([
        '农村自建房',
        '水利工程',
        '公路建设（桥隧比<50%）',
        '普通拆除工程',
        '河道治理',
        '农田水利'
      ]),
      display_order: 3,
    },
    {
      id: 'class_004',
      class_level: 4,
      class_name: '四类工程',
      description: '高架桥、钢结构、公路（桥隧比≥50%）、爆破工程、地下隧道',
      keywords: JSON.stringify(['桥', '隧道', '高架', '钢结构', '爆破', '地下']),
      risk_level: 'high',
      k3_labor: 7.0,
      k4_range_min: 2.30,
      k4_range_max: 2.50,
      examples: JSON.stringify([
        '高架桥工程',
        '钢结构工程',
        '公路建设（桥隧比≥50%）',
        '爆破工程',
        '地下隧道',
        '架线工程'
      ]),
      display_order: 4,
    },
  ],

  // 默认费率节点
  rateNodes: [
    // K1系数节点（造价）
    { id: 'rate_001', node_type: 'k1_cost', node_value: 500, factor: 0.8, display_order: 1 },
    { id: 'rate_002', node_type: 'k1_cost', node_value: 1000, factor: 0.9, display_order: 2 },
    { id: 'rate_003', node_type: 'k1_cost', node_value: 5000, factor: 1.0, display_order: 3 },
    { id: 'rate_004', node_type: 'k1_cost', node_value: 10000, factor: 1.1, display_order: 4 },
    { id: 'rate_005', node_type: 'k1_cost', node_value: 100000, factor: 1.3, display_order: 5 },

    // K2系数节点（面积）
    { id: 'rate_006', node_type: 'k2_area', node_value: 200, factor: 0.9, display_order: 1 },
    { id: 'rate_007', node_type: 'k2_area', node_value: 500, factor: 0.95, display_order: 2 },
    { id: 'rate_008', node_type: 'k2_area', node_value: 1000, factor: 1.0, display_order: 3 },
    { id: 'rate_009', node_type: 'k2_area', node_value: 5000, factor: 1.1, display_order: 4 },
    { id: 'rate_010', node_type: 'k2_area', node_value: 10000, factor: 1.2, display_order: 5 },
  ],

  // 公司业务分类默认数据
  businessClassifications: [
    {
      id: 'business_001',
      category_level: 'encouraged',
      category_name: '鼓励类',
      category_description: '低风险业务，优先承保',
      risk_levels: JSON.stringify(['1类建筑风险', '2类建筑风险']),
      business_types: JSON.stringify([
        '层高低于100米的房建工程',
        '室内装修工程',
        '环保工程',
        '交通运输配套设项目',
        '园区建设项目',
        '生态旅游建设项目',
        '美丽乡村工程',
        '层高高于100米的房建工程',
        '普通道路工程',
        '市政道路工程',
        '灌溉引水工程'
      ]),
      examples: JSON.stringify([
        '住宅小区建设项目',
        '办公楼装修工程',
        '公园绿化项目',
        '工业园区基础设施',
        '乡村道路建设'
      ]),
      underwriting_guide: '可积极承保，给予优惠费率',
      display_order: 1,
    },
    {
      id: 'business_002',
      category_level: 'general',
      category_name: '一般类',
      category_description: '中等风险业务，正常承保',
      risk_levels: JSON.stringify(['3类建筑风险']),
      business_types: JSON.stringify([
        '飞机场',
        '体育馆等大跨距场馆',
        '基坑工程',
        '城市防洪工程',
        '边坡防护工程'
      ]),
      examples: JSON.stringify([
        '大型体育场馆建设',
        '深基坑支护工程',
        '城市防洪堤坝建设',
        '山体边坡治理'
      ]),
      underwriting_guide: '按标准费率承保，注意风险评估',
      display_order: 2,
    },
    {
      id: 'business_003',
      category_level: 'cautious',
      category_name: '谨慎类',
      category_description: '中高风险业务，需谨慎评估',
      risk_levels: JSON.stringify(['4类建筑风险']),
      business_types: JSON.stringify([
        '内河航道工程',
        '市政道路（含桥涵）',
        '普通桥梁（一般情况下单跨小于50m）',
        '机电安装工程',
        '通信系统供电设备'
      ]),
      examples: JSON.stringify([
        '内河港口码头建设',
        '市政桥梁工程',
        '工厂设备安装',
        '通信基站建设'
      ]),
      underwriting_guide: '需详细评估风险，可考虑适当提高费率或设置免赔额',
      display_order: 3,
    },
    {
      id: 'business_004',
      category_level: 'restricted',
      category_name: '限制类',
      category_description: '高风险业务，严格限制承保',
      risk_levels: JSON.stringify(['5类-6类建筑风险']),
      business_types: JSON.stringify([
        '玻璃幕墙工程',
        '空调设备安装工程',
        '隧洞、桥梁造价占比超40%的高速公路',
        '铁路工程',
        '电力高压电工程',
        '电力、电信工程设施架设',
        '电力行业设备安装',
        '钢结构工程',
        '玻璃幕墙、外墙施工',
        '冶炼工程设备安装',
        '采矿工程',
        '水库/水电站主体工程（大坝、电站厂房建筑）',
        '水库/水电站前期工程(包括进场公路、岸坡处理、围堰、导流洞等)',
        '水库/水电站设备及安装工程',
        '铁路/公路隧道',
        '海底/水底隧道',
        '其他隧道（人行隧道、排水隧道、输水隧道等）'
      ]),
      examples: JSON.stringify([
        '高速铁路项目',
        '大型水电站建设',
        '地铁隧道工程',
        '大型钢结构安装',
        '玻璃幕墙外墙工程'
      ]),
      underwriting_guide: '需严格核保，建议提高费率、设置免赔额或共保，必要时需上级审批',
      display_order: 4,
    },
    {
      id: 'business_005',
      category_level: 'strictly_restricted',
      category_name: '严格限制类',
      category_description: '极高风险业务，原则上不予承保',
      risk_levels: JSON.stringify(['特殊风险']),
      business_types: JSON.stringify([
        '除机械或爆破拆除外，单独的人工拆除项目',
        '纯桥梁或纯隧道工程',
        '个人建房业务',
        '施工单位无施工资质的业务'
      ]),
      examples: JSON.stringify([
        '人工拆除旧建筑',
        '个人自建房',
        '无资质队伍承包的工程'
      ]),
      underwriting_guide: '原则上不予承保，特殊情况需总公司批准',
      display_order: 5,
    },
  ],
};

/**
 * 初始化数据库
 * 创建所有表和索引
 */
export const INIT_DATABASE = `
  ${CREATE_PROJECTS_TABLE}
  ${CREATE_HISTORICAL_DATA_TABLE}
  ${CREATE_SYSTEM_CONFIGS_TABLE}
  ${CREATE_ENGINEERING_CLASSES_TABLE}
  ${CREATE_RATE_NODES_TABLE}
  ${CREATE_UI_LAYOUTS_TABLE}
  ${CREATE_CONFIG_HISTORY_TABLE}
  ${CREATE_RATE_RULES_TABLE}
  ${CREATE_COMPANY_BUSINESS_CLASSIFICATION_TABLE}
  ${CREATE_PRICING_PLANS_TABLE}
`;

/**
 * 数据库迁移 SQL
 * 为现有表添加新字段
 */
export const MIGRATION_SQL = [
  // 为 historical_data 表添加 project_id 字段（如果不存在）
  `ALTER TABLE historical_data ADD COLUMN project_id TEXT`,

  // 为 pricing_plans 表添加 project_id 字段（如果不存在）
  `ALTER TABLE pricing_plans ADD COLUMN project_id TEXT`,

  // 为 historical_data 表添加 signing_date 字段（如果不存在）
  `ALTER TABLE historical_data ADD COLUMN signing_date TEXT`,
];

/**
 * 数据库版本
 * 用于未来的数据迁移
 */
export const DATABASE_VERSION = 7;

/**
 * 数据库文件路径
 */
export const DATABASE_PATH = './data/insurance_pricing.db';
