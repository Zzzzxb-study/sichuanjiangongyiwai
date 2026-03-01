/**
 * 保险条款PDF文件映射配置
 * 定义各险种对应的条款PDF文件路径
 */

export interface ClauseFileConfig {
  /** 险种代码 */
  insuranceType: string;
  /** 险种名称 */
  insuranceName: string;
  /** PDF文件路径（相对于public目录） */
  pdfPath: string;
  /** 条款显示名称 */
  displayName: string;
}

/**
 * 条款文件映射表
 */
export const CLAUSE_FILE_MAP: Record<string, ClauseFileConfig> = {
  // 主险
  MAIN: {
    insuranceType: 'MAIN',
    insuranceName: '主险',
    pdfPath: '/assets/clauses/main.pdf',
    displayName: '四川省建筑施工人员团体意外伤害保险条款（修订版）',
  },

  // 附加医疗保险
  MEDICAL: {
    insuranceType: 'MEDICAL',
    insuranceName: '附加医疗保险',
    pdfPath: '/assets/clauses/medical.pdf',
    displayName: '附加意外伤害医疗费用保险条款',
  },

  // 住院津贴保险
  ALLOWANCE: {
    insuranceType: 'ALLOWANCE',
    insuranceName: '住院津贴保险',
    pdfPath: '/assets/clauses/allowance.pdf',
    displayName: '附加意外伤害住院津贴保险条款',
  },

  // 急性病保险
  ACUTE_DISEASE: {
    insuranceType: 'ACUTE_DISEASE',
    insuranceName: '突发急性病保险',
    pdfPath: '/assets/clauses/acute_disease.pdf',
    displayName: '附加突发急性病身故保险条款',
  },

  // 高原病保险
  PLATEAU_DISEASE: {
    insuranceType: 'PLATEAU_DISEASE',
    insuranceName: '高原病保险',
    pdfPath: '/assets/clauses/plateau_disease.pdf',
    displayName: '附加高原病保险条款',
  },
};

/**
 * 根据险种类型获取条款PDF路径
 * @param insuranceType 险种类型
 * @returns PDF文件路径，如果未找到则返回null
 */
export function getClausePdfPath(insuranceType: string): string | null {
  const config = CLAUSE_FILE_MAP[insuranceType];
  return config ? config.pdfPath : null;
}

/**
 * 根据险种类型获取条款配置
 * @param insuranceType 险种类型
 * @returns 条款配置，如果未找到则返回null
 */
export function getClauseConfig(insuranceType: string): ClauseFileConfig | null {
  return CLAUSE_FILE_MAP[insuranceType] || null;
}

/**
 * 获取所有可用的条款配置列表
 * @returns 条款配置数组
 */
export function getAllClauseConfigs(): ClauseFileConfig[] {
  return Object.values(CLAUSE_FILE_MAP);
}
