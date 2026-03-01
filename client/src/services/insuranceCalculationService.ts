/**
 * 保险费率计算服务
 * 基于《建筑施工人员系列保险——全局计算引擎技术规范 (V1.0)》
 * 实现：主险 + 4种附加险的费率计算
 */

import {
  MainInsuranceParams,
  MainInsuranceResult,
  MedicalInsuranceParams,
  MedicalInsuranceResult,
  AllowanceInsuranceParams,
  AllowanceInsuranceResult,
  AcuteDiseaseInsuranceParams,
  AcuteDiseaseInsuranceResult,
  PlateauDiseaseInsuranceParams,
  PlateauDiseaseInsuranceResult,
  GlobalRateFactors,
  ComprehensivePricingResult,
  ProjectNature,
  ContractType,
  EngineeringClass,
  ConstructionQualification,
  RiskManagementLevel,
  EnterpriseCategory,
  PersonRiskLevel,
  RegionLevel,
  SocialInsuranceStatus,
  OtherInsuranceStatus,
} from '../types/insurance';

import {
  linearInterpolationNodes,
  formatPremium,
  roundToDecimals,
  daysToYears,
  K1_COST_FACTOR_NODES,
  K2_AREA_FACTOR_NODES,
  K3_CONTRACT_TYPE_FACTORS,
  K4_ENGINEERING_TYPE_RANGES,
  K5_DURATION_FACTOR_NODES,
  K6_QUALIFICATION_FACTORS,
  K7_RISK_MANAGEMENT_RANGES,
  AQ2_REGION_LEVEL_RANGES,
  AQ3_ENTERPRISE_CATEGORY_RANGES,
  M1_MEDICAL_COVERAGE_NODES,
  M2_MEDICAL_DEDUCTIBLE_NODES,
  M3_MEDICAL_PAYMENT_RATIO_NODES,
  ALLOWANCE_M2_PAYMENT_DAYS_NODES,
  ALLOWANCE_M3_TOTAL_DAYS_NODES,
  ALLOWANCE_M1_DEDUCTIBLE_DAYS_NODES,
} from '../utils/insuranceUtils';

// ==================== 基准费率常量 ====================

/**
 * 主险基准费率（固定值，不随工程类别变化）
 *
 * 造价型：0.0436‰（每一被保险人保险金额10000元为基准）
 * 面积型：0.069元/平方米（每一被保险人保险金额10000元为基准）
 */
const MAIN_INSURANCE_BASE_RATE_COST = 0.0436; // ‰，造价型基准费率
const MAIN_INSURANCE_BASE_PREMIUM_AREA = 0.069; // 元/㎡，面积型基准保费（每万元保额）

/**
 * 附加医疗保险基准费率
 * 非农村项目：0.33‰（按造价）
 * 农村项目：0.9元/㎡（按面积）
 */
const MEDICAL_INSURANCE_BASE_RATE_COST = 0.33; // ‰，造价型基准费率
const MEDICAL_INSURANCE_BASE_PREMIUM_AREA = 0.9; // 元/㎡，面积型基准保费

/**
 * 附加住院津贴保险基准费率（‰）
 * 造价型：0.004‰ (基准给付标准：每人每日津贴10元)
 * 注意：0.004‰ = 0.000004（小数形式）
 * 面积型：0.016元/㎡
 */
const ALLOWANCE_INSURANCE_BASE_RATE_COST = 0.004; // ‰，造价型基准费率
const ALLOWANCE_INSURANCE_BASE_PREMIUM_AREA = 0.016; // 元/㎡，面积型基准保费

/**
 * 附加急性病身故保险基准费率（‰）
 * 造价型：0.006‰
 * 面积型：0.015元/㎡
 */
const ACUTE_DISEASE_BASE_RATE_COST = 0.006; // ‰，造价型基准费率
const ACUTE_DISEASE_BASE_PREMIUM_AREA = 0.015; // 元/㎡，面积型基准保费

/**
 * 附加高原病保险基础加费比例（%）
 */
const PLATEAU_DISEASE_BASE_RATE = 8.1;

// ==================== 全局费率因子计算 ====================

/**
 * 计算K1：工程造价调整系数（非农村项目）
 * @param costAmount 工程造价（万元）
 * @returns K1系数
 */
export const calculateK1 = (costAmount: number): number => {
  return linearInterpolationNodes(costAmount, K1_COST_FACTOR_NODES);
};

/**
 * 计算K2：工程面积调整系数（农村项目）
 * @param area 工程面积（平方米）
 * @returns K2系数
 */
export const calculateK2 = (area: number): number => {
  return linearInterpolationNodes(area, K2_AREA_FACTOR_NODES);
};

/**
 * 计算K3：施工合同类型系数
 * @param contractType 合同类型
 * @returns K3系数
 */
export const calculateK3 = (contractType: ContractType): number => {
  return K3_CONTRACT_TYPE_FACTORS[contractType] || 1.0;
};

/**
 * 计算K4：工程类型系数
 * @param engineeringClass 工程类别（1-4）
 * @param k4Value 用户选择的K4值（在范围内）
 * @returns K4系数
 */
export const calculateK4 = (
  engineeringClass: EngineeringClass,
  k4Value: number
): number => {
  const range = K4_ENGINEERING_TYPE_RANGES[engineeringClass];
  if (!range) {
    throw new Error(`Invalid engineering class: ${engineeringClass}`);
  }

  // 确保值在合理范围内
  if (k4Value < range.min || k4Value > range.max) {
    throw new Error(
      `K4 value ${k4Value} is out of range for class ${engineeringClass}: [${range.min}, ${range.max}]`
    );
  }

  return k4Value;
};

/**
 * 计算K5：施工期限系数
 * @param durationDays 施工期限（天）
 * @returns K5系数
 */
export const calculateK5 = (durationDays: number): number => {
  const years = daysToYears(durationDays);
  return linearInterpolationNodes(years, K5_DURATION_FACTOR_NODES);
};

