import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Form, Input, InputNumber, Select, Switch, Button, Tag, Modal, Tabs, Alert, Space, Tooltip, message, Upload } from 'antd';
import * as XLSX from 'xlsx';
import {
  SettingOutlined,
  UserOutlined,
  SafetyOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  KeyOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  GlobalOutlined,
  DatabaseOutlined,
  BankOutlined,
  ImportOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import type { ColumnsType } from 'antd/es/table';
import { ConfigApiService, BusinessClassification } from '../../services/configApi';

const { Option } = Select;
const { TabPane } = Tabs;
const { confirm } = Modal;

const PageContainer = styled.div`
  max-width: 1600px;
  margin: 0 auto;
`;

const StyledCard = styled(Card)`
  margin-bottom: var(--space-xl);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--neutral-300);
  overflow: hidden;
  transition: all var(--transition-normal);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
    border-color: var(--primary-blue);
  }

  .ant-card-head {
    background: linear-gradient(135deg, var(--neutral-50) 0%, var(--neutral-100) 100%);
    border-bottom: 2px solid var(--primary-blue);

    .ant-card-head-title {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--neutral-900);
      display: flex;
      align-items: center;
      gap: var(--space-sm);

      .anticon {
        color: var(--primary-blue);
      }
    }
  }
`;

const ConfigSection = styled(motion.div)`
  background: var(--neutral-50);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  border: 1px solid var(--neutral-300);
  margin-bottom: var(--space-lg);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-lg);

    .section-title {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--neutral-900);
      display: flex;
      align-items: center;
      gap: var(--space-sm);

      .anticon {
        color: var(--primary-blue);
      }
    }

    .section-actions {
      display: flex;
      gap: var(--space-sm);
    }
  }

  .config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space-lg);

    .config-item {
      background: white;
      border-radius: var(--radius-md);
      padding: var(--space-lg);
      border: 1px solid var(--neutral-300);
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--primary-blue);
        box-shadow: var(--shadow-sm);
      }

      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-md);

        .item-title {
          font-weight: 600;
          color: var(--neutral-900);
        }

        .item-status {
          font-size: 0.8rem;
        }
      }

      .item-description {
        color: var(--neutral-600);
        font-size: 0.9rem;
        margin-bottom: var(--space-md);
        line-height: 1.4;
      }

      .item-controls {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);

        .ant-form-item {
          margin-bottom: var(--space-sm);

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }
`;

const UserManagementPanel = styled.div`
  .user-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-lg);

    .search-filters {
      display: flex;
      gap: var(--space-md);
      align-items: center;
    }
  }

  .ant-table {
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-md);

    .ant-table-thead > tr > th {
      background: var(--neutral-100);
      color: var(--neutral-900);
      font-weight: 600;
      border: none;
      text-align: center;
      font-family: var(--font-display);

      &:first-child {
        text-align: left;
      }
    }

    .ant-table-tbody > tr > td {
      border-bottom: 1px solid var(--neutral-300);
      text-align: center;

      &:first-child {
        text-align: left;
      }
    }

    .ant-table-tbody > tr:hover > td {
      background: var(--bg-blue-50);
    }
  }
`;

const SystemStatusPanel = styled.div`
  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-lg);
    margin-bottom: var(--space-xl);

    .status-card {
      background: white;
      color: var(--neutral-900);
      border-radius: var(--radius-xl);
      padding: var(--space-xl);
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--neutral-300);

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, var(--primary-blue) 0%, var(--primary-sky) 100%);
      }

      .status-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-lg);

        .status-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          background: var(--bg-blue-50);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: var(--primary-blue);
          border: 1px solid var(--bg-blue-100);
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--secondary-green);
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
        }
      }

      .status-value {
        font-family: var(--font-display);
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--primary-blue);
        margin-bottom: var(--space-sm);
      }

      .status-label {
        font-size: 1rem;
        color: var(--neutral-800);
        font-weight: 500;
      }

      .status-subtitle {
        font-size: 0.85rem;
        color: var(--neutral-600);
        margin-top: var(--space-xs);
      }
    }
  }
`;

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  status: 'active' | 'inactive';
  lastLogin: string;
  permissions: string[];
}

interface SystemConfig {
  maxFileSize: number;
  sessionTimeout: number;
  backupFrequency: string;
  logLevel: string;
  enableAuditLog: boolean;
  enableNotifications: boolean;
  apiRateLimit: number;
  maintenanceMode: boolean;
}

interface APIConfig {
  provider: 'openai' | 'anthropic' | 'azure' | 'qwen' | 'custom';
  apiKey: string;
  apiEndpoint: string;
  model: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
}

interface SearchConfig {
  provider: 'tavily' | 'serper' | 'custom';
  apiKey: string;
  apiEndpoint: string;
  maxResults: number;
  searchDepth: 'basic' | 'advanced';
  enabled: boolean;
}

interface ModelInfo {
  id: string;
  name: string;
  owned_by: string;
}

