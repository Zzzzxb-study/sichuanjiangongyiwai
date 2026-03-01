import { api } from './axios';

/**
 * 历史承保数据 API 服务
 */
export const historyDataApi = {
  /**
   * 获取历史承保记录
   */
  getHistoryRecords: async (params: {
    projectType?: 'rural' | 'non_rural';
    engineeringClass?: number;
    costRange?: [number, number];
    areaRange?: [number, number];
    dateRange?: [string, string];
    page?: number;
    limit?: number;
  } = {}) => {
    const response = await api.get('/history/records', { params });
    return response.data;
  },

  /**
   * 获取费率统计信息
   */
  getRateStatistics: async (params: {
    projectType?: 'rural' | 'non_rural';
    engineeringClass?: number;
    timeRange?: string;
  } = {}) => {
    const response = await api.get('/history/statistics', { params });
    return response.data;
  },

  /**
   * 获取相似项目推荐
   */
  getSimilarProjects: async (projectInfo: any) => {
    const response = await api.post('/history/similar', { projectInfo });
    return response.data;
  },

  /**
   * 获取费率趋势分析
   */
  getRateTrends: async (params: {
    projectType?: 'rural' | 'non_rural';
    engineeringClass?: number;
    period?: string;
  } = {}) => {
    const response = await api.get('/history/trends', { params });
    return response.data;
  },

  /**
   * 导出历史数据
   */
  exportHistoryData: async (params: {
    format?: string;
    filters?: any;
  }) => {
    const response = await api.post('/history/export', params);
    return response.data;
  },

  /**
   * 删除历史记录
   */
  deleteHistoryRecord: async (id: string) => {
    const response = await api.delete(`/history/${id}`);
    return response.data;
  },

  /**
   * 批量删除历史记录
   */
  batchDeleteHistoryRecords: async (ids: string[]) => {
    const response = await api.post('/history/batch-delete', { ids });
    return response.data;
  },

  /**
   * 批量导入历史数据
   */
  importHistoryData: async (data: any[], format?: string) => {
    try {
      console.log('=== 调用历史数据导入API ===');
      console.log('请求URL:', '/history/import');
      console.log('数据条数:', data.length);
      console.log('数据格式:', format);
      console.log('请求体样本:', JSON.stringify(data[0], null, 2));

      const response = await api.post('/history/import', { data, format });

      console.log('导入API响应:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('=== 导入API调用失败 ===');
      console.error('错误类型:', error.name);
      console.error('错误消息:', error.message);
      console.error('响应状态:', error.response?.status);
      console.error('响应数据:', error.response?.data);
      console.error('响应头:', error.response?.headers);

      // 详细的错误信息
      if (error.response?.status === 404) {
        throw new Error('后端导入接口未就绪 (404)，请检查服务器配置');
      } else if (error.response?.status === 500) {
        throw new Error(`服务器内部错误 (500): ${error.response?.data?.error || '未知错误'}`);
      } else if (error.response?.status === 400) {
        throw new Error(`请求数据格式错误 (400): ${error.response?.data?.error || '请检查数据格式'}`);
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('无法连接到服务器，请确认后端服务已启动');
      } else {
        throw new Error(`导入失败: ${error.message || '未知错误'}`);
      }
    }
  },

  /**
   * 获取数据质量报告
   */
  getDataQualityReport: async () => {
    const response = await api.get('/history/quality-report');
    return response.data;
  },
};