/**
 * 计算K6：施工资质系数
 * @param qualification 资质等级
 * @returns K6系数
 */
export const calculateK6 = (qualification?: ConstructionQualification): number => {
  if (!qualification) {
    return K6_QUALIFICATION_FACTORS.ungraded;
  }
  return K6_QUALIFICATION_FACTORS[qualification] || 1.0;
};

/**
 * 计算K7：企业风险管理水平系数
 * @param riskLevel 风险管理水平
 * @param k7Value 用户选择的K7值（在范围内）
 * @returns K7系数
 */
export const calculateK7 = (
  riskLevel: RiskManagementLevel,
  k7Value: number
): number => {
  const range = K7_RISK_MANAGEMENT_RANGES[riskLevel];
  if (!range) {
    throw new Error(`Invalid risk management level: ${riskLevel}`);
  }

  // 确保值在合理范围内
  if (k7Value < range.min || k7Value > range.max) {
    throw new Error(
      `K7 value ${k7Value} is out of range for level ${riskLevel}: [${range.min}, ${range.max}]`
    );
  }

  return k7Value;
};

/**
 * 计算K8：经验/预期赔付率调整系数
 * @param lossRecordFactor 用户手动输入的赔付率系数
 * @param lossRate 赔付率（%），如果没有直接提供系数则根据赔付率计算
 * @returns K8系数（默认1.0）
 */
export const calculateK8 = (
  lossRecordFactor?: number,
  lossRate?: number
): number => {
  // 如果用户直接提供了系数，直接使用
  if (lossRecordFactor !== undefined) {
    return lossRecordFactor;
  }

  // 如果提供了赔付率，根据区间线性插值计算K8系数
  if (lossRate !== undefined) {
    if (lossRate <= 30) {
      // 30%及以下: [0.5，0.7]
      // 线性插值：lossRate=0时为0.5，lossRate=30时为0.7
      return 0.5 + (lossRate / 30) * (0.7 - 0.5);
    } else if (lossRate <= 60) {
      // (30％，60％]: (0.7，0.9]
      // 线性插值：lossRate=30时为0.7，lossRate=60时为0.9
      return 0.7 + ((lossRate - 30) / 30) * (0.9 - 0.7);
    } else if (lossRate <= 80) {
      // (60％，80％]: (0.9，1.1]
      // 线性插值：lossRate=60时为0.9，lossRate=80时为1.1
      return 0.9 + ((lossRate - 60) / 20) * (1.1 - 0.9);
    } else {
      // >80％: (1.1，1.2]
      // 线性插值：lossRate=80时为1.1，lossRate=100时为1.2
      // 超过100%的部分，继续使用1.2（不超过1.2）
      const clampedRate = Math.min(lossRate, 100);
      return 1.1 + ((clampedRate - 80) / 20) * (1.2 - 1.1);
    }
  }

  // 都没有提供，返回默认值1.0
  return 1.0;
};

/**
 * 计算全局费率因子
 * @param params 主险参数
 * @returns 全局费率因子
 */
export const calculateGlobalRateFactors = (
  params: MainInsuranceParams
): GlobalRateFactors => {
  const factors: GlobalRateFactors = {
    k3_contractType: calculateK3(params.contractType),
    k4_engineeringType: 0, // 将在下面计算
    k5_durationFactor: calculateK5(params.durationDays),
    k6_qualificationFactor: calculateK6(params.qualification),
    k7_riskManagementFactor: 0, // 将在下面计算
    k8_lossRecordFactor: 1.0, // 默认值，将在下面重新计算
  };

  // K4需要用户选择，这里先设为中值
  const k4Range = K4_ENGINEERING_TYPE_RANGES[params.engineeringClass];
  factors.k4_engineeringType = (k4Range.min + k4Range.max) / 2;

  // K7需要用户选择，这里先设为中值
  const k7Range = K7_RISK_MANAGEMENT_RANGES[params.riskManagementLevel];
  factors.k7_riskManagementFactor = (k7Range.min + k7Range.max) / 2;

  // 根据项目性质计算K1或K2
  if (params.projectNature === ProjectNature.NON_RURAL) {
    // K1系数需要工程造价（万元为单位）
    factors.k1_costFactor = calculateK1(params.baseAmount / 10000);
  } else {
    factors.k2_areaFactor = calculateK2(params.baseAmount);
  }

  // K8（默认1.0，始终参与计算）
  factors.k8_lossRecordFactor = calculateK8(
    params.lossRecordFactor,
    undefined
  );

  return factors;
};

// ==================== 主险费率计算 ====================

/**
 * 计算主险保费
 * @param params 主险参数
 * @param factors 全局费率因子
 * @returns 主险计算结果
 */
