/**
 * 保险费率计算 - 公共工具函数
 * 提供：线性插值、系数查找、区间判断等通用算法
 */

// ==================== 线性插值算法 ====================

/**
 * 线性插值函数
 * @param targetX - 目标值（需要插值的数值）
 * @param x1 - 节点1的X值
 * @param x2 - 节点2的X值
 * @param y1 - 节点1的Y值
 * @param y2 - 节点2的Y值
 * @returns 插值结果
 * @example
 * // 在 [1.0, 2.0] 之间插值，计算 1.5 对应的系数
 * // 系数节点: [(1.0, 0.95), (2.0, 1.0)]
 * linearInterpolation(1.5, 1.0, 2.0, 0.95, 1.0) // => 0.975
 */
export const linearInterpolation = (
  targetX: number,
  x1: number,
  x2: number,
  y1: number,
  y2: number
): number => {
  if (x1 === x2) {
    return y1;
  }

  const result = y1 + ((y2 - y1) / (x2 - x1)) * (targetX - x1);
  return result;
};

/**
 * 多节点线性插值（用于连续的档位查找）
 * @param targetX - 目标值
 * @param nodes - 节点数组，格式为 [{x: number, y: number}]
 * @returns 插值结果
 * @example
 * const nodes = [
 *   {x: 500, y: 1.40},
 *   {x: 1000, y: 1.30},
 *   {x: 3000, y: 1.00}
 * ];
 * linearInterpolationNodes(1500, nodes); // => 1.20
 */
export const linearInterpolationNodes = (
  targetX: number,
  nodes: Array<{ x: number; y: number }>
): number => {
  // 找到目标值所在的区间
  for (let i = 0; i < nodes.length - 1; i++) {
    if (targetX >= nodes[i].x && targetX <= nodes[i + 1].x) {
      return linearInterpolation(
        targetX,
        nodes[i].x,
        nodes[i + 1].x,
        nodes[i].y,
        nodes[i + 1].y
      );
    }
  }

  // 如果小于最小节点，返回最小节点的Y值
  if (targetX < nodes[0].x) {
    return nodes[0].y;
  }

  // 如果大于最大节点，返回最大节点的Y值
  return nodes[nodes.length - 1].y;
};

/**
 * 带边界处理的线性插值（用于处理超出范围的情况）
 * @param targetX - 目标值
 * @param nodes - 节点数组
 * @param lowerBound - 小于最小节点时的返回值（可选）
 * @param upperBound - 大于最大节点时的返回值（可选）
 * @returns 插值结果
 */
export const linearInterpolationWithBounds = (
  targetX: number,
  nodes: Array<{ x: number; y: number }>,
  lowerBound?: number,
  upperBound?: number
): number => {
  // 小于最小节点
  if (targetX < nodes[0].x) {
    return lowerBound !== undefined ? lowerBound : nodes[0].y;
  }

  // 大于最大节点
  if (targetX > nodes[nodes.length - 1].x) {
    return upperBound !== undefined ? upperBound : nodes[nodes.length - 1].y;
  }

  // 在范围内，使用多节点插值
  return linearInterpolationNodes(targetX, nodes);
};

// ==================== 数值范围检查 ====================

/**
 * 检查数值是否在指定区间内
 * @param value - 待检查的数值
 * @param min - 最小值（包含）
 * @param max - 最大值（包含）
 * @returns 是否在区间内
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * 限制数值在指定区间内
 * @param value - 待限制的数值
 * @param min - 最小值
 * @param max - 最大值
 * @returns 限制后的数值
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// ==================== 精度控制 ====================

/**
 * 向上取整到整数（元）
 * @param value - 待取整的数值
 * @returns 取整后的数值
 */
export const ceilToInteger = (value: number): number => {
  return Math.ceil(value);
};

/**
 * 保留指定小数位（四舍五入）
 * @param value - 待格式化的数值
 * @param decimals - 小数位数
 * @returns 格式化后的数值
 */
export const roundToDecimals = (value: number, decimals: number): number => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};

/**
 * 格式化保费（保留2位小数，向上取整）
 * @param premium - 原始保费
 * @returns 格式化后的保费
 */
export const formatPremium = (premium: number): number => {
  // 保留4位小数
  const rounded = roundToDecimals(premium, 4);
  // 向上取整到元
  return ceilToInteger(rounded);
};

// ==================== 日期计算 ====================

/**
 * 计算两个日期之间的天数
 * @param startDate - 开始日期
 * @param endDate - 结束日期
 * @returns 天数
 */
