/**
 * 合同解析 API 服务
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:58080/api';

export interface ContractParseResponse {
  projectName: string;
  address: string;
  constructionUnit: string;
  totalCost?: number;
  totalArea?: number;
  startDate?: string;
  endDate?: string;
  engineeringClass?: string;
  projectType?: string;
  confidence?: number;
  projectId: string;
  businessNo: string;
  recommendations?: any;
  validationResults?: any;
}

/**
 * 上传并解析合同文件
 * @param file 合同文件（PDF 或 Word）
 * @returns 解析结果，包含 projectId 和 businessNo
 */
export async function parseContract(file: File): Promise<{
  success: boolean;
  data?: ContractParseResponse;
  error?: string;
  message?: string;
}> {
  try {
    const formData = new FormData();
    formData.append('contract', file);

    const response = await axios.post(`${API_BASE_URL}/contract/parse`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2分钟超时
    });

    return response.data;
  } catch (error: any) {
    console.error('合同解析请求失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || '合同解析失败',
    };
  }
}

/**
 * 获取解析历史
 * @param page 页码
 * @param limit 每页数量
 */
export async function getParseHistory(page = 1, limit = 10) {
  try {
    const response = await axios.get(`${API_BASE_URL}/contract/history`, {
      params: { page, limit },
    });
    return response.data;
  } catch (error: any) {
    console.error('获取解析历史失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || '获取解析历史失败',
    };
  }
}

/**
 * 删除解析记录
 * @param id 记录 ID
 */
export async function deleteParseRecord(id: string) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/contract/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('删除解析记录失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || '删除解析记录失败',
    };
  }
}

/**
 * 获取工程分类建议
 * @param projectName 项目名称
 * @param address 项目地址
 */
export async function getEngineeringClassification(projectName: string, address?: string) {
  try {
    const response = await axios.post(`${API_BASE_URL}/contract/classify`, {
      projectName,
      address,
    });
    return response.data;
  } catch (error: any) {
    console.error('获取工程分类建议失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || '获取工程分类建议失败',
    };
  }
}

/**
 * 检测高原地区
 * @param address 地址
 */
export async function checkHighAltitude(address: string) {
  try {
    const response = await axios.post(`${API_BASE_URL}/contract/check-altitude`, {
      address,
    });
    return response.data;
  } catch (error: any) {
    console.error('高原地区检测失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || '高原地区检测失败',
    };
  }
}

export const contractApi = {
  parseContract,
  getParseHistory,
  deleteParseRecord,
  getEngineeringClassification,
  checkHighAltitude,
};