export const calculateMainInsurance = (
  params: MainInsuranceParams,
  factors?: GlobalRateFactors
): MainInsuranceResult => {
  // 如果没有提供因子，自动计算
  const calculatedFactors =
    factors || calculateGlobalRateFactors(params);

  let premium = 0;
  let baseRate = 0;
  let actualRate = 0;

  if (params.projectNature === ProjectNature.NON_RURAL) {
    // ========== 造价型计算 ==========
    // 基准费率：0.0436‰（每万元保额）
    baseRate = MAIN_INSURANCE_BASE_RATE_COST;

    // 计算调整系数之积
    let factorProduct = 1.0;
    factorProduct *= calculatedFactors.k1_costFactor || 1; // 工程造价调整系数
    factorProduct *= calculatedFactors.k3_contractType;
    factorProduct *= calculatedFactors.k4_engineeringType;
    factorProduct *= calculatedFactors.k5_durationFactor;
    factorProduct *= calculatedFactors.k6_qualificationFactor;
    factorProduct *= calculatedFactors.k7_riskManagementFactor;
    factorProduct *= calculatedFactors.k8_lossRecordFactor; // K8始终参与计算

    // 计算实际费率
    actualRate = baseRate * factorProduct;

    // 计算保费
    // 正确公式：工程造价(元) × (每人保额/10000) × 0.0436‰ × 各调整系数之积
    // = 工程造价(元) × (每人保额/10000) × (基准费率‰/1000) × 各调整系数之积
    premium = params.baseAmount; // 工程造价（元）
    premium *= (params.coverageAmount / 10000); // 保额系数（每人保额/10000）
    premium *= (baseRate / 1000); // 基准费率（‰转换为小数）
    premium *= factorProduct; // 调整系数之积

  } else {
    // ========== 面积型计算 ==========
    // 基准保费：0.069元/平方米（每万元保额）

    // 计算调整系数之积
    let factorProduct = 1.0;
    factorProduct *= calculatedFactors.k2_areaFactor || 1; // 工程面积调整系数
    factorProduct *= calculatedFactors.k3_contractType;
    factorProduct *= calculatedFactors.k4_engineeringType;
    factorProduct *= calculatedFactors.k5_durationFactor;
    factorProduct *= calculatedFactors.k6_qualificationFactor;
    factorProduct *= calculatedFactors.k7_riskManagementFactor;
    factorProduct *= calculatedFactors.k8_lossRecordFactor; // K8始终参与计算

    // 面积型使用基准保费直接计算（baseRate转换为‰以便显示）
    baseRate = (MAIN_INSURANCE_BASE_PREMIUM_AREA / 10000) * 1000; // 转换为‰显示

    // 计算保费
    // 公式：工程面积(㎡) × 0.069元//㎡ × (每人保额/10000) × 各调整系数之积
    premium = params.baseAmount; // 工程面积（平方米）
    premium *= MAIN_INSURANCE_BASE_PREMIUM_AREA; // 基准保费 0.069元/㎡
    premium *= (params.coverageAmount / 10000); // 保额转换为万元单位
    premium *= factorProduct; // 应用调整系数

    // 实际费率（用于显示，转换为每万元保额的‰）
    actualRate = baseRate * factorProduct;
  }

  // 格式化保费（保留4位小数，向上取整）
  const formattedPremium = formatPremium(premium);

  return {
    premium: formattedPremium,
    baseRate,
    actualRate,
    factors: calculatedFactors,
  };
};

// ==================== 附加医疗保险费率计算 ====================

/**
 * 计算M1：保额调整系数
 * @param coverageAmount 保额（元）
 * @returns M1系数
 */
export const calculateM1 = (coverageAmount: number): number => {
  return linearInterpolationNodes(coverageAmount, M1_MEDICAL_COVERAGE_NODES);
};

/**
 * 计算M2：免赔额调整系数
 * @param deductible 免赔额（元）
 * @returns M2系数
 */
export const calculateM2 = (deductible: number): number => {
  return linearInterpolationNodes(deductible, M2_MEDICAL_DEDUCTIBLE_NODES);
};

/**
 * 计算M3：给付比例调整系数
 * @param paymentRatio 给付比例（%）
 * @returns M3系数
 */
export const calculateM3 = (paymentRatio: number): number => {
  return linearInterpolationNodes(paymentRatio, M3_MEDICAL_PAYMENT_RATIO_NODES);
};

/**
 * 计算M4：社保投保情况系数
 * @param status 社保投保情况
 * @returns M4系数
 */
export const calculateM4 = (status: SocialInsuranceStatus): number => {
  // 参加：1.0，未参加：1.5
  return status === SocialInsuranceStatus.PARTICIPATED ? 1.0 : 1.5;
};

/**
 * 计算M5：其他费用补偿型医疗保险系数
 * @param status 其他医疗保险情况
 * @returns M5系数
 */
export const calculateM5 = (status: OtherInsuranceStatus): number => {
  // 有：0.9，无或无法准确获取：1.0
  return status === OtherInsuranceStatus.HAS ? 0.9 : 1.0;
};

/**
 * 计算附加医疗保险保费
 * @param params 医疗保险参数
 * @returns 医疗保险计算结果
 */
export const calculateMedicalInsurance = (
  params: MedicalInsuranceParams,
  mainParams?: { projectNature: ProjectNature; baseAmount: number }
): MedicalInsuranceResult => {
  if (!params.enabled) {
    throw new Error('Medical insurance is not enabled');
  }

  // 计算参数调整因子（MP系列：Medical Parameter）
  const parameterFactors = {
    mp1_coverageAmount: calculateM1(params.coverageAmount),
    mp2_deductible: calculateM2(params.deductible),
    mp3_paymentRatio: calculateM3(params.paymentRatio),
    mp4_socialInsurance: calculateM4(params.socialInsuranceStatus),
    mp5_otherInsurance: calculateM5(params.otherInsuranceStatus),
  };

  // 创建医疗险独立的费率调整因子（MF系列：Medical Factor）
  // 从主险的GlobalRateFactors映射到医疗险的MedicalRateFactors
  const globalFactors = params.globalFactors;
  const rateFactors = {
    mf1_costFactor: globalFactors.k1_costFactor,
    mf2_areaFactor: globalFactors.k2_areaFactor,
    mf3_contractType: globalFactors.k3_contractType,
    mf4_engineeringType: globalFactors.k4_engineeringType,
    mf5_durationFactor: globalFactors.k5_durationFactor,
    mf6_qualificationFactor: globalFactors.k6_qualificationFactor,
    mf7_riskManagementFactor: globalFactors.k7_riskManagementFactor,
  };

  // 判断项目性质并计算基准保费
  const isCostBased = rateFactors.mf1_costFactor !== undefined;
  let basePremium = 0;
  let baseRate = 0;

  if (isCostBased) {
    // 造价型：基准保费 = 0.33‰ × 项目总造价
    baseRate = MEDICAL_INSURANCE_BASE_RATE_COST; // 0.33‰
    basePremium = mainParams?.baseAmount || 0; // 使用主险的工程造价
    basePremium *= (baseRate / 1000); // ‰转换为小数
  } else {
    // 面积型：基准保费 = 0.9元/㎡ × 项目总面积
    baseRate = MEDICAL_INSURANCE_BASE_PREMIUM_AREA; // 0.9元/㎡
    basePremium = mainParams?.baseAmount || 0; // 使用主险的工程面积
    basePremium *= baseRate;
  }

  // 计算所有调整系数之积（不包括MP1，MP1将作为独立的保额系数）
  let factorProduct = 1.0;

  // MP系列：医疗参数调整系数（注意：MP1单独作为保额系数，不包含在factorProduct中）
  factorProduct *= parameterFactors.mp2_deductible;
  factorProduct *= parameterFactors.mp3_paymentRatio;
  factorProduct *= parameterFactors.mp4_socialInsurance;
  factorProduct *= parameterFactors.mp5_otherInsurance;

  // MF系列：医疗险费率调整系数（独立于主险的K系列）
  // 注意：附加医疗保险的费率调整系数只有MF1-MF7，不包含K8
  factorProduct *= rateFactors.mf1_costFactor || 1;
  factorProduct *= rateFactors.mf2_areaFactor || 1;
  factorProduct *= rateFactors.mf3_contractType;
  factorProduct *= rateFactors.mf4_engineeringType;
  factorProduct *= rateFactors.mf5_durationFactor;
  factorProduct *= rateFactors.mf6_qualificationFactor;
  factorProduct *= rateFactors.mf7_riskManagementFactor;
  // 附加医疗保险不包含K8系数

  // 计算实际费率（用于显示）
  const actualRate = baseRate * factorProduct;

  // 计算最终保费
  // 附加意外医疗保费 = (每人保险金额/10000) × 基准保费 × 全部系数之积
  let premium = basePremium * factorProduct;
  premium *= (params.coverageAmount / 10000); // 保额系数
  const formattedPremium = formatPremium(premium);

  return {
    premium: formattedPremium,
    baseRate,
    actualRate,
    parameterFactors,
    rateFactors,
  };
};

