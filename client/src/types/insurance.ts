/**
 * 建筑施工人员系列保险 - 全局类型定义
 * 基于《建筑施工人员系列保险——全局计算引擎技术规范 (V1.0)》
 */

// ==================== 基础枚举类型 ====================

/**
 * 项目性质（计费模式）
 */
export enum ProjectNature {
  NON_RURAL = 'non_rural', // 非农村项目（造价型）
  RURAL = 'rural', // 农村建房项目（面积型）
}

/**
 * 施工合同类型
 */
export enum ContractType {
  GENERAL_CONTRACT = 'general_contract', // 总包
  SPECIAL_SUBCONTRACT = 'special_subcontract', // 专业分包
  LABOR_CLASS_1 = 'labor_class_1', // 一类工程劳务分包
  LABOR_CLASS_2 = 'labor_class_2', // 二类工程劳务分包
  LABOR_CLASS_3 = 'labor_class_3', // 三类工程劳务分包
  LABOR_CLASS_4 = 'labor_class_4', // 四类工程劳务分包
}

/**
 * 工程类别（1-4类）
 */
export enum EngineeringClass {
  CLASS_1 = 1, // 一类工程
  CLASS_2 = 2, // 二类工程
  CLASS_3 = 3, // 三类工程
  CLASS_4 = 4, // 四类工程
}

/**
 * 施工资质等级
 */
export enum ConstructionQualification {
  SPECIAL = 'special', // 特级
  GRADE_1 = 'grade_1', // 一级
  GRADE_2 = 'grade_2', // 二级
  GRADE_3 = 'grade_3', // 三级
  UNGRADED = 'ungraded', // 不分类
}

/**
 * 风险管理水平等级
 */
export enum RiskManagementLevel {
  SOUND = 'sound', // 健全（A类）
  RELATIVELY_SOUND = 'relatively_sound', // 较健全（B类）
  POOR = 'poor', // 不健全（C类）
}

/**
 * 企业分类等级（AQ3系数使用）
 */
export enum EnterpriseCategory {
  CLASS_A = 'class_a', // A类企业
  CLASS_B = 'class_b', // B类企业
  CLASS_C = 'class_c', // C类企业
}

/**
 * 被保险人风险状况（急性病专用）
 */
export enum PersonRiskLevel {
  CLASS_A = 'class_a', // A类水平（低风险）
  CLASS_B = 'class_b', // B类水平（中风险）
  CLASS_C = 'class_c', // C类水平（高风险）
}

/**
 * 区域等级（急性病、高原病专用）
 */
export enum RegionLevel {
  CLASS_A = 'class_a', // A类（优/低风险）
  CLASS_B = 'class_b', // B类（良/中风险）
  CLASS_C = 'class_c', // C类（一般/高风险）
}

/**
 * 社保投保情况
 */
export enum SocialInsuranceStatus {
  PARTICIPATED = 'participated', // 参加
  NOT_PARTICIPATED = 'not_participated', // 未参加
}

/**
 * 其他医疗保险情况
 */
export enum OtherInsuranceStatus {
  HAS = 'has', // 有
  NONE = 'none', // 无或无法准确获取
}

// ==================== 费率因子接口 ====================

/**
 * 全局费率因子（主险使用）
 */
export interface GlobalRateFactors {
  // K1: 工程造价调整系数（非农村项目）
  k1_costFactor?: number;

  // K2: 工程面积调整系数（农村项目）
  k2_areaFactor?: number;

  // K3: 施工合同类型系数
  k3_contractType: number;

  // K4: 工程类型系数（风险区间）
  k4_engineeringType: number;

  // K5: 施工期限系数
  k5_durationFactor: number;

  // K6: 施工资质系数
  k6_qualificationFactor: number;

  // K7: 企业风险管理水平系数
  k7_riskManagementFactor: number;

  // K8: 经验/预期赔付率调整系数（默认1.0）
  k8_lossRecordFactor: number;
}

/**
 * 医疗保险参数调整系数（MP系列）
 */
export interface MedicalParameterFactors {
  // MP1: 保额调整系数
  mp1_coverageAmount: number;

  // MP2: 免赔额调整系数
  mp2_deductible: number;

  // MP3: 给付比例调整系数
  mp3_paymentRatio: number;

  // MP4: 社保投保情况系数
  mp4_socialInsurance: number;

  // MP5: 其他费用补偿型医疗保险系数
  mp5_otherInsurance: number;
}

/**
 * 医疗保险工程费率调整系数（MF系列）
 * 独立于主险的K系列，避免变量名混淆
 */
export interface MedicalRateFactors {
  // MF1: 工程造价调整系数（非农村项目）
  mf1_costFactor?: number;

