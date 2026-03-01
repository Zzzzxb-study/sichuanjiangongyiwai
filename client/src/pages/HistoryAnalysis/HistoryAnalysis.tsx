import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, DatePicker, Select, Button, Tag, Statistic, Input, Space, Tooltip, Modal, Form, Alert, List, Spin, message, Upload, InputNumber, Tabs } from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  RiseOutlined,
  FallOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  ExportOutlined,
  CalendarOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  InboxOutlined,
  UploadOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  BankOutlined,
  EnvironmentOutlined,
  SafetyOutlined,
  DollarOutlined,
  HeartOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload';
import { useNavigate } from 'react-router-dom';
import { historyDataApi } from '../../services/historyDataApi';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { confirm } = Modal;
const { Search } = Input;

const PageContainer = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: var(--space-xl) var(--space-lg);

  @media (max-width: 768px) {
    padding: var(--space-md) var(--space-sm);
  }
`;

const StyledCard = styled(Card)`
  margin-bottom: var(--space-xl);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--neutral-300);
  overflow: hidden;
  transition: all var(--transition-normal);

  &:hover {
    border-color: var(--primary-blue);
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
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

const FilterPanel = styled(motion.div)`
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  border: 1px solid var(--neutral-300);
  margin-bottom: var(--space-xl);

  .filter-row {
    display: flex;
    gap: var(--space-lg);
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: var(--space-lg);

    &:last-child {
      margin-bottom: 0;
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);

      .filter-label {
        font-weight: 500;
        color: var(--neutral-700);
        font-size: 0.9rem;
      }

      .ant-select,
      .ant-picker,
      .ant-input {
        min-width: 200px;
        border-radius: var(--radius-md);
      }
    }

    .filter-actions {
      margin-left: auto;
      display: flex;
      gap: var(--space-md);
    }
  }
`;

const StatisticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);

  .stat-card {
    background: white;
    border-radius: var(--radius-xl);
    padding: var(--space-xl);
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--neutral-300);
    transition: all var(--transition-normal);

    &:hover {
      transform: translateY(-4px);
      border-color: var(--primary-blue);
      box-shadow: var(--shadow-xl);
    }

    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-lg);

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-lg);
        background: var(--bg-blue-50);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: var(--primary-blue);
      }

      .stat-trend {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        font-size: 0.9rem;
        font-weight: 600;

        &.positive {
          color: var(--semantic-success);
        }

        &.negative {
          color: var(--semantic-error);
        }
      }
    }

    .stat-value {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 700;
      color: var(--neutral-900);
      margin-bottom: var(--space-sm);
      line-height: 1;
    }

    .stat-label {
      font-size: 1rem;
      color: var(--neutral-700);
      font-weight: 500;
    }

    .stat-subtitle {
      font-size: 0.85rem;
      color: var(--neutral-600);
      margin-top: var(--space-xs);
    }
  }
`;

const ChartContainer = styled.div`
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-lg);

    .chart-title {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--neutral-900);
    }

    .chart-controls {
      display: flex;
      gap: var(--space-sm);
    }
  }

  .echarts-container {
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
`;

const StyledTable = styled(Table)`
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
        font-weight: 500;
      }
    }

    .ant-table-tbody > tr:hover > td {
      background: var(--bg-blue-50);
    }
  }

  .ant-pagination {
    margin-top: var(--space-lg);
    text-align: center;

    .ant-pagination-item-active {
      background: var(--primary-blue);
      border-color: var(--primary-blue);

      a {
        color: white;
        font-weight: 600;
      }
    }
  }
`;

const DetailModal = styled(Modal)`
  .ant-modal-content {
    border-radius: var(--radius-xl);
    overflow: hidden;
  }

  .ant-modal-header {
    background: var(--primary-blue);
    border-bottom: none;

    .ant-modal-title {
      color: white;
      font-family: var(--font-display);
      font-weight: 600;
    }
  }

  .ant-modal-close {
    color: white;

    &:hover {
      color: var(--neutral-100);
    }
  }
