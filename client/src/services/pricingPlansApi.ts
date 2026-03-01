/**
 * 报价方案API服务
 */

export interface SavePricingPlanRequest {
  planName: string;
  planDescription?: string;
  projectName?: string;
  contractor?: string;
  projectLocation?: string;
  mainParams: any;
  medicalParams?: any;
  allowanceParams?: any;
  acuteDiseaseParams?: any;
  plateauDiseaseParams?: any;
  calculationResult: any;
  tags?: string[];
  createdBy?: string;
  projectId?: string;  // 添加 projectId
}

export interface PricingPlan {
  id: string;
  planName: string;
  planDescription: string;
  projectName?: string;
  contractor?: string;
  projectLocation?: string;
  mainParams: any;
  medicalParams?: any;
  allowanceParams?: any;
  acuteDiseaseParams?: any;
  plateauDiseaseParams?: any;
  calculationResult: any;
  totalPremium: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  isFavorite: boolean;
  projectId?: string;  // 添加 projectId
  businessNo?: string;  // 添加业务流水号
}

export interface PricingPlansResponse {
  records: PricingPlan[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:58080/api';

/**
 * 获取项目完整信息（包括施工方、地点等）
 */
export const getProjectFullInfo = async (projectId: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/full`);

  if (!response.ok) {
    throw new Error('获取项目信息失败');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || '获取项目信息失败');
  }
  return data.data;
};



/**
 * 保存报价方案
 */
export const savePricingPlan = async (request: SavePricingPlanRequest): Promise<{ id: string }> => {
  // 调试日志：打印请求体
  console.log('=== 发送保存方案请求 ===');
  console.log('请求对象:', request);
  const bodyString = JSON.stringify(request);
  console.log('序列化后的请求体:', bodyString);
  console.log('请求体长度:', bodyString.length);
  console.log('========================');

  const response = await fetch(`${API_BASE_URL}/pricing-plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: bodyString,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('保存方案失败:', response.status, errorText);
    throw new Error(`保存方案失败: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (!data.success) {
    console.error('保存方案失败:', data.error);
    throw new Error(data.error || '保存方案失败');
  }
  return data.data;
};

/**
 * 获取方案列表
 */
export const getPricingPlans = async (params?: {
  keyword?: string;
  isFavorite?: boolean;
  projectId?: string;  // 添加 projectId 参数
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}): Promise<PricingPlansResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.keyword) queryParams.append('keyword', params.keyword);
  if (params?.isFavorite !== undefined) queryParams.append('isFavorite', String(params.isFavorite));
  if (params?.projectId) queryParams.append('projectId', params.projectId);  // 添加 projectId 查询参数
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const response = await fetch(`${API_BASE_URL}/pricing-plans?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error('获取方案列表失败');
  }

  const data = await response.json();
  return data.data;
};

/**
 * 获取方案详情
 */
export const getPricingPlanDetail = async (id: string): Promise<PricingPlan> => {
  const response = await fetch(`${API_BASE_URL}/pricing-plans/${id}`);

  if (!response.ok) {
    throw new Error('获取方案详情失败');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || '获取方案详情失败');
  }
  return data.data;
};

/**
 * 更新方案完整信息
 */
export const updatePricingPlanFull = async (
  id: string,
  request: SavePricingPlanRequest
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/pricing-plans/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('更新方案失败:', response.status, errorText);
    throw new Error(`更新方案失败: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (!data.success) {
    console.error('更新方案失败:', data.error);
    throw new Error(data.error || '更新方案失败');
  }
};

/**
 * 更新方案基本信息（向后兼容）
 */
export const updatePricingPlan = async (
  id: string,
  updates: {
    planName?: string;
    planDescription?: string;
    tags?: string[];
    isFavorite?: boolean;
  }
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/pricing-plans/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('更新方案失败:', response.status, errorText);
    throw new Error(`更新方案失败: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (!data.success) {
    console.error('更新方案失败:', data.error);
    throw new Error(data.error || '更新方案失败');
  }
};

/**
 * 删除方案
 */
export const deletePricingPlan = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/pricing-plans/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('删除方案失败:', response.status, errorText);
    throw new Error(`删除方案失败: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || '删除方案失败');
  }
};

/**
 * 切换收藏状态
 */
export const togglePlanFavorite = async (id: string): Promise<{ isFavorite: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/pricing-plans/${id}/favorite`, {
    method: 'PATCH',
  });

  if (!response.ok) {
    throw new Error('切换收藏状态失败');
  }

  const data = await response.json();
  return data.data;
};

/**
 * 导出报价PDF（包含报价详情页和条款附件）
 * @param id 方案ID
 * @param includeClauses 是否包含条款（默认true）
 */
export const exportPlanPDF = async (id: string, includeClauses: boolean = true): Promise<void> => {
  const queryParams = new URLSearchParams();
  queryParams.append('includeClauses', String(includeClauses));

  const response = await fetch(`${API_BASE_URL}/pricing-plans/${id}/export-pdf?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error('导出PDF失败');
  }

  // 获取文件名
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = '报价单.pdf';
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
    }
  }

  // 下载文件
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