  // MF2: 工程面积调整系数（农村项目）
  mf2_areaFactor?: number;

  // MF3: 施工合同类型系数
  mf3_contractType: number;

  // MF4: 工程类型系数
  mf4_engineeringType: number;

  // MF5: 施工期限系数
  mf5_durationFactor: number;

  // MF6: 施工资质系数
  mf6_qualificationFactor: number;

  // MF7: 企业风险管理水平系数
  mf7_riskManagementFactor: number;
}

/**
 * 住院津贴参数调整系数（AM系列 - Allowance Medical）
 */
export interface AllowanceParameterFactors {
  // AM1: 免赔日数调整系数
  am1_deductibleDays: number;

  // AM2: 每次最高给付日数调整系数
  am2_maxPaymentDays: number;

  // AM3: 累计承担住院津贴日数调整系数
  am3_totalAllowanceDays: number;
}

/**
 * 急性病专用费率系数
 */
export interface AcuteDiseaseRateFactors {
  // Q1: 被保险人风险状况系数
  q1_personRisk: number;

  // Q2: 区域性系数
  q2_region: number;

  // Q3: 施工企业风险管理水平系数
  q3_companyRiskManagement: number;
}

/**
 * 高原病专用费率系数
 */
export interface PlateauDiseaseRateFactors {
  // R1: 被保险人风险状况（高原适应力）系数
  r1_personRisk: number;

  // R2: 区域性系数（海拔风险）系数
  r2_region: number;
}

// ==================== 主险参数 ====================

/**
 * 主险计算参数
 */
export interface MainInsuranceParams {
  // 项目性质
  projectNature: ProjectNature;

  // 计费基数（造价或面积）
  baseAmount: number;

  // 施工合同类型
  contractType: ContractType;

  // 工程类别（1-4类）
  engineeringClass: EngineeringClass;

  // 施工期限（天）
  durationDays: number;

  // 施工资质等级
  qualification?: ConstructionQualification;

  // 风险管理水平
  riskManagementLevel: RiskManagementLevel;

  // 经验/预期赔付率系数（手动输入）
  lossRecordFactor?: number;

  // 每人保险金额（元）
  coverageAmount: number;
}

// ==================== 附加险参数 ====================

/**
 * 附加医疗保险参数
 */
export interface MedicalInsuranceParams {
  // 是否启用
  enabled: boolean;

  // 每人保险金额（元）
  coverageAmount: number;

  // 免赔额（元）
  deductible: number;

  // 给付比例（%）
  paymentRatio: number;

  // 是否参加社保/公费医疗
  socialInsuranceStatus: SocialInsuranceStatus;

  // 是否有其他费用补偿型医疗保险
  otherInsuranceStatus: OtherInsuranceStatus;

  // 继承主险的全局因子
  globalFactors: GlobalRateFactors;
}

/**
 * 附加住院津贴保险参数
 */
export interface AllowanceInsuranceParams {
  // 是否启用
  enabled: boolean;

  // 每人每日意外伤害住院津贴金额（元/天）
  dailyAmount: number;

  // 免赔日数
  deductibleDays: number;

  // 每次最高给付日数
  maxPaymentDays: number;

  // 累计承担住院津贴给付日数
  totalAllowanceDays: number;

  // 继承主险的全局因子
  globalFactors: GlobalRateFactors;
}

/**
 * 附加急性病身故保险参数
 */
export interface AcuteDiseaseInsuranceParams {
  // 是否启用
  enabled: boolean;

  // 每一被保险人保险金额（元）
  coverageAmount: number;

  // 被保险人风险状况
  personRiskLevel: PersonRiskLevel;

  // 所在区域等级
  regionLevel: RegionLevel;

  // 企业分类等级
  enterpriseCategory: EnterpriseCategory;

  // 计费基数（造价或面积）
  baseAmount: number;

  // 项目性质
  projectNature: ProjectNature;
}

/**
 * 附加高原病保险参数
 */
export interface PlateauDiseaseInsuranceParams {
  // 是否启用
  enabled: boolean;

  // 被保险人风险状况（高原适应力）
  personRiskLevel: PersonRiskLevel;

  // 销售/目的地区域（海拔风险）
  regionLevel: RegionLevel;

  // 基础保费（只使用主险保费，不包含其他附加险）
  basePremium: number;

  // 关联的险种列表（保留字段，不再使用）
  relatedPolicies?: string[];
}

// ==================== 计算结果接口 ====================

/**
 * 主险计算结果
 */
export interface MainInsuranceResult {
  // 主险保费
  premium: number;

  // 基准费率（‰）
  baseRate: number;

  // 实际费率（‰）
  actualRate: number;