// ==================== 附加住院津贴保险费率计算 ====================

/**
 * 计算津贴金额倍数（日限额/10）
 * @param dailyAmount 每人每日津贴金额（元/天）
 * @returns 津贴金额倍数
 */
const calculateDailyAmountMultiplier = (dailyAmount: number): number => {
  return dailyAmount / 10;
};

/**
 * 计算AM1：免赔日数调整系数（住院津贴）
 * @param deductibleDays 免赔日数
 * @returns AM1系数
 */
export const calculateAllowanceAM1 = (deductibleDays: number): number => {
  return linearInterpolationNodes(deductibleDays, ALLOWANCE_M1_DEDUCTIBLE_DAYS_NODES);
};

/**
 * 计算AM2：每次最高给付日数调整系数（住院津贴）
 * @param maxPaymentDays 每次最高给付日数
 * @returns AM2系数
 */
export const calculateAllowanceAM2 = (maxPaymentDays: number): number => {
  return linearInterpolationNodes(maxPaymentDays, ALLOWANCE_M2_PAYMENT_DAYS_NODES);
};

/**
 * 计算AM3：累计给付日数调整系数（住院津贴）
 * @param totalAllowanceDays 累计给付日数
 * @returns AM3系数
 */
export const calculateAllowanceAM3 = (totalAllowanceDays: number): number => {
  return linearInterpolationNodes(totalAllowanceDays, ALLOWANCE_M3_TOTAL_DAYS_NODES);
};

/**
 * 计算附加住院津贴保险保费
 * @param params 住院津贴参数
 * @param mainParams 主险参数（用于判断项目性质：造价型/面积型）
 * @returns 住院津贴计算结果
 */
export const calculateAllowanceInsurance = (
  params: AllowanceInsuranceParams,
  mainParams?: { projectNature: ProjectNature; baseAmount: number }
): AllowanceInsuranceResult => {
  if (!params.enabled) {
    throw new Error('Allowance insurance is not enabled');
  }

  // 计算参数调整因子（使用AM系列以区别于医疗保险的M系列）
  const parameterFactors = {
    am1_deductibleDays: calculateAllowanceAM1(params.deductibleDays),
    am2_maxPaymentDays: calculateAllowanceAM2(params.maxPaymentDays),
    am3_totalAllowanceDays: calculateAllowanceAM3(params.totalAllowanceDays),
  };

  // 获取全局费率因子（从主险继承）
  const rateFactors = params.globalFactors;

  // 计算津贴金额倍数
  const dailyAmountMultiplier = calculateDailyAmountMultiplier(params.dailyAmount);

  // 根据项目性质选择正确的基准费率
  let baseRate = 0;
  if (mainParams) {
    if (mainParams.projectNature === ProjectNature.NON_RURAL) {
      // 造价型：0.004‰ = 0.000004
      baseRate = ALLOWANCE_INSURANCE_BASE_RATE_COST / 1000; // 转换为小数：0.000004
    } else {
      // 面积型：0.016元/㎡
      baseRate = ALLOWANCE_INSURANCE_BASE_PREMIUM_AREA;
    }
  } else {
    // 默认使用造价型
    baseRate = ALLOWANCE_INSURANCE_BASE_RATE_COST / 1000;
  }

  // 计算所有调节系数之积（AM系数 × AK系数，不包括基准费率和津贴倍数）
  let adjustmentFactors = 1;
  adjustmentFactors *= parameterFactors.am1_deductibleDays;
  adjustmentFactors *= parameterFactors.am2_maxPaymentDays;
  adjustmentFactors *= parameterFactors.am3_totalAllowanceDays;
  adjustmentFactors *= rateFactors.k1_costFactor || rateFactors.k2_areaFactor || 1; // K1或K2
  adjustmentFactors *= rateFactors.k3_contractType;
  adjustmentFactors *= rateFactors.k4_engineeringType;
  adjustmentFactors *= rateFactors.k5_durationFactor;
  adjustmentFactors *= rateFactors.k6_qualificationFactor;
  adjustmentFactors *= rateFactors.k7_riskManagementFactor;

  // 计算保费
  // 公式：保费 = 合同造价 × (日津贴/10) × 0.000004 × 调节系数之积
  let premium: number;
  if (mainParams) {
    // 造价型：保费 = 项目造价 × (日津贴/10) × 0.000004 × 调节系数（包含K1）
    // 面积型：保费 = 项目面积 × (日津贴/10) × 0.016 × 调节系数（包含K2）
    premium = mainParams.baseAmount * (params.dailyAmount / 10) * baseRate * adjustmentFactors;
  } else {
    // 默认计算（造价型）
    premium = baseRate * (params.dailyAmount / 10) * adjustmentFactors;
  }

  const formattedPremium = formatPremium(premium);

  return {
    premium: formattedPremium,
    baseRate: baseRate * 1000, // 返回千分率形式供显示
    actualRate: baseRate * (params.dailyAmount / 10) * adjustmentFactors * 1000,
    dailyAmountMultiplier,
    parameterFactors,
    rateFactors,
  };
};

