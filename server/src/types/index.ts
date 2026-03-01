// 项目性质枚举
export enum ProjectType {
  NON_RURAL = 'non_rural',    // 非农村项目
  RURAL = 'rural'             // 农村项目
}

// 工程分类枚举
export enum EngineeringClass {
  CLASS_ONE = 1,    // 一类工程
  CLASS_TWO = 2,    // 二类工程
  CLASS_THREE = 3,  // 三类工程
  CLASS_FOUR = 4    // 四类工程
}

// 合同类型枚举
export enum ContractType {
  GENERAL = 'general',           // 总包
  PROFESSIONAL = 'professional', // 专业分包
  LABOR = 'labor'               // 劳务分包
}

// 企业资质枚举
export enum CompanyQualification {
  SPECIAL = 'special',  // 特级
  FIRST = 'first',      // 一级
  SECOND = 'second',    // 二级
  THIRD = 'third',      // 三级
  UNCLASSIFIED = 'unclassified' // 不分等级
}

// 管理水平枚举
export enum ManagementLevel {
  SOUND = 'sound',           // 健全
  RELATIVELY_SOUND = 'relatively_sound', // 较健全
  UNSOUND = 'unsound'        // 不健全
}

// 险种类型枚举
export enum InsuranceType {
  MAIN = 'main',              // 主险
  MEDICAL = 'medical',        // 附加医疗
  ALLOWANCE = 'allowance',    // 住院津贴
  ACUTE_DISEASE = 'acute_disease', // 急性病
  PLATEAU_DISEASE = 'plateau_disease' // 高原病
}

// 项目基本信息接口
export interface ProjectInfo {
  projectName: string;           // 项目名称
  projectType: ProjectType;      // 项目性质
  totalCost?: number;           // 项目总造价（万元）
  totalArea?: number;           // 项目总面积（平方米）
  engineeringClass: EngineeringClass; // 工程分类
  signingDate?: Date;           // 签单日期
  startDate: Date;              // 开工日期
  endDate: Date;                // 竣工日期
  contractType: ContractType;   // 合同类型
  companyQualification: CompanyQualification; // 企业资质
  managementLevel: ManagementLevel; // 管理水平
  address: string;              // 工程地址
  constructionUnit: string;     // 施工单位
}

// 主险参数接口
export interface MainInsuranceParams {
  coverageAmount: number;       // 保险金额（万元）
  k7ManagementLevel: number;    // K7管理水平系数
  k8LossRecord: number;         // K8损失记录系数
}

// 附加医疗险参数接口
export interface MedicalInsuranceParams {
  coverageAmount: number;       // 每人保险金额（元）
  deductible: number;          // 免赔额（元）
  paymentRatio: number;        // 给付比例（%）
  hasSocialInsurance: boolean; // 是否参加社保
  hasOtherMedicalInsurance: boolean; // 是否有其他医疗险
}

// 住院津贴险参数接口
export interface AllowanceInsuranceParams {
  dailyLimit: number;          // 日限额（元）
  waitingDays: number;         // 免赔天数
  paymentDays: number;         // 给付天数
}

// 急性病险参数接口
export interface AcuteDiseaseParams {
  coverageAmount: number;      // 保险金额（元）
}

// 高原病险参数接口
export interface PlateauDiseaseParams {
  personnelRiskLevel: 'A' | 'B' | 'C'; // 被保险人风险状况
  regionRiskLevel: 'A' | 'B' | 'C';    // 区域性系数
  applicableInsurances: InsuranceType[]; // 适用的险种
}

// 系数范围接口
export interface CoefficientRange {
  name: string;       // 系数名称
  min: number;        // 最低值
  current: number;     // 当前值
  max: number;        // 最高值
}

// 保费计算结果接口
export interface PremiumCalculationResult {
  mainInsurance: number;       // 主险保费
  medicalInsurance: number;    // 附加医疗保费
  allowanceInsurance: number;  // 住院津贴保费
  acuteDiseaseInsurance: number; // 急性病保费
  plateauDiseaseInsurance: number; // 高原病保费
  totalPremium: number;        // 总保费
  calculationDetails: CalculationDetails; // 计算详情
  premiumRange?: {            // 保费范围（仅当启用灵活系数时计算）
    minimum: number;          // 理论最低保费
    maximum: number;          // 理论最高保费
    currentMinimum: number;    // 当前配置最低保费
    currentMaximum: number;    // 当前配置最高保费
  };
  factorRanges?: {             // 灵活系数取值范围
    k4?: CoefficientRange;    // K4工程类型风险系数
    k7?: CoefficientRange;    // K7管理水平系数
    k8?: CoefficientRange;    // K8损失记录系数
    // 附加险灵活系数范围（AQ系、R系为灵活系数）
    aq1?: CoefficientRange;   // AQ1等待期系数
    aq2?: CoefficientRange;   // AQ2区域等级系数
    aq3?: CoefficientRange;   // AQ3企业类别系数
    r1?: CoefficientRange;    // R1人员风险系数
    r2?: CoefficientRange;    // R2区域风险系数
    // 注意：M1-M3（医疗保险）和 AM1-AM3（住院津贴）系数是固定取值规律，不参与灵活系数范围计算
  };
}

// 计算详情接口
export interface CalculationDetails {
  basePremium: number;         // 基准保费
  adjustmentFactors: {         // 调整系数
    k1: number;  // 造价/面积系数
    k2: number;  // 面积系数（农村项目）
    k3: number;  // 合同类型系数
    k4: number;  // 工程类型系数
    k5: number;  // 施工期限系数
    k6: number;  // 企业资质系数
    k7: number;  // 管理水平系数
    k8: number;  // 损失记录系数
  };
  medicalFactors?: {           // 医疗险系数
    m1: number;  // 保额系数
    m2: number;  // 免赔额系数
    m3: number;  // 给付比例系数
    m4: number;  // 社保系数
    m5: number;  // 第三方补偿系数
  };
  plateauFactors?: {           // 高原病系数
    r1: number;  // 人员风险系数
    r2: number;  // 区域风险系数
  };
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 合同解析结果接口
export interface ContractParseResult {
  projectName: string;
  totalCost?: number;
  totalArea?: number;
  startDate?: Date;
  endDate?: Date;
  address: string;
  constructionUnit: string;
  engineeringClass?: EngineeringClass;
  confidence: number;          // 解析置信度
  extractedText: string;       // 提取的文本
}

// 历史数据查询参数接口
export interface HistoryQueryParams {
  projectType?: ProjectType;
  engineeringClass?: EngineeringClass;
  costRange?: [number, number];
  areaRange?: [number, number];
  dateRange?: [Date, Date];
  limit?: number;
  offset?: number;
}

// 历史承保数据接口
export interface HistoricalData {
  id: string;
  projectInfo: ProjectInfo;
  premiumResult: PremiumCalculationResult;
  createdAt: Date;
  updatedAt: Date;
}