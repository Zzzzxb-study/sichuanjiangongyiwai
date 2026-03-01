import axios from 'axios';
import { Project, ProjectStatus, ProjectSource, ApiResponse } from '../types/project';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:58080/api';

/**
 * 项目 API 服务
 */
export const projectApi = {
  /**
   * 获取项目详情
   */
  getProjectById: async (id: string) => {
    return axios.get<ApiResponse<Project>>(`${API_BASE_URL}/projects/${id}`);
  },

  /**
   * 根据业务流水号获取项目
   */
  getProjectByBusinessNo: async (no: string) => {
    return axios.get<ApiResponse<Project>>(`${API_BASE_URL}/projects/business-no/${no}`);
  },

  /**
   * 更新项目状态
   */
  updateStatus: async (id: string, status: ProjectStatus) => {
    return axios.put<ApiResponse>(`${API_BASE_URL}/projects/${id}/status`, { status });
  },

  /**
   * 创建新项目（手动创建）
   */
  createProject: async (projectName: string, source?: ProjectSource, sourceFileName?: string) => {
    return axios.post<ApiResponse<Project>>(`${API_BASE_URL}/projects`, {
      projectName,
      source,
      sourceFileName
    });
  }
};