// ==================== 附加急性病身故保险费率计算 ====================

/**
 * AQ1：被保险人风险状况系数
 * @param riskLevel 风险等级
 * @returns AQ1系数
 */
export const calculateAQ1 = (riskLevel: PersonRiskLevel): number => {
  switch (riskLevel) {
    case PersonRiskLevel.CLASS_A:
      return 0.8; // A类水平（低风险）
    case PersonRiskLevel.CLASS_B:
      return 1.0; // B类水平（中风险）
    case PersonRiskLevel.CLASS_C:
      return 1.2; // C类水平（高风险）
    default:
      return 1.0;
  }
};

/**
 * AQ2：区域性系数
 * @param regionLevel 区域等级
 * @param aq2Value 用户选择的AQ2值（在范围内）
 * @returns AQ2系数
 */
export const calculateAQ2 = (
  regionLevel: RegionLevel,
  aq2Value?: number
): number => {
  // 如果用户提供了具体值，使用该值
  if (aq2Value !== undefined) {
    return aq2Value;
  }

  // 否则返回区间的默认值（中值）
  const range = AQ2_REGION_LEVEL_RANGES[regionLevel];
  if (range) {
    return (range.min + range.max) / 2;
  }

  return 1.0;
};

/**
 * AQ3：企业分类系数
 * @param enterpriseCategory 企业分类等级
 * @param aq3Value 用户选择的AQ3值（在范围内）
 * @returns AQ3系数
 */
export const calculateAQ3 = (
  enterpriseCategory: EnterpriseCategory,
  aq3Value?: number
): number => {
  // 如果用户提供了具体值，使用该值
  if (aq3Value !== undefined) {
    return aq3Value;
  }

  // 否则返回区间的默认值（中值）
  const range = AQ3_ENTERPRISE_CATEGORY_RANGES[enterpriseCategory];
  if (range) {
    return (range.min + range.max) / 2;
  }

  return 1.0;
};

/**
 * 计算附加急性病身故保险保费
 * @param params 急性病保险参数
 * @returns 急性病保险计算结果
 */
export const calculateAcuteDiseaseInsurance = (
  params: AcuteDiseaseInsuranceParams
): AcuteDiseaseInsuranceResult => {
  // 计算AQ参数调整因子（使用AQ系列以区别于其他险种）
  const parameterFactors = {
    aq1_personRisk: calculateAQ1(params.personRiskLevel),
    aq2_region: calculateAQ2(params.regionLevel),
    aq3_companyRiskManagement: calculateAQ3(params.enterpriseCategory),
  };

  // 根据项目性质选择基准费率
  let baseRate = 0;
  if (params.projectNature === ProjectNature.NON_RURAL) {
    // 造价型：0.006‰ = 0.000006
    baseRate = ACUTE_DISEASE_BASE_RATE_COST / 1000;
  } else {
    // 面积型：0.015元/㎡
    baseRate = ACUTE_DISEASE_BASE_PREMIUM_AREA;
  }

  // 计算实际费率
  // 公式：实际费率 = 基准费率 × AQ1 × AQ2 × AQ3
  let actualRate = baseRate;
  actualRate *= parameterFactors.aq1_personRisk;
  actualRate *= parameterFactors.aq2_region;
  actualRate *= parameterFactors.aq3_companyRiskManagement;

  // 计算保额系数（保额/10000）
  const coverageFactor = params.coverageAmount / 10000;

  // 计算保费
  // 造价型：P = 项目造价 × 0.006‰ × (保额/10000) × AQ1×AQ2×AQ3
  // 面积型：P = 项目面积 × 0.015 × (保额/10000) × AQ1×AQ2×AQ3
  let premium = params.baseAmount * coverageFactor * actualRate;

  const formattedPremium = formatPremium(premium);

  return {
    premium: formattedPremium,
    baseRate: params.projectNature === ProjectNature.NON_RURAL ? 0.006 : 0.015,
    actualRate,
    coverageFactor,
    parameterFactors,
  };
};

// ==================== 附加高原病保险费率计算 ====================

/**
 * R1：被保险人风险状况（高原适应力）系数
 * @param riskLevel 风险等级
 * @returns R1系数
 */
const calculateR1 = (riskLevel: PersonRiskLevel): number => {
  switch (riskLevel) {
    case PersonRiskLevel.CLASS_A:
      return 0.8; // 高原适应力强
    case PersonRiskLevel.CLASS_B:
      return 1.0; // 高原适应力中等
    case PersonRiskLevel.CLASS_C:
      return 1.2; // 高原适应力弱
    default:
      return 1.0;
  }
};

/**
 * R2：区域性（海拔风险）系数
 * @param regionLevel 区域等级
 * @returns R2系数
 */
const calculateR2 = (regionLevel: RegionLevel): number => {
  switch (regionLevel) {
    case RegionLevel.CLASS_A:
      return 0.7; // 低海拔风险
    case RegionLevel.CLASS_B:
      return 0.9; // 中海拔风险
    case RegionLevel.CLASS_C:
      return 1.0; // 高海拔风险
    default:
      return 1.0;
  }
};