export const calculateDaysDiff = (startDate: Date, endDate: Date): number => {
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * 将天数转换为年数（保留4位小数）
 * @param days - 天数
 * @returns 年数
 */
export const daysToYears = (days: number): number => {
  return roundToDecimals(days / 365, 4);
};

// ==================== 费率表节点数据 ====================

/**
 * K1: 工程造价调整系数节点（非农村项目）
 * 单位：万元
 */
export const K1_COST_FACTOR_NODES = [
  { x: 500, y: 1.40 },
  { x: 1000, y: 1.30 },
  { x: 3000, y: 1.00 },
  { x: 6000, y: 0.90 },
  { x: 10000, y: 0.85 },
  { x: 20000, y: 0.75 },
  { x: 50000, y: 0.70 },
  { x: 100000, y: 0.62 },
  { x: 200000, y: 0.50 },
  { x: 500000, y: 0.30 },
  { x: 1000000, y: 0.20 },
];

/**
 * K2: 工程面积调整系数节点（农村项目）
 * 单位：平方米
 */
export const K2_AREA_FACTOR_NODES = [
  { x: 200, y: 1.65 },
  { x: 300, y: 1.30 },
  { x: 500, y: 1.00 },
  { x: 800, y: 0.85 },
  { x: 1200, y: 0.75 },
];

/**
 * K3: 施工合同类型系数
 */
export const K3_CONTRACT_TYPE_FACTORS: Record<string, number> = {
  general_contract: 1.00, // 总包、专业分包
  labor_class_1: 4.00, // 一类工程劳务分包
  labor_class_2: 5.00, // 二类工程劳务分包
  labor_class_3: 6.00, // 三类工程劳务分包
  labor_class_4: 7.00, // 四类工程劳务分包
};

/**
 * K4: 工程类型系数区间
 */
export const K4_ENGINEERING_TYPE_RANGES = {
  1: { min: 0.80, max: 1.00 }, // 一类工程
  2: { min: 1.30, max: 1.50 }, // 二类工程
  3: { min: 1.80, max: 2.00 }, // 三类工程
  4: { min: 2.30, max: 2.50 }, // 四类工程
};

/**
 * K5: 施工期限系数节点
 * 单位：年
 */
export const K5_DURATION_FACTOR_NODES = [
  { x: 1, y: 0.95 },
  { x: 2, y: 1.00 },
  { x: 3, y: 1.30 },
  { x: 4, y: 1.50 },
  { x: 5, y: 1.80 },
  { x: 10, y: 2.30 }, // 五年以上
];

/**
 * K6: 施工资质系数
 */
export const K6_QUALIFICATION_FACTORS: Record<string, number> = {
  special: 0.90, // 特级
  grade_1: 0.95, // 一级
  grade_2: 1.00, // 二级
  grade_3: 1.10, // 三级
  ungraded: 1.20, // 不分类
};

/**
 * K7: 企业风险管理水平系数区间
 * 统一范围为 0.5-1.5，适用于 K7、MF7、AK7
 */
export const K7_RISK_MANAGEMENT_RANGES = {
  sound: { min: 0.5, max: 1.5 }, // 健全
  relatively_sound: { min: 0.5, max: 1.5 }, // 较健全
  poor: { min: 0.5, max: 1.5 }, // 不健全
};

/**
 * AQ2: 区域性系数区间（急性病保险专用）
 */
export const AQ2_REGION_LEVEL_RANGES = {
  class_a: { min: 0.7, max: 0.9 }, // A类地区（优/低风险）
  class_b: { min: 0.9, max: 1.0 }, // B类地区（良/中风险）
  class_c: { min: 1.0, max: 1.3 }, // C类地区（一般/高风险）
};

/**
 * AQ3: 企业分类系数区间（急性病保险专用）
 */
export const AQ3_ENTERPRISE_CATEGORY_RANGES = {
  class_a: { min: 0.9, max: 0.9 }, // A类企业（固定值）
  class_b: { min: 0.9, max: 1.0 }, // B类企业（区间，不含0.9）
  class_c: { min: 1.0, max: 1.5 }, // C类企业（区间，不含1.0）
};

/**
 * 医疗保险 M1: 保额调整系数节点
 * 单位：元
 */
export const M1_MEDICAL_COVERAGE_NODES = [
  { x: 2000, y: 0.58 },
  { x: 5000, y: 0.84 },
  { x: 10000, y: 1.00 },
  { x: 20000, y: 1.14 },
  { x: 30000, y: 1.23 },
  { x: 50000, y: 1.31 },
  { x: 100000, y: 1.38 },
  { x: 200000, y: 1.41 },
];

/**
 * 医疗保险 M2: 免赔额调整系数节点
 * 单位：元
 */
export const M2_MEDICAL_DEDUCTIBLE_NODES = [
  { x: 0, y: 1.02 },
  { x: 100, y: 1.00 },
  { x: 200, y: 0.98 },
  { x: 300, y: 0.96 },
  { x: 400, y: 0.94 },
  { x: 500, y: 0.92 },
  { x: 1000, y: 0.84 },
  { x: 2000, y: 0.72 },
];

/**
 * 医疗保险 M3: 给付比例调整系数节点
 * 单位：%
 */
export const M3_MEDICAL_PAYMENT_RATIO_NODES = [
  { x: 50, y: 0.63 },
  { x: 60, y: 0.75 },
  { x: 70, y: 0.88 },
  { x: 80, y: 1.00 },
  { x: 90, y: 1.13 },
  { x: 100, y: 1.25 },
];

/**
 * 住院津贴 M2: 每次最高给付日数调整系数节点
 * 单位：日
 */
export const ALLOWANCE_M2_PAYMENT_DAYS_NODES = [
  { x: 15, y: 0.72 },
  { x: 30, y: 0.91 },
  { x: 60, y: 1.00 },
  { x: 90, y: 1.02 },
  { x: 180, y: 1.04 },
];

/**
 * 住院津贴 M3: 累计给付日数调整系数节点
 * 单位：日
 */
export const ALLOWANCE_M3_TOTAL_DAYS_NODES = [
  { x: 90, y: 0.95 },
  { x: 180, y: 1.00 },
  { x: 365, y: 1.04 },
];

/**
 * 住院津贴 M1: 免赔日数调整系数节点
 * 单位：日
 */
export const ALLOWANCE_M1_DEDUCTIBLE_DAYS_NODES = [
  { x: 0, y: 1.22 },
  { x: 3, y: 1.00 },
];
