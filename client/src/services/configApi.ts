/**
 * 配置管理API服务
 * 用于工程分类、费率节点等配置的CRUD操作
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:58080/api';

/**
 * 工程分类接口
 */
export interface EngineeringClass {
  id?: string;
  class_level: number;
  class_name: string;
  description?: string;
  keywords?: string[];
  risk_level?: string;
  k3_labor: number;
  k4_range_min: number;
  k4_range_max: number;
  examples?: string[];
  display_order?: number;
}

/**
 * 费率节点接口
 */
export interface RateNode {
  id?: string;
  node_type: string;
  node_value: number;
  factor: number;
  display_order?: number;
}

/**
 * 系统配置接口
 */
export interface SystemConfigData {
  id?: string;
  config_key: string;
  config_value: string;
  config_type: string;
  category?: string;
  description?: string;
}

/**
 * 公司业务分类接口
 */
export interface BusinessClassification {
  id?: string;
  category_level: string;           // encouraged/general/cautious/restricted/strictly_restricted
  category_name: string;             // 分类名称
  category_description?: string;     // 分类描述
  risk_levels?: string[];            // 建筑风险等级列表
  business_types?: string[];         // 业务类型描述
  examples?: string[];               // 示例项目
  underwriting_guide?: string;       // 承保指引
  display_order?: number;            // 显示顺序
}

/**
 * API响应接口
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * 配置API服务类
 */
export class ConfigApiService {
  /**
   * 获取所有工程分类
   */
  static async getEngineeringClasses(): Promise<EngineeringClass[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/engineering-classes`);
      const result: ApiResponse<EngineeringClass[]> = await response.json();

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.message || '获取工程分类失败');
    } catch (error) {
      console.error('获取工程分类失败:', error);
      throw error;
    }
  }

  /**
   * 更新工程分类
   */
  static async updateEngineeringClasses(classes: EngineeringClass[]): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/engineering-classes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classes }),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || '更新工程分类失败');
      }
    } catch (error) {
      console.error('更新工程分类失败:', error);
      throw error;
    }
  }

  /**
   * 获取费率节点
   */
  static async getRateNodes(nodeType?: string): Promise<RateNode[]> {
    try {
      const url = nodeType
        ? `${API_BASE_URL}/config/rate-nodes?nodeType=${nodeType}`
        : `${API_BASE_URL}/config/rate-nodes`;

      const response = await fetch(url);
      const result: ApiResponse<RateNode[]> = await response.json();

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.message || '获取费率节点失败');
    } catch (error) {
      console.error('获取费率节点失败:', error);
      throw error;
    }
  }

  /**
   * 批量更新费率节点
   */
  static async updateRateNodes(nodes: RateNode[], nodeType: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/rate-nodes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeType, nodes }),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || '更新费率节点失败');
      }
    } catch (error) {
      console.error('更新费率节点失败:', error);
      throw error;
    }
  }

  /**
   * 创建费率节点
   */
  static async createRateNode(node: RateNode): Promise<RateNode> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/rate-nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(node),
      });

      const result: ApiResponse<RateNode> = await response.json();

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.message || '创建费率节点失败');
    } catch (error) {
      console.error('创建费率节点失败:', error);
      throw error;
    }
  }

  /**
   * 更新单个费率节点
   */
  static async updateRateNode(id: string, node: RateNode): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/rate-nodes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(node),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || '更新费率节点失败');
      }
    } catch (error) {
      console.error('更新费率节点失败:', error);
      throw error;
    }
  }

  /**
   * 删除费率节点
   */
  static async deleteRateNode(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/rate-nodes/${id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || '删除费率节点失败');
      }
    } catch (error) {
      console.error('删除费率节点失败:', error);
      throw error;
    }
  }

  /**
   * 获取系统配置
   */
  static async getSystemConfigs(): Promise<SystemConfigData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/system`);
      const result: ApiResponse<SystemConfigData[]> = await response.json();

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.message || '获取系统配置失败');
    } catch (error) {
      console.error('获取系统配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新系统配置
   */
  static async updateSystemConfig(config: SystemConfigData): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/system`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || '更新系统配置失败');
      }
    } catch (error) {
      console.error('更新系统配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取配置历史
   */
  static async getConfigHistory(configType: string, configId: string, limit?: number): Promise<any[]> {
    try {
      const url = limit
        ? `${API_BASE_URL}/config/history/${configType}/${configId}?limit=${limit}`
        : `${API_BASE_URL}/config/history/${configType}/${configId}`;

      const response = await fetch(url);
      const result: ApiResponse<any[]> = await response.json();

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.message || '获取配置历史失败');
    } catch (error) {
      console.error('获取配置历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取最近的配置变更
   */
  static async getRecentConfigHistory(limit = 100): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/history/recent?limit=${limit}`);
      const result: ApiResponse<any[]> = await response.json();

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.message || '获取最近配置历史失败');
    } catch (error) {
      console.error('获取最近配置历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有公司业务分类
   */
  static async getBusinessClassifications(): Promise<BusinessClassification[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/business-classifications`);
      const result: ApiResponse<BusinessClassification[]> = await response.json();

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.message || '获取业务分类失败');
    } catch (error) {
      console.error('获取业务分类失败:', error);
      throw error;
    }
  }

  /**
   * 更新公司业务分类
   */
  static async updateBusinessClassification(
    id: string,
    classification: BusinessClassification
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/business-classifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classification),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || '更新业务分类失败');
      }
    } catch (error) {
      console.error('更新业务分类失败:', error);
      throw error;
    }
  }

  /**
   * 根据工程类型匹配业务分类
   */
  static async matchBusinessClassification(projectType: string): Promise<BusinessClassification | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/match-business-classification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectType }),
      });

      const result: ApiResponse<BusinessClassification> = await response.json();

      if (result.success) {
        return result.data || null;
      }
      throw new Error(result.message || '匹配业务分类失败');
    } catch (error) {
      console.error('匹配业务分类失败:', error);
      throw error;
    }
  }
}