/**
 * 计算附加高原病保险保费
 * @param params 高原病保险参数
 * @returns 高原病保险计算结果
 */
export const calculatePlateauDiseaseInsurance = (
  params: PlateauDiseaseInsuranceParams
): PlateauDiseaseInsuranceResult => {
  if (!params.enabled) {
    throw new Error('Plateau disease insurance is not enabled');
  }

  // 计算费率调整因子
  const factors = {
    r1_personRisk: calculateR1(params.personRiskLevel),
    r2_region: calculateR2(params.regionLevel),
  };

  // 计算实际加费比例
  // 公式：实际加费比例 = 基础加费比例(8.1%) × R1 × R2
  let actualRate = PLATEAU_DISEASE_BASE_RATE;
  actualRate *= factors.r1_personRisk;
  actualRate *= factors.r2_region;

  // 计算保费
  // 公式：P = 主险保费 × 8.1% × R1 × R2
  const premium = params.basePremium * (actualRate / 100);

  const formattedPremium = formatPremium(premium);

  return {
    premium: formattedPremium,
    baseRate: PLATEAU_DISEASE_BASE_RATE,
    actualRate,
    factors,
    basePremium: params.basePremium,
  };
};

// ==================== 综合报价计算 ====================

/**
 * 综合报价计算（主险 + 所有附加险）
 * @param mainParams 主险参数
 * @param medicalParams 医疗保险参数
 * @param allowanceParams 住院津贴参数
 * @param acuteDiseaseParams 急性病参数
 * @param plateauDiseaseParams 高原病参数
 * @returns 综合报价结果
 */
export const calculateComprehensivePricing = ({
  mainParams,
  medicalParams,
  allowanceParams,
  acuteDiseaseParams,
  plateauDiseaseParams,
}: {
  mainParams: MainInsuranceParams;
  medicalParams?: MedicalInsuranceParams;
  allowanceParams?: AllowanceInsuranceParams;
  acuteDiseaseParams?: AcuteDiseaseInsuranceParams;
  plateauDiseaseParams?: PlateauDiseaseInsuranceParams;
}): ComprehensivePricingResult => {
  // 1. 计算主险
  const mainInsurance = calculateMainInsurance(mainParams);

  // 2. 计算附加医疗保险
  let medicalInsurance: MedicalInsuranceResult | undefined;
  if (medicalParams && medicalParams.enabled === true) {
    // 继承主险的全局因子
    medicalParams.globalFactors = mainInsurance.factors;
    medicalInsurance = calculateMedicalInsurance(medicalParams, {
      projectNature: mainParams.projectNature,
      baseAmount: mainParams.baseAmount,
    });
  }

  // 3. 计算附加住院津贴保险
  let allowanceInsurance: AllowanceInsuranceResult | undefined;
  if (allowanceParams && allowanceParams.enabled === true) {
    // 继承主险的全局因子
    allowanceParams.globalFactors = mainInsurance.factors;
    allowanceInsurance = calculateAllowanceInsurance(allowanceParams, {
      projectNature: mainParams.projectNature,
      baseAmount: mainParams.baseAmount,
    });
  }

  // 4. 计算附加急性病身故保险
  let acuteDiseaseInsurance: AcuteDiseaseInsuranceResult | undefined;
  if (acuteDiseaseParams && acuteDiseaseParams.enabled === true) {
    // 确保有项目性质和计费基数
    acuteDiseaseParams.baseAmount = mainParams.baseAmount;
    acuteDiseaseParams.projectNature = mainParams.projectNature;
    acuteDiseaseInsurance = calculateAcuteDiseaseInsurance(acuteDiseaseParams);
  }

  // 5. 计算附加高原病保险（只基于主险保费）
  let plateauDiseaseInsurance: PlateauDiseaseInsuranceResult | undefined;
  if (plateauDiseaseParams && plateauDiseaseParams.enabled === true) {
    // 高原病保费 = 主险保费 × 8.1% × R1 × R2
    // 只使用主险保费，不包含其他附加险
    plateauDiseaseParams.basePremium = mainInsurance.premium;

    plateauDiseaseInsurance = calculatePlateauDiseaseInsurance(
      plateauDiseaseParams
    );
  }

  // 6. 计算总保费
  let totalPremium = mainInsurance.premium;
  if (medicalInsurance) totalPremium += medicalInsurance.premium;
  if (allowanceInsurance) totalPremium += allowanceInsurance.premium;
  if (acuteDiseaseInsurance) totalPremium += acuteDiseaseInsurance.premium;
  if (plateauDiseaseInsurance) totalPremium += plateauDiseaseInsurance.premium;

  // 对总保费也进行格式化（向上取整到元）
  totalPremium = formatPremium(totalPremium);

  // 7. 计算整体费率分析
  const overallRate = (totalPremium / mainParams.baseAmount) * 1000; // ‰
  const per100kCoverageRate = overallRate / (mainParams.coverageAmount / 100000); // ‰

  const overallRateAnalysis = {
    overallRate: roundToDecimals(overallRate, 4),
    per100kCoverageRate: roundToDecimals(per100kCoverageRate, 4),
    constructionCost: mainParams.baseAmount,
    coverageAmount: mainParams.coverageAmount,
  };

  // 8. 计算保费范围
  const premiumRange = calculatePremiumRange(
    mainParams,
    mainInsurance,
    medicalInsurance,
    allowanceInsurance,
    acuteDiseaseInsurance,
    plateauDiseaseInsurance
  );

  return {
    mainInsurance,
    medicalInsurance,
    allowanceInsurance,
    acuteDiseaseInsurance,
    plateauDiseaseInsurance,
    totalPremium,
    overallRateAnalysis,
    ...premiumRange,
    calculatedAt: new Date(),
  };
};