  // 费率调整因子
  factors: GlobalRateFactors;
}

/**
 * 附加医疗保险计算结果
 */
export interface MedicalInsuranceResult {
  // 保费
  premium: number;

  // 基准费率（‰）
  baseRate: number;

  // 实际费率（‰）
  actualRate: number;

  // 参数调整因子（MP系列）
  parameterFactors: MedicalParameterFactors;

  // 费率调整因子（MF系列，独立于主险的K系列）
  rateFactors: MedicalRateFactors;
}

/**
 * 附加住院津贴保险计算结果
 */
export interface AllowanceInsuranceResult {
  // 保费
  premium: number;

  // 基准费率（‰）
  baseRate: number;

  // 实际费率（‰）
  actualRate: number;

  // 津贴金额倍数（日限额/10）
  dailyAmountMultiplier: number;

  // 参数调整因子
  parameterFactors: AllowanceParameterFactors;

  // 费率调整因子
  rateFactors: GlobalRateFactors;
}

/**
 * 急性病参数调整系数（AQ系列 - Acute参数）
 */
export interface AcuteDiseaseParameterFactors {
  // AQ1: 被保险人风险状况系数
  aq1_personRisk: number;

  // AQ2: 区域性系数
  aq2_region: number;

  // AQ3: 施工企业风险管理水平系数
  aq3_companyRiskManagement: number;
}

/**
 * 附加急性病身故保险计算结果
 */
export interface AcuteDiseaseInsuranceResult {
  // 保费
  premium: number;

  // 基准费率（‰）
  baseRate: number;

  // 实际费率（‰）
  actualRate: number;

  // 保额系数（保额/10000）
  coverageFactor: number;

  // 参数调整因子（AQ系列）
  parameterFactors: AcuteDiseaseParameterFactors;
}

/**
 * 附加高原病保险计算结果
 */
export interface PlateauDiseaseInsuranceResult {
  // 保费
  premium: number;

  // 基础加费比例（8.1%）
  baseRate: number;

  // 实际加费比例（%）
  actualRate: number;

  // 费率调整因子
  factors: PlateauDiseaseRateFactors;

  // 计算基数（主险+关联险种保费）
  basePremium: number;
}

/**
 * 综合报价结果
 */
export interface ComprehensivePricingResult {
  // 主险结果
  mainInsurance: MainInsuranceResult;

  // 附加医疗保险结果
  medicalInsurance?: MedicalInsuranceResult;

  // 附加住院津贴保险结果
  allowanceInsurance?: AllowanceInsuranceResult;

  // 附加急性病身故保险结果
  acuteDiseaseInsurance?: AcuteDiseaseInsuranceResult;

  // 附加高原病保险结果
  plateauDiseaseInsurance?: PlateauDiseaseInsuranceResult;

  // 总保费
  totalPremium: number;

  // 整体费率分析
  overallRateAnalysis?: {
    overallRate: number; // 整体费率（‰）= 总保费 / 工程造价 × 1000
    per100kCoverageRate: number; // 10万元保额费率（‰）= 整体费率 / (主险每人保额 / 100000)
    constructionCost: number; // 工程造价（元）
    coverageAmount: number; // 主险每人保额（元）
  };

  // 保费范围（理论最低/最高）
  premiumRange?: {
    minimum: number; // 最低保费（所有灵活系数取最小值）
    maximum: number; // 最高保费（所有灵活系数取最大值）
    currentMinimum: number; // 当前配置的最低可能值
    currentMaximum: number; // 当前配置的最高可能值
  };

  // 系数范围详情（用于展示影响）
  factorRanges?: {
    k4?: { min: number; max: number; current: number; name: string };
    k7?: { min: number; max: number; current: number; name: string };
    k8?: { min: number; max: number; current: number; name: string };
    // AQ系、R系为灵活系数
    aq1?: { min: number; max: number; current: number; name: string };
    aq2?: { min: number; max: number; current: number; name: string };
    aq3?: { min: number; max: number; current: number; name: string };
    r1?: { min: number; max: number; current: number; name: string };
    r2?: { min: number; max: number; current: number; name: string };
    // MF系：医疗险工程费率系数（对应主险K系列）
    mf4?: { min: number; max: number; current: number; name: string };
    mf7?: { min: number; max: number; current: number; name: string };
    // AK系：津贴险工程费率系数（对应主险K系列）
    ak4?: { min: number; max: number; current: number; name: string };
    ak7?: { min: number; max: number; current: number; name: string };
    // 注意：M1-M3（医疗保险）和 AM1-AM3（住院津贴）参数系数是固定取值规律，不参与灵活系数范围计算
  };

  // 计算时间戳
  calculatedAt: Date;
}
