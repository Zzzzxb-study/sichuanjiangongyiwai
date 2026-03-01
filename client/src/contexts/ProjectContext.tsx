import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Project as ApiProject } from '../types/project';
import { projectApi } from '../services/projectApi';

/**
 * 项目状态
 */
export type ProjectStatus = 'draft' | 'pricing' | 'completed' | 'cancelled';

/**
 * 项目来源
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
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  notes?: string;
}

/**
 * 项目上下文类型
 */
interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  createProject: (projectName: string, source?: ProjectSource, sourceFileName?: string) => Promise<Project>;
  loadProject: (projectId: string) => Promise<Project | null>;
  loadProjectByBusinessNo: (businessNo: string) => Promise<Project | null>;
  updateProjectStatus: (projectId: string, status: ProjectStatus) => Promise<void>;
  clearCurrentProject: () => void;
}

/**
 * 项目上下文
 */
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

/**
 * 项目提供者属性
 */
interface ProjectProviderProps {
  children: ReactNode;
}

/**
 * 项目提供者组件
 */
export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);

  const setCurrentProject = useCallback((project: Project | null) => {
    setCurrentProjectState(project);
  }, []);

  const createProject = useCallback(async (
    projectName: string,
    source: ProjectSource = 'manual',
    sourceFileName?: string
  ): Promise<Project> => {
    try {
      const response = await projectApi.createProject(projectName, source, sourceFileName);
      if (response.data.success && response.data.data) {
        const project = transformApiProject(response.data.data);
        setCurrentProjectState(project);
        return project;
      }
      throw new Error(response.data.error || '创建项目失败');
    } catch (error) {
      console.error('创建项目失败:', error);
      throw error;
    }
  }, []);

  const loadProject = useCallback(async (projectId: string): Promise<Project | null> => {
    try {
      const response = await projectApi.getProjectById(projectId);
      if (response.data.success && response.data.data) {
        const project = transformApiProject(response.data.data);
        setCurrentProjectState(project);
        return project;
      }
      return null;
    } catch (error) {
      console.error('加载项目失败:', error);
      return null;
    }
  }, []);

  const loadProjectByBusinessNo = useCallback(async (businessNo: string): Promise<Project | null> => {
    try {
      const response = await projectApi.getProjectByBusinessNo(businessNo);
      if (response.data.success && response.data.data) {
        const project = transformApiProject(response.data.data);
        setCurrentProjectState(project);
        return project;
      }
      return null;
    } catch (error) {
      console.error('加载项目失败:', error);
      return null;
    }
  }, []);

  const updateProjectStatus = useCallback(async (projectId: string, status: ProjectStatus): Promise<void> => {
    try {
      await projectApi.updateStatus(projectId, status);
      if (currentProject?.project_id === projectId) {
        setCurrentProjectState({ ...currentProject, status });
      }
    } catch (error) {
      console.error('更新项目状态失败:', error);
      throw error;
    }
  }, [currentProject]);

  const clearCurrentProject = useCallback(() => {
    setCurrentProjectState(null);
  }, []);

  const value: ProjectContextType = {
    currentProject,
    setCurrentProject,
    createProject,
    loadProject,
    loadProjectByBusinessNo,
    updateProjectStatus,
    clearCurrentProject
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

/**
 * 使用项目上下文
 */
export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject 必须在 ProjectProvider 内部使用');
  }
  return context;
};

/**
 * 转换 API 项目数据为前端项目数据
 */
function transformApiProject(apiProject: ApiProject): Project {
  return {
    project_id: apiProject.project_id,
    business_no: apiProject.business_no,
    project_name: apiProject.project_name,
    status: apiProject.status as ProjectStatus,
    source: apiProject.source as ProjectSource,
    source_file_name: apiProject.source_file_name,
    created_at: new Date(apiProject.created_at),
    updated_at: new Date(apiProject.updated_at),
    created_by: apiProject.created_by,
    notes: apiProject.notes
  };
}

export default ProjectContext;