`;

interface HistoryRecord {
  id: string;
  projectName: string;
  location?: string;
  insurer?: string;
  contractAmount: number;
  totalPremium: number;
  engineeringClass: number;
  engineeringClassName?: string; // 工程类别名称
  contractType?: string; // 施工合同类型
  riskLevel: string;
  signingDate: string; // 签单日期
  startDate: string; // 起保日期
  endDate: string;
  status: 'active' | 'completed' | 'cancelled';
  settledClaims: number; // 已决赔款（元）
  unsettledClaims: number; // 未决赔款（元）
  profitability: number;
  durationDays?: number; // 施工工期（天）
  // 保险金额字段
  accidentInsurance?: number;  // 建筑施工人员意外伤害保险（元/人）
  medicalInsurance?: number;    // 附加建筑施工人员意外伤害医疗保险（元/人）
  hospitalAllowance?: number;   // 附加建筑施工人员意外伤害住院津贴（元/天/人）
  acuteDiseaseInsurance?: number; // 附加建筑施工人员急性病身故保险（元）
  altitudeSicknessInsurance?: number; // 附加建筑施工人员高原病保险（元）
  // 费率字段
  overallRate?: number;  // 整体费率（‰）
  ratePer100k?: number;  // 10万元保额费率（‰）
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
}

interface IndustryInsight {
  summary: string;
  sources: SearchResult[];
  timestamp: string;
}

// 项目分类统计接口
interface CategoryStatistics {
  category: string; // 工程类别名称
  projectCount: number; // 项目数量
  premiumIncome: number; // 保费收入
  ratePer100kStats: {
    average: number; // 10万元保额平均费率（‰）- 加权平均
    min: number; // 10万元保额最低费率（‰）
    max: number; // 10万元保额最高费率（‰）
  };
}

interface HistoryAnalysisData {
  records: HistoryRecord[];
  statistics: {
    totalProjects: number; // 历史项目总数
    totalPremium: number; // 累计保费收入
    currentMonthProjects: number; // 当月项目总数
    currentMonthPremium: number; // 当月保费收入
  };
  categoryStatistics: CategoryStatistics[]; // 分类统计
  trends: {
    monthly: any[];
    riskDistribution: any[];
    profitabilityTrend: any[];
  };
}

const HistoryAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<HistoryAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(12, 'month'),
    dayjs()
  ]);
  const [filters, setFilters] = useState({
    engineeringClass: '',
    riskLevel: '',
    searchText: '',
  });

  // 搜索相关状态
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [industryInsight, setIndustryInsight] = useState<IndustryInsight | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('四川建工意外险 2024年 风险分析');

  // 导入相关状态
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);

  // 标签页状态
  const [activeTab, setActiveTab] = useState('statistics');

  // 删除相关状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pageSize, setPageSize] = useState(10); // 分页大小

  // 编辑相关状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HistoryRecord | null>(null);
  const [editForm] = Form.useForm();

  // 组件挂载时加载数据
  useEffect(() => {
    loadHistoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 当筛选条件变化时重新加载数据
  useEffect(() => {
    if (data !== null) { // 只有在数据已经加载过一次后才响应筛选条件变化
      loadHistoryData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, filters]);

  const loadHistoryData = async () => {
    setLoading(true);

    try {
      console.log('=== 开始加载历史数据 ===');

      // 从后端 API 获取历史数据
      const response = await historyDataApi.getHistoryRecords({
        page: 1,
        limit: 1000,  // 获取足够的数据用于分析
      });

      console.log('后端API响应:', response);

      if (!response.success) {
        console.error('后端返回失败:', response);
        throw new Error(response.error || '获取历史数据失败');
      }

      if (!response.data || !response.data.records) {
        console.warn('后端返回的数据格式不正确，使用空数据');
        // 使用空数据而不是抛出错误
        setData({
          records: [],
          statistics: {
            totalProjects: 0,
            totalPremium: 0,
            currentMonthProjects: 0,
            currentMonthPremium: 0,
          },
          categoryStatistics: [],
          trends: {
            monthly: [],
            riskDistribution: [],
            profitabilityTrend: [],
          },
        });
        setLoading(false);
        return;
      }

      console.log('获取到的记录数量:', response.data.records.length);

      // 转换后端数据格式为前端需要的格式
      // 后端返回的数据结构是：{ id, projectInfo: {...}, premiumResult: {...}, createdAt, updatedAt }
      const records = response.data.records.map((item: any, index: number) => {
        const projectInfo = item.projectInfo || {};
        const premiumResult = item.premiumResult || {};

        if (index === 0) {
          console.log('第一条记录样本:', { item, projectInfo, premiumResult });
        }

        // 计算工期天数
        let durationDays = 0;
        if (projectInfo.startDate && projectInfo.endDate) {
          const start = new Date(projectInfo.startDate);
          const end = new Date(projectInfo.endDate);
          durationDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        }

        // 计算综合费率（千分比）
        let overallRate = 0;
        if (premiumResult.totalPremium && projectInfo.totalCost) {
          overallRate = (premiumResult.totalPremium / (projectInfo.totalCost * 10000)) * 1000;
        }

        // 计算10万元保额费率
        let ratePer100k = 0;
        if (premiumResult.totalPremium && projectInfo.totalCost) {
          ratePer100k = (premiumResult.totalPremium / (projectInfo.totalCost * 10000)) * 100000;
        }

        // 获取工程分类名称
        const engineeringClassMap: Record<number, string> = {
          1: '房屋建筑工程',
          2: '市政工程',
          3: '机电工程',
          4: '公路工程',
          5: '铁路工程',
          6: '港口与航道工程',
          7: '水利水电工程',
          8: '矿山工程',
          9: '冶金工程',
          10: '石油化工工程',
          11: '电力工程',
          12: '通信工程',
        };

        return {
          id: item.id,
          projectId: item.projectId,
          projectName: projectInfo.projectName || '未知项目',
          projectType: projectInfo.projectType || 'non_rural',
          engineeringClass: parseInt(projectInfo.engineeringClass) || 1,
          engineeringClassName: engineeringClassMap[parseInt(projectInfo.engineeringClass) || 1] || '未知工程类型',
          totalCost: projectInfo.totalCost || 0,
          totalArea: projectInfo.totalArea || 0,
          contractType: projectInfo.contractType || 'general_contract',
          companyQualification: projectInfo.companyQualification || 'grade_2',
          managementLevel: projectInfo.managementLevel || 'sound',
          address: projectInfo.address || '',
          constructionUnit: projectInfo.constructionUnit || '',
          // 签单日期：优先使用signingDate，如果没有则使用startDate作为后备
          signingDate: projectInfo.signingDate
            ? new Date(projectInfo.signingDate).toISOString().split('T')[0]
            : (projectInfo.startDate ? new Date(projectInfo.startDate).toISOString().split('T')[0] : ''),
          startDate: projectInfo.startDate ? new Date(projectInfo.startDate).toISOString().split('T')[0] : '',
          endDate: projectInfo.endDate ? new Date(projectInfo.endDate).toISOString().split('T')[0] : '',
          totalPremium: premiumResult.totalPremium || 0,
          createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : '',
          updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : '',
          // 兼容旧字段名（用于表格显示）
          insurer: projectInfo.constructionUnit || '', // 投保人对应施工单位
          location: projectInfo.address || '', // 项目地址对应地址
          contractAmount: projectInfo.totalCost ? Math.round(projectInfo.totalCost * 10000) : 0, // 万元转换为元，四舍五入避免精度问题
          // 工期和费率（优先使用数据库中存储的值，如果没有则计算）
          durationDays,
          overallRate: premiumResult.overallRate !== undefined ? premiumResult.overallRate : overallRate,
          ratePer100k: premiumResult.ratePer100k !== undefined ? premiumResult.ratePer100k : ratePer100k,
          // 主险保费（mainInsurance可能是对象或数值）
          mainInsurance: typeof premiumResult.mainInsurance === 'object'
            ? (premiumResult.mainInsurance as any).premium || premiumResult.totalPremium || 0
            : premiumResult.mainInsurance || premiumResult.totalPremium || 0,
          // 附加险种金额（检查premiumResult的子对象或直接数值）
          accidentInsurance: typeof premiumResult.accidentInsurance === 'number'
            ? premiumResult.accidentInsurance
            : (typeof premiumResult.accidentInsurance === 'object' && premiumResult.accidentInsurance
              ? (premiumResult.accidentInsurance as any).premium || 0
              : (typeof premiumResult.mainInsurance === 'number'
                ? premiumResult.mainInsurance // 回退：如果accidentInsurance不存在，使用mainInsurance
                : (typeof premiumResult.mainInsurance === 'object'
                  ? (premiumResult.mainInsurance as any).premium || 0
                  : 0))),
          medicalInsurance: typeof premiumResult.medicalInsurance === 'number'
            ? premiumResult.medicalInsurance
            : (typeof premiumResult.medicalInsurance === 'object' && premiumResult.medicalInsurance
              ? (premiumResult.medicalInsurance as any).premium || 0
              : 0),
          hospitalAllowance: typeof premiumResult.hospitalAllowance === 'number'
            ? premiumResult.hospitalAllowance
            : (typeof premiumResult.hospitalAllowance === 'object' && premiumResult.hospitalAllowance
              ? (premiumResult.hospitalAllowance as any).premium || 0
              : 0),
          acuteDiseaseInsurance: typeof premiumResult.acuteDiseaseInsurance === 'number'
            ? premiumResult.acuteDiseaseInsurance
            : (typeof premiumResult.acuteDiseaseInsurance === 'object' && premiumResult.acuteDiseaseInsurance
              ? (premiumResult.acuteDiseaseInsurance as any).premium || 0
              : 0),
          altitudeSicknessInsurance: typeof premiumResult.altitudeSicknessInsurance === 'number'
            ? premiumResult.altitudeSicknessInsurance
            : (typeof premiumResult.altitudeSicknessInsurance === 'object' && premiumResult.altitudeSicknessInsurance
              ? (premiumResult.altitudeSicknessInsurance as any).premium || 0
              : 0),
          // 理赔信息（从数据库读取，如果不存在则为0）
          settledClaims: premiumResult.settledClaims || 0,
          unsettledClaims: premiumResult.unsettledClaims || 0,
        };
      });

      console.log('转换后的记录数量:', records.length);

        // 计算统计数据
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const statistics = {
          totalProjects: records.length,
          totalPremium: records.reduce((sum: number, r: any) => sum + (r.totalPremium || 0), 0),
          // 按签单日期统计当月项目总数
          currentMonthProjects: records.filter((r: any) => {
            // 优先使用signingDate，如果不存在则使用startDate
            const dateStr = r.signingDate || r.startDate;
            if (!dateStr) return false;
            const date = new Date(dateStr);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
          }).length,
          // 按签单日期统计当月保费收入
          currentMonthPremium: records
            .filter((r: any) => {
              // 优先使用signingDate，如果不存在则使用startDate
              const dateStr = r.signingDate || r.startDate;
              if (!dateStr) return false;
              const date = new Date(dateStr);
              return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            })
            .reduce((sum: number, r: any) => sum + (r.totalPremium || 0), 0),
        };

        // 生成分类统计
        const categoryStatistics = calculateCategoryStatistics(records);

        // 生成趋势数据
        const trends = generateTrendsData(records);

        const parsedData = {
          records,
          statistics,
          categoryStatistics,
          trends,
        };

        console.log('从后端加载历史数据:', parsedData);
        setData(parsedData);

        // 可选：同时保存到 localStorage 以便离线使用
        localStorage.setItem('historyAnalysisData', JSON.stringify(parsedData));
      } catch (error) {
      console.error('获取历史数据失败:', error);
      message.error('获取历史数据失败，请稍后重试');

      // 返回空数据
      setData({
        records: [],
        statistics: {
          totalProjects: 0,
          totalPremium: 0,
          currentMonthProjects: 0,
          currentMonthPremium: 0,
        },
        categoryStatistics: [],
        trends: {
          monthly: [],
          riskDistribution: [],
          profitabilityTrend: [],
        },
      });
    }

    setLoading(false);
  };

  // 添加防抖hook
  const useDebounce = (value: any, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  // 使用防抖处理搜索文本
  const debouncedSearchText = useDebounce(filters.searchText, 300);

  // 过滤数据函数
  const getFilteredRecords = () => {
    if (!data?.records) return [];

    return data.records.filter((record) => {
      // 搜索文本过滤
      if (debouncedSearchText) {
        const searchLower = debouncedSearchText.toLowerCase();
        const matchSearch =
          (record.projectName && record.projectName.toLowerCase().includes(searchLower)) ||
          (record.insurer && record.insurer.toLowerCase().includes(searchLower)) ||
          (record.location && record.location.toLowerCase().includes(searchLower));

        if (!matchSearch) return false;
      }

      // 工程类别过滤
      if (filters.engineeringClass && record.engineeringClass !== parseInt(filters.engineeringClass)) {
        return false;
      }

      // 风险等级过滤
      if (filters.riskLevel && record.riskLevel !== filters.riskLevel) {
        return false;
      }

      return true;
    });
  };

  const handleViewDetails = (record: HistoryRecord) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  const handleExport = () => {
    // Export functionality
    console.log('Exporting data...');
  };

  // 下载导入模板
  const handleDownloadTemplate = () => {
    // 创建模板数据
    const templateData = [
      [
        '项目名称',
        '项目地址',
        '投保人',
        '合同金额（元）',
        '施工合同类型',
        '工程类别',
        '施工工期（天）',
        '签单日期',
        '起保日期',
        '终止日期',
        '建筑施工人员意外伤害保险（元/人）',
        '附加建筑施工人员意外伤害医疗保险（元/人）',
        '附加建筑施工人员意外伤害住院津贴（元/天/人）',
        '附加建筑施工人员急性病身故保险（元）',
        '附加建筑施工人员高原病保险（元）',
        '保费（元）',
        '已决赔款（元）',
        '未决赔款（元）',
        '整体费率（‰）',
        '10万元保额费率（‰）',
      ],
      [
        '示例项目',
        '四川省成都市示例地址',
        '示例投保人公司',
        '1000000',
        '总承包',
        '房屋建筑工程',
        '180',
        '2025-01-01',
        '2025-01-02',
        '2025-07-01',
        '500000',
        '50000',
        '0',
        '0',
        '0',
        '2000',
        '0',
        '0',
        '2.5',
        '3.0',
      ],
    ];

    // 创建工作簿
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '历史数据模板');

    // 设置列宽
    ws['!cols'] = [
      { wch: 30 }, // 项目名称
      { wch: 30 }, // 项目地址
      { wch: 20 }, // 投保人
      { wch: 15 }, // 合同金额
      { wch: 15 }, // 施工合同类型
      { wch: 15 }, // 工程类别
      { wch: 12 }, // 施工工期
      { wch: 12 }, // 签单日期
      { wch: 12 }, // 起保日期
      { wch: 12 }, // 终止日期
      { wch: 30 }, // 意外伤害保险
      { wch: 30 }, // 医疗保险
      { wch: 30 }, // 住院津贴
      { wch: 30 }, // 急性病身故
      { wch: 25 }, // 高原病保险
      { wch: 12 }, // 保费
      { wch: 15 }, // 已决赔款
      { wch: 15 }, // 未决赔款
      { wch: 15 }, // 整体费率
      { wch: 18 }, // 10万元保额费率
    ];

    // 下载文件
    XLSX.writeFile(wb, '历史数据导入模板.xlsx');
    message.success('模板下载成功');
  };

  // 辅助函数：安全解析日期，支持多种格式（Excel序列号、字符串等）
  // 修复：避免时区转换导致的日期偏差问题
  const parseDate = (dateValue: any, fieldName?: string): string => {
    if (!dateValue && dateValue !== 0) return '';

    try {
      // 调试日志：输出原始值和类型
      const typeStr = Object.prototype.toString.call(dateValue);
      const rawStr = typeof dateValue === 'object' ? JSON.stringify(dateValue) : String(dateValue);
      console.log(`[日期解析] ${fieldName || ''} - 原始值: ${rawStr}, 类型: ${typeStr}`);

      // 1. 处理XLSX的日期对象格式 { t: 'd', v: 序列号 }
      if (dateValue && typeof dateValue === 'object' && !Array.isArray(dateValue) && !(dateValue instanceof Date)) {
        if ((dateValue as any).t === 'd' && typeof (dateValue as any).v === 'number') {
          const excelDays = (dateValue as any).v;
          console.log(`[日期解析] 检测到XLSX日期对象格式，序列号: ${excelDays}`);
          // 继续用序列号处理逻辑
          dateValue = excelDays;
        }
      }

      // 2. 处理Date对象类型（XLSX使用cellDates:true时，返回本地Date对象）
      if (dateValue instanceof Date) {
        // 直接使用本地时区方法，因为Date对象已经是正确的本地日期
        const year = dateValue.getFullYear();
        const month = String(dateValue.getMonth() + 1).padStart(2, '0');
        const day = String(dateValue.getDate()).padStart(2, '0');

        // 日期范围校验：1900-2100年
        if (year < 1900 || year > 2100) {
          console.error(`日期超出合理范围: ${dateValue} -> ${year}年`);
          message.error(`日期 ${dateValue} 超出合理范围（1900-2100年）`);
          return '';
        }

        const result = `${year}-${month}-${day}`;
        console.log(`[日期解析] Date对象解析结果: ${result}`);
        return result;
      }

      // 3. 处理数字类型（Excel日期序列号）
      if (typeof dateValue === 'number') {
        // Excel序列号转日期
        // Excel基准日期：1899-12-30 = 序列号0（这是Excel实际使用的基准日期）
        // 这样可以自动处理Excel的1900年闰年bug
        const excelSerial = dateValue;
        // Excel日期系统从1899-12-30开始（序列号0）
        const excelEpoch = dayjs('1899-12-30');
        const targetDate = excelEpoch.add(excelSerial, 'day');

        const year = targetDate.year();
        if (year < 1900 || year > 2100) {
          console.error(`日期超出合理范围: ${dateValue} -> ${year}年`);
          message.error(`日期值 ${dateValue} 超出合理范围（1900-2100年）`);
          return '';
        }

        const result = targetDate.format('YYYY-MM-DD');
        console.log(`[日期解析] Excel序列号 ${excelSerial} 解析结果: ${result}`);
        return result;
      }

      // 4. 处理字符串类型（使用dayjs本地时区）
      const dateStr = String(dateValue).trim();

      // 3.1 支持标准格式 YYYY-MM-DD 或 YYYY/MM/DD
      if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(dateStr)) {
        const parsedDate = dayjs(dateStr, ['YYYY-MM-DD', 'YYYY/MM/DD']);

        if (parsedDate.isValid()) {
          const year = parsedDate.year();
          // 日期范围校验
          if (year < 1900 || year > 2100) {
            console.error(`日期超出合理范围: ${dateStr} -> ${year}年`);
            message.error(`日期 ${dateStr} 超出合理范围（1900-2100年）`);
            return '';
          }

          return parsedDate.format('YYYY-MM-DD');
        }
      }

      // 3.2 支持其他格式
      const parsedDate = dayjs(dateStr);
      if (parsedDate.isValid()) {
        const year = parsedDate.year();
        if (year < 1900 || year > 2100) {
          console.error(`日期超出合理范围: ${dateStr} -> ${year}年`);
          message.error(`日期 ${dateStr} 超出合理范围（1900-2100年）`);
          return '';
        }
        return parsedDate.format('YYYY-MM-DD');
      }

      // 2.3 无法解析的格式
      console.error(`无法解析日期格式: ${dateStr}`);
      message.warning(`无法识别日期格式: ${dateStr}，请使用 YYYY-MM-DD 或 YYYY/MM/DD 格式`);
      return '';
    } catch (error) {
      console.error('日期解析异常:', dateValue, error);
      message.error(`日期解析失败: ${dateValue}`);
      return '';
    }
  };

  // 格式化日期显示（用于表格渲染）
  const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return '-';
    try {
      const date = dayjs(dateStr);
      if (date.isValid()) {
        return date.format('YYYY年MM月DD日');
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // 辅助函数：计算项目分类统计（按工程类别：1类、2类、3类、4类）
  const calculateCategoryStatistics = (records: HistoryRecord[]): CategoryStatistics[] => {
    // 工程类别名称映射
    const classNames: Record<number, string> = {
      1: '一类工程',
      2: '二类工程',
      3: '三类工程',
      4: '四类工程',
    };

    // 按工程类别（1、2、3、4）分组
    const categoryMap = new Map<number, HistoryRecord[]>();

    records.forEach(record => {
      const classValue = record.engineeringClass || 1; // 默认为一类工程
      if (!categoryMap.has(classValue)) {
        categoryMap.set(classValue, []);
      }
      categoryMap.get(classValue)!.push(record);
    });

    // 计算每个类别的统计信息（带类别值用于排序）
    const categoryStatsWithClass = Array.from(categoryMap.entries()).map(([classValue, records]) => {
      const category = classNames[classValue] || `${classValue}类工程`;
      const projectCount = records.length;
      const premiumIncome = records.reduce((sum, r) => sum + r.totalPremium, 0);

      // 筛选有10万元保额费率数据的记录
      const validRateRecords = records.filter(r =>
        r.ratePer100k !== undefined &&
        r.ratePer100k !== null &&
        r.ratePer100k > 0
      );

      // 计算加权平均费率：sum(10万元保额费率 * 合同金额) / sum(合同金额)
      const totalContractAmount = validRateRecords.reduce((sum, r) => sum + (r.contractAmount || 0), 0);

      const weightedAverageRate = totalContractAmount > 0
        ? validRateRecords.reduce((sum, r) => {
            const rate = r.ratePer100k || 0;
            const amount = r.contractAmount || 0;
            return sum + (rate * amount);
          }, 0) / totalContractAmount
        : 0;

      // 计算最低和最高费率（同类别项目中的最小值和最大值）
      const rates = validRateRecords.map(r => r.ratePer100k || 0);
      const minRate = rates.length > 0 ? Math.min(...rates) : 0;
      const maxRate = rates.length > 0 ? Math.max(...rates) : 0;

      return {
        category,
        projectCount,
        premiumIncome,
        classValue, // 保存原始类别值用于排序
        ratePer100kStats: {
          average: Number(weightedAverageRate.toFixed(4)),
          min: Number(minRate.toFixed(4)),
          max: Number(maxRate.toFixed(4)),
        },
      };
    });

    // 按工程类别顺序排序（1类->2类->3类->4类）
    const sortedStats = categoryStatsWithClass.sort((a, b) => (a.classValue || 1) - (b.classValue || 1));

    // 移除临时使用的classValue字段，返回符合接口的数据
    return sortedStats.map(({ classValue, ...rest }) => rest) as CategoryStatistics[];
  };

  // 辅助函数：生成趋势数据
  const generateTrendsData = (records: HistoryRecord[]) => {
    if (!records || records.length === 0) {
      return {
        monthly: [],
        riskDistribution: [],
        profitabilityTrend: [],
      };
    }

    // 1. 生成月度趋势数据
    const monthlyMap = new Map<string, {
      projects: number;
      premium: number;
      claims: number;
    }>();

    records.forEach(record => {
      if (!record.startDate) return;

      const date = dayjs(record.startDate);
      const monthKey = date.format('YYYY-MM');

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          projects: 0,
          premium: 0,
          claims: 0,
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.projects += 1;
      monthData.premium += record.totalPremium || 0;
      monthData.claims += (record.settledClaims || 0) + (record.unsettledClaims || 0);
    });

    // 转换为数组并排序
    const monthly = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        projects: data.projects,
        premium: data.premium,
        claims: data.claims,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 2. 生成工程类别保费收入分布数据（按一类、二类、三类、四类工程）
    const classNames: Record<number, string> = {
      1: '一类工程',
      2: '二类工程',
      3: '三类工程',
      4: '四类工程',
    };

    // 按工程类别（1、2、3、4）统计保费收入
    const classPremiumMap = new Map<number, number>();
    records.forEach(record => {
      const classValue = record.engineeringClass || 1;
      const premium = record.totalPremium || 0;
      classPremiumMap.set(classValue, (classPremiumMap.get(classValue) || 0) + premium);
    });

    // 定义颜色方案（对应一、二、三、四类工程）
    const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666'];

    // 计算总保费
    const totalPremium = Array.from(classPremiumMap.values()).reduce((sum, val) => sum + val, 0);

    const riskDistribution = Array.from(classPremiumMap.entries())
      .map(([classValue, premium]) => ({
        name: classNames[classValue] || `${classValue}类工程`,
        value: premium,  // 保费收入
        percentage: totalPremium > 0 ? ((premium / totalPremium) * 100).toFixed(2) : '0.00',
        color: colors[(classValue - 1) % colors.length],
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')); // 按一类->二类->三类->四类排序

    // 3. 生成盈利率趋势（如果有的话）
    const profitabilityTrend = records
      .filter(r => r.profitability !== undefined && r.profitability !== null)
      .map(r => ({
        month: r.startDate ? dayjs(r.startDate).format('YYYY-MM') : '',
        value: r.profitability * 100,
      }))
      .filter(item => item.month)
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      monthly,
      riskDistribution,
      profitabilityTrend,
    };
  };

  // 辅助函数：从工程类别名称推断工程类别等级
  // 根据费率表标准进行分类
  const parseEngineeringClass = (className: string): number => {
    if (!className) return 1;
    const name = String(className).toLowerCase();

    // 四类工程 (2.3≤调整系数≤2.5)
    if (name.includes('高架桥') ||
        name.includes('输变电') ||
        name.includes('架线') ||
        name.includes('钢结构') ||
        name.includes('高空安装') ||
        name.includes('基坑') ||
        name.includes('边坡') ||
        (name.includes('桥梁') && name.includes('隧道')) ||
        (name.includes('隧道') && name.includes('桥梁'))) {
      return 4;
    }

    // 三类工程 (1.8≤调整系数≤2.0)
    if (name.includes('室外装饰') ||
        name.includes('外墙装饰') ||
        name.includes('室外装修') ||
        name.includes('外墙') ||
        name.includes('幕墙') ||
        name.includes('农村自建房') ||
        name.includes('农村建房') ||
        name.includes('水利') ||
        name.includes('水电') ||
        name.includes('矿山') ||
        name.includes('矿井') ||
        name.includes('高速公路') ||
        (name.includes('公路') && (name.includes('桥梁') || name.includes('隧道')))) {
      return 3;
    }

    // 二类工程 (1.3≤调整系数≤1.5)
    if (name.includes('火电') ||
        name.includes('风电') ||
        name.includes('光伏') ||
        name.includes('核电') ||
        name.includes('港口') ||
        name.includes('码头') ||
        name.includes('航道') ||
        name.includes('机电设备安装') ||
        name.includes('机电安装') ||
        name.includes('消防工程')) {
      return 2;
    }

    // 一类工程 (0.8≤调整系数≤1.0) - 默认
    if (name.includes('室内装修') ||
        name.includes('室内装饰') ||
        name.includes('室内') ||
        name.includes('工民建') ||
        name.includes('房建') ||
        name.includes('市政') ||
        name.includes('地铁') ||
        name.includes('绿化') ||
        name.includes('河湖治理')) {
      return 1;
    }

    // 如果包含明确的类别标识
    if (name.includes('四类') || name.includes('4类')) return 4;
    if (name.includes('三类') || name.includes('3类')) return 3;
    if (name.includes('二类') || name.includes('2类')) return 2;
    if (name.includes('一类') || name.includes('1类')) return 1;

    // 默认一类工程
    return 1;
  };

  // 处理Excel文件导入
  const handleImportExcel = async (file: File) => {
    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      // 不使用cellDates，直接获取原始值，手动处理日期序列号
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        message.error('Excel文件为空或格式不正确');
        return;
      }

      // 解析表头和数据
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1);

      // 创建列名到索引的映射（增强版，支持模糊匹配）
      const getColumnIndex = (columnName: string): number => {
        // 首先尝试精确匹配
        const exactMatch = headers.findIndex(h => h && h.trim() === columnName);
        if (exactMatch !== -1) return exactMatch;

        // 如果精确匹配失败，尝试模糊匹配
        // 去除列名中的单位和空格进行匹配
        const normalize = (str: string) => str.trim().replace(/[（(][^）)]*[）)]/g, '').replace(/\s+/g, '');
        const normalizedColumnName = normalize(columnName);

        const fuzzyMatch = headers.findIndex(h => {
          if (!h) return false;
          const normalizedHeader = normalize(h);
          return normalizedHeader === normalizedColumnName ||
                 normalizedHeader.includes(normalizedColumnName) ||
                 normalizedColumnName.includes(normalizedHeader);
        });

        return fuzzyMatch;
      };

      // 获取各列的索引
      const colIndexes = {
        projectName: getColumnIndex('项目名称'),
        location: getColumnIndex('项目地址'),
        insurer: getColumnIndex('投保人'),
        contractAmount: getColumnIndex('合同金额（元）'),
        contractType: getColumnIndex('施工合同类型'),
        engineeringClass: getColumnIndex('工程类别'),
        durationDays: getColumnIndex('施工工期（天）'),
        signingDate: getColumnIndex('签单日期'),
        startDate: getColumnIndex('起保日期'),
        endDate: getColumnIndex('终止日期'),
        accidentInsurance: getColumnIndex('建筑施工人员意外伤害保险（元/人）'),
        medicalInsurance: getColumnIndex('附加建筑施工人员意外伤害医疗保险（元/人）'),
        hospitalAllowance: getColumnIndex('附加建筑施工人员意外伤害住院津贴（元/天/人）'),
        acuteDiseaseInsurance: getColumnIndex('附加建筑施工人员急性病身故保险（元）'),
        altitudeSicknessInsurance: getColumnIndex('附加建筑施工人员高原病保险（元）'),
        totalPremium: getColumnIndex('保费（元）'),
        settledClaims: getColumnIndex('已决赔款（元）'),
        unsettledClaims: getColumnIndex('未决赔款（元）'),
        overallRate: getColumnIndex('整体费率（‰）'),
        ratePer100k: getColumnIndex('10万元保额费率（‰）'),
      };

      console.log('列名索引映射:', colIndexes);

      // 转换为历史记录格式
      const importedRecords: HistoryRecord[] = rows
        .filter((row: any[]) => row.length > 0 && row[0]) // 过滤空行
        .map((row: any[], index: number) => {
          // 使用列名索引获取数据，而不是硬编码索引
          const getValue = (colIndex: number) => {
            if (colIndex === -1 || colIndex >= row.length) return undefined;
            return row[colIndex];
          };

          const contractAmount = parseFloat(getValue(colIndexes.contractAmount)) || 0;
          const totalPremium = parseFloat(getValue(colIndexes.totalPremium)) || 0;
          const settledClaims = parseFloat(getValue(colIndexes.settledClaims)) || 0;
          const unsettledClaims = parseFloat(getValue(colIndexes.unsettledClaims)) || 0;

          // 处理施工工期：直接使用数字或解析字符串中的数字
          let durationDays = 30;
          const durationValue = getValue(colIndexes.durationDays);
          if (durationValue !== undefined && durationValue !== null && durationValue !== '') {
            const value = String(durationValue).trim();
            // 移除所有非数字字符（如"天"、"天、"等）
            const numericValue = value.replace(/[^\d]/g, '');
            const parsed = parseInt(numericValue);
            if (!isNaN(parsed) && parsed > 0) {
              durationDays = parsed;
            }
          }

          // 解析三个独立的日期字段
          const signingDate = parseDate(getValue(colIndexes.signingDate), '签单日期');
          const startDate = parseDate(getValue(colIndexes.startDate), '起保日期');

          // 计算结束日期
          let endDate = '';
          const endDateValue = getValue(colIndexes.endDate);
          if (endDateValue) {
            endDate = parseDate(endDateValue, '终止日期');
          } else if (startDate) {
            endDate = dayjs(startDate).add(durationDays, 'day').format('YYYY-MM-DD');
          }

          // 获取工程类别名称和等级
          const engineeringClassName = getValue(colIndexes.engineeringClass) || '房屋建筑工程';
          const engineeringClassValue = parseEngineeringClass(engineeringClassName);

          // 解析费率数据
          const overallRateValue = getValue(colIndexes.overallRate);
          const ratePer100kValue = getValue(colIndexes.ratePer100k);

          const parsedRecord: HistoryRecord = {
            id: `imported-${Date.now()}-${index}`,
            projectName: getValue(colIndexes.projectName) || '未命名项目',
            location: getValue(colIndexes.location) || '',
            insurer: getValue(colIndexes.insurer) || '',
            contractAmount: contractAmount,
            totalPremium: totalPremium,
            engineeringClass: engineeringClassValue,
            engineeringClassName: engineeringClassName,
            riskLevel: '中等',
            signingDate: signingDate || startDate || '',
            startDate: startDate || signingDate || '',
            endDate: endDate,
            status: 'active',
            settledClaims: settledClaims,
            unsettledClaims: unsettledClaims,
            profitability: totalPremium > 0 ? (totalPremium * 0.15) / totalPremium : 0,
            durationDays: durationDays,
            // 保险金额字段
            accidentInsurance: parseFloat(getValue(colIndexes.accidentInsurance)) || 0,
            medicalInsurance: parseFloat(getValue(colIndexes.medicalInsurance)) || 0,
            hospitalAllowance: parseFloat(getValue(colIndexes.hospitalAllowance)) || 0,
            acuteDiseaseInsurance: parseFloat(getValue(colIndexes.acuteDiseaseInsurance)) || 0,
            altitudeSicknessInsurance: parseFloat(getValue(colIndexes.altitudeSicknessInsurance)) || 0,
            // 费率字段
            overallRate: overallRateValue !== undefined && overallRateValue !== null && overallRateValue !== '' ? parseFloat(overallRateValue) : undefined,
            ratePer100k: ratePer100kValue !== undefined && ratePer100kValue !== null && ratePer100kValue !== '' ? parseFloat(ratePer100kValue) : undefined,
          };

          // 调试：打印费率数据
          console.log(`导入记录 ${index}:`, {
            项目名称: parsedRecord.projectName,
            整体费率原始值: overallRateValue,
            整体费率解析值: parsedRecord.overallRate,
            ratePer100k原始值: ratePer100kValue,
            ratePer100k解析值: parsedRecord.ratePer100k,
          });

          return parsedRecord;
        });

      // 调用后端API将数据保存到数据库
      // 声明变量在外层作用域，以便后续使用
      let importResponse: any = null;

      try {
        // 去重检查：根据项目名称和日期判断是否已存在
        const existingRecords = data?.records || [];
        const duplicateProjects: string[] = [];

        const uniqueRecords = importedRecords.filter((record: HistoryRecord) => {
          const isDuplicate = existingRecords.some((existing: HistoryRecord) =>
            existing.projectName === record.projectName &&
            existing.startDate === record.startDate
          );

          if (isDuplicate) {
            duplicateProjects.push(record.projectName);
          }

          return !isDuplicate;
        });

        if (duplicateProjects.length > 0) {
          message.warning(`发现 ${duplicateProjects.length} 条重复数据，已自动跳过：${duplicateProjects.slice(0, 3).join(', ')}${duplicateProjects.length > 3 ? '...' : ''}`);
        }

        if (uniqueRecords.length === 0) {
          message.info('所有数据都已存在，无需重复导入');
          setImportModalVisible(false);
          setUploadFileList([]);
          setImporting(false);
          return;
        }

        // 将导入的记录转换为后端期望的格式
        const backendData = uniqueRecords.map(record => {
          // 使用UTC时间创建Date对象，避免时区转换
          // 传入YYYY-MM-DD格式的字符串，并指定UTC时间
          const startDate = record.startDate ? new Date(record.startDate + 'T00:00:00.000Z') : new Date();
          const endDate = record.endDate ? new Date(record.endDate + 'T00:00:00.000Z') : new Date();

          // 验证Date对象是否有效
          if (isNaN(startDate.getTime())) {
            console.error('无效的startDate:', record.startDate);
            throw new Error(`无效的开始日期: ${record.startDate}`);
          }
          if (isNaN(endDate.getTime())) {
            console.error('无效的endDate:', record.endDate);
            throw new Error(`无效的结束日期: ${record.endDate}`);
          }

          return {
            projectInfo: {
              projectName: record.projectName,
              projectType: 'non_rural', // 默认非农村
              engineeringClass: String(record.engineeringClass), // 转换为字符串
              totalCost: record.contractAmount ? record.contractAmount / 10000 : 0, // 转换为万元
              totalArea: 0,
              contractType: 'general_contract', // 默认总包
              companyQualification: 'grade_2', // 默认二级
              managementLevel: 'sound', // 默认健全
              address: record.location || '',
              constructionUnit: record.insurer || '',
              startDate: startDate,
              endDate: endDate,
              signingDate: record.signingDate ? new Date(record.signingDate + 'T00:00:00.000Z') : startDate,
            },
            premiumResult: {
              totalPremium: record.totalPremium,
              mainInsurance: record.accidentInsurance || record.totalPremium * 0.8, // 优先使用导入的意外伤害保险金额
              accidentInsurance: record.accidentInsurance || 0, // 同时存储意外伤害保险字段，方便读取
              medicalInsurance: record.medicalInsurance || 0,
              hospitalAllowance: record.hospitalAllowance || 0,
              acuteDiseaseInsurance: record.acuteDiseaseInsurance || 0,
              altitudeSicknessInsurance: record.altitudeSicknessInsurance || 0,
              // 理赔信息
              settledClaims: record.settledClaims || 0,
              unsettledClaims: record.unsettledClaims || 0,
              // 费率信息
              overallRate: record.overallRate,
              ratePer100k: record.ratePer100k,
            },
          };
        });

        console.log('准备导入到后端的数据（去重后）:', backendData.length);
        console.log('数据样本:', JSON.stringify(backendData[0], null, 2));

        // 显示加载提示
        message.loading({ content: `正在保存 ${backendData.length} 条记录到数据库...`, key: 'import', duration: 0 });

        // 调用后端导入API
        importResponse = await historyDataApi.importHistoryData(backendData);

        // 关闭加载提示
        message.destroy('import');

        if (importResponse.success) {
          console.log('后端导入成功:', importResponse.data);

          const { importedCount, errorCount, errors } = importResponse.data;

          if (importedCount > 0) {
            message.success(`成功导入 ${importedCount} 条历史记录到数据库`);
            // 重新加载数据以确保与后端同步
            await loadHistoryData();
          }

          if (errorCount > 0) {
            message.warning(`有 ${errorCount} 条记录导入失败: ${errors.slice(0, 2).join('; ')}${errors.length > 2 ? '...' : ''}`);
          }
        } else {
          console.error('后端导入失败:', importResponse.error);
          message.error(`保存到数据库失败: ${importResponse.error}`);
        }
      } catch (error: any) {
        // 关闭加载提示
        message.destroy('import');

        console.error('调用后端导入API失败:', error);

        // 显示详细的错误信息
        if (error.message) {
          message.error(error.message);
        } else {
          message.error('数据已导入到本地，但保存到数据库失败，页面刷新后可能丢失');
        }
      }

      // 只更新本地数据（作为fallback，当后端API失败时）
      // 但如果后端成功，已经在上面调用了loadHistoryData，不需要再更新
      if (!importResponse || !importResponse.success) {
        setData(prevData => {
          if (!prevData) return null;

          const newRecords = [...prevData.records, ...importedRecords];
          const newTotalPremium = prevData.statistics.totalPremium + importedRecords.reduce((sum, r) => sum + r.totalPremium, 0);

          // 计算当月数据
          const currentMonth = dayjs().format('YYYY-MM');
          const currentMonthRecords = newRecords.filter(r =>
            r.startDate && r.startDate.startsWith(currentMonth)
          );
          const currentMonthPremium = currentMonthRecords.reduce((sum, r) => sum + r.totalPremium, 0);

          // 计算分类统计
          const newCategoryStats = calculateCategoryStatistics(newRecords);

          const newData = {
            ...prevData,
            records: newRecords,
            statistics: {
              totalProjects: newRecords.length,
              totalPremium: newTotalPremium,
              currentMonthProjects: currentMonthRecords.length,
              currentMonthPremium: currentMonthPremium,
            },
            categoryStatistics: newCategoryStats,
            trends: generateTrendsData(newRecords),
          };

          // 保存到localStorage（作为备份）
          try {
            localStorage.setItem('historyAnalysisData', JSON.stringify(newData));
            console.log('历史数据已保存到localStorage');
          } catch (error) {
            console.error('保存历史数据到localStorage失败:', error);
          }

          return newData;
        });

        message.success(`成功导入 ${importedRecords.length} 条历史记录（仅本地）`);
      }
      setImportModalVisible(false);
      setUploadFileList([]);
    } catch (error) {
      console.error('导入失败:', error);
      message.error('文件导入失败，请检查文件格式');
    } finally {
      setImporting(false);
    }
  };

  // 单条编辑
  const handleEditRecord = (record: HistoryRecord) => {
    setEditingRecord(record);
    editForm.setFieldsValue({
      projectName: record.projectName,
      location: record.location || '',
      insurer: record.insurer || '',
      contractAmount: record.contractAmount,
      totalPremium: record.totalPremium,
      engineeringClass: record.engineeringClass,
      engineeringClassName: record.engineeringClassName || '',
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
      durationDays: record.durationDays || 0,
      settledClaims: record.settledClaims || 0,
      unsettledClaims: record.unsettledClaims || 0,
      accidentInsurance: record.accidentInsurance || 0,
      medicalInsurance: record.medicalInsurance || 0,
      hospitalAllowance: record.hospitalAllowance || 0,
      acuteDiseaseInsurance: record.acuteDiseaseInsurance || 0,
      altitudeSicknessInsurance: record.altitudeSicknessInsurance || 0,
      overallRate: record.overallRate,
      ratePer100k: record.ratePer100k,
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (values: any) => {
    if (!editingRecord) return;

    try {
      setLoading(true);

      // 重新计算工程类别等级
      const engineeringClassValue = parseEngineeringClass(values.engineeringClassName || '');

      // 计算盈利率
      const profitability = values.totalPremium > 0
        ? (values.totalPremium * 0.15) / values.totalPremium
        : 0;

      const updatedRecord: HistoryRecord = {
        ...editingRecord,
        projectName: values.projectName,
        location: values.location,
        insurer: values.insurer,
        contractAmount: parseFloat(values.contractAmount) || 0,
        totalPremium: parseFloat(values.totalPremium) || 0,
        engineeringClass: engineeringClassValue,
        engineeringClassName: values.engineeringClassName,
        startDate: values.startDate ? dayjs(values.startDate).format('YYYY-MM-DD') : '',
        endDate: values.endDate ? dayjs(values.endDate).format('YYYY-MM-DD') : '',
        durationDays: parseInt(values.durationDays) || 0,
        settledClaims: parseFloat(values.settledClaims) || 0,
        unsettledClaims: parseFloat(values.unsettledClaims) || 0,
        accidentInsurance: parseFloat(values.accidentInsurance) || 0,
        medicalInsurance: parseFloat(values.medicalInsurance) || 0,
        hospitalAllowance: parseFloat(values.hospitalAllowance) || 0,
        acuteDiseaseInsurance: parseFloat(values.acuteDiseaseInsurance) || 0,
        altitudeSicknessInsurance: parseFloat(values.altitudeSicknessInsurance) || 0,
        overallRate: values.overallRate ? parseFloat(values.overallRate) : undefined,
        ratePer100k: values.ratePer100k ? parseFloat(values.ratePer100k) : undefined,
        profitability: profitability,
      };

      // 更新数据
      setData(prevData => {
        if (!prevData) return null;

        const oldRecord = prevData.records.find(r => r.id === editingRecord.id);
        const newRecords = prevData.records.map(r =>
          r.id === editingRecord.id ? updatedRecord : r
        );

        // 更新统计数据
        const newTotalPremium = prevData.statistics.totalPremium - (oldRecord?.totalPremium || 0) + updatedRecord.totalPremium;

        const newData = {
          ...prevData,
          records: newRecords,
          statistics: {
            ...prevData.statistics,
            totalPremium: newTotalPremium,
          },
          categoryStatistics: calculateCategoryStatistics(newRecords),
          trends: generateTrendsData(newRecords),
        };

        // 保存到localStorage
        try {
          localStorage.setItem('historyAnalysisData', JSON.stringify(newData));
          console.log('历史数据已保存到localStorage');
        } catch (error) {
          console.error('保存历史数据到localStorage失败:', error);
        }

        return newData;
      });

      message.success('记录更新成功');
      setEditModalVisible(false);
      setEditingRecord(null);
      editForm.resetFields();
    } catch (error) {
      console.error('更新失败:', error);
      message.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 单条删除
  const handleDeleteRecord = async (id: string) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这条历史记录吗？此操作不可撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          setLoading(true);

          // 显示加载提示
          const hide = message.loading('正在删除记录...', 0);

          // 调用后端API删除数据
          console.log('正在删除记录:', id);
          await historyDataApi.deleteHistoryRecord(id);

          hide();

          // 重新加载数据以确保与后端同步
          await loadHistoryData();

          message.success('记录删除成功');
        } catch (error: any) {
          console.error('删除记录失败:', error);
          message.error(error?.response?.data?.error || '删除记录失败，请稍后重试');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的记录');
      return;
    }

    confirm({
      title: '确认批量删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除选中的 ${selectedRowKeys.length} 条历史记录吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          setLoading(true);

          // 显示加载提示
          const hide = message.loading(`正在删除 ${selectedRowKeys.length} 条记录...`, 0);

          // 将 selectedRowKeys 转换为字符串数组
          const idsToDelete = selectedRowKeys.map(key => String(key));

          console.log('正在批量删除记录:', idsToDelete);

          // 调用批量删除API
          const response = await historyDataApi.batchDeleteHistoryRecords(idsToDelete);

          hide();

          if (response.success) {
            const { deletedCount, totalRequested } = response.data;

            if (deletedCount > 0) {
              message.success(`成功删除 ${deletedCount} 条记录`);

              // 清空选择
              setSelectedRowKeys([]);

              // 延迟500ms后刷新数据，确保数据库事务完成
              await new Promise(resolve => setTimeout(resolve, 500));

              // 重新加载数据以确保与后端同步
              await loadHistoryData();
            }

            // 部分记录删除失败的情况
            if (deletedCount < totalRequested) {
              message.warning(`有 ${totalRequested - deletedCount} 条记录删除失败`);
            }
          } else {
            message.error(response.error || '批量删除失败，请稍后重试');
          }

        } catch (error: any) {
          console.error('批量删除失败:', error);
          message.error(error?.response?.data?.error || error?.message || '批量删除失败，请稍后重试');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls',
    beforeUpload: (file) => {
      setUploadFileList([file]);
      handleImportExcel(file);
      return false;
    },
    onRemove: () => {
      setUploadFileList([]);
    },
    fileList: uploadFileList,
  };

  // 调用搜索API进行行业风险分析
  const handleSearchIndustryInsight = async () => {
    setSearchLoading(true);
    try {
      // TODO: 实际调用后端搜索API
      // const response = await fetch('/api/search/industry-insight', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ query: searchQuery, maxResults: 10 })
      // });
      // const data = await response.json();

      // 模拟搜索API调用
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockInsight: IndustryInsight = {
        summary: '根据最新行业数据，四川省建工意外险市场在2024年呈现以下趋势：1）三类工程风险率上升约3.5%，主要原因包括工期延长和材料成本波动；2）保险公司理赔案件中，高空作业相关事故占比达42%，建议加强相关风险管控；3）行业整体保费增长率为12.8%，高于全国平均水平。',
        sources: [
          {
            title: '2024年四川省建筑行业保险风险分析报告',
            url: 'https://example.com/report-2024',
            snippet: '详细分析了四川地区建工意外险的风险分布、理赔趋势和行业最佳实践...',
            publishedDate: '2024-01-15',
          },
          {
            title: '建筑工程安全生产监督管理办法最新解读',
            url: 'https://example.com/safety-regulation',
            snippet: '国家最新安全监管政策对建筑工程保险行业的影响分析...',
            publishedDate: '2024-01-10',
          },
          {
            title: '建筑业数字化转型与风险管理创新',
            url: 'https://example.com/digital-transformation',
            snippet: '探讨数字化技术如何改善建筑工程风险识别和预防...',
            publishedDate: '2024-01-08',
          },
        ],
        timestamp: new Date().toISOString(),
      };

      setIndustryInsight(mockInsight);
      message.success('行业洞察搜索完成');
    } catch (error) {
      message.error('搜索失败，请检查网络连接');
    } finally {
      setSearchLoading(false);
    }
  };

  const columns: ColumnsType<HistoryRecord> = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 200,
      render: (text: string) => (
        <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{text}</div>
      ),
    },
    {
      title: '项目地址',
      dataIndex: 'location',
      key: 'location',
      width: 200,
      ellipsis: true,
    },
    {
      title: '投保人',
      dataIndex: 'insurer',
      key: 'insurer',
      width: 150,
      ellipsis: true,
    },
    {
      title: '合同金额（元）',
      dataIndex: 'contractAmount',
      key: 'contractAmount',
      width: 130,
      render: (value: number) => value ? `¥${value.toLocaleString()}` : '-',
      sorter: (a, b) => (a.contractAmount || 0) - (b.contractAmount || 0),
    },
    {
      title: '保费（元）',
      dataIndex: 'totalPremium',
      key: 'totalPremium',
      width: 120,
      render: (value: number) => (
        <span style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>
          {value ? `¥${value.toLocaleString()}` : '-'}
        </span>
      ),
      sorter: (a, b) => (a.totalPremium || 0) - (b.totalPremium || 0),
    },
    {
      title: '施工工期（天）',
      key: 'duration',
      width: 120,
      render: (_, record: HistoryRecord) => {
        // 优先使用导入的 durationDays 字段
        if (record.durationDays) {
          return `${record.durationDays}天`;
        }
        // 如果没有 durationDays，则计算日期差
        if (record.startDate && record.endDate) {
          const days = dayjs(record.endDate).diff(dayjs(record.startDate), 'day');
          return `${days}天`;
        }
        return '-';
      },
    },
    {
      title: '签单日期',
      dataIndex: 'signingDate',
      key: 'signingDate',
      width: 120,
      render: (value: string) => formatDateDisplay(value),
      sorter: (a, b) => {
        if (!a.signingDate || !b.signingDate) return 0;
        return dayjs(a.signingDate).unix() - dayjs(b.signingDate).unix();
      },
    },
    {
      title: '起保日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (value: string) => formatDateDisplay(value),
      sorter: (a, b) => {
        if (!a.startDate || !b.startDate) return 0;
        return dayjs(a.startDate).unix() - dayjs(b.startDate).unix();
      },
    },
    {
      title: '终止日期',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: (value: string) => formatDateDisplay(value),
      sorter: (a, b) => {
        if (!a.endDate || !b.endDate) return 0;
        return dayjs(a.endDate).unix() - dayjs(b.endDate).unix();
      },
    },
    {
      title: '施工合同类型',
      key: 'contractType',
      width: 150,
      render: (_, record: HistoryRecord) => {
        // 合同类型映射
        const contractTypeMap: Record<string, string> = {
          'general_contract': '总包',
          'subcontract': '分包',
          'labor_contract': '劳务合同',
          'professional_contract': '专业承包',
        };
        if (record.contractType) {
          return contractTypeMap[record.contractType] || record.contractType;
        }
        return '-';
      },
    },
    {
      title: '工程类别',
      dataIndex: 'engineeringClass',
      key: 'engineeringClass',
      width: 100,
      render: (value: number) => `${value}类`,
      filters: [
        { text: '一类', value: 1 },
        { text: '二类', value: 2 },
        { text: '三类', value: 3 },
        { text: '四类', value: 4 },
      ],
      onFilter: (value, record) => record.engineeringClass === value,
    },
    {
      title: '已决赔款',
      dataIndex: 'settledClaims',
      key: 'settledClaims',
      width: 120,
      render: (value: number) => (
        <span style={{ color: value && value > 0 ? 'var(--semantic-error)' : 'var(--semantic-success)' }}>
          {value ? `¥${value.toLocaleString()}` : '-'}
        </span>
      ),
      sorter: (a, b) => (a.settledClaims || 0) - (b.settledClaims || 0),
    },
    {
      title: '未决赔款',
      dataIndex: 'unsettledClaims',
      key: 'unsettledClaims',
      width: 120,
      render: (value: number) => (
        <span style={{ color: value && value > 0 ? 'var(--semantic-warning)' : 'var(--semantic-success)' }}>
          {value ? `¥${value.toLocaleString()}` : '-'}
        </span>
      ),
      sorter: (a, b) => (a.unsettledClaims || 0) - (b.unsettledClaims || 0),
    },
    {
      title: '意外伤害保险',
      dataIndex: 'accidentInsurance',
      key: 'accidentInsurance',
      width: 140,
      render: (value: number) => value ? `¥${value.toLocaleString()}` : '-',
      sorter: (a, b) => (a.accidentInsurance || 0) - (b.accidentInsurance || 0),
    },
    {
      title: '医疗保险',
      dataIndex: 'medicalInsurance',
      key: 'medicalInsurance',
      width: 130,
      render: (value: number) => value ? `¥${value.toLocaleString()}` : '-',
      sorter: (a, b) => (a.medicalInsurance || 0) - (b.medicalInsurance || 0),
    },
    {
      title: '住院津贴',
      dataIndex: 'hospitalAllowance',
      key: 'hospitalAllowance',
      width: 130,
      render: (value: number) => value ? `¥${value.toLocaleString()}` : '-',
      sorter: (a, b) => (a.hospitalAllowance || 0) - (b.hospitalAllowance || 0),
    },
    {
      title: '急性病身故',
      dataIndex: 'acuteDiseaseInsurance',
      key: 'acuteDiseaseInsurance',
      width: 130,
      render: (value: number) => value ? `¥${value.toLocaleString()}` : '-',
      sorter: (a, b) => (a.acuteDiseaseInsurance || 0) - (b.acuteDiseaseInsurance || 0),
    },
    {
      title: '高原病保险',
      dataIndex: 'altitudeSicknessInsurance',
      key: 'altitudeSicknessInsurance',
      width: 130,
      render: (value: number) => value ? `¥${value.toLocaleString()}` : '-',
      sorter: (a, b) => (a.altitudeSicknessInsurance || 0) - (b.altitudeSicknessInsurance || 0),
    },
    {
      title: '整体费率（‰）',
      dataIndex: 'overallRate',
      key: 'overallRate',
      width: 130,
      render: (value: number) => value !== undefined ? `${value.toFixed(2)}‰` : '-',
      sorter: (a, b) => (a.overallRate || 0) - (b.overallRate || 0),
    },
    {
      title: '10万元保额费率（‰）',
      dataIndex: 'ratePer100k',
      key: 'ratePer100k',
      width: 160,
      render: (value: number) => value !== undefined ? `${value.toFixed(2)}‰` : '-',
      sorter: (a, b) => (a.ratePer100k || 0) - (b.ratePer100k || 0),
    },
    {
      title: '操作',
      key: 'actions',
      width: 350,
      fixed: 'right',
      render: (_, record: HistoryRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            style={{ color: 'var(--primary-blue)', padding: '0 4px' }}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditRecord(record)}
            style={{ padding: '0 4px' }}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRecord(record.id)}
            style={{ padding: '0 4px' }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const getTrendChart = () => {
    if (!data) return {};

    const hasData = data.trends.monthly.length > 0;

    const option = {
      title: {
        text: '历史趋势分析',
        left: 'center',
        textStyle: {
          color: '#1a2332',
          fontSize: 16,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      legend: {
        data: ['项目数量', '保费收入', '理赔支出'],
        bottom: 10,
      },
      xAxis: {
        type: 'category',
        data: data.trends.monthly.map(item => item.month),
        axisLine: {
          lineStyle: { color: '#d1d8e0' },
        },
        axisLabel: {
          color: '#6b7280',
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '项目数量',
          position: 'left',
          axisLine: {
            lineStyle: { color: '#764ba2' },
          },
          axisLabel: {
            color: '#6b7280',
          },
          splitLine: {
            lineStyle: { color: '#f4f6f8' },
          },
        },
        {
          type: 'value',
          name: '金额(万元)',
          position: 'right',
          axisLine: {
            lineStyle: { color: '#1a2332' },
          },
          axisLabel: {
            color: '#6b7280',
          },
        },
      ],
      series: [
        {
          name: '项目数量',
          type: chartType === 'line' ? 'line' : 'bar',
          yAxisIndex: 0,
          data: data.trends.monthly.map(item => item.projects),
          itemStyle: {
            color: '#764ba2',
          },
          lineStyle: chartType === 'line' ? {
            color: '#764ba2',
            width: 3,
          } : undefined,
        },
        {
          name: '保费收入',
          type: chartType === 'line' ? 'line' : 'bar',
          yAxisIndex: 1,
          data: data.trends.monthly.map(item => item.premium / 10000),
          itemStyle: {
            color: '#1a2332',
          },
          lineStyle: chartType === 'line' ? {
            color: '#1a2332',
            width: 3,
          } : undefined,
        },
        {
          name: '理赔支出',
          type: chartType === 'line' ? 'line' : 'bar',
          yAxisIndex: 1,
          data: data.trends.monthly.map(item => item.claims / 10000),
          itemStyle: {
            color: '#ef4444',
          },
          lineStyle: chartType === 'line' ? {
            color: '#ef4444',
            width: 3,
          } : undefined,
        },
      ],
      // 暂无数据提示
      graphic: hasData ? undefined : [
        {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '暂无数据',
            fontSize: 16,
            fill: '#9b9590',
          },
        },
      ],
    };

    return option;
  };

  const getRiskDistributionChart = () => {
    if (!data) return {};

    const hasData = data.trends.riskDistribution.length > 0;

    return {
      title: {
        text: '工程类别保费收入分布',
        left: 'center',
        top: '5%',
        textStyle: {
          color: '#1a2332',
          fontSize: 16,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          const percentage = params.data.percentage || '0.00';
          return `${params.seriesName}<br/>${params.name}: ${params.value.toLocaleString()}元 (${percentage}%)`;
        },
      },
      // 设置全局内边距，为四周标签留出空间
      grid: {
        left: '5%',
        right: '5%',
        top: '10%',
        bottom: '5%',
        containLabel: true,
      },
      series: [
        {
          name: '工程类别保费收入',
          type: 'pie',
          // 缩小圆环半径，为四周标签留出Buffer
          radius: ['30%', '48%'],
          // 居中对齐
          center: ['50%', '50%'],
          data: data.trends.riskDistribution.map(item => ({
            value: item.value,
            name: item.name,
            percentage: item.percentage,
            itemStyle: { color: item.color },
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          label: {
            show: true,
            position: 'outside',
            formatter: function(params: any) {
              const percentage = params.data.percentage || '0.00';
              return `${params.name}\n${percentage}%`;
            },
            fontSize: 11,
            color: '#1a2332',
            fontWeight: 500,
            // 开启防碰撞算法，自动调整重叠标签
            alignTo: 'edge',
            bleedMargin: 8,
            margin: 8,
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 20,
            smooth: true,
            maxSurfaceAngle: 90,
          },
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2,
          },
          // 避免标签重叠，让标签在垂直方向自动错开
          avoidLabelOverlap: true,
        },
      ],
      // 暂无数据提示
      graphic: hasData ? undefined : [
        {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '暂无数据',
            fontSize: 16,
            fill: '#9b9590',
          },
        },
      ],
    };
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
          <h3>正在加载历史数据...</h3>
          <p style={{ color: 'var(--neutral-500)' }}>分析承保历史和风险趋势</p>
        </div>
      </PageContainer>
    );
  }

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
              历史数据分析
            </h1>
            <p style={{
              margin: '0.5rem 0 0 0',
              color: 'var(--neutral-600)',
              fontSize: '1.1rem'
            }}>
              承保历史回顾与风险趋势分析
            </p>
          </div>
          <Button
            type="primary"
            icon={<ExportOutlined />}
            size="large"
            onClick={handleExport}
            style={{
              background: 'var(--primary-blue)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
            }}
          >
            导出报告
          </Button>
          <Button
            icon={<UploadOutlined />}
            size="large"
            onClick={() => setImportModalVisible(true)}
            style={{
              borderColor: 'var(--primary-blue)',
              color: 'var(--primary-blue)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
            }}
          >
            导入数据
          </Button>
          {selectedRowKeys.length > 0 && (
            <Button
              danger
              icon={<DeleteOutlined />}
              size="large"
              onClick={handleBatchDelete}
              style={{
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
              }}
            >
              批量删除 ({selectedRowKeys.length})
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ marginTop: 'var(--space-xl)' }}
          items={[
            {
              key: 'statistics',
              label: (
                <span>
                  <BarChartOutlined />
                  承保情况
                </span>
              ),
              children: (
                <>
                  {/* Statistics - 承保情况（签单口径） */}
                  <StatisticsGrid>
          <motion.div
            className="stat-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <HistoryOutlined />
              </div>
            </div>
            <div className="stat-value">{data?.statistics.totalProjects}</div>
            <div className="stat-label">历史项目总数</div>
          </motion.div>

          <motion.div
            className="stat-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <BarChartOutlined />
              </div>
            </div>
            <div className="stat-value">¥{data?.statistics.totalPremium?.toLocaleString() || '0'}</div>
            <div className="stat-label">累计保费收入</div>
          </motion.div>

          <motion.div
            className="stat-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <CalendarOutlined />
              </div>
            </div>
            <div className="stat-value">{data?.statistics.currentMonthProjects || 0}</div>
            <div className="stat-label">当月项目总数</div>
          </motion.div>

          <motion.div
            className="stat-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="stat-header">
              <div className="stat-icon">
                <RiseOutlined />
              </div>
            </div>
            <div className="stat-value">¥{data?.statistics.currentMonthPremium?.toLocaleString() || '0'}</div>
            <div className="stat-label">当月保费收入</div>
          </motion.div>
        </StatisticsGrid>

        {/* 项目分类明细 */}
        <StyledCard
          title={
            <>
              <PieChartOutlined />
              项目分类明细
            </>
          }
          style={{ marginBottom: 'var(--space-xl)' }}
        >
          {data?.categoryStatistics && data.categoryStatistics.length > 0 ? (
            <Table
              columns={[
                {
                  title: '工程类别',
                  dataIndex: 'category',
                  key: 'category',
                  width: 150,
                  fixed: 'left',
                  render: (text: string) => <strong>{text}</strong>,
                },
                {
                  title: '项目数量',
                  dataIndex: 'projectCount',
                  key: 'projectCount',
                  width: 120,
                  render: (value: number) => value?.toLocaleString() || '0',
                  sorter: (a: CategoryStatistics, b: CategoryStatistics) => (a.projectCount || 0) - (b.projectCount || 0),
                },
                {
                  title: '保费收入（元）',
                  dataIndex: 'premiumIncome',
                  key: 'premiumIncome',
                  width: 150,
                  render: (value: number) => value ? `¥${value.toLocaleString()}` : '-',
                  sorter: (a: CategoryStatistics, b: CategoryStatistics) => (a.premiumIncome || 0) - (b.premiumIncome || 0),
                },
                {
                  title: '10万元保额平均费率（‰）',
                  key: 'avgRate',
                  width: 180,
                  render: (_, record: CategoryStatistics) =>
                    record.ratePer100kStats.average > 0
                      ? `${record.ratePer100kStats.average.toFixed(4)}‰`
                      : '-',
                  sorter: (a: CategoryStatistics, b: CategoryStatistics) =>
                    a.ratePer100kStats.average - b.ratePer100kStats.average,
                },
                {
                  title: '10万元保额最低费率（‰）',
                  key: 'minRate',
                  width: 180,
                  render: (_, record: CategoryStatistics) =>
                    record.ratePer100kStats.min > 0
                      ? `${record.ratePer100kStats.min.toFixed(4)}‰`
                      : '-',
                  sorter: (a: CategoryStatistics, b: CategoryStatistics) =>
                    a.ratePer100kStats.min - b.ratePer100kStats.min,
                },
                {
                  title: '10万元保额最高费率（‰）',
                  key: 'maxRate',
                  width: 180,
                  render: (_, record: CategoryStatistics) =>
                    record.ratePer100kStats.max > 0
                      ? `${record.ratePer100kStats.max.toFixed(4)}‰`
                      : '-',
                  sorter: (a: CategoryStatistics, b: CategoryStatistics) =>
                    a.ratePer100kStats.max - b.ratePer100kStats.max,
                },
              ]}
              dataSource={data.categoryStatistics}
              rowKey={(record) => record.category}
              pagination={false}
              size="small"
              scroll={{ x: 960 }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--neutral-600)' }}>
              暂无分类统计数据，请先导入历史数据
            </div>
          )}
        </StyledCard>

        {/* Charts */}
        <Row gutter={[24, 24]} style={{ marginBottom: 'var(--space-xl)' }}>
          <Col xs={24} lg={16}>
            <StyledCard
              title={
                <>
                  <LineChartOutlined />
                  趋势分析
                </>
              }
              extra={
                <Space>
                  <Button
                    type="primary"
                    icon={<GlobalOutlined />}
                    onClick={() => setSearchModalVisible(true)}
                    style={{
                      background: 'var(--primary-blue)',
                      border: 'none',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  >
                    行业洞察
                  </Button>
                  <Select
                    value={chartType}
                    onChange={setChartType}
                    style={{ width: 100 }}
                  >
                    <Option value="line">折线图</Option>
                    <Option value="bar">柱状图</Option>
                  </Select>
                </Space>
              }
            >
              <ChartContainer>
                <ReactECharts
                  option={getTrendChart()}
                  style={{ height: '400px' }}
                  className="echarts-container"
                />
              </ChartContainer>
            </StyledCard>
          </Col>

          <Col xs={24} lg={8}>
            <StyledCard
              title={
                <>
                  <PieChartOutlined />
                  工程类别保费收入
                </>
              }
            >
              <ChartContainer>
                <ReactECharts
                  option={getRiskDistributionChart()}
                  style={{ height: '400px' }}
                  className="echarts-container"
                />
              </ChartContainer>
            </StyledCard>
          </Col>
        </Row>
                </>
              ),
            },
            {
              key: 'records',
              label: (
                <span>
                  <HistoryOutlined />
                  历史承保记录
                </span>
              ),
              children: (
                <>
                  {/* Filter Panel for Records Tab */}
                  <FilterPanel
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ marginBottom: 'var(--space-lg)' }}
                  >
                    <div className="filter-row">
                      <div className="filter-item">
                        <div className="filter-label">时间范围</div>
                        <RangePicker
                          value={dateRange}
                          onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                        />
                      </div>
                      <div className="filter-item">
                        <div className="filter-label">工程类别</div>
                        <Select
                          placeholder="选择工程类别"
                          value={filters.engineeringClass}
                          onChange={(value) => setFilters({ ...filters, engineeringClass: value })}
                          allowClear
                        >
                          <Option value="1">一类工程</Option>
                          <Option value="2">二类工程</Option>
                          <Option value="3">三类工程</Option>
                          <Option value="4">四类工程</Option>
                        </Select>
                      </div>
                      <div className="filter-item">
                        <div className="filter-label">搜索项目</div>
                        <Search
                          placeholder="输入项目名称"
                          value={filters.searchText}
                          onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                          allowClear
                        />
                      </div>
                    </div>
                  </FilterPanel>

                  {/* Data Table */}
                  <StyledCard
                    title={
                      <>
                        <HistoryOutlined />
                        承保历史记录
                      </>
                    }
                  >
          <StyledTable
            columns={columns as any}
            dataSource={getFilteredRecords()}
            rowKey="id"
            rowSelection={rowSelection}
            scroll={{ x: 2900, y: 'calc(100vh - 500px)' }}
            pagination={{
              pageSize: pageSize,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
              onChange: (page, newSize) => {
                if (newSize && newSize !== pageSize) {
                  setPageSize(newSize);
                }
              },
            }}
          />
        </StyledCard>
                </>
              ),
            },
          ]}
        />

        {/* Detail Modal */}
        <DetailModal
          title={
            <Space>
              <FileTextOutlined />
              <span>项目详细信息</span>
            </Space>
          }
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
          width={900}
        >
          {selectedRecord && (
            <div style={{ padding: '8px' }}>
              {/* 项目基本信息卡片 */}
              <div style={{
                marginBottom: '20px',
                padding: '20px',
                background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)',
                borderRadius: '12px',
                border: '2px solid #91d5ff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <BankOutlined style={{ fontSize: '20px', color: '#1890ff', marginRight: 8 }} />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#262626' }}>项目基本信息</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>项目名称</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#262626' }}>
                      {selectedRecord.projectName}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>项目地点</div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#262626' }}>
                      <EnvironmentOutlined style={{ marginRight: 4, color: '#52c41a' }} />
                      {selectedRecord.location || '未填写'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>保险公司</div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#262626' }}>
                      <SafetyOutlined style={{ marginRight: 4, color: '#1890ff' }} />
                      {selectedRecord.insurer || '未填写'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>工程类别</div>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>
                      <Tag color="blue" style={{ fontSize: '13px', padding: '4px 12px' }}>
                        {selectedRecord.engineeringClass}类工程
                      </Tag>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>风险等级</div>
                    <div style={{ fontSize: '15px', fontWeight: 500 }}>
                      <Tag color={selectedRecord.riskLevel === '高' ? 'error' : selectedRecord.riskLevel === '中' ? 'warning' : 'success'}>
                        {selectedRecord.riskLevel}
                      </Tag>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>施工工期</div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#262626' }}>
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      {selectedRecord.durationDays || 0} 天
                    </div>
                  </div>
                </div>
              </div>

              {/* 财务信息卡片 */}
              <div style={{
                marginBottom: '20px',
                padding: '20px',
                background: 'linear-gradient(135deg, #fff7e6 0%, #fff9f0 100%)',
                borderRadius: '12px',
                border: '2px solid #ffd591'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <DollarOutlined style={{ fontSize: '20px', color: '#fa8c16', marginRight: 8 }} />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#262626' }}>财务信息</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>合同金额</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#262626' }}>
                      {selectedRecord.contractAmount ? `¥${selectedRecord.contractAmount.toLocaleString()}` : '-'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>总保费</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#1890ff' }}>
                      {selectedRecord.totalPremium ? `¥${selectedRecord.totalPremium.toLocaleString()}` : '-'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>综合费率</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#52c41a' }}>
                      {selectedRecord.overallRate ? `${selectedRecord.overallRate.toFixed(2)}‰` : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 保险期间卡片 */}
              <div style={{
                marginBottom: '20px',
                padding: '20px',
                background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)',
                borderRadius: '12px',
                border: '2px solid #b7eb8f'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <CalendarOutlined style={{ fontSize: '20px', color: '#52c41a', marginRight: 8 }} />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#262626' }}>保险期间</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>起保日期</div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#262626' }}>
                      {selectedRecord.startDate || '-'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>终止日期</div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#262626' }}>
                      {selectedRecord.endDate || '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 保险金额信息卡片 */}
              <div style={{
                marginBottom: '20px',
                padding: '20px',
                background: 'linear-gradient(135deg, #fff0f6 0%, #fff9f0 100%)',
                borderRadius: '12px',
                border: '2px solid #ffadd2'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <HeartOutlined style={{ fontSize: '20px', color: '#eb2f96', marginRight: 8 }} />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#262626' }}>保险金额（元/人）</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>意外伤害保险</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#262626' }}>
                      {selectedRecord.accidentInsurance ? `¥${selectedRecord.accidentInsurance.toLocaleString()}` : '-'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>医疗保险</div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#595959' }}>
                      {selectedRecord.medicalInsurance ? `¥${selectedRecord.medicalInsurance.toLocaleString()}` : '-'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>住院津贴</div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#595959' }}>
                      {selectedRecord.hospitalAllowance ? `¥${selectedRecord.hospitalAllowance.toLocaleString()}/天` : '-'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>急性病保险</div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#595959' }}>
                      {selectedRecord.acuteDiseaseInsurance ? `¥${selectedRecord.acuteDiseaseInsurance.toLocaleString()}` : '-'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>高原病保险</div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#595959' }}>
                      {selectedRecord.altitudeSicknessInsurance ? `¥${selectedRecord.altitudeSicknessInsurance.toLocaleString()}` : '-'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>10万元保额费率</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#1890ff' }}>
                      {selectedRecord.ratePer100k ? `${selectedRecord.ratePer100k.toFixed(2)}‰` : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 理赔信息卡片 */}
              <div style={{
                marginBottom: '20px',
                padding: '20px',
                background: 'linear-gradient(135deg, #fff1f0 0%, #fff9f0 100%)',
                borderRadius: '12px',
                border: '2px solid #ffa39e'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <WarningOutlined style={{ fontSize: '20px', color: '#ff4d4f', marginRight: 8 }} />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#262626' }}>理赔信息</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>已决赔款</div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: selectedRecord.settledClaims && selectedRecord.settledClaims > 0 ? '#ff4d4f' : '#52c41a'
                    }}>
                      {selectedRecord.settledClaims ? `¥${selectedRecord.settledClaims.toLocaleString()}` : '-'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>未决赔款</div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: selectedRecord.unsettledClaims && selectedRecord.unsettledClaims > 0 ? '#faad14' : '#52c41a'
                    }}>
                      {selectedRecord.unsettledClaims ? `¥${selectedRecord.unsettledClaims.toLocaleString()}` : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DetailModal>

        {/* 行业洞察搜索模态框 */}
        <DetailModal
          title={
            <Space>
              <GlobalOutlined />
              行业风险洞察
            </Space>
          }
          open={searchModalVisible}
          onCancel={() => setSearchModalVisible(false)}
          footer={null}
          width={900}
        >
          <div style={{ padding: 'var(--space-md)' }}>
            {/* 搜索输入区域 */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <Input.Search
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入行业风险分析关键词..."
                size="large"
                onSearch={handleSearchIndustryInsight}
                loading={searchLoading}
                enterButton={
                  <Button type="primary" icon={<ThunderboltOutlined />}>
                    搜索洞察
                  </Button>
                }
                style={{
                  marginBottom: 'var(--space-md)',
                }}
              />
              <Alert
                message="基于互联网搜索的行业实时风险分析"
                description="系统将从权威数据源搜索最新的建筑行业风险趋势、政策法规变化和理赔统计数据"
                type="info"
                showIcon
                icon={<GlobalOutlined />}
              />
            </div>

            {/* 搜索结果区域 */}
            {searchLoading && (
              <div style={{ textAlign: 'center', padding: 'var(--space-xxl)' }}>
                <Spin size="large" />
                <p style={{ marginTop: 'var(--space-md)', color: 'var(--neutral-600)' }}>
                  正在搜索行业数据...
                </p>
              </div>
            )}

            {!searchLoading && industryInsight && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* AI分析摘要 */}
                <Card
                  title={
                    <Space>
                      <ThunderboltOutlined style={{ color: 'var(--primary-blue)' }} />
                      <span>AI风险分析摘要</span>
                    </Space>
                  }
                  style={{
                    marginBottom: 'var(--space-lg)',
                    background: 'white',
                    border: '1px solid var(--neutral-300)',
                  }}
                >
                  <p style={{ fontSize: '1rem', lineHeight: '1.8', margin: 0 }}>
                    {industryInsight.summary}
                  </p>
                  <div style={{ marginTop: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
                    <CalendarOutlined /> 更新时间: {dayjs(industryInsight.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                </Card>

                {/* 数据来源列表 */}
                <Card
                  title={
                    <Space>
                      <SearchOutlined />
                      <span>数据来源</span>
                      <Tag color="blue">{industryInsight.sources.length} 个来源</Tag>
                    </Space>
                  }
                >
                  <List
                    dataSource={industryInsight.sources}
                    renderItem={(item, index) => (
                      <List.Item
                        key={index}
                        style={{
                          padding: 'var(--space-md)',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: index < industryInsight.sources.length - 1 ? 'var(--space-md)' : 0,
                          background: 'var(--neutral-50)',
                          border: '1px solid var(--neutral-300)',
                        }}
                      >
                        <List.Item.Meta
                          avatar={
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: 'var(--primary-blue)',
                                color: 'var(--neutral-900)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 600,
                              }}
                            >
                              {index + 1}
                            </div>
                          }
                          title={
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontWeight: 600, color: 'var(--neutral-900)' }}
                            >
                              {item.title}
                            </a>
                          }
                          description={
                            <div>
                              <p style={{ marginBottom: 'var(--space-xs)', color: 'var(--neutral-600)' }}>
                                {item.snippet}
                              </p>
                              {item.publishedDate && (
                                <Tag color="green" style={{ fontSize: '0.8rem' }}>
                                  发布于: {item.publishedDate}
                                </Tag>
                              )}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>

                {/* 操作按钮 */}
                <div style={{ marginTop: 'var(--space-lg)', textAlign: 'right' }}>
                  <Space>
                    <Button onClick={() => setSearchModalVisible(false)}>
                      关闭
                    </Button>
                    <Button
                      type="primary"
                      icon={<ExportOutlined />}
                      onClick={() => {
                        message.success('洞察报告已导出');
                      }}
                      style={{
                        background: 'var(--primary-blue)',
                        border: 'none',
                        fontWeight: 600,
                      }}
                    >
                      导出报告
                    </Button>
                  </Space>
                </div>
              </motion.div>
            )}
          </div>
        </DetailModal>

        {/* Import Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <UploadOutlined style={{ color: 'var(--primary-blue)' }} />
              <span>导入历史数据</span>
            </div>
          }
          open={importModalVisible}
          onCancel={() => {
            setImportModalVisible(false);
            setUploadFileList([]);
          }}
          footer={[
            <Button key="cancel" onClick={() => setImportModalVisible(false)}>
              取消
            </Button>,
          ]}
          width={700}
        >
          <div style={{ padding: 'var(--space-lg) 0' }}>
            <Alert
              message="导入说明"
              description={
                <div>
                  <p>请上传Excel文件（.xlsx或.xls格式），文件应包含以下列（共20列）：</p>
                  <ul style={{ margin: 'var(--space-sm) 0', paddingLeft: 'var(--space-lg)' }}>
                    <li><strong>基础信息：</strong>项目名称、项目地址、投保人</li>
                    <li><strong>合同信息：</strong>合同金额、施工合同类型、工程类别</li>
                    <li><strong>工期信息：</strong>施工工期（天）、签单日期、起保日期、终止日期</li>
                    <li><strong>保额信息：</strong>建筑施工人员意外伤害保险（元/人）</li>
                    <li><strong>附加险：</strong></li>
                    <ul style={{ margin: 'var(--space-xs) 0', paddingLeft: 'var(--space-xl)' }}>
                      <li>附加建筑施工人员意外伤害医疗保险（元/人）</li>
                      <li>附加建筑施工人员意外伤害住院津贴（元/天/人）</li>
                      <li>附加建筑施工人员急性病身故保险（元）</li>
                      <li>附加建筑施工人员高原病保险（元）</li>
                    </ul>
                    <li><strong>保费信息：</strong>保费（元）</li>
                    <li><strong>赔款信息：</strong>已决赔款（元）、未决赔款（元）</li>
                    <li><strong>费率信息：</strong>整体费率（‰）、10万元保额费率（‰）</li>
                  </ul>
                  <p style={{ color: 'var(--semantic-error)', fontWeight: 500, marginTop: 'var(--space-sm)' }}>
                    注意：导入的数据将追加到现有历史记录中
                  </p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 'var(--space-lg)' }}
            />

            <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
              <Button
                type="link"
                icon={<DownloadOutlined />}
                onClick={handleDownloadTemplate}
                style={{
                  color: 'var(--primary-blue)',
                  fontSize: '1rem',
                }}
              >
                下载Excel导入模板
              </Button>
            </div>

            <Upload.Dragger
              {...uploadProps}
              style={{
                backgroundColor: 'var(--neutral-50)',
                borderColor: 'var(--primary-blue)',
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: '3rem', color: 'var(--primary-blue)' }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: '1rem', fontWeight: 600 }}>
                点击或拖拽文件到此区域上传
              </p>
              <p className="ant-upload-hint">
                支持 .xlsx 或 .xls 格式的Excel文件，单个文件不超过 10MB
              </p>
            </Upload.Dragger>

            {importing && (
              <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center' }}>
                <Spin size="large" />
                <p style={{ marginTop: 'var(--space-md)', color: 'var(--neutral-600)' }}>
                  正在解析Excel文件，请稍候...
                </p>
              </div>
            )}
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <EditOutlined style={{ color: 'var(--primary-blue)' }} />
              <span>编辑历史记录</span>
            </div>
          }
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            setEditingRecord(null);
            editForm.resetFields();
          }}
          footer={null}
          width={800}
        >
          <div style={{ padding: 'var(--space-lg)' }}>
            <Form
              form={editForm}
              layout="vertical"
              onFinish={handleSaveEdit}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="项目名称"
                    name="projectName"
                    rules={[{ required: true, message: '请输入项目名称' }]}
                  >
                    <Input placeholder="输入项目名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="项目地址" name="location">
                    <Input placeholder="输入项目地址" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="投保人" name="insurer">
                    <Input placeholder="输入投保人" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="合同金额（元）"
                    name="contractAmount"
                    rules={[{ required: true, message: '请输入合同金额' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="输入合同金额"
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="保费（元）"
                    name="totalPremium"
                    rules={[{ required: true, message: '请输入保费' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="输入保费"
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="施工工期（天）"
                    name="durationDays"
                    rules={[{ required: true, message: '请输入施工工期' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="输入施工工期"
                      min={0}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="已决赔款（元）"
                    name="settledClaims"
                    rules={[{ required: true, message: '请输入已决赔款' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="输入已决赔款金额"
                      min={0}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="未决赔款（元）"
                    name="unsettledClaims"
                    rules={[{ required: true, message: '请输入未决赔款' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="输入未决赔款金额"
                      min={0}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="签单日期"
                    name="startDate"
                    rules={[{ required: true, message: '请选择签单日期' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="终止日期" name="endDate">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="工程类型"
                name="engineeringClassName"
                rules={[{ required: true, message: '请输入工程类型' }]}
              >
                <Input placeholder="例如：房屋建筑工程、机电工程、室内装修等" />
              </Form.Item>

              <div style={{ marginTop: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
                <strong style={{ color: 'var(--neutral-900)', marginBottom: 'var(--space-sm)', display: 'block' }}>
                  保险金额信息
                </strong>
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="意外伤害保险（元/人）" name="accidentInsurance">
                    <InputNumber style={{ width: '100%' }} placeholder="输入保额" min={0} precision={0} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="医疗保险（元/人）" name="medicalInsurance">
                    <InputNumber style={{ width: '100%' }} placeholder="输入保额" min={0} precision={0} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="住院津贴（元/天/人）" name="hospitalAllowance">
                    <InputNumber style={{ width: '100%' }} placeholder="输入保额" min={0} precision={0} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="急性病身故（元）" name="acuteDiseaseInsurance">
                    <InputNumber style={{ width: '100%' }} placeholder="输入保额" min={0} precision={0} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="高原病保险（元）" name="altitudeSicknessInsurance">
                    <InputNumber style={{ width: '100%' }} placeholder="输入保额" min={0} precision={0} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="工程类别（自动识别）" name="engineeringClass">
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ marginTop: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
                <strong style={{ color: 'var(--neutral-900)', marginBottom: 'var(--space-sm)', display: 'block' }}>
                  费率信息
                </strong>
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="整体费率（‰）" name="overallRate">
                    <InputNumber style={{ width: '100%' }} placeholder="输入整体费率" min={0} step={0.01} precision={2} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="10万元保额费率（‰）" name="ratePer100k">
                    <InputNumber style={{ width: '100%' }} placeholder="输入10万元保额费率" min={0} step={0.01} precision={2} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginTop: 'var(--space-xl)', marginBottom: 0 }}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => setEditModalVisible(false)}>
                    取消
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    style={{
                      background: 'var(--primary-blue)',
                      border: 'none',
                      fontWeight: 600,
                    }}
                  >
                    保存修改
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        </Modal>
      </motion.div>
    </PageContainer>
  );
};

export default HistoryAnalysis;