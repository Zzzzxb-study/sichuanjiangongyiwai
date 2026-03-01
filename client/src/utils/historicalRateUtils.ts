/**
 * 历史同类工程费率对比工具函数
 * 用于从历史数据中提取并统计工程费率指标
 */

/**
 * 历史记录接口（最小化定义，只包含需要的字段）
 */
export interface HistoryRecord {
  engineeringClass: number;
  ratePer100k?: number;
  contractAmount?: number;  // 合同金额（元）
  projectName?: string;      // 项目名称
}

/**
 * 工程类别归一化后的类型
 */
export type NormalizedEngineeringClass = 1 | 2 | 3 | 4;

/**
 * 历史费率指标
 */
export interface HistoricalRateMetrics {
  /** 平均费率（‰） */
  averageRate: number;
  /** 最低费率（‰） */
  minRate: number;
  /** 最高费率（‰） */
  maxRate: number;
  /** 样本数量 */
  sampleCount: number;
  /** 最接近工程造价的项目 */
  closestProject?: {
    projectName: string;
    contractAmount: number;
    ratePer100k: number;
  };
}

/**
 * 历史费率数据结果（带Graceful Fallback）
 */
export type HistoricalRateResult =
  | { success: true; data: HistoricalRateMetrics }
  | { success: false; error: string };

/**
 * 工程类别名称映射（支持中文数字和阿拉伯数字的等价匹配）
 */
const ENGINEERING_CLASS_PATTERNS: Record<number, RegExp[]> = {
  1: [
    /^1\s*类工程?$/,
    /^一\s*类工程?$/,
    /^一类$/,
    /^1类$/,
  ],
  2: [
    /^2\s*类工程?$/,
    /^二\s*类工程?$/,
    /^二类$/,
    /^2类$/,
  ],
  3: [
    /^3\s*类工程?$/,
    /^三\s*类工程?$/,
    /^三类$/,
    /^3类$/,
  ],
  4: [
    /^4\s*类工程?$/,
    /^四\s*类工程?$/,
    /^四类$/,
    /^4类$/,
  ],
};

/**
 * 归一化工程类别名称
 * 支持将"1类、2类..."与"一类、二类..."进行等价匹配
 *
 * @param classInput 工程类别输入（可能是数字、字符串等）
 * @returns 归一化后的工程类别（1-4），如果无法匹配则返回null
 *
 * @example
 * normalizeEngineeringClass(1) // => 1
 * normalizeEngineeringClass('一类工程') // => 1
 * normalizeEngineeringClass('2类') // => 2
 * normalizeEngineeringClass('三类工程') // => 3
 * normalizeEngineeringClass('invalid') // => null
 */
export function normalizeEngineeringClass(
  classInput: number | string | undefined | null
): NormalizedEngineeringClass | null {
  if (classInput === undefined || classInput === null) {
    return null;
  }

  // 如果是数字，直接验证范围
  if (typeof classInput === 'number') {
    if (classInput >= 1 && classInput <= 4) {
      return classInput as NormalizedEngineeringClass;
    }
    return null;
  }

  // 如果是字符串，去除空格后尝试匹配
  const trimmed = classInput.toString().trim();

  // 先尝试直接转换为数字
  const numericValue = parseInt(trimmed, 10);
  if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 4) {
    return numericValue as NormalizedEngineeringClass;
  }

  // 使用正则表达式进行模式匹配
  for (const [classNum, patterns] of Object.entries(ENGINEERING_CLASS_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(trimmed)) {
        return parseInt(classNum, 10) as NormalizedEngineeringClass;
      }
    }
  }

  return null;
}

/**
 * 从历史记录中计算指定工程类别的费率指标
 *
 * @param records 历史记录数组
 * @param engineeringClass 工程类别（1-4）
 * @param currentProjectCost 当前工程造价（元），可选
 * @returns 历史费率指标结果
 *
 * @example
 * const result = getHistoricalRateMetrics(records, 1, 5000000);
 * if (result.success) {
 *   console.log(`平均费率: ${result.data.averageRate}‰`);
 *   console.log(`费率区间: ${result.data.minRate}‰ - ${result.data.maxRate}‰`);
 *   if (result.data.closestProject) {
 *     console.log(`最接近项目: ${result.data.closestProject.projectName}`);
 *   }
 * }
 */
export function getHistoricalRateMetrics(
  records: HistoryRecord[],
  engineeringClass: NormalizedEngineeringClass,
  currentProjectCost?: number
): HistoricalRateResult {
  // 参数验证
  if (!Array.isArray(records) || records.length === 0) {
    return {
      success: false,
      error: '历史数据为空或格式不正确',
    };
  }

  if (engineeringClass < 1 || engineeringClass > 4) {
    return {
      success: false,
      error: `无效的工程类别: ${engineeringClass}`,
    };
  }

  // 过滤出指定工程类别的记录，并确保有费率数据
  const filteredRecords = records.filter(
    (record) =>
      record.engineeringClass === engineeringClass &&
      record.ratePer100k !== undefined &&
      record.ratePer100k !== null &&
      record.ratePer100k > 0
  );

  // Graceful Fallback: 如果没有匹配的数据
  if (filteredRecords.length === 0) {
    return {
      success: false,
      error: `暂无${engineeringClass}类工程的历史费率数据`,
    };
  }

  // 提取所有有效费率
  const rates = filteredRecords.map((r) => r.ratePer100k!);

  // 计算统计指标
  const averageRate =
    rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);

  // 格式化为2位小数
  const metrics: HistoricalRateMetrics = {
    averageRate: Math.round(averageRate * 100) / 100,
    minRate: Math.round(minRate * 100) / 100,
    maxRate: Math.round(maxRate * 100) / 100,
    sampleCount: filteredRecords.length,
  };

  // 如果提供了当前工程造价，查找最接近的项目
  if (currentProjectCost !== undefined && currentProjectCost > 0) {
    const closest = findClosestProject(records, engineeringClass, currentProjectCost);
    if (closest) {
      metrics.closestProject = closest;
    }
  }

  return {
    success: true,
    data: metrics,
  };
}

/**
 * 格式化费率显示
 * @param rate 费率值
 * @returns 格式化后的字符串（保留2位小数，带‰单位）
 */
export function formatRate(rate: number): string {
  return `${rate.toFixed(2)}‰`;
}

/**
 * 格式化费率区间显示
 * @param minRate 最低费率
 * @param maxRate 最高费率
 * @returns 格式化后的区间字符串
 */
export function formatRateRange(minRate: number, maxRate: number): string {
  return `${minRate.toFixed(2)} - ${maxRate.toFixed(2)}‰`;
}

/**
 * 查找工程造价最接近的历史项目
 *
 * @param records 历史记录数组
 * @param engineeringClass 工程类别（1-4）
 * @param currentProjectCost 当前工程造价（元）
 * @returns 最接近的项目信息，如果没有找到则返回null
 *
 * @example
 * const closest = findClosestProject(records, 1, 5000000);
 * if (closest) {
 *   console.log(`最接近项目: ${closest.projectName}`);
 *   console.log(`造价差: ${Math.abs(closest.contractAmount - 5000000)}元`);
 * }
 */
export function findClosestProject(
  records: HistoryRecord[],
  engineeringClass: NormalizedEngineeringClass,
  currentProjectCost: number
): {
  projectName: string;
  contractAmount: number;
  ratePer100k: number;
} | null {
  // 过滤出指定工程类别且有合同金额和费率的记录
  const filteredRecords = records.filter(
    (record) =>
      record.engineeringClass === engineeringClass &&
      record.contractAmount !== undefined &&
      record.contractAmount !== null &&
      record.contractAmount > 0 &&
      record.ratePer100k !== undefined &&
      record.ratePer100k !== null &&
      record.ratePer100k > 0
  );

  if (filteredRecords.length === 0) {
    return null;
  }

  // 计算每个项目与当前工程造价的差值绝对值，找到最小的
  const closest = filteredRecords.reduce((prev, curr) => {
    const prevDiff = Math.abs(prev.contractAmount! - currentProjectCost);
    const currDiff = Math.abs(curr.contractAmount! - currentProjectCost);
    return currDiff < prevDiff ? curr : prev;
  });

  return {
    projectName: closest.projectName || '未知项目',
    contractAmount: closest.contractAmount!,
    ratePer100k: closest.ratePer100k!,
  };
}