/**
 * 计算保费范围（最低/最高）
 * @param mainParams 主险参数
 * @param mainInsurance 主险计算结果
 * @param medicalInsurance 医疗保险计算结果
 * @param allowanceInsurance 住院津贴计算结果
 * @param acuteDiseaseInsurance 急性病计算结果
 * @param plateauDiseaseInsurance 高原病计算结果
 */
export function calculatePremiumRange(
  mainParams: MainInsuranceParams,
  mainInsurance: MainInsuranceResult,
  medicalInsurance?: MedicalInsuranceResult,
  allowanceInsurance?: AllowanceInsuranceResult,
  acuteDiseaseInsurance?: AcuteDiseaseInsuranceResult,
  plateauDiseaseInsurance?: PlateauDiseaseInsuranceResult
) {
  const factorRanges: any = {};

  // 获取K4范围（工程类型系数）
  const k4Range = K4_ENGINEERING_TYPE_RANGES[mainParams.engineeringClass];
  if (k4Range) {
    factorRanges.k4 = {
      min: k4Range.min,
      max: k4Range.max,
      current: mainInsurance.factors.k4_engineeringType,
      name: '工程类型系数K4'
    };
  }

  // 获取K7范围（风险管理水平）
  const k7Range = K7_RISK_MANAGEMENT_RANGES[mainParams.riskManagementLevel];
  if (k7Range) {
    factorRanges.k7 = {
      min: k7Range.min,
      max: k7Range.max,
      current: mainInsurance.factors.k7_riskManagementFactor,
      name: '风险管理水平K7'
    };
  }

  // K8范围（赔付记录系数，始终存在）
  factorRanges.k8 = {
    min: 0.5,
    max: 1.2,
    current: mainInsurance.factors.k8_lossRecordFactor,
    name: '赔付记录系数K8'
  };

  // 获取AQ1范围（急性病被保险人风险）
  if (acuteDiseaseInsurance) {
    factorRanges.aq1 = {
      min: 0.8,
      max: 1.2,
      current: acuteDiseaseInsurance.parameterFactors.aq1_personRisk,
      name: '被保险人风险状况AQ1'
    };

    // 获取AQ2范围（区域性系数）
    factorRanges.aq2 = {
      min: 0.7,
      max: 1.3,
      current: acuteDiseaseInsurance.parameterFactors.aq2_region,
      name: '区域性系数AQ2'
    };

    // 获取AQ3范围（企业分类系数）
    factorRanges.aq3 = {
      min: 0.9,
      max: 1.5,
      current: acuteDiseaseInsurance.parameterFactors.aq3_companyRiskManagement,
      name: '企业分类系数AQ3'
    };
  }

  // 注意：M1-M3（医疗保险）和 AM1-AM3（住院津贴）系数是固定取值规律，不参与灵活系数范围计算

  // 获取R1、R2范围（高原病系数）
  if (plateauDiseaseInsurance) {
    factorRanges.r1 = {
      min: 0.8,
      max: 1.2,
      current: plateauDiseaseInsurance.factors.r1_personRisk,
      name: '高原适应力系数R1'
    };

    factorRanges.r2 = {
      min: 0.7,
      max: 1.0,
      current: plateauDiseaseInsurance.factors.r2_region,
      name: '海拔风险系数R2'
    };
  }

  // 计算当前配置的最低/最高保费
  // 方法：将当前保费除以灵活系数的乘积，得到固定部分
  // 然后分别乘以灵活系数的最小/最大值

  // 主险固定部分（排除K4、K7、K8）
  const mainFixedPremium = mainInsurance.premium /
    (mainInsurance.factors.k4_engineeringType *
     mainInsurance.factors.k7_riskManagementFactor *
     mainInsurance.factors.k8_lossRecordFactor);

  // 医疗保险固定部分（排除MF4、MF7）
  let medicalFixedPremium = 0;
  if (medicalInsurance) {
    medicalFixedPremium = medicalInsurance.premium /
      (medicalInsurance.rateFactors.mf4_engineeringType *
       medicalInsurance.rateFactors.mf7_riskManagementFactor);
  }

  // 获取MF4、MF7范围（医疗险工程费率系数）
  if (medicalInsurance) {
    // MF4: 工程类型系数（对应主险K4）
    const mf4Range = K4_ENGINEERING_TYPE_RANGES[mainParams.engineeringClass];
    if (mf4Range) {
      factorRanges.mf4 = {
        min: mf4Range.min,
        max: mf4Range.max,
        current: medicalInsurance.rateFactors.mf4_engineeringType,
        name: '工程类型系数MF4'
      };
    }

    // MF7: 风险管理水平系数（对应主险K7）
    const mf7Range = K7_RISK_MANAGEMENT_RANGES[mainParams.riskManagementLevel];
    if (mf7Range) {
      factorRanges.mf7 = {
        min: mf7Range.min,
        max: mf7Range.max,
        current: medicalInsurance.rateFactors.mf7_riskManagementFactor,
        name: '风险管理水平MF7'
      };
    }
  }

  // 住院津贴固定部分（排除AK4、AK7）
  let allowanceFixedPremium = 0;
  if (allowanceInsurance) {
    allowanceFixedPremium = allowanceInsurance.premium /
      (allowanceInsurance.rateFactors.k4_engineeringType *
       allowanceInsurance.rateFactors.k7_riskManagementFactor);
  }

  // 获取AK4、AK7范围（津贴险工程费率系数）
  if (allowanceInsurance) {
    // AK4: 工程类型系数（对应主险K4）
    const ak4Range = K4_ENGINEERING_TYPE_RANGES[mainParams.engineeringClass];
    if (ak4Range) {
      factorRanges.ak4 = {
        min: ak4Range.min,
        max: ak4Range.max,
        current: allowanceInsurance.rateFactors.k4_engineeringType,
        name: '工程类型系数AK4'
      };
    }

    // AK7: 风险管理水平系数（对应主险K7）
    const ak7Range = K7_RISK_MANAGEMENT_RANGES[mainParams.riskManagementLevel];
    if (ak7Range) {
      factorRanges.ak7 = {
        min: ak7Range.min,
        max: ak7Range.max,
        current: allowanceInsurance.rateFactors.k7_riskManagementFactor,
        name: '风险管理水平AK7'
      };
    }
  }

  // 急性病固定部分（排除AQ1、AQ2、AQ3）
  let acuteFixedPremium = 0;
  if (acuteDiseaseInsurance) {
    acuteFixedPremium = acuteDiseaseInsurance.premium /
      (acuteDiseaseInsurance.parameterFactors.aq1_personRisk *
       acuteDiseaseInsurance.parameterFactors.aq2_region *
       acuteDiseaseInsurance.parameterFactors.aq3_companyRiskManagement);
  }

  // 高原病固定部分（排除R1、R2）
  let plateauFixedPremium = 0;
  if (plateauDiseaseInsurance) {
    plateauFixedPremium = plateauDiseaseInsurance.premium /
      (plateauDiseaseInsurance.factors.r1_personRisk *
       plateauDiseaseInsurance.factors.r2_region);
  }

  // 计算范围
  const calcRange = (
    fixedPremium: number,
    k4Min: number,
    k4Max: number,
    k4Current: number,
    k7Min: number,
    k7Max: number,
    k7Current: number,
    k8Min: number,
    k8Max: number,
    k8Current: number
  ) => {
    // 固定部分已经除过了当前值，所以这里直接乘以最小/最大值
    // 公式：最低保费 = 固定部分 × K4_min × K7_min × K8_min
    //       最高保费 = 固定部分 × K4_max × K7_max × K8_max
    return {
      minimum: formatPremium(fixedPremium * k4Min * k7Min * k8Min),
      maximum: formatPremium(fixedPremium * k4Max * k7Max * k8Max)
    };
  };

  // 计算各险种的范围
  const mainRange = calcRange(
    mainFixedPremium,
    factorRanges.k4?.min || 1,
    factorRanges.k4?.max || 1,
    factorRanges.k4?.current || 1,
    factorRanges.k7?.min || 1,
    factorRanges.k7?.max || 1,
    factorRanges.k7?.current || 1,
    factorRanges.k8?.min || 1,
    factorRanges.k8?.max || 1,
    factorRanges.k8?.current || 1
  );

  const medicalRange = calcRange(
    medicalFixedPremium,
    factorRanges.mf4?.min || 1,
    factorRanges.mf4?.max || 1,
    factorRanges.mf4?.current || 1,
    factorRanges.mf7?.min || 1,
    factorRanges.mf7?.max || 1,
    factorRanges.mf7?.current || 1,
    1, 1, 1  // 医疗险不包含K8
  );

  const allowanceRange = calcRange(
    allowanceFixedPremium,
    factorRanges.ak4?.min || 1,
    factorRanges.ak4?.max || 1,
    factorRanges.ak4?.current || 1,
    factorRanges.ak7?.min || 1,
    factorRanges.ak7?.max || 1,
    factorRanges.ak7?.current || 1,
    1, 1, 1  // 住院津贴不包含K8
  );

  // 急性病范围（AQ1、AQ2、AQ3）
  let acuteRange = { minimum: 0, maximum: 0 };
  if (acuteDiseaseInsurance && factorRanges.aq1) {
    const aq2Min = factorRanges.aq2?.min || 1;
    const aq2Max = factorRanges.aq2?.max || 1;
    const aq2Current = factorRanges.aq2?.current || 1;
    const aq3Min = factorRanges.aq3?.min || 1;
    const aq3Max = factorRanges.aq3?.max || 1;
    const aq3Current = factorRanges.aq3?.current || 1;

    const acuteMinMultiplier = (factorRanges.aq1.min / factorRanges.aq1.current) *
      (aq2Min / aq2Current) *
      (aq3Min / aq3Current);
    const acuteMaxMultiplier = (factorRanges.aq1.max / factorRanges.aq1.current) *
      (aq2Max / aq2Current) *
      (aq3Max / aq3Current);

    acuteRange = {
      minimum: formatPremium(acuteFixedPremium * acuteMinMultiplier),
      maximum: formatPremium(acuteFixedPremium * acuteMaxMultiplier)
    };
  }

  // 高原病范围（R1、R2）
  let plateauRange = { minimum: 0, maximum: 0 };
  if (plateauDiseaseInsurance && factorRanges.r1) {
    const r2Min = factorRanges.r2?.min || 1;
    const r2Max = factorRanges.r2?.max || 1;
    const r2Current = factorRanges.r2?.current || 1;

    const plateauMinMultiplier = (factorRanges.r1.min / factorRanges.r1.current) *
      (r2Min / r2Current);
    const plateauMaxMultiplier = (factorRanges.r1.max / factorRanges.r1.current) *
      (r2Max / r2Current);

    plateauRange = {
      minimum: formatPremium(plateauFixedPremium * plateauMinMultiplier),
      maximum: formatPremium(plateauFixedPremium * plateauMaxMultiplier)
    };
  }

  // 计算总体范围
  const totalMinimum = mainRange.minimum + medicalRange.minimum + allowanceRange.minimum +
    acuteRange.minimum + plateauRange.minimum;
  const totalMaximum = mainRange.maximum + medicalRange.maximum + allowanceRange.maximum +
    acuteRange.maximum + plateauRange.maximum;

  // 计算当前配置的最低/最高（仅考虑已启用的险种）
  const currentMinimum = totalMinimum;
  const currentMaximum = totalMaximum;

  // 计算浮动范围百分比
  const rangePercent = totalMinimum > 0 ? ((totalMaximum - totalMinimum) / totalMinimum) * 100 : 0;

  return {
    premiumRange: {
      minimum: totalMinimum,
      maximum: totalMaximum,
      currentMinimum,
      currentMaximum,
      rangePercent: roundToDecimals(rangePercent, 2)
    },
    factorRanges
  };
};
