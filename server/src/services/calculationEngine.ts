import {
  ProjectInfo,
  ProjectType,
  EngineeringClass,
  ContractType,
  CompanyQualification,
  ManagementLevel,
  MainInsuranceParams,
  MedicalInsuranceParams,
  AllowanceInsuranceParams,
  AcuteDiseaseParams,
  PlateauDiseaseParams,
  PremiumCalculationResult,
  CalculationDetails,
  InsuranceType
} from '../types';

/**
 * 核心计算引擎类
 * 实现四川建工意外险的所有保费计算逻辑
 */
export class CalculationEngine {

  /**
   * 线性插值算法
   * @param targetValue 目标值
   * @param nodes 节点数组 [{x: number, y: number}]
   * @returns 插值结果
   */
  private linearInterpolation(
    targetValue: number,
    nodes: Array<{x: number, y: number}>
  ): number {
    // 排序节点
    const sortedNodes = nodes.sort((a, b) => a.x - b.x);

    // 边界处理
    if (targetValue <= sortedNodes[0].x) {
      return sortedNodes[0].y;
    }
    if (targetValue >= sortedNodes[sortedNodes.length - 1].x) {
      return sortedNodes[sortedNodes.length - 1].y;
    }

    // 找到插值区间
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const x1 = sortedNodes[i].x;
      const x2 = sortedNodes[i + 1].x;
      const y1 = sortedNodes[i].y;
      const y2 = sortedNodes[i + 1].y;

      if (targetValue >= x1 && targetValue <= x2) {
        // 线性插值公式: y = y1 + (y2-y1)/(x2-x1) * (x-x1)
        return y1 + ((y2 - y1) / (x2 - x1)) * (targetValue - x1);
      }
    }