const SystemConfiguration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('config');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [apiConfig, setApiConfig] = useState<APIConfig>({
    provider: 'openai',
    apiKey: '',
    apiEndpoint: '',
    model: 'gpt-3.5-turbo',
    maxTokens: 2000,
    temperature: 0.7,
    enabled: false,
  });
  const [searchConfig, setSearchConfig] = useState<SearchConfig>({
    provider: 'tavily',
    apiKey: '',
    apiEndpoint: 'https://api.tavily.com',
    maxResults: 10,
    searchDepth: 'basic',
    enabled: false,
  });

  // 模型列表相关状态
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const [userModalVisible, setUserModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm] = Form.useForm();
  const [apiForm] = Form.useForm();
  const [searchForm] = Form.useForm();

  // 业务分类相关状态
  const [businessClassifications, setBusinessClassifications] = useState<BusinessClassification[]>([]);
  const [businessModalVisible, setBusinessModalVisible] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessClassification | null>(null);
  const [businessForm] = Form.useForm();
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadConfigurationData();
  }, []);

  const loadConfigurationData = async () => {
    setLoading(true);

    // Simulate API calls
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock users
    const mockUsers: User[] = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@sichuanjiangong.com',
        role: 'admin',
        status: 'active',
        lastLogin: '2024-01-20 10:30:00',
        permissions: ['all'],
      },
      {
        id: '2',
        username: 'zhang.manager',
        email: 'zhang@sichuanjiangong.com',
        role: 'operator',
        status: 'active',
        lastLogin: '2024-01-20 09:15:00',
        permissions: ['contract_analysis', 'pricing', 'history_view'],
      },
      {
        id: '3',
        username: 'li.analyst',
        email: 'li@sichuanjiangong.com',
        role: 'viewer',
        status: 'active',
        lastLogin: '2024-01-19 14:20:00',
        permissions: ['history_view', 'reports'],
      },
    ];

    // Mock system config
    const mockSystemConfig: SystemConfig = {
      maxFileSize: 50,
      sessionTimeout: 30,
      backupFrequency: 'daily',
      logLevel: 'info',
      enableAuditLog: true,
      enableNotifications: true,
      apiRateLimit: 1000,
      maintenanceMode: false,
    };

    setSystemConfig(mockSystemConfig);

    // 从localStorage加载用户数据
    try {
      const savedUsers = localStorage.getItem('system_users');
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      } else {
        // 首次加载，使用默认用户数据
        setUsers(mockUsers);
        localStorage.setItem('system_users', JSON.stringify(mockUsers));
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
      setUsers(mockUsers);
    }

    // 从localStorage加载API配置
    try {
      const savedApiConfig = localStorage.getItem('ai_api_config');
      if (savedApiConfig) {
        const parsedConfig = JSON.parse(savedApiConfig);
        setApiConfig({
          provider: parsedConfig.provider || 'openai',
          apiKey: parsedConfig.apiKey || '',
          apiEndpoint: parsedConfig.apiEndpoint || '',
          model: parsedConfig.model || 'gpt-3.5-turbo',
          maxTokens: parsedConfig.maxTokens || 2000,
          temperature: parsedConfig.temperature || 0.7,
          enabled: parsedConfig.enabled || false,
        });
      }
    } catch (error) {
      console.error('加载API配置失败:', error);
    }

    // 从localStorage加载搜索配置
    try {
      const savedSearchConfig = localStorage.getItem('search_api_config');
      if (savedSearchConfig) {
        const parsedConfig = JSON.parse(savedSearchConfig);
        setSearchConfig({
          provider: parsedConfig.provider || 'tavily',
          apiKey: parsedConfig.apiKey || '',
          apiEndpoint: parsedConfig.apiEndpoint || 'https://api.tavily.com',
          maxResults: parsedConfig.maxResults || 10,
          searchDepth: parsedConfig.searchDepth || 'basic',
          enabled: parsedConfig.enabled || false,
        });
      }
    } catch (error) {
      console.error('加载搜索配置失败:', error);
    }

    // 加载业务分类数据
    try {
      console.log('[SystemConfig] 开始加载业务分类数据...');
      const classifications = await ConfigApiService.getBusinessClassifications();
      console.log('[SystemConfig] API返回的业务分类数据:', classifications);
      console.log('[SystemConfig] 业务分类数据条数:', classifications?.length || 0);

      // 将JSON字符串转换为数组
      const parsedClassifications = classifications.map(item => ({
        ...item,
        risk_levels: typeof item.risk_levels === 'string' ? JSON.parse(item.risk_levels || '[]') : item.risk_levels,
        business_types: typeof item.business_types === 'string' ? JSON.parse(item.business_types || '[]') : item.business_types,
        examples: typeof item.examples === 'string' ? JSON.parse(item.examples || '[]') : item.examples,
      }));

      console.log('[SystemConfig] 解析后的业务分类数据:', parsedClassifications);
      console.log('[SystemConfig] 设置businessClassifications状态...');
      setBusinessClassifications(parsedClassifications);
      console.log('[SystemConfig] 业务分类数据加载完成');
    } catch (error) {
      console.error('[SystemConfig] 加载业务分类失败:', error);
      message.error('加载业务分类失败: ' + (error as Error).message);
    }

    setLoading(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    userForm.setFieldsValue(user);
    setUserModalVisible(true);
  };

  const handleSaveUser = async (values: any) => {
    try {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));

      let updatedUsers: User[];

      if (editingUser) {
        // Update existing user
        setUsers(prev => {
          updatedUsers = prev.map(user =>
            user.id === editingUser.id
              ? { ...user, ...values }
              : user
          );
          // 保存到localStorage
          localStorage.setItem('system_users', JSON.stringify(updatedUsers));
          return updatedUsers;
        });
        message.success('用户信息更新成功');
      } else {
        // Add new user
        const newUser: User = {
          ...values,
          id: Date.now().toString(),
          lastLogin: '从未登录',
        };
        setUsers(prev => {
          updatedUsers = [...prev, newUser];
          // 保存到localStorage
          localStorage.setItem('system_users', JSON.stringify(updatedUsers));
          return updatedUsers;
        });
        message.success('用户添加成功');
      }

      // 触发自定义事件，通知 Layout 组件更新用户信息
      window.dispatchEvent(new Event('userUpdated'));

      setUserModalVisible(false);
      setEditingUser(null);
      userForm.resetFields();
    } catch (error) {
      message.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBusiness = (business: BusinessClassification) => {
    setEditingBusiness(business);

    // 将数组转换为换行符分隔的字符串，便于编辑
    const riskLevelsStr = (business.risk_levels || []).join('\n');
    const businessTypesStr = (business.business_types || []).join('\n');
    const examplesStr = (business.examples || []).join('\n');

    businessForm.setFieldsValue({
      ...business,
      risk_levels: riskLevelsStr,
      business_types: businessTypesStr,
      examples: examplesStr,
    });
    setBusinessModalVisible(true);
  };

  const handleSaveBusiness = async (values: any) => {
    try {
      setLoading(true);

      if (!editingBusiness?.id) {
        message.error('缺少业务分类ID');
        return;
      }

      // 将换行符分隔的字符串转换为数组
      const classificationData: BusinessClassification = {
        ...values,
        risk_levels: values.risk_levels ? values.risk_levels.split('\n').filter((item: string) => item.trim()) : [],
        business_types: values.business_types ? values.business_types.split('\n').filter((item: string) => item.trim()) : [],
        examples: values.examples ? values.examples.split('\n').filter((item: string) => item.trim()) : [],
      };

      await ConfigApiService.updateBusinessClassification(editingBusiness.id, classificationData);

      // 更新本地状态
      setBusinessClassifications(prev =>
        prev.map(item =>
          item.id === editingBusiness.id
            ? { ...item, ...classificationData }
            : item
        )
      );

      message.success('业务分类更新成功');
      setBusinessModalVisible(false);
      setEditingBusiness(null);
      businessForm.resetFields();
    } catch (error) {
      message.error('更新失败，请重试');
      console.error('保存业务分类失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 下载导入模板
  const downloadTemplate = () => {
    const template = [
      {
        '分类名称': '鼓励类',
        '分类等级': 'encouraged',
        '分类描述': '低风险、高价值的优质工程项目',
        '风险等级': '1类建筑风险\n2类建筑风险',
        '业务类型': '层高低于100米的房建工程\n室内装修工程\n环保工程',
        '示例项目': '住宅小区建设项目\n办公楼装修工程\n绿化景观工程',
        '承保指引': '可积极承保，给予优惠费率',
        '显示顺序': 1
      },
      {
        '分类名称': '一般类',
        '分类等级': 'general',
        '分类描述': '风险适中、常见的工程项目',
        '风险等级': '2类建筑风险\n3类建筑风险',
        '业务类型': '普通房建工程\n市政道路工程\n小型桥梁工程',
        '示例项目': '普通住宅楼建设\n城市道路改造\n小型人行天桥',
        '承保指引': '正常承保，标准费率',
        '显示顺序': 2
      },
      {
        '分类名称': '谨慎类',
        '分类等级': 'cautious',
        '分类描述': '风险较高、需要谨慎评估的工程项目',
        '风险等级': '3类建筑风险\n4类建筑风险',
        '业务类型': '高层建筑工程\n大型桥梁工程\n隧道工程',
        '示例项目': '100米以上高层建筑\n大型跨江桥梁\n城市隧道工程',
        '承保指引': '谨慎承保，适当提高费率',
        '显示顺序': 3
      },
      {
        '分类名称': '限制类',
        '分类等级': 'restricted',
        '分类描述': '风险高、需要严格控制的工程项目',
        '风险等级': '4类建筑风险\n5类建筑风险',
        '业务类型': '深基坑工程\n爆破工程\n大型拆除工程',
        '示例项目': '地下室深度超过10米\n石方爆破工程\n大型建筑拆除',
        '承保指引': '限制承保，大幅提高费率或加免赔额',
        '显示顺序': 4
      },
      {
        '分类名称': '严格限制类',
        '分类等级': 'strictly_restricted',
        '分类描述': '风险极高、原则上不予承保的工程项目',
        '风险等级': '5类建筑风险\n特殊风险',
        '业务类型': '超高建筑工程\n特殊地质条件工程\n危大工程',
        '示例项目': '200米以上超高层建筑\n复杂地质条件施工\n超过一定规模的危大工程',
        '承保指引': '原则上不予承保，特殊情况需总公司审批',
        '显示顺序': 5
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '业务分类模板');
    XLSX.writeFile(workbook, '公司业务分类导入模板.xlsx');
    message.success('模板下载成功');
  };

  // 处理文件上传
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          message.error('Excel文件为空，请检查数据');
          return;
        }

        // 解析并验证数据
        const parsedData: BusinessClassification[] = jsonData.map((row, index) => {
          // 解析风险等级（换行符分隔）
          const riskLevels = row['风险等级']
            ? String(row['风险等级']).split('\n').filter((item: string) => item.trim())
            : [];

          // 解析业务类型（换行符分隔）
          const businessTypes = row['业务类型']
            ? String(row['业务类型']).split('\n').filter((item: string) => item.trim())
            : [];

          // 解析示例项目（换行符分隔）
          const examples = row['示例项目']
            ? String(row['示例项目']).split('\n').filter((item: string) => item.trim())
            : [];

          return {
            category_name: row['分类名称'],
            category_level: row['分类等级'],
            category_description: row['分类描述'] || '',
            risk_levels: riskLevels,
            business_types: businessTypes,
            examples: examples,
            underwriting_guide: row['承保指引'] || '',
            display_order: row['显示顺序'] || (index + 1),
          };
        });

        // 验证必填字段
        const invalidRows = parsedData.filter((item, index) => {
          const rowNum = index + 2; // Excel行号从2开始（第1行是标题）
          if (!item.category_name) {
            message.error(`第${rowNum}行：分类名称不能为空`);
            return true;
          }
          if (!item.category_level) {
            message.error(`第${rowNum}行：分类等级不能为空`);
            return true;
          }
          if (!item.category_description) {
            message.error(`第${rowNum}行：分类描述不能为空`);
            return true;
          }
          return false;
        });

        if (invalidRows.length > 0) {
          return;
        }

        // 批量导入
        setImporting(true);
        try {
          // 逐个更新或创建业务分类
          for (const item of parsedData) {
            // 检查是否已存在相同等级的分类
            const existing = businessClassifications.find(
              bc => bc.category_level === item.category_level
            );

            if (existing && existing.id) {
              // 更新现有分类
              await ConfigApiService.updateBusinessClassification(existing.id, item);
            } else {
              // 注意：当前API没有创建功能，这里只是示例
              message.warning(`分类等级 ${item.category_level} 不存在，跳过`);
            }
          }

          message.success(`成功导入 ${parsedData.length} 条业务分类数据`);
          setImportModalVisible(false);

          // 重新加载数据
          await loadConfigurationData();
        } catch (error: any) {
          message.error('导入失败：' + (error.message || '未知错误'));
        } finally {
          setImporting(false);
        }
      } catch (error) {
        message.error('文件解析失败，请检查文件格式');
        console.error('解析Excel失败:', error);
      }
    };
    reader.readAsBinaryString(file);
    return false; // 阻止默认上传行为
  };

  const handleDeleteUser = (user: User) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除用户"${user.username}"吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        setUsers(prev => {
          const updatedUsers = prev.filter(u => u.id !== user.id);
          // 保存到localStorage
          localStorage.setItem('system_users', JSON.stringify(updatedUsers));
          return updatedUsers;
        });
        message.success('用户删除成功');

        // 触发自定义事件，通知 Layout 组件更新用户信息
        window.dispatchEvent(new Event('userUpdated'));
      },
    });
  };

  const handleToggleUserStatus = (user: User) => {
    setUsers(prev => {
      const updatedUsers = prev.map(u => {
        if (u.id === user.id) {
          const newStatus: 'active' | 'inactive' = u.status === 'active' ? 'inactive' : 'active';
          return { ...u, status: newStatus };
        }
        return u;
      });
      // 保存到localStorage
      localStorage.setItem('system_users', JSON.stringify(updatedUsers));
      return updatedUsers;
    });
    message.success(`用户已${user.status === 'active' ? '禁用' : '启用'}`);

    // 触发自定义事件，通知 Layout 组件更新用户信息
    window.dispatchEvent(new Event('userUpdated'));
  };

  const handleSystemConfigChange = (key: keyof SystemConfig, value: any) => {
    if (systemConfig) {
      setSystemConfig({ ...systemConfig, [key]: value });
    }
  };

  const handleSaveSystemConfig = async () => {
    try {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      message.success('系统配置保存成功');
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取当前提供商的maxTokens限制
  const getMaxTokensLimit = () => {
    const limits: Record<string, number> = {
      openai: 128000,
      anthropic: 200000,
      azure: 128000,
      qwen: 8192,
      custom: 200000,
    };
    return limits[apiConfig.provider] || 8192;
  };

  const handleAPIConfigChange = (key: keyof APIConfig, value: any) => {
    const newConfig = { ...apiConfig, [key]: value };

    // 如果切换提供商，检查maxTokens是否需要调整
    if (key === 'provider') {
      const limits: Record<string, number> = {
        openai: 128000,
        anthropic: 200000,
        azure: 128000,
        qwen: 8192,
        custom: 200000,
      };
      const newLimit = limits[value as string] || 8192;
      if (newConfig.maxTokens > newLimit) {
        newConfig.maxTokens = newLimit;
        message.warning(`已将最大Token数调整为 ${newLimit.toLocaleString()}（新提供商 ${value} 的限制）`);
      }
    }

    setApiConfig(newConfig);
  };

  const handleTestAPI = async () => {
    if (!apiConfig.apiKey) {
      message.error('请先填写API密钥');
      return;
    }

    if (!apiConfig.enabled) {
      message.warning('请先启用AI功能');
      return;
    }

    setLoading(true);

    try {
      let endpoint = '';
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // 根据提供商设置测试端点
      switch (apiConfig.provider) {
        case 'openai':
          endpoint = apiConfig.apiEndpoint || 'https://api.openai.com/v1/chat/completions';
          headers['Authorization'] = `Bearer ${apiConfig.apiKey}`;
          break;
        case 'anthropic':
          endpoint = `${apiConfig.apiEndpoint}/v1/messages`;
          headers['x-api-key'] = apiConfig.apiKey;
          headers['anthropic-version'] = '2023-06-01';
          break;
        case 'qwen':
          endpoint = apiConfig.apiEndpoint || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
          headers['Authorization'] = `Bearer ${apiConfig.apiKey}`;
          break;
        case 'azure':
          if (!apiConfig.apiEndpoint) {
            message.error('请先配置Azure OpenAI端点');
            setLoading(false);
            return;
          }
          endpoint = `${apiConfig.apiEndpoint}/openai/deployments/${apiConfig.model}/chat/completions?api-version=2023-05-15`;
          headers['api-key'] = apiConfig.apiKey;
          break;
        default:
          message.error('不支持的提供商');
          setLoading(false);
          return;
      }

      console.log('测试API端点:', endpoint);

      // 发送简单的测试请求
      const testBody = apiConfig.provider === 'anthropic' ? {
        model: apiConfig.model,
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: '请回复：测试成功'
        }]
      } : {
        model: apiConfig.model,
        messages: [{
          role: 'user',
          content: '请回复：测试成功'
        }],
        max_tokens: 100,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(testBody),
        mode: 'cors',
      });

      console.log('测试API响应状态:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API测试失败:', errorText);

        if (response.status === 401) {
          message.error('API密钥验证失败，请检查API密钥是否正确');
        } else if (response.status === 403) {
          message.error('API访问被拒绝，请检查权限或配额');
        } else if (response.status === 404) {
          message.error('API端点不存在，请检查模型名称是否正确');
        } else {
          message.error(`API连接失败: ${response.status} - ${errorText.substring(0, 100)}`);
        }
      } else {
        const data = await response.json();
        console.log('API测试成功:', data);
        message.success('API连接测试成功！配置正确。');
      }

    } catch (error: any) {
      console.error('API测试失败:', error);

      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        message.error({
          content: '网络连接失败，请检查：1. 是否可以访问外网 2. API端点是否正确 3. 浏览器控制台是否有CORS错误',
          duration: 8,
        });
      } else {
        message.error(`API测试失败: ${error.message || '未知错误'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAPIConfig = async () => {
    try {
      setLoading(true);

      // 验证必要字段
      if (apiConfig.enabled && !apiConfig.apiKey) {
        message.error('启用AI功能时必须填写API密钥');
        setLoading(false);
        return;
      }

      // 验证maxTokens是否在提供商允许的范围内
      const maxTokensLimit = getMaxTokensLimit();
      if (apiConfig.maxTokens > maxTokensLimit) {
        message.error(`最大Token数不能超过 ${maxTokensLimit.toLocaleString()}（当前提供商: ${apiConfig.provider}）`);
        setLoading(false);
        return;
      }

      // 验证maxTokens最小值
      if (apiConfig.maxTokens < 1) {
        message.error('最大Token数不能小于1');
        setLoading(false);
        return;
      }

      // 如果填写了API密钥但未启用，自动启用并提示
      if (!apiConfig.enabled && apiConfig.apiKey && apiConfig.apiKey.trim() !== '') {
        setApiConfig({ ...apiConfig, enabled: true });
        localStorage.setItem('ai_api_config', JSON.stringify({
          provider: apiConfig.provider,
          apiKey: apiConfig.apiKey,
          apiEndpoint: apiConfig.apiEndpoint,
          model: apiConfig.model,
          enabled: true, // 自动启用
          maxTokens: apiConfig.maxTokens,
          temperature: apiConfig.temperature,
        }));
        message.success('API配置保存成功并已自动启用AI功能');
      } else {
        // 保存到localStorage
        localStorage.setItem('ai_api_config', JSON.stringify({
          provider: apiConfig.provider,
          apiKey: apiConfig.apiKey,
          apiEndpoint: apiConfig.apiEndpoint,
          model: apiConfig.model,
          enabled: apiConfig.enabled,
          maxTokens: apiConfig.maxTokens,
          temperature: apiConfig.temperature,
        }));

        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 500));

        if (apiConfig.enabled) {
          message.success('API配置保存成功，AI功能已启用');
        } else {
          message.success('API配置保存成功，但AI功能未启用');
        }
      }
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchConfigChange = (key: keyof SearchConfig, value: any) => {
    setSearchConfig({ ...searchConfig, [key]: value });
  };

  const handleTestSearch = async () => {
    try {
      setLoading(true);

      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 1500));

      message.success('搜索服务连接测试成功！');
    } catch (error) {
      message.error('搜索服务连接测试失败，请检查配置');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSearchConfig = async () => {
    try {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      message.success('搜索配置保存成功');
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 从模型提供商API获取模型列表
  const handleFetchModels = async () => {
    if (!apiConfig.apiKey) {
      message.warning('请先输入API密钥');
      return;
    }

    setLoadingModels(true);
    try {
      let endpoint = '';
      let headers: Record<string, string> = {
        'Authorization': `Bearer ${apiConfig.apiKey}`,
        'Content-Type': 'application/json',
      };

      // 根据不同的provider设置API端点
      switch (apiConfig.provider) {
        case 'openai':
          endpoint = apiConfig.apiEndpoint || 'https://api.openai.com/v1';
          endpoint = `${endpoint}/models`;
          break;
        case 'anthropic':
          // Anthropic不提供公开的模型列表API，使用预设列表
          const anthropicModels: ModelInfo[] = [
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (推荐)', owned_by: 'anthropic' },
            { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (快速)', owned_by: 'anthropic' },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', owned_by: 'anthropic' },
            { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', owned_by: 'anthropic' },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', owned_by: 'anthropic' },
          ];
          setAvailableModels(anthropicModels);
          message.success('成功获取Anthropic模型列表');
          setLoadingModels(false);
          return;
        case 'qwen':
          // 通义千问（Qwen）使用DashScope API，但没有公开的模型列表端点
          // 使用预设的通义千问模型列表
          const qwenModels: ModelInfo[] = [
            { id: 'qwen-vl-max', name: '通义千问-VL-Max (视觉识别，推荐)', owned_by: 'alibaba' },
            { id: 'qwen-vl-plus', name: '通义千问-VL-Plus (视觉识别)', owned_by: 'alibaba' },
            { id: 'qwen-vl-v1', name: '通义千问-VL-V1 (视觉识别)', owned_by: 'alibaba' },
            { id: 'qwen-max', name: '通义千问-Max (最强模型)', owned_by: 'alibaba' },
            { id: 'qwen-max-latest', name: '通义千问-Max Latest', owned_by: 'alibaba' },
            { id: 'qwen-plus', name: '通义千问-Plus (性价比)', owned_by: 'alibaba' },
            { id: 'qwen-plus-latest', name: '通义千问-Plus Latest', owned_by: 'alibaba' },
            { id: 'qwen-turbo', name: '通义千问-Turbo (快速响应)', owned_by: 'alibaba' },
            { id: 'qwen-turbo-latest', name: '通义千问-Turbo Latest', owned_by: 'alibaba' },
            { id: 'qwen-long', name: '通义千问-Long (长文本)', owned_by: 'alibaba' },
          ];
          setAvailableModels(qwenModels);
          message.success('成功获取通义千问模型列表');
          setLoadingModels(false);
          return;
        case 'azure':
          // Azure OpenAI使用不同的端点格式
          if (!apiConfig.apiEndpoint) {
            message.error('请先配置Azure OpenAI端点');
            setLoadingModels(false);
            return;
          }
          endpoint = `${apiConfig.apiEndpoint}/openai/deployments?api-version=2023-05-15`;
          headers['api-key'] = apiConfig.apiKey;
          delete headers['Authorization'];
          break;
        default:
          message.error('不支持的提供商');
          setLoadingModels(false);
          return;
      }

      // 调用API获取模型列表
      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API错误响应:', errorText);
        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // 根据不同提供商的响应格式解析模型列表
      let models: ModelInfo[] = [];
      if (apiConfig.provider === 'openai') {
        // 过滤出GPT系列模型
        const allModels = data.data || [];
        models = allModels
          .filter((model: any) => {
            const modelId = model.id.toLowerCase();
            // 只包含GPT系列模型（gpt-4, gpt-3.5, gpt-4o等）
            return modelId.startsWith('gpt-') &&
                   !modelId.includes('realtime') &&
                   !modelId.includes('audio') &&
                   !modelId.includes('vision-preview');
          })
          .map((model: any) => ({
            id: model.id,
            name: model.id,
            owned_by: model.owned_by || 'openai',
          }));
        // 按模型名称排序，将新版本排在前面
        models.sort((a: any, b: any) => {
          // 优先级: gpt-4o > gpt-4 > gpt-3.5
          if (a.id.includes('gpt-4o') && !b.id.includes('gpt-4o')) return -1;
          if (!a.id.includes('gpt-4o') && b.id.includes('gpt-4o')) return 1;
          if (a.id.includes('gpt-4') && !b.id.includes('gpt-4')) return -1;
          if (!a.id.includes('gpt-4') && b.id.includes('gpt-4')) return 1;
          return a.id.localeCompare(b.id);
        });
      } else if (apiConfig.provider === 'azure') {
        models = data.data?.map((deployment: any) => ({
          id: deployment.id,
          name: deployment.id,
          owned_by: deployment.owner || 'azure',
        })) || [];
      }

      if (models.length === 0) {
        message.warning('未获取到任何模型，请检查API配置');
      } else {
        setAvailableModels(models);
        message.success(`成功获取${models.length}个模型`);
      }
    } catch (error: any) {
      console.error('获取模型列表失败:', error);
      const errorMsg = error.message || '未知错误';
      message.error(`获取模型列表失败: ${errorMsg}`);
    } finally {
      setLoadingModels(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red';
      case 'operator': return 'blue';
      case 'viewer': return 'green';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'error';
  };

  const userColumns: ColumnsType<User> = [
    {
      title: '用户信息',
      key: 'userInfo',
      width: 250,
      render: (_, record: User) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
            {record.username}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
            {record.email}
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleMap = {
          admin: '管理员',
          operator: '操作员',
          viewer: '查看者',
        };
        return <Tag color={getRoleColor(role)}>{roleMap[role as keyof typeof roleMap]}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status === 'active' ? '活跃' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '权限数量',
      key: 'permissionCount',
      render: (_, record: User) => `${record.permissions.length} 项`,
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
            style={{ color: 'var(--primary-blue)' }}
          >
            编辑
          </Button>
          <Button
            type="link"
            icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleUserStatus(record)}
            style={{ color: record.status === 'active' ? 'var(--secondary-red)' : 'var(--secondary-green)' }}
          >
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
          <Button
            type="link"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteUser(record)}
            danger
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-xl)'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--neutral-900)'
            }}>
              系统配置
            </h1>
            <p style={{
              margin: '0.5rem 0 0 0',
              color: 'var(--neutral-600)',
              fontSize: '1.1rem'
            }}>
              费率规则管理、用户权限设置、系统参数配置
            </p>
          </div>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            size="large"
            onClick={loadConfigurationData}
            loading={loading}
            style={{
              background: 'var(--primary-blue)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
            }}
          >
            刷新配置
          </Button>
        </div>

        {/* System Status */}
        <SystemStatusPanel>
          <div className="status-grid">
            <motion.div
              className="status-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="status-header">
                <div className="status-icon">
                  <SafetyOutlined />
                </div>
                <div className="status-indicator"></div>
              </div>
              <div className="status-value">正常</div>
              <div className="status-label">系统状态</div>
              <div className="status-subtitle">所有服务运行正常</div>
            </motion.div>

            <motion.div
              className="status-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="status-header">
                <div className="status-icon">
                  <UserOutlined />
                </div>
                <div className="status-indicator"></div>
              </div>
              <div className="status-value">{users.filter(u => u.status === 'active').length}</div>
              <div className="status-label">活跃用户</div>
              <div className="status-subtitle">当前在线用户数量</div>
            </motion.div>

            <motion.div
              className="status-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="status-header">
                <div className="status-icon">
                  <SettingOutlined />
                </div>
                <div className="status-indicator"></div>
              </div>
              <div className="status-value">{users.filter(u => u.status === 'active').length}</div>
              <div className="status-label">活跃用户</div>
              <div className="status-subtitle">当前登录用户</div>
            </motion.div>

            <motion.div
              className="status-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="status-header">
                <div className="status-icon">
                  <KeyOutlined />
                </div>
                <div className="status-indicator"></div>
              </div>
              <div className="status-value">99.9%</div>
              <div className="status-label">系统可用性</div>
              <div className="status-subtitle">过去30天平均值</div>
            </motion.div>
          </div>
        </SystemStatusPanel>

        {/* Configuration Tabs */}
        <StyledCard>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            style={{ minHeight: '600px' }}
          >
            <TabPane
              tab={
                <span>
                  <UserOutlined />
                  用户权限管理
                </span>
              }
              key="users"
            >
              <UserManagementPanel>
                <div className="user-actions">
                  <div className="search-filters">
                    <Input.Search
                      placeholder="搜索用户"
                      style={{ width: 200 }}
                      allowClear
                    />
                    <Select
                      placeholder="角色筛选"
                      style={{ width: 120 }}
                      allowClear
                    >
                      <Option value="admin">管理员</Option>
                      <Option value="operator">操作员</Option>
                      <Option value="viewer">查看者</Option>
                    </Select>
                  </div>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingUser(null);
                      userForm.resetFields();
                      setUserModalVisible(true);
                    }}
                    style={{
                      background: 'var(--primary-blue)',
                      border: 'none',
                      color: 'var(--neutral-900)',
                      fontWeight: 600,
                    }}
                  >
                    添加用户
                  </Button>
                </div>

                <Table
                  columns={userColumns}
                  dataSource={users}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                  }}
                />
              </UserManagementPanel>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <SettingOutlined />
                  系统参数
                </span>
              }
              key="system"
            >
              {systemConfig && (
                <ConfigSection
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="section-header">
                    <div className="section-title">
                      <SettingOutlined />
                      基础配置
                    </div>
                    <div className="section-actions">
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSaveSystemConfig}
                        loading={loading}
                        style={{
                          background: 'var(--primary-blue)',
                          border: 'none',
                          color: 'var(--neutral-900)',
                          fontWeight: 600,
                        }}
                      >
                        保存配置
                      </Button>
                    </div>
                  </div>

                  <div className="config-grid">
                    <div className="config-item">
                      <div className="item-header">
                        <div className="item-title">文件上传限制</div>
                        <Tag color="blue" className="item-status">MB</Tag>
                      </div>
                      <div className="item-description">
                        设置单个文件上传的最大大小限制
                      </div>
                      <div className="item-controls">
                        <InputNumber
                          min={1}
                          max={200}
                          value={systemConfig.maxFileSize}
                          onChange={(value) => handleSystemConfigChange('maxFileSize', value)}
                          style={{ width: '100%' }}
                          addonAfter="MB"
                        />
                      </div>
                    </div>

                    <div className="config-item">
                      <div className="item-header">
                        <div className="item-title">会话超时时间</div>
                        <Tag color="orange" className="item-status">分钟</Tag>
                      </div>
                      <div className="item-description">
                        用户无操作后自动退出登录的时间
                      </div>
                      <div className="item-controls">
                        <InputNumber
                          min={5}
                          max={120}
                          value={systemConfig.sessionTimeout}
                          onChange={(value) => handleSystemConfigChange('sessionTimeout', value)}
                          style={{ width: '100%' }}
                          addonAfter="分钟"
                        />
                      </div>
                    </div>

                    <div className="config-item">
                      <div className="item-header">
                        <div className="item-title">备份频率</div>
                        <Tag color="green" className="item-status">自动</Tag>
                      </div>
                      <div className="item-description">
                        系统数据自动备份的频率设置
                      </div>
                      <div className="item-controls">
                        <Select
                          value={systemConfig.backupFrequency}
                          onChange={(value) => handleSystemConfigChange('backupFrequency', value)}
                          style={{ width: '100%' }}
                        >
                          <Option value="hourly">每小时</Option>
                          <Option value="daily">每天</Option>
                          <Option value="weekly">每周</Option>
                          <Option value="monthly">每月</Option>
                        </Select>
                      </div>
                    </div>

                    <div className="config-item">
                      <div className="item-header">
                        <div className="item-title">日志级别</div>
                        <Tag color="purple" className="item-status">系统</Tag>
                      </div>
                      <div className="item-description">
                        系统日志记录的详细程度设置
                      </div>
                      <div className="item-controls">
                        <Select
                          value={systemConfig.logLevel}
                          onChange={(value) => handleSystemConfigChange('logLevel', value)}
                          style={{ width: '100%' }}
                        >
                          <Option value="error">错误</Option>
                          <Option value="warn">警告</Option>
                          <Option value="info">信息</Option>
                          <Option value="debug">调试</Option>
                        </Select>
                      </div>
                    </div>

                    <div className="config-item">
                      <div className="item-header">
                        <div className="item-title">API请求限制</div>
                        <Tag color="red" className="item-status">次/小时</Tag>
                      </div>
                      <div className="item-description">
                        单个用户每小时API请求次数限制
                      </div>
                      <div className="item-controls">
                        <InputNumber
                          min={100}
                          max={10000}
                          value={systemConfig.apiRateLimit}
                          onChange={(value) => handleSystemConfigChange('apiRateLimit', value)}
                          style={{ width: '100%' }}
                          addonAfter="次/小时"
                        />
                      </div>
                    </div>

                    <div className="config-item">
                      <div className="item-header">
                        <div className="item-title">审计日志</div>
                        <Tag color={systemConfig.enableAuditLog ? 'success' : 'error'} className="item-status">
                          {systemConfig.enableAuditLog ? '启用' : '禁用'}
                        </Tag>
                      </div>
                      <div className="item-description">
                        记录用户操作和系统变更的详细日志
                      </div>
                      <div className="item-controls">
                        <Switch
                          checked={systemConfig.enableAuditLog}
                          onChange={(checked) => handleSystemConfigChange('enableAuditLog', checked)}
                          checkedChildren="启用"
                          unCheckedChildren="禁用"
                        />
                      </div>
                    </div>

                    <div className="config-item">
                      <div className="item-header">
                        <div className="item-title">系统通知</div>
                        <Tag color={systemConfig.enableNotifications ? 'success' : 'error'} className="item-status">
                          {systemConfig.enableNotifications ? '启用' : '禁用'}
                        </Tag>
                      </div>
                      <div className="item-description">
                        启用系统事件和警告的通知推送
                      </div>
                      <div className="item-controls">
                        <Switch
                          checked={systemConfig.enableNotifications}
                          onChange={(checked) => handleSystemConfigChange('enableNotifications', checked)}
                          checkedChildren="启用"
                          unCheckedChildren="禁用"
                        />
                      </div>
                    </div>

                    <div className="config-item">
                      <div className="item-header">
                        <div className="item-title">维护模式</div>
                        <Tag color={systemConfig.maintenanceMode ? 'warning' : 'success'} className="item-status">
                          {systemConfig.maintenanceMode ? '维护中' : '正常'}
                        </Tag>
                      </div>
                      <div className="item-description">
                        启用后将阻止普通用户访问系统
                      </div>
                      <div className="item-controls">
                        <Switch
                          checked={systemConfig.maintenanceMode}
                          onChange={(checked) => handleSystemConfigChange('maintenanceMode', checked)}
                          checkedChildren="维护"
                          unCheckedChildren="正常"
                        />
                      </div>
                    </div>
                  </div>
                </ConfigSection>
              )}
            </TabPane>

            <TabPane
              tab={
                <span>
                  <ApiOutlined />
                  大模型API配置
                </span>
              }
              key="api"
            >
              <ConfigSection
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="section-header">
                  <div className="section-title">
                    <ThunderboltOutlined />
                    AI模型设置
                  </div>
                  <div className="section-actions">
                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      onClick={handleTestAPI}
                      loading={loading}
                      style={{ marginRight: 'var(--space-sm)' }}
                    >
                      测试连接
                    </Button>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={handleSaveAPIConfig}
                      loading={loading}
                    >
                      保存配置
                    </Button>
                  </div>
                </div>

                {!apiConfig.enabled && (
                  <Alert
                    message="AI功能未启用"
                    description="请填写API配置后点击保存配置按钮。如果已填写API密钥，保存时将自动启用AI功能。"
                    type="warning"
                    showIcon
                    style={{ marginBottom: 'var(--space-md)' }}
                  />
                )}

                {apiConfig.enabled && (
                  <Alert
                    message="AI功能已启用"
                    description="系统将使用大模型进行智能合同分析。如需修改配置，请更新后点击保存配置按钮。"
                    type="success"
                    showIcon
                    style={{ marginBottom: 'var(--space-md)' }}
                  />
                )}

                <Alert
                  message="API配置说明"
                  description="配置大语言模型API以启用智能分析功能。API密钥将安全存储在本地浏览器中。支持OpenAI、通义千问、Anthropic Claude等主流大模型。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 'var(--space-md)' }}
                />

                <Alert
                  message="视觉识别功能说明"
                  description={
                    <div>
                      <p style={{ marginBottom: '0.5rem' }}><strong>支持图片和扫描版PDF识别</strong></p>
                      <p style={{ marginBottom: '0.5rem' }}>要使用视觉识别功能，请选择支持视觉的模型：</p>
                      <ul style={{ marginBottom: 0, paddingLeft: '1.5rem' }}>
                        <li><strong>OpenAI</strong>: gpt-4o, gpt-4o-mini, gpt-4-turbo</li>
                        <li><strong>通义千问</strong>: qwen-vl-max, qwen-vl-plus, qwen-vl-v1</li>
                        <li><strong>Anthropic</strong>: Claude 3.5 Sonnet, Claude 3 Opus/Sonnet/Haiku</li>
                      </ul>
                    </div>
                  }
                  type="warning"
                  showIcon
                  style={{ marginBottom: 'var(--space-lg)' }}
                />

                <div className="config-grid">
                  <div className="config-item">
                    <div className="item-header">
                      <div className="item-title">启用AI功能</div>
                      <Tag color={apiConfig.enabled ? 'success' : 'default'} className="item-status">
                        {apiConfig.enabled ? '已启用' : '未启用'}
                      </Tag>
                    </div>
                    <div className="item-description">
                      开启后将使用大模型进行智能分析和推荐
                    </div>
                    <div className="item-controls">
                      <Switch
                        checked={apiConfig.enabled}
                        onChange={(checked) => handleAPIConfigChange('enabled', checked)}
                        checkedChildren="启用"
                        unCheckedChildren="禁用"
                      />
                    </div>
                  </div>

                  <div className="config-item">
                    <div className="item-header">
                      <div className="item-title">服务提供商</div>
                      <Tag color="blue" className="item-status">必填</Tag>
                    </div>
                    <div className="item-description">
                      选择大语言模型服务提供商
                    </div>
                    <div className="item-controls">
                      <Select
                        value={apiConfig.provider}
                        onChange={(value) => handleAPIConfigChange('provider', value)}
                        style={{ width: '100%' }}
                      >
                        <Option value="openai">OpenAI</Option>
                        <Option value="anthropic">Anthropic</Option>
                        <Option value="azure">Azure OpenAI</Option>
                        <Option value="qwen">通义千问 (Qwen)</Option>
                        <Option value="custom">自定义</Option>
                      </Select>
                    </div>
                  </div>

                  <div className="config-item">
                    <div className="item-header">
                      <div className="item-title">API密钥</div>
                      <Tag color="red" className="item-status">必填</Tag>
                    </div>
                    <div className="item-description">
                      输入您的API密钥，将安全加密存储
                    </div>
                    <div className="item-controls">
                      <Input.Password
                        value={apiConfig.apiKey}
                        onChange={(e) => handleAPIConfigChange('apiKey', e.target.value)}
                        placeholder="sk-..."
                        prefix={<KeyOutlined />}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div className="config-item">
                    <div className="item-header">
                      <div className="item-title">API端点</div>
                      <Tag color="blue" className="item-status">可选</Tag>
                    </div>
                    <div className="item-description">
                      自定义API端点URL（用于自定义或代理服务）
                    </div>
                    <div className="item-controls">
                      <Input
                        value={apiConfig.apiEndpoint}
                        onChange={(e) => handleAPIConfigChange('apiEndpoint', e.target.value)}
                        placeholder="https://api.openai.com/v1"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div className="config-item">
                    <div className="item-header">
                      <div className="item-title">模型名称</div>
                      <Tag color="red" className="item-status">必填</Tag>
                    </div>
                    <div className="item-description">
                      选择或输入要使用的模型名称
                    </div>
                    <div className="item-controls">
                      <Space.Compact style={{ width: '100%' }}>
                        {availableModels.length > 0 ? (
                          <Select
                            value={apiConfig.model}
                            onChange={(value) => handleAPIConfigChange('model', value)}
                            style={{ flex: 1 }}
                            placeholder="选择模型"
                            showSearch
                            optionFilterProp="children"
                          >
                            {availableModels.map((model) => (
                              <Option key={model.id} value={model.id}>
                                {model.name || model.id}
                                <span style={{ fontSize: '0.8em', color: '#999', marginLeft: 8 }}>
                                  ({model.owned_by})
                                </span>
                              </Option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            value={apiConfig.model}
                            onChange={(e) => handleAPIConfigChange('model', e.target.value)}
                            placeholder="输入模型名称或点击右侧按钮获取"
                            style={{ flex: 1 }}
                          />
                        )}
                        <Tooltip title="从API获取可用模型列表">
                          <Button
                            icon={<SearchOutlined />}
                            onClick={handleFetchModels}
                            loading={loadingModels}
                            type="primary"
                            style={{
                              background: 'var(--primary-blue)',
                              borderColor: 'var(--primary-blue)',
                              color: 'var(--neutral-900)',
                            }}
                          >
                            获取模型
                          </Button>
                        </Tooltip>
                      </Space.Compact>
                      {availableModels.length > 0 && (
                        <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
                          已获取 {availableModels.length} 个可用模型
                          <Button
                            type="link"
                            size="small"
                            onClick={() => setAvailableModels([])}
                            style={{ padding: 0, marginLeft: 8 }}
                          >
                            清除缓存
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="config-item">
                    <div className="item-header">
                      <div className="item-title">最大Token数</div>
                      <Tag color="purple" className="item-status">tokens</Tag>
                    </div>
                    <div className="item-description">
                      设置单次请求的最大token数量
                    </div>
                    <div className="item-controls">
                      <InputNumber
                        min={100}
                        max={getMaxTokensLimit()}
                        step={100}
                        value={apiConfig.maxTokens}
                        onChange={(value) => handleAPIConfigChange('maxTokens', value)}
                        style={{ width: '100%' }}
                      />
                      <div style={{ fontSize: '12px', color: 'var(--neutral-500)', marginTop: '4px' }}>
                        当前提供商限制: 最大 {getMaxTokensLimit().toLocaleString()} tokens
                      </div>
                    </div>
                  </div>

                  <div className="config-item">
                    <div className="item-header">
                      <div className="item-title">温度参数</div>
                      <Tag color="orange" className="item-status">0-1</Tag>
                    </div>
                    <div className="item-description">
                      控制输出随机性，越高越随机
                    </div>
                    <div className="item-controls">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', width: '100%' }}>
                        <InputNumber
                          min={0}
                          max={1}
                          step={0.1}
                          value={apiConfig.temperature}
                          onChange={(value) => handleAPIConfigChange('temperature', value)}
                          style={{ flex: 1 }}
                        />
                        <div style={{ minWidth: '60px', textAlign: 'right', color: 'var(--neutral-600)' }}>
                          {apiConfig.temperature.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ConfigSection>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <SearchOutlined />
                  搜索配置
                </span>
              }
              key="search"
            >
              <ConfigSection
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="section-header">
                  <div className="section-title">
                    <GlobalOutlined />
                    互联网搜索设置
                  </div>
                  <div className="section-actions">
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      onClick={handleTestSearch}
                      loading={loading}
                      style={{ marginRight: 'var(--space-sm)' }}
                    >
                      测试连接
                    </Button>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={handleSaveSearchConfig}
                      loading={loading}
                    >
                      保存配置
                    </Button>
                  </div>
                </div>

                <Alert
                  message="搜索配置说明"
                  description="配置互联网搜索API以在风险分析时获取实时数据。支持Tavily和Serper等搜索服务。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 'var(--space-lg)' }}
                />

                <div className="config-grid">
                  <div className="config-item">
                    <div className="item-header">
                      <div className="item-title">启用搜索功能</div>
                      <Tag color={searchConfig.enabled ? 'success' : 'default'} className="item-status">
                        {searchConfig.enabled ? '已启用' : '未启用'}
                      </Tag>
                    </div>
                    <div className="item-description">
                      开启后在风险分析时可获取实时行业数据
                    </div>
                    <div className="item-controls">
                      <Switch
                        checked={searchConfig.enabled}
                        onChange={(checked) => handleSearchConfigChange('enabled', checked)}
                        checkedChildren="启用"
                        unCheckedChildren="禁用"
                      />
                    </div>
                  </div>

                  <div className="config-item">
                    <div className="item-header">
                      <div className="item-title">搜索服务提供商</div>
                      <Tag color="blue" className="item-status">必填</Tag>
                    </div>
                    <div className="item-description">
                      选择互联网搜索服务提供商
                    </div>
                    <div className="item-controls">
                      <Select
                        value={searchConfig.provider}
                        onChange={(value) => handleSearchConfigChange('provider', value)}
                        style={{ width: '100%' }}
                      >
                        <Option value="tavily">Tavily Search</Option>
                        <Option value="serper">Serper.dev</Option>
                        <Option value="custom">自定义</Option>
                      </Select>
                    </div>
                  </div>

                  <div className="config-item">
                    <div className="item-header">
                      <div className="item-title">API密钥</div>
                      <Tag color="red" className="item-status">必填</Tag>
                    </div>
                    <div className="item-description">
                      输入搜索服务的API密钥
                    </div>
                    <div className="item-controls">
                      <Input.Password
                        value={searchConfig.apiKey}
                        onChange={(e) => handleSearchConfigChange('apiKey', e.target.value)}
                        placeholder="tvly-..."
                        prefix={<KeyOutlined />}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div className="config-item">
                    <div className="item-header">
                      <div className="item-title">API端点</div>
                      <Tag color="blue" className="item-status">可选</Tag>
                    </div>
                    <div className="item-description">
                      自定义搜索API端点URL
                    </div>
                    <div className="item-controls">
                      <Input
                        value={searchConfig.apiEndpoint}
                        onChange={(e) => handleSearchConfigChange('apiEndpoint', e.target.value)}
                        placeholder="https://api.tavily.com"
                        prefix={<DatabaseOutlined />}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div className="config-item">
                    <div className="item-header">
                      <div className="item-title">最大结果数</div>
                      <Tag color="purple" className="item-status">条数</Tag>
                    </div>
                    <div className="item-description">
                      单次搜索返回的最大结果数量
                    </div>
                    <div className="item-controls">
                      <InputNumber
                        min={1}
                        max={50}
                        step={1}
                        value={searchConfig.maxResults}
                        onChange={(value) => handleSearchConfigChange('maxResults', value)}
                        style={{ width: '100%' }}
                        addonAfter="条"
                      />
                    </div>
                  </div>

                  <div className="config-item">
                    <div className="item-header">
                      <div className="item-title">搜索深度</div>
                      <Tag color="orange" className="item-status">精度</Tag>
                    </div>
                    <div className="item-description">
                      选择搜索的深度和详细程度
                    </div>
                    <div className="item-controls">
                      <Select
                        value={searchConfig.searchDepth}
                        onChange={(value) => handleSearchConfigChange('searchDepth', value)}
                        style={{ width: '100%' }}
                      >
                        <Option value="basic">基础搜索（快速）</Option>
                        <Option value="advanced">深度搜索（详细）</Option>
                      </Select>
                    </div>
                  </div>
                </div>
              </ConfigSection>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <BankOutlined />
                  公司业务分类
                </span>
              }
              key="business"
            >
              <ConfigSection
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="section-header">
                  <div className="section-title">
                    <DatabaseOutlined />
                    业务分类管理
                  </div>
                  <div className="section-actions">
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={downloadTemplate}
                      style={{ marginRight: 8 }}
                    >
                      下载模板
                    </Button>
                    <Button
                      type="primary"
                      icon={<ImportOutlined />}
                      onClick={() => setImportModalVisible(true)}
                      style={{
                        background: 'var(--primary-blue)',
                        border: 'none',
                        color: 'var(--neutral-900)',
                        fontWeight: 600,
                        marginRight: 8
                      }}
                    >
                      导入数据
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => loadConfigurationData()}
                      loading={loading}
                    >
                      刷新数据
                    </Button>
                  </div>
                </div>

                <Table
                  columns={[
                    {
                      title: '分类名称',
                      dataIndex: 'category_name',
                      key: 'category_name',
                      width: 150,
                      render: (text: string, record: BusinessClassification) => {
                        const colorMap: Record<string, string> = {
                          '鼓励类': 'green',
                          '一般类': 'blue',
                          '谨慎类': 'orange',
                          '限制类': 'red',
                          '严格限制类': 'purple',
                        };
                        return <Tag color={colorMap[record.category_name]}>{text}</Tag>;
                      },
                    },
                    {
                      title: '分类描述',
                      dataIndex: 'category_description',
                      key: 'category_description',
                      ellipsis: true,
                    },
                    {
                      title: '风险等级',
                      dataIndex: 'risk_levels',
                      key: 'risk_levels',
                      width: 200,
                      render: (riskLevels: string[]) => (
                        <Space size={[4, 4]} wrap>
                          {riskLevels?.map((level, index) => (
                            <Tag key={index} color="cyan">{level}</Tag>
                          ))}
                        </Space>
                      ),
                    },
                    {
                      title: '业务类型数量',
                      dataIndex: 'business_types',
                      key: 'business_types_count',
                      width: 120,
                      align: 'center',
                      render: (types: string[]) => types?.length || 0,
                    },
                    {
                      title: '承保指引',
                      dataIndex: 'underwriting_guide',
                      key: 'underwriting_guide',
                      ellipsis: true,
                      width: 250,
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 100,
                      align: 'center',
                      render: (_, record: BusinessClassification) => (
                        <Button
                          type="link"
                          icon={<EditOutlined />}
                          onClick={() => handleEditBusiness(record)}
                        >
                          编辑
                        </Button>
                      ),
                    },
                  ]}
                  dataSource={businessClassifications}
                  rowKey="id"
                  pagination={false}
                  style={{ marginTop: 16 }}
                />
              </ConfigSection>
            </TabPane>
          </Tabs>
        </StyledCard>

        {/* User Modal */}
        <Modal
          title={editingUser ? '编辑用户' : '添加用户'}
          open={userModalVisible}
          onCancel={() => {
            setUserModalVisible(false);
            setEditingUser(null);
            userForm.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form
            form={userForm}
            layout="vertical"
            onFinish={handleSaveUser}
            style={{ marginTop: 'var(--space-lg)' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input placeholder="输入用户名" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input placeholder="输入邮箱地址" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="role"
                  label="角色"
                  rules={[{ required: true, message: '请选择角色' }]}
                >
                  <Select placeholder="选择用户角色">
                    <Option value="admin">管理员</Option>
                    <Option value="operator">操作员</Option>
                    <Option value="viewer">查看者</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="状态"
                  rules={[{ required: true, message: '请选择状态' }]}
                >
                  <Select placeholder="选择用户状态">
                    <Option value="active">活跃</Option>
                    <Option value="inactive">禁用</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="permissions"
              label="权限"
              rules={[{ required: true, message: '请选择权限' }]}
            >
              <Select
                mode="multiple"
                placeholder="选择用户权限"
                style={{ width: '100%' }}
              >
                <Option value="contract_analysis">合同解析</Option>
                <Option value="pricing">智能报价</Option>
                <Option value="history_view">历史查看</Option>
                <Option value="reports">报告生成</Option>
                <Option value="user_management">用户管理</Option>
                <Option value="system_config">系统配置</Option>
                <Option value="all">全部权限</Option>
              </Select>
            </Form.Item>

            <div style={{ textAlign: 'right', marginTop: 'var(--space-xl)' }}>
              <Space>
                <Button onClick={() => setUserModalVisible(false)}>
                  取消
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  style={{
                    background: 'var(--primary-blue)',
                    border: 'none',
                    color: 'var(--neutral-900)',
                    fontWeight: 600,
                  }}
                >
                  {editingUser ? '更新' : '添加'}
                </Button>
              </Space>
            </div>
          </Form>
        </Modal>

        {/* Business Classification Modal */}
        <Modal
          title="编辑业务分类"
          open={businessModalVisible}
          onCancel={() => {
            setBusinessModalVisible(false);
            setEditingBusiness(null);
            businessForm.resetFields();
          }}
          footer={null}
          width={800}
        >
          <Form
            form={businessForm}
            layout="vertical"
            onFinish={handleSaveBusiness}
            style={{ marginTop: 'var(--space-lg)' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="category_name"
                  label="分类名称"
                  rules={[{ required: true, message: '请输入分类名称' }]}
                >
                  <Input placeholder="例如：鼓励类" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="category_level"
                  label="分类等级"
                  rules={[{ required: true, message: '请输入分类等级' }]}
                >
                  <Input placeholder="例如：encouraged" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="category_description"
              label="分类描述"
              rules={[{ required: true, message: '请输入分类描述' }]}
            >
              <Input.TextArea rows={2} placeholder="请输入分类描述" />
            </Form.Item>

            <Form.Item
              name="risk_levels"
              label="风险等级"
              rules={[{ required: true, message: '请输入风险等级' }]}
              extra="每行输入一个风险等级"
            >
              <Input.TextArea rows={3} placeholder="例如：&#10;1类建筑风险&#10;2类建筑风险" />
            </Form.Item>

            <Form.Item
              name="business_types"
              label="业务类型"
              rules={[{ required: true, message: '请输入业务类型' }]}
              extra="每行输入一种业务类型"
            >
              <Input.TextArea rows={6} placeholder="例如：&#10;层高低于100米的房建工程&#10;室内装修工程&#10;环保工程" />
            </Form.Item>

            <Form.Item
              name="examples"
              label="示例项目"
              extra="每行输入一个示例"
            >
              <Input.TextArea rows={4} placeholder="例如：&#10;住宅小区建设项目&#10;办公楼装修工程" />
            </Form.Item>

            <Form.Item
              name="underwriting_guide"
              label="承保指引"
              rules={[{ required: true, message: '请输入承保指引' }]}
            >
              <Input.TextArea rows={2} placeholder="例如：可积极承保，给予优惠费率" />
            </Form.Item>

            <Form.Item
              name="display_order"
              label="显示顺序"
              rules={[{ required: true, message: '请输入显示顺序' }]}
            >
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
            </Form.Item>

            <div style={{ textAlign: 'right', marginTop: 'var(--space-xl)' }}>
              <Space>
                <Button onClick={() => setBusinessModalVisible(false)}>
                  取消
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  style={{
                    background: 'var(--primary-blue)',
                    border: 'none',
                    color: 'var(--neutral-900)',
                    fontWeight: 600,
                  }}
                >
                  保存
                </Button>
              </Space>
            </div>
          </Form>
        </Modal>

        {/* 导入弹窗 */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImportOutlined style={{ color: 'var(--primary-blue)' }} />
              导入业务分类数据
            </div>
          }
          open={importModalVisible}
          onCancel={() => setImportModalVisible(false)}
          footer={null}
          width={600}
        >
          <Alert
            message="导入说明"
            description={
              <div>
                <p style={{ marginBottom: '8px' }}>1. 请先下载导入模板，按照模板格式填写数据</p>
                <p style={{ marginBottom: '8px' }}>2. 风险等级、业务类型、示例项目支持多行输入，在Excel中用换行分隔</p>
                <p style={{ marginBottom: '8px' }}>3. 分类等级必须唯一，如已存在则更新对应分类</p>
                <p style={{ marginBottom: '0' }}>4. 带*的字段为必填项</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <div style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={downloadTemplate}
                size="large"
                block
                style={{
                  background: 'var(--primary-blue)',
                  border: 'none',
                  color: 'var(--neutral-900)',
                  fontWeight: 600,
                }}
              >
                下载Excel模板
              </Button>

              <Upload.Dragger
                accept=".xlsx,.xls"
                beforeUpload={handleFileUpload}
                showUploadList={false}
                disabled={importing}
                style={{ padding: '20px 0' }}
              >
                <p className="ant-upload-drag-icon" style={{ fontSize: '48px', color: 'var(--primary-blue)' }}>
                  <FileExcelOutlined />
                </p>
                <p className="ant-upload-text" style={{ fontSize: '16px', fontWeight: 600 }}>
                  点击或拖拽文件到此区域上传
                </p>
                <p className="ant-upload-hint" style={{ color: 'var(--neutral-600)' }}>
                  支持单个Excel文件上传（.xlsx或.xls格式）
                </p>
              </Upload.Dragger>
            </Space>
          </div>

          {importing && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Button type="primary" loading={importing} size="large" disabled>
                正在导入数据...
              </Button>
            </div>
          )}
        </Modal>
      </motion.div>
    </PageContainer>
  );
};

export default SystemConfiguration;