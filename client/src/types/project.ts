/**
 * 项目类型定义
 */

/**
 * 项目状态枚举
 */
export type ProjectStatus = 'draft' | 'pricing' | 'completed' | 'cancelled';

/**
 * 项目来源枚举
 */
export type ProjectSource = 'contract' | 'manual' | 'import' | 'migration';

/**
 * 项目信息
 */
export interface Project {
  project_id: string;
  business_no: string;
  project_name: string;
  status: ProjectStatus;
  source?: ProjectSource;
  source_file_name?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  notes?: string;
}

/**
 * API 响应
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