    return 1.0; // 默认值
  }

  /**
   * 计算K1系数（造价系数）
   * @param totalCost 项目总造价（万元）
   * @returns K1系数
   */
  private calculateK1(totalCost: number): number {
    const nodes = [
      { x: 500, y: 0.8 },
      { x: 1000, y: 0.9 },
      { x: 5000, y: 1.0 },
      { x: 10000, y: 1.1 },
      { x: 100000, y: 1.3 }
    ];

    return this.linearInterpolation(totalCost, nodes);
  }

  /**
   * 计算K2系数（面积系数）
   * @param totalArea 项目总面积（平方米）
   * @returns K2系数
   */
  private calculateK2(totalArea: number): number {
    const nodes = [
      { x: 200, y: 0.9 },
      { x: 400, y: 1.0 },
      { x: 600, y: 1.1 },
      { x: 800, y: 1.2 }
    ];

    return this.linearInterpolation(totalArea, nodes);
  }

  /**
   * 计算K3系数（合同类型系数）
   * @param contractType 合同类型
   * @param engineeringClass 工程分类
   * @returns K3系数
   */
  private calculateK3(contractType: ContractType, engineeringClass: EngineeringClass): number {
    if (contractType === ContractType.LABOR) {
      // 劳务分包
      switch (engineeringClass) {
        case EngineeringClass.CLASS_ONE: return 4.0;
        case EngineeringClass.CLASS_TWO: return 5.0;
        case EngineeringClass.CLASS_THREE: return 6.0;
        case EngineeringClass.CLASS_FOUR: return 7.0;
        default: return 1.0;
      }
    }
    return 1.0; // 总包/专业分包
  }

  /**
   * 计算K4系数（工程类型风险系数）
   * @param engineeringClass 工程分类
   * @param riskLevel 用户输入的风险等级（在对应区间内）
   * @returns K4系数
   */
  private calculateK4(engineeringClass: EngineeringClass, riskLevel: number): number {
    // 验证输入值是否在允许区间内
    const ranges = {
      [EngineeringClass.CLASS_ONE]: [0.80, 1.00],
      [EngineeringClass.CLASS_TWO]: [1.30, 1.50],
      [EngineeringClass.CLASS_THREE]: [1.80, 2.00],
      [EngineeringClass.CLASS_FOUR]: [2.30, 2.50]
    };

    const [min, max] = ranges[engineeringClass];
    if (riskLevel < min || riskLevel > max) {
      throw new Error(`K4系数超出允许范围 [${min}, ${max}]`);
    }

    return riskLevel;
  }

  /**
   * 计算K5系数（施工期限系数）
   * @param startDate 开工日期
   * @param endDate 竣工日期
   * @returns K5系数
   */
  private calculateK5(startDate: Date, endDate: Date): number {
    const timeDiff = endDate.getTime() - startDate.getTime();
    const days = timeDiff / (1000 * 3600 * 24);
    const years = days / 365;

    if (years < 0) {
      throw new Error('竣工日期不可早于开工日期');
    }

    const nodes = [
      { x: 1.0, y: 0.95 },
      { x: 2.0, y: 1.00 },
      { x: 3.0, y: 1.30 },
      { x: 4.0, y: 1.50 },
      { x: 5.0, y: 1.80 }
    ];

    if (years > 5.0) {
      return 2.30;
    }

    return this.linearInterpolation(years, nodes);
  }

  /**
   * 计算K6系数（企业资质系数）
   * @param qualification 企业资质
   * @returns K6系数
   */
  private calculateK6(qualification: CompanyQualification): number {
    const qualificationMap = {
      [CompanyQualification.SPECIAL]: 0.9,
      [CompanyQualification.FIRST]: 0.95,
      [CompanyQualification.SECOND]: 1.0,
      [CompanyQualification.THIRD]: 1.1,
      [CompanyQualification.UNCLASSIFIED]: 1.2
    };

    return qualificationMap[qualification];
  }

  /**
   * 计算主险保费
   * @param projectInfo 项目信息
   * @param params 主险参数
   * @returns 主险保费和计算详情
   */
  public calculateMainInsurance(
    projectInfo: ProjectInfo,
    params: MainInsuranceParams
  ): { premium: number; details: CalculationDetails } {

    // 确定计费基数
    let basePremium: number;
    let k1 = 1.0, k2 = 1.0;

    if (projectInfo.projectType === ProjectType.RURAL) {
      // 农村项目：按面积计费
      if (!projectInfo.totalArea) {
        throw new Error('农村项目必须提供总面积');
      }
      basePremium = 0.9 * projectInfo.totalArea; // 基准费率 0.9元/平方米
      k2 = this.calculateK2(projectInfo.totalArea);
    } else {
      // 非农村项目：按造价计费
      if (!projectInfo.totalCost) {
        throw new Error('非农村项目必须提供总造价');
      }
      basePremium = 0.33 * projectInfo.totalCost; // 基准费率 0.33‰
      k1 = this.calculateK1(projectInfo.totalCost);
    }

    // 计算各项系数
    const k3 = this.calculateK3(projectInfo.contractType, projectInfo.engineeringClass);
    const k5 = this.calculateK5(projectInfo.startDate, projectInfo.endDate);
    const k6 = this.calculateK6(projectInfo.companyQualification);
    const k7 = params.k7ManagementLevel;
    const k8 = params.k8LossRecord;

    // K4需要用户手动输入，这里使用默认中值
    const k4 = this.getDefaultK4(projectInfo.engineeringClass);

    // 限额因子
    const coverageFactor = params.coverageAmount / 10; // 保额/10万

    // 计算最终保费
    const totalAdjustment = k1 * k2 * k3 * k4 * k5 * k6 * k7 * k8;
    const premium = Math.ceil(basePremium * coverageFactor * totalAdjustment);

    const details: CalculationDetails = {
      basePremium,
      adjustmentFactors: { k1, k2, k3, k4, k5, k6, k7, k8 }
    };

    return { premium, details };
  }

  /**
   * 获取工程分类的默认K4中值
   */
  private getDefaultK4(engineeringClass: EngineeringClass): number {
    const defaults = {
      [EngineeringClass.CLASS_ONE]: 0.90,
      [EngineeringClass.CLASS_TWO]: 1.40,
      [EngineeringClass.CLASS_THREE]: 1.90,
      [EngineeringClass.CLASS_FOUR]: 2.40
    };
    return defaults[engineeringClass];
  }

  /**
   * 计算附加医疗险保费
   * @param projectInfo 项目信息
   * @param params 医疗险参数
   * @returns 医疗险保费
   */
  public calculateMedicalInsurance(
    projectInfo: ProjectInfo,
    params: MedicalInsuranceParams
  ): number {
    // 确定基准保费
    let basePremium: number;

    if (projectInfo.projectType === ProjectType.RURAL) {
      basePremium = 0.9 * (projectInfo.totalArea || 0);
    } else {
      basePremium = 0.33 * (projectInfo.totalCost || 0);
    }

    // 计算M系数
    const m1 = this.calculateM1(params.coverageAmount);
    const m2 = this.calculateM2(params.deductible);
    const m3 = this.calculateM3(params.paymentRatio);
    const m4 = params.hasSocialInsurance ? 1.0 : 1.5;
    const m5 = params.hasOtherMedicalInsurance ? 0.9 : 1.0;

    // 复用主险的K系数（简化处理）
    const kFactors = this.calculateMainInsurance(projectInfo, {
      coverageAmount: 10, // 默认10万
      k7ManagementLevel: 1.0,
      k8LossRecord: 1.0
    }).details.adjustmentFactors;

    const totalAdjustment = m1 * m2 * m3 * m4 * m5 *
      kFactors.k1 * kFactors.k2 * kFactors.k3 * kFactors.k4 *
      kFactors.k5 * kFactors.k6;

    return Math.ceil(basePremium * totalAdjustment);
  }

  /**
   * 计算M1系数（医疗保额系数）
   */
  private calculateM1(coverageAmount: number): number {
    if (coverageAmount < 2000) return 0.58;
    if (coverageAmount > 200000) return 1.41;

    const nodes = [
      { x: 2000, y: 0.58 },
      { x: 5000, y: 0.72 },
      { x: 10000, y: 0.85 },
      { x: 20000, y: 1.00 },
      { x: 30000, y: 1.12 },
      { x: 50000, y: 1.25 },
      { x: 100000, y: 1.35 },
      { x: 200000, y: 1.41 }
    ];

    return this.linearInterpolation(coverageAmount, nodes);
  }

  /**
   * 计算M2系数（免赔额系数）
   */
  private calculateM2(deductible: number): number {
    if (deductible > 2000) return 0.72;

    const nodes = [
      { x: 0, y: 1.02 },
      { x: 100, y: 1.00 },
      { x: 200, y: 0.98 },
      { x: 300, y: 0.95 },
      { x: 400, y: 0.92 },
      { x: 500, y: 0.88 },
      { x: 1000, y: 0.80 },
      { x: 2000, y: 0.72 }
    ];

    return this.linearInterpolation(deductible, nodes);
  }

  /**
   * 计算M3系数（给付比例系数）
   */
  private calculateM3(paymentRatio: number): number {
    const nodes = [
      { x: 50, y: 0.75 },
      { x: 60, y: 0.82 },
      { x: 70, y: 0.88 },
      { x: 80, y: 0.94 },
      { x: 90, y: 0.97 },
      { x: 100, y: 1.00 }
    ];

    return this.linearInterpolation(paymentRatio, nodes);
  }

  /**
   * 计算高原病保费
   * @param basePremiums 其他险种保费总和
   * @param params 高原病参数
   * @returns 高原病保费
   */
  public calculatePlateauDiseaseInsurance(
    basePremiums: number,
    params: PlateauDiseaseParams
  ): number {
    // R1系数（人员风险）
    const r1Map = { 'A': 0.8, 'B': 1.0, 'C': 1.2 };
    const r1 = r1Map[params.personnelRiskLevel];

    // R2系数（区域风险）
    const r2Map = { 'A': 0.7, 'B': 0.9, 'C': 1.0 };
    const r2 = r2Map[params.regionRiskLevel];

    // 高原病保费 = 基数 × 8.1% × R1 × R2
    return Math.ceil(basePremiums * 0.081 * r1 * r2);
  }

  /**
   * 综合计算所有险种保费
   * @param projectInfo 项目信息
   * @param insuranceParams 各险种参数
   * @returns 完整的保费计算结果
   */
  public calculateTotalPremium(
    projectInfo: ProjectInfo,
    insuranceParams: {
      main: MainInsuranceParams;
      medical?: MedicalInsuranceParams;
      allowance?: AllowanceInsuranceParams;
      acuteDisease?: AcuteDiseaseParams;
      plateauDisease?: PlateauDiseaseParams;
    }
  ): PremiumCalculationResult {

    // 计算主险
    const mainResult = this.calculateMainInsurance(projectInfo, insuranceParams.main);
    let totalPremium = mainResult.premium;

    // 计算附加医疗险
    let medicalPremium = 0;
    if (insuranceParams.medical) {
      medicalPremium = this.calculateMedicalInsurance(projectInfo, insuranceParams.medical);
      totalPremium += medicalPremium;
    }

    // 计算其他附加险（简化实现）
    let allowancePremium = 0;
    let acuteDiseasePremium = 0;

    // 计算高原病保费（只基于主险保费）
    let plateauDiseasePremium = 0;
    if (insuranceParams.plateauDisease) {
      // 高原病保费 = 主险保费 × 8.1% × R1 × R2
      plateauDiseasePremium = this.calculatePlateauDiseaseInsurance(
        mainResult.premium, // 只使用主险保费，不包含其他附加险
        insuranceParams.plateauDisease
      );
      totalPremium += plateauDiseasePremium;
    }

    // 计算系数范围和保费范围
    const { premiumRange, factorRanges } = this.calculateCoefficientRanges(
      projectInfo,
      insuranceParams,
      mainResult
    );

    return {
      mainInsurance: mainResult.premium,
      medicalInsurance: medicalPremium,
      allowanceInsurance: allowancePremium,
      acuteDiseaseInsurance: acuteDiseasePremium,
      plateauDiseaseInsurance: plateauDiseasePremium,
      totalPremium,
      calculationDetails: mainResult.details,
      premiumRange,
      factorRanges
    };
  }

  /**
   * 计算系数范围和保费范围
   */
  private calculateCoefficientRanges(
    projectInfo: ProjectInfo,
    insuranceParams: {
      main: MainInsuranceParams;
      medical?: MedicalInsuranceParams;
      allowance?: AllowanceInsuranceParams;
      acuteDisease?: AcuteDiseaseParams;
      plateauDisease?: PlateauDiseaseParams;
    },
    mainResult: { premium: number; details: CalculationDetails }
  ): { premiumRange: any; factorRanges: any } {
    const ranges: any = {};
    const mainRanges: any = {};

    // 主险系数范围
    mainRanges.k4 = this.calculateK4Range(projectInfo.engineeringClass);
    mainRanges.k7 = this.calculateK7Range();
    mainRanges.k8 = this.calculateK8Range();

    // 注意：M1-M3（医疗保险）和 AM1-AM3（住院津贴）系数是固定取值规律，不参与灵活系数范围计算

    // 附加急性病系数范围
    if (insuranceParams.acuteDisease) {
      ranges.aq1 = this.calculateAQ1Range();
      ranges.aq2 = this.calculateAQ2Range();
      ranges.aq3 = this.calculateAQ3Range();
    }

    // 附加高原病系数范围
    if (insuranceParams.plateauDisease) {
      ranges.r1 = this.calculateR1Range(insuranceParams.plateauDisease.personnelRiskLevel);
      ranges.r2 = this.calculateR2Range(insuranceParams.plateauDisease.regionRiskLevel);
    }

    // 计算保费范围（传递系数范围以便使用实际范围计算）
    const premiumRange = this.calculatePremiumRange(
      projectInfo,
      insuranceParams,
      mainResult,
      mainRanges,
      ranges
    );

    return { premiumRange, factorRanges: { ...mainRanges, ...ranges } };
  }

  /**
   * 计算K4系数范围
   */
  private calculateK4Range(engineeringClass: EngineeringClass): any {
    const ranges = {
      [EngineeringClass.CLASS_ONE]: [0.80, 1.00],
      [EngineeringClass.CLASS_TWO]: [1.30, 1.50],
      [EngineeringClass.CLASS_THREE]: [1.80, 2.00],
      [EngineeringClass.CLASS_FOUR]: [2.30, 2.50]
    };
    const [min, max] = ranges[engineeringClass];
    const current = this.getDefaultK4(engineeringClass);
    return { name: 'K4工程类型风险系数', min, current, max };
  }

  /**
   * 计算K7系数范围
   */
  private calculateK7Range(): any {
    const min = 0.5;
    const max = 1.5;
    const current = 1.0; // 默认值
    return { name: 'K7管理水平系数', min, current, max };
  }

  /**
   * 计算K8系数范围
   */
  private calculateK8Range(): any {
    const min = 0.5;
    const max = 1.2;
    const current = 1.0; // 默认值
    return { name: 'K8损失记录系数', min, current, max };
  }

  /**
   * 计算M1系数范围（医疗保额系数）
   */
  private calculateM1Range(coverageAmount: number): any {
    const min = 0.58; // 2千元
    const max = 1.41; // 20万元
    const current = this.calculateM1(coverageAmount);
    return { name: 'M1医疗保额系数', min, current, max };
  }

  /**
   * 计算M2系数范围（免赔额系数）
   */
  private calculateM2Range(deductible: number): any {
    const min = 0.72;
    const max = 1.02;
    const current = this.calculateM2(deductible);
    return { name: 'M2免赔额系数', min, current, max };
  }

  /**
   * 计算M3系数范围（给付比例系数）
   */
  private calculateM3Range(paymentRatio: number): any {
    const min = 0.75;
    const max = 1.00;
    const current = this.calculateM3(paymentRatio);
    return { name: 'M3给付比例系数', min, current, max };
  }

  /**
   * 计算AM1系数范围（每日津贴系数）
   */
  private calculateAM1Range(dailyLimit: number): any {
    const min = 50;
    const max = 300;
    const current = dailyLimit;
    return { name: 'AM1每日津贴系数', min, current, max };
  }

  /**
   * 计算AM2系数范围（免赔天数系数）
   */
  private calculateAM2Range(waitingDays: number): any {
    const min = 0;
    const max = 7;
    const current = waitingDays;
    return { name: 'AM2免赔天数系数', min, current, max };
  }

  /**
   * 计算AM3系数范围（给付天数系数）
   */
  private calculateAM3Range(paymentDays: number): any {
    const min = 90;
    const max = 365;
    const current = paymentDays;
    return { name: 'AM3给付天数系数', min, current, max };
  }

  /**
   * 计算AQ1系数范围（等待期系数）
   */
  private calculateAQ1Range(): any {
    const min = 3;
    const max = 15;
    const current = 7; // 默认值
    return { name: 'AQ1等待期系数', min, current, max };
  }

  /**
   * 计算AQ2系数范围（区域等级系数）
   */
  private calculateAQ2Range(): any {
    const min = 0.7;
    const max = 1.0;
    const current = 0.9; // 默认值
    return { name: 'AQ2区域等级系数', min, current, max };
  }

  /**
   * 计算AQ3系数范围（企业类别系数）
   */
  private calculateAQ3Range(): any {
    const min = 0.8;
    const max = 1.2;
    const current = 1.0; // 默认值
    return { name: 'AQ3企业类别系数', min, current, max };
  }

  /**
   * 计算R1系数范围（人员风险系数）
   */
  private calculateR1Range(personnelRiskLevel: 'A' | 'B' | 'C'): any {
    const rangeMap = { 'A': [0.8, 1.0], 'B': [1.0, 1.2], 'C': [1.2, 1.5] };
    const [min, max] = rangeMap[personnelRiskLevel];
    const currentMap = { 'A': 0.8, 'B': 1.0, 'C': 1.2 };
    const current = currentMap[personnelRiskLevel];
    return { name: 'R1人员风险系数', min, current, max };
  }

  /**
   * 计算R2系数范围（区域风险系数）
   */
  private calculateR2Range(regionRiskLevel: 'A' | 'B' | 'C'): any {
    const rangeMap = { 'A': [0.7, 1.0], 'B': [0.9, 1.1], 'C': [1.0, 1.3] };
    const [min, max] = rangeMap[regionRiskLevel];
    const currentMap = { 'A': 0.7, 'B': 0.9, 'C': 1.0 };
    const current = currentMap[regionRiskLevel];
    return { name: 'R2区域风险系数', min, current, max };
  }

  /**
   * 计算保费范围（基于系数的最低值和最高值）
   * 使用实际灵活系数范围（K4、K7、K8等）计算，而非固定浮动范围
   */
  private calculatePremiumRange(
    projectInfo: ProjectInfo,
    insuranceParams: any,
    mainResult: any,
    mainRanges: any,
    otherRanges: any
  ): any {
    const currentPremium = mainResult.premium;
    const details = mainResult.details;

    // 获取当前灵活系数值
    const k4Current = details.adjustmentFactors.k4;
    const k7Current = details.adjustmentFactors.k7;
    const k8Current = details.adjustmentFactors.k8;

    // 获取灵活系数范围
    const k4Min = mainRanges.k4?.min || k4Current;
    const k4Max = mainRanges.k4?.max || k4Current;
    const k7Min = mainRanges.k7?.min || k7Current;
    const k7Max = mainRanges.k7?.max || k7Current;
    const k8Min = mainRanges.k8?.min || k8Current;
    const k8Max = mainRanges.k8?.max || k8Current;

    // 计算固定部分（排除灵活系数K4、K7、K8）
    // 当前保费 = 固定部分 × K4 × K7 × K8
    // 所以 固定部分 = 当前保费 / (K4 × K7 × K8)
    const fixedPremium = currentPremium / (k4Current * k7Current * k8Current);

    // 计算理论最低和最高保费
    // 最低 = 固定部分 × K4_min × K7_min × K8_min
    // 最高 = 固定部分 × K4_max × K7_max × K8_max
    const minimum = Math.ceil(fixedPremium * k4Min * k7Min * k8Min);
    const maximum = Math.ceil(fixedPremium * k4Max * k7Max * k8Max);

    // 当前配置的最低/最高（与理论最低/最高相同）
    const currentMinimum = minimum;
    const currentMaximum = maximum;

    return {
      minimum,
      maximum,
      currentMinimum,
      currentMaximum
    };
  }
}