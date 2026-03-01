import React, { useState, useEffect } from 'react';
import { Card, Upload, Button, Steps, Row, Col, Alert, Input, Select, Table, Tag, Progress, message, Badge, Tabs, DatePicker, Space, Popconfirm, Modal, Typography, Collapse } from 'antd';
import { InboxOutlined, FileTextOutlined, RobotOutlined, CheckCircleOutlined, EditOutlined, WarningOutlined, HistoryOutlined, DeleteOutlined, EyeOutlined, DownloadOutlined, SearchOutlined, BankOutlined, InfoCircleOutlined, CalculatorOutlined, SafetyOutlined, HeartOutlined, ThunderboltOutlined, SettingOutlined, EnvironmentOutlined, UploadOutlined, ArrowUpOutlined, ArrowDownOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { analyzeContract, type ContractAnalysisResult } from '../../services/aiService';
import { extractTextFromFile, formatFileSize, type ParseResult } from '../../services/fileParserService';
import * as contractRecordService from '../../services/contractRecordService';
import type { ContractRecord } from '../../services/contractRecordService';
import { ConfigApiService } from '../../services/configApi';
import { projectApi } from '../../services/projectApi';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import type { UploadProps } from 'antd/es/upload';
import {
  getHistoricalRateMetrics,
  normalizeEngineeringClass,
  formatRate,
  formatRateRange,
  type HistoricalRateResult,
} from '../../utils/historicalRateUtils';

const { Dragger } = Upload;
const { Step } = Steps;
const { Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

const PageContainer = styled.div`
  max-width: 1400px;
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
    border-color: var(--primary-blue);
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

const ProcessingCard = styled(motion.div)`
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border: 2px solid #e8e8e8;
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const UploadArea = styled.div`
  margin: var(--space-md) 0;
  padding: var(--space-md);

  .ant-upload-drag {
    padding: 48px 32px !important;
  }

  .ant-upload-drag-hover {
    border-color: #1890ff !important;
    background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%) !important;
  }

  .ant-upload-drag:hover {
    border-color: #40a9ff !important;
  }

  .ant-upload {
    transition: all 0.3s ease;
  }
`;

const ExtractionResults = styled(motion.div)`
  .extraction-section {
    margin-bottom: 24px;
    padding: 20px;
    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
    border-radius: 12px;
    border: 2px solid #e8e8e8;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      border-color: #d9d9d9;
    }

    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #262626;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f0f0f0;

      .anticon {
        font-size: 18px;
        color: #1890ff;
      }

      .confidence-tag {
        margin-left: auto;
      }
    }

    .field-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      padding: 12px 16px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e8e8e8;
      transition: all 0.2s ease;

      &:hover {
        border-color: #1890ff;
        box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
      }

      .field-label {
        min-width: 120px;
        font-weight: 600;
        font-size: 14px;
        color: #595959;
      }

      .field-value {
        flex: 1;
        font-weight: 500;
        font-size: 15px;
        color: #262626;
      }

      .edit-button {
        border: none;
        background: transparent;
        color: #1890ff;
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;

        &:hover {
          background: #e6f7ff;
          transform: scale(1.05);
        }

        .anticon {
          font-size: 14px;
        }
      }
    }

    .field-row:last-child {
      margin-bottom: 0;
    }
  }
`;

const StyledSteps = styled(Steps)`
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #f6f9fc 0%, #ffffff 100%);
  border-radius: 12px;
  border: 1px solid #e8e8e8;

  .ant-steps-item-finish {
    .ant-steps-item-icon {
      background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
      border-color: #52c41a;
      box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);

      .ant-steps-icon {
        color: white;
        font-weight: 700;
      }
    }

    .ant-steps-item-title {
      color: #52c41a;
      font-weight: 600;
    }

    .ant-steps-item-description {
      color: #8c8c8c;
    }

    .ant-steps-item-tail::after {
      background: linear-gradient(90deg, #52c41a 0%, #d9f7be 100%);
    }
  }

  .ant-steps-item-process {
    .ant-steps-item-icon {
      background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
      border-color: #1890ff;
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);

      .ant-steps-icon {
        color: white;
        font-weight: 700;
      }
    }

    .ant-steps-item-title {
      color: #1890ff;
      font-weight: 700;
    }

    .ant-steps-item-description {
      color: #595959;
    }
  }

  .ant-steps-item-wait {
    .ant-steps-item-icon {
      background: #f5f5f5;
      border-color: #d9d9d9;

      .ant-steps-icon {
        color: #bfbfbf;
        font-weight: 600;
      }
    }

    .ant-steps-item-title {
      color: #8c8c8c;
      font-weight: 500;
    }

    .ant-steps-item-description {
      color: #bfbfbf;
    }
  }

  .ant-steps-item-icon {
    width: 40px;
    height: 40px;
    font-size: 16px;
    margin-top: 4px;
  }

  .ant-steps-item-title {
    font-size: 15px;
    margin-top: 8px;
  }

  .ant-steps-item-description {
    font-size: 13px;
    margin-top: 4px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #f0f0f0;
`;

const RateMetricCard = styled.div<{ color: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: linear-gradient(135deg, ${(props) => props.color === 'primary' ? '#e6f7ff 0%' : props.color === 'success' ? '#f6ffed 0%' : '#fff7e6 0%'},
    ${(props) => props.color === 'primary' ? '#f0f9ff 100%' : props.color === 'success' ? '#f0f9ff 100%' : '#fff9f0 100%'});
  border-radius: 8px;
  border: 1px solid ${(props) => props.color === 'primary' ? '#91d5ff' : props.color === 'success' ? '#b7eb8f' : '#ffd591'};
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .metric-label {
    font-size: 12px;
    color: #8c8c8c;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .metric-value {
    font-size: 20px;
    font-weight: 700;
    color: ${(props) => props.color === 'primary' ? '#1890ff' : props.color === 'success' ? '#52c41a' : '#fa8c16'};
  }

  .metric-unit {
    font-size: 12px;
    font-weight: 400;
    color: #8c8c8c;
    margin-left: 4px;
  }

  .metric-icon {
    font-size: 24px;
    margin-bottom: 8px;
    color: ${(props) => props.color === 'primary' ? '#1890ff' : props.color === 'success' ? '#52c41a' : '#fa8c16'};
  }
`;

interface Field {
  key: string;
  label: string;
  value: string | number | boolean;
  confidence?: 'high' | 'medium' | 'low';
  highlight?: boolean;
  isSelect?: boolean; // 是否为下拉框
  options?: { label: string; value: string | number | boolean }[]; // 下拉框选项
  // AI推荐相关字段
  aiRecommended?: boolean; // 是否为AI推荐
  reasoning?: string; // AI推荐理由
}

const ContractAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [parsing, setParsing] = useState(false); // 文件解析中
  const [parseProgress, setParseProgress] = useState(0); // 解析进度
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [extractedData, setExtractedData] = useState<ContractAnalysisResult | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null); // 当前解析记录的ID
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null); // 当前项目ID
  const [currentBusinessNo, setCurrentBusinessNo] = useState<string | null>(null); // 当前业务流水号

  // 业务分类相关状态
  const [businessClassifications, setBusinessClassifications] = useState<any[]>([]);

  // 加载业务分类选项
  useEffect(() => {
    const loadBusinessClassifications = async () => {
      try {
        const data = await ConfigApiService.getBusinessClassifications();
        setBusinessClassifications(data);
      } catch (error) {
        console.error('加载业务分类失败:', error);
      }
    };
    loadBusinessClassifications();
  }, []);

  // 历史记录相关状态
  const [activeTab, setActiveTab] = useState('analysis');
  const [records, setRecords] = useState<ContractRecord[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<any>(null);
  const [viewingRecord, setViewingRecord] = useState<ContractRecord | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 映射到报价相关状态
  const [mappingModalVisible, setMappingModalVisible] = useState(false);
  const [mappingPreviewData, setMappingPreviewData] = useState<any[]>([]);
  const [currentMappingRecord, setCurrentMappingRecord] = useState<ContractRecord | null>(null);

  // 历史数据相关状态（用于费率对比）
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loadingHistoricalData, setLoadingHistoricalData] = useState(false);

  // 加载历史记录
  const loadRecords = () => {
    const allRecords = contractRecordService.loadContractRecords();
    setRecords(allRecords);
  };

  // 初始加载记录
  React.useEffect(() => {
    loadRecords();
    loadHistoricalData(); // 加载历史分析数据
  }, []);

  /**
   * 加载历史分析数据（用于费率对比）
   * 从localStorage读取历史分析数据
   */
  const loadHistoricalData = async () => {
    setLoadingHistoricalData(true);
    try {
      // 从localStorage读取历史数据（与历史分析页面保持一致）
      const savedData = localStorage.getItem('historyAnalysisData');

      if (savedData) {
        const parsedData = JSON.parse(savedData);

        // 提取records字段
        if (parsedData.records && Array.isArray(parsedData.records)) {
          console.log('✅ 从localStorage加载历史数据成功:', parsedData.records.length, '条记录');
          setHistoricalData(parsedData.records);
        } else {
          console.warn('⚠️ 历史数据格式不正确，缺少records字段');
          setHistoricalData([]);
        }
      } else {
        console.warn('⚠️ localStorage中没有历史数据，请先在"历史分析"页面导入数据');
        setHistoricalData([]);
      }
    } catch (error) {
      console.error('❌ 加载历史数据失败:', error);
      setHistoricalData([]);
    } finally {
      setLoadingHistoricalData(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'contract',
    multiple: false,
    accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png',
    beforeUpload: (file) => {
      setUploadedFile(file);
      setCurrentStep(1);
      handleFileUpload(file);
      return false;
    },
    onRemove: () => {
      setUploadedFile(null);
      setCurrentStep(0);
      setExtractedData(null);
    },
  };

  const handleFileUpload = async (file: any) => {
    setUploadedFile(file);
    setCurrentStep(1);

    try {
      console.log('开始解析文件:', file.name, '大小:', formatFileSize(file.size));

      // 第一步：从文件中提取文本
      setCurrentStep(1);
      setParsing(true);
      setParseProgress(0);

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setParseProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const result = await extractTextFromFile(file);

      clearInterval(progressInterval);
      setParseProgress(100);
      setParseResult(result);

      console.log('文件解析结果:', result);

      if (!result.success) {
        message.error(`文件解析失败: ${result.error || '未知错误'}`);
        setParsing(false);
        setCurrentStep(0);
        return;
      }

      if (!result.text || result.text.trim().length === 0) {
        message.error('文件内容为空，请检查文件');
        setParsing(false);
        setCurrentStep(0);
        return;
      }

      console.log('文件文本提取成功，长度:', result.text.length);
      setParsing(false);
      setCurrentStep(2);
      setProcessing(true);

      // 第二步：调用AI分析
      try {
        console.log('开始AI合同解析...');

        const analysisResult = await analyzeContract(result.text, false);

        console.log('AI解析成功:', analysisResult);

        // 工程造价智能修正
        let correctedResult = { ...analysisResult };
        let costCorrected = false;
        const originalCost = correctedResult.projectCost;

        if (correctedResult.projectCost > 100000) {
          // 如果工程造价超过10亿元，很可能是单位识别错误
          // 尝试除以10
          correctedResult.projectCost = correctedResult.projectCost / 10;
          costCorrected = true;
          console.log(`工程造价自动修正：${originalCost.toLocaleString()} 万元 → ${correctedResult.projectCost.toLocaleString()} 万元（疑似单位识别错误）`);

          // 如果修正后仍然异常大，再除以10
          if (correctedResult.projectCost > 100000) {
            correctedResult.projectCost = correctedResult.projectCost / 10;
            console.log(`工程造价二次修正：${(originalCost / 10).toLocaleString()} 万元 → ${correctedResult.projectCost.toLocaleString()} 万元`);
          }
        }

        // 如果进行了修正，提示用户
        if (costCorrected) {
          message.warning(`工程造价已自动修正：${originalCost.toLocaleString()} 万元 → ${correctedResult.projectCost.toLocaleString()} 万元（请核对）`);
        }

        setExtractedData(correctedResult);
        setProcessing(false);
        setCurrentStep(3);

        // 保存解析记录
        const recordId = Date.now().toString();
        const record: ContractRecord = {
          id: recordId,
          fileName: file.name,
          fileSize: file.size,
          uploadTime: new Date().toISOString(),
          parseMethod: result.method,
          parseSuccess: result.success,
          analysisSuccess: true,
          data: correctedResult,
        };
        contractRecordService.saveContractRecord(record);
        setCurrentRecordId(recordId); // 保存当前记录ID
        loadRecords(); // 刷新历史记录

        // 创建项目并获取 projectId 和 businessNo
        try {
          console.log('创建项目:', correctedResult.projectName);
          const projectResponse = await projectApi.createProject(
            correctedResult.projectName,
            'contract',
            file.name
          );

          if (projectResponse.data.success && projectResponse.data.data) {
            const { project_id, business_no } = projectResponse.data.data;
            setCurrentProjectId(project_id);
            setCurrentBusinessNo(business_no);

            // 更新记录中的项目信息
            contractRecordService.updateContractRecordMetadata(recordId, {
              projectId: project_id,
              businessNo: business_no,
            });
            loadRecords();

            console.log('项目创建成功:', { project_id, business_no });
            message.success(
              `合同解析完成！项目编号：${business_no}`
            );
          }
        } catch (projectError) {
          console.error('创建项目失败:', projectError);
          message.warning('合同解析成功，但项目创建失败，请手动创建项目');
        }

        // 如果是OCR且置信度较低，给出提示
        if (result.method === 'ocr' && result.confidence && result.confidence < 70) {
          message.warning('图片识别置信度较低，建议手动核对提取的信息');
        }
      } catch (error: any) {
        console.error('AI解析失败:', error);
        setProcessing(false);
        setCurrentStep(0);

        // 提供详细的错误信息和解决方案
        if (error.message?.includes('未启用') || error.message?.includes('未配置')) {
          message.error({
            content: 'AI功能未配置，请先在"系统配置"页面配置大模型API',
            duration: 5,
          });
        } else if (error.message?.includes('API请求失败')) {
          message.error({
            content: `API请求失败: ${error.message}。请检查API密钥是否正确，或网络连接是否正常。`,
            duration: 8,
          });
        } else if (error.message?.includes('未找到JSON格式')) {
          message.error({
            content: 'AI返回的内容格式不正确，请重试或联系技术支持',
            duration: 5,
          });
        } else {
          message.error({
            content: `合同解析失败: ${error.message || '未知错误'}`,
            duration: 5,
          });
        }
      }
    } catch (error: any) {
      console.error('文件处理失败:', error);
      message.error(`文件处理失败: ${error.message}`);
      setParsing(false);
      setProcessing(false);
      setCurrentStep(0);
    }
  };

  const handleFieldEdit = (fieldName: string, value: any) => {
    if (extractedData) {
      const updatedData = {
        ...extractedData,
        [fieldName]: value,
      };
      setExtractedData(updatedData);

      // 如果有当前记录ID，同步更新历史记录
      if (currentRecordId) {
        contractRecordService.updateContractRecord(currentRecordId, {
          [fieldName]: value
        });
        // 刷新历史记录列表
        loadRecords();
      }
    }
    setEditingField(null);
  };

  const handleConfirmData = () => {
    // 检查是否有 projectId
    if (!currentProjectId) {
      message.warning('项目未创建，请重新解析合同或手动创建项目');
      return;
    }

    // 保存解析数据到 localStorage，供报价页面使用
    if (extractedData) {
      const storageKey = `contract_parse_${currentProjectId}`;
      const storageData = {
        data: extractedData,
        projectId: currentProjectId,
        businessNo: currentBusinessNo,
        fileName: uploadedFile?.name,
      };

      console.log('=== 合同解析保存到 localStorage ===');
      console.log('存储键:', storageKey);
      console.log('项目名称:', extractedData.projectName);
      console.log('施工方:', extractedData.contractors);
      console.log('项目地点:', extractedData.location);
      console.log('完整数据:', storageData);

      localStorage.setItem(storageKey, JSON.stringify(storageData));

      // 立即验证存储是否成功
      const verifyData = localStorage.getItem(storageKey);
      console.log('存储验证 - 数据存在:', !!verifyData);
      if (verifyData) {
        const parsed = JSON.parse(verifyData);
        console.log('存储验证 - projectName:', parsed.data?.projectName);
        console.log('存储验证 - contractors:', parsed.data?.contractors);
        console.log('存储验证 - location:', parsed.data?.location);
      }
    }

    // 确认成功，显示提示
    message.success('信息已确认保存！您可以从历史记录导入到智能报价模块。');

    // 返回第一步，准备上传下一个合同
    setCurrentStep(0);
    setUploadedFile(null);
    setExtractedData(null);
  };

  const getConfidenceLabel = (level: string) => {
    const map = { high: '高', medium: '中', low: '低' };
    return map[level as keyof typeof map] || level;
  };

  const getConfidenceBadge = (level: string) => {
    const color = level === 'high' ? 'success' : level === 'medium' ? 'warning' : 'error';
    return <Badge status={color as any} text={getConfidenceLabel(level)} />;
  };

  /**
   * 获取历史同类工程费率指标
   * @param engineeringClass 工程类别（1-4）
   * @param currentProjectCost 当前工程造价（万元），可选
   * @returns 历史费率指标结果
   */
  const getHistoricalRateForClass = (engineeringClass: number, currentProjectCost?: number): HistoricalRateResult => {
    console.log('=== 历史费率调试信息 ===');
    console.log('1. 工程类别输入:', engineeringClass);
    console.log('2. 是否正在加载:', loadingHistoricalData);
    console.log('3. 历史数据总数:', historicalData.length);
    console.log('4. 历史数据前3条:', historicalData.slice(0, 3));

    if (loadingHistoricalData) {
      return {
        success: false,
        error: '正在加载历史数据...',
      };
    }

    if (!historicalData || historicalData.length === 0) {
      console.log('❌ 历史数据为空');
      return {
        success: false,
        error: '暂无历史数据',
      };
    }

    const normalizedClass = normalizeEngineeringClass(engineeringClass);
    console.log('5. 归一化后的工程类别:', normalizedClass);

    if (!normalizedClass) {
      console.log('❌ 工程类别归一化失败');
      return {
        success: false,
        error: '工程类别无效',
      };
    }

    // 过滤出指定工程类别的记录
    const filteredRecords = historicalData.filter(
      (record) => {
        const matchClass = record.engineeringClass === normalizedClass;
        const hasRate = record.ratePer100k !== undefined &&
                       record.ratePer100k !== null &&
                       record.ratePer100k > 0;
        console.log(`记录: class=${record.engineeringClass}, rate=${record.ratePer100k}, 匹配=${matchClass && hasRate}`);
        return matchClass && hasRate;
      }
    );

    console.log('6. 过滤后的记录数:', filteredRecords.length);

    if (filteredRecords.length === 0) {
      console.log('❌ 没有匹配的记录');
      return {
        success: false,
        error: `暂无${engineeringClass}类工程的历史费率数据`,
      };
    }

    // 转换工程造价为元（历史数据存储的是元，传入的是万元）
    const currentProjectCostInYuan = currentProjectCost ? currentProjectCost * 10000 : undefined;

    const result = getHistoricalRateMetrics(historicalData, normalizedClass, currentProjectCostInYuan);
    console.log('7. 最终结果:', result);
    console.log('========================');
    return result;
  };

  /**
   * 渲染历史同类工程费率对比组件
   * @param engineeringClass 工程类别
   * @param currentProjectCost 当前工程造价（万元），可选
   */
  const renderHistoricalRateComparison = (engineeringClass: number, currentProjectCost?: number) => {
    const result = getHistoricalRateForClass(engineeringClass, currentProjectCost);

    // 优雅降级：显示空状态
    if (!result.success) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#8c8c8c',
          fontSize: '14px',
          background: '#fafafa',
          borderRadius: '8px',
        }}>
          <InfoCircleOutlined style={{ marginRight: 8, fontSize: '16px' }} />
          {result.error}
        </div>
      );
    }

    const { averageRate, minRate, maxRate, sampleCount, closestProject } = result.data;

    return (
      <div style={{ width: '100%' }}>
        {/* 标题和样本数 */}
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '13px', color: '#8c8c8c', fontWeight: 500 }}>
            基于 {sampleCount} 个{engineeringClass}类工程样本
          </div>
          <Tag color="blue" style={{ fontSize: '11px' }}>
            10万元保额
          </Tag>
        </div>

        {/* 三维度费率对比 - 横向展开 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          {/* 平均费率 */}
          <Col xs={24} sm={8}>
            <RateMetricCard color="primary">
              <MinusCircleOutlined className="metric-icon" />
              <div className="metric-label">平均费率</div>
              <div className="metric-value">
                {formatRate(averageRate)}
              </div>
            </RateMetricCard>
          </Col>

          {/* 最低费率 */}
          <Col xs={24} sm={8}>
            <RateMetricCard color="success">
              <ArrowDownOutlined className="metric-icon" />
              <div className="metric-label">最低费率</div>
              <div className="metric-value">
                {formatRate(minRate)}
              </div>
            </RateMetricCard>
          </Col>

          {/* 最高费率 */}
          <Col xs={24} sm={8}>
            <RateMetricCard color="warning">
              <ArrowUpOutlined className="metric-icon" />
              <div className="metric-label">最高费率</div>
              <div className="metric-value">
                {formatRate(maxRate)}
              </div>
            </RateMetricCard>
          </Col>
        </Row>

        {/* 费率区间 */}
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)',
          borderRadius: '8px',
          border: '1px dashed #b7eb8f',
          textAlign: 'center',
          fontSize: '14px',
          color: '#595959',
        }}>
          <span style={{ fontWeight: 500 }}>费率区间：</span>
          <span style={{ fontWeight: 600, color: '#1890ff', marginLeft: '4px' }}>
            {formatRateRange(minRate, maxRate)}
          </span>
        </div>

        {/* 最接近工程造价参考 - 通栏展示 */}
        {closestProject && (
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #fff7e6 0%, #fff9f0 100%)',
            borderRadius: '8px',
            border: '2px solid #ffd591',
          }}>
            <div style={{
              fontSize: '13px',
              color: '#8c8c8c',
              marginBottom: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
            }}>
              <InfoCircleOutlined style={{ marginRight: 6, color: '#fa8c16', fontSize: '15px' }} />
              最接近工程造价参考
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr',
              gap: '20px',
              alignItems: 'center',
            }}>
              {/* 项目名称 */}
              <div style={{
                padding: '10px 14px',
                background: 'white',
                borderRadius: '6px',
                border: '1px solid #ffe7ba',
              }}>
                <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '4px' }}>项目名称</div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1890ff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {closestProject.projectName}
                </div>
              </div>

              {/* 合同金额 */}
              <div style={{
                padding: '10px 14px',
                background: 'white',
                borderRadius: '6px',
                border: '1px solid #ffe7ba',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '4px' }}>合同金额</div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#fa8c16',
                }}>
                  {(closestProject.contractAmount / 10000).toFixed(2)}
                  <span style={{ fontSize: '12px', fontWeight: 400, marginLeft: '4px' }}>万元</span>
                </div>
              </div>

              {/* 10万元保额费率 */}
              <div style={{
                padding: '10px 14px',
                background: 'white',
                borderRadius: '6px',
                border: '1px solid #ffe7ba',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '4px' }}>10万元保额费率</div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#52c41a',
                }}>
                  {formatRate(closestProject.ratePer100k)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderExtractionResults = () => {
    if (!extractedData) return null;

    const sections: { title: string; icon: React.ReactNode; fields: Field[] }[] = [
      {
        title: '项目基本信息',
        icon: <FileTextOutlined />,
        fields: [
          { key: 'projectName', label: '工程名称', value: extractedData.projectName },
          {
            key: 'contractors',
            label: '施工方名称',
            value: (() => {
              if (!extractedData.contractors) return '未提取';
              // 如果是字符串，直接返回
              if (typeof extractedData.contractors === 'string') return extractedData.contractors;
              // 如果是数组，使用 join 连接
              if (Array.isArray(extractedData.contractors) && extractedData.contractors.length > 0) {
                return extractedData.contractors.join('、');
              }
              return '未提取';
            })()
          },
          {
            key: 'contractType',
            label: '施工合同类型',
            value: extractedData.contractType || '未明确',
            highlight: !!extractedData.contractType && extractedData.contractType !== '未明确',
            isSelect: true,
            options: [
              { label: '总包、专业分包（系数1.0）', value: '总包、专业分包' },
              { label: '一类工程劳务分包（系数4.0）', value: '一类工程劳务分包' },
              { label: '二类工程劳务分包（系数5.0）', value: '二类工程劳务分包' },
              { label: '三类工程劳务分包（系数6.0）', value: '三类工程劳务分包' },
              { label: '四类工程劳务分包（系数7.0）', value: '四类工程劳务分包' },
              { label: '未明确', value: '未明确' },
            ],
          },
          { key: 'location', label: '项目地点', value: extractedData.location },
          {
            key: 'businessClassification',
            label: '公司业务分类',
            value: extractedData.businessClassification?.category_name || '请选择',
            highlight: !!extractedData.businessClassification,
            // AI推荐信息
            aiRecommended: !!extractedData.businessClassification,
            confidence: extractedData.businessClassification?.confidence,
            reasoning: extractedData.businessClassification?.reasoning,
          },
        ],
      },
      {
        title: '计算基数',
        icon: <RobotOutlined />,
        fields: [
          { key: 'projectCost', label: '工程造价', value: `${extractedData.projectCost} 万元` },
          { key: 'buildingArea', label: '建筑面积', value: `${extractedData.buildingArea} ㎡` },
          {
            key: 'isRuralBuilding',
            label: '计费模式',
            value: extractedData.isRuralBuilding ? '面积型（农村自建房）' : '造价型',
            highlight: true,
            isSelect: true,
            options: [
              { label: '造价型', value: false },
              { label: '面积型（农村自建房）', value: true },
            ],
          },
        ],
      },
      {
        title: '工程分类',
        icon: <FileTextOutlined />,
        fields: [
          {
            key: 'engineeringClass',
            label: '工程类别',
            value: `${extractedData.engineeringClass}类工程`,
            highlight: true,
            isSelect: true,
            options: [
              { label: '一类工程（普通基建/装饰）', value: 1 },
              { label: '二类工程（机电/能源）', value: 2 },
              { label: '三类工程（高风险/农村）', value: 3 },
              { label: '四类工程（极高风险）', value: 4 },
            ],
          },
          { key: 'classificationReason', label: '分类依据', value: extractedData.classificationReason },
        ],
      },
      {
        title: '工程参数',
        icon: <RobotOutlined />,
        fields: [
          { key: 'duration', label: '施工工期', value: `${extractedData.duration} 天` },
          { key: 'workerCount', label: '施工人数', value: extractedData.workerCount },
        ],
      },
    ];

    return (
      <ExtractionResults
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {sections.map((section, index) => (
          <div key={index} className="extraction-section">
            <div className="section-title">
              {section.icon}
              {section.title}
            </div>
            <Row gutter={[16, 16]}>
              {section.fields.map((field) => (
                <Col key={field.key} xs={24} sm={12} md={field.key === 'classificationReason' ? 24 : 12}>
                  <div className="field-row">
                    <div className="field-label">{field.label}:</div>
                    {editingField === field.key ? (
                      field.isSelect ? (
                        <Select
                          defaultValue={field.value}
                          style={{ width: '100%' }}
                          onChange={(value) => {
                            handleFieldEdit(field.key, value);
                          }}
                          autoFocus
                          onBlur={() => setEditingField(null)}
                        >
                          {field.options?.map((option) => (
                            <Option key={String(option.value)} value={option.value}>
                              {option.label}
                            </Option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          defaultValue={String(field.value)}
                          onPressEnter={(e) => handleFieldEdit(field.key, (e.target as HTMLInputElement).value)}
                          onBlur={(e) => handleFieldEdit(field.key, e.target.value)}
                          autoFocus
                        />
                      )
                    ) : (
                      <>
                        <div className="field-value">
                          {field.key === 'businessClassification' ? (
                            // 业务分类字段：显示为下拉选择框
                            <Select
                              style={{ width: 200 }}
                              placeholder="请选择业务分类"
                              value={extractedData.businessClassification?.category_name || undefined}
                              onChange={(value) => {
                                const classification = businessClassifications.find(c => c.category_name === value);
                                if (classification) {
                                  setExtractedData({
                                    ...extractedData,
                                    businessClassification: {
                                      category_level: classification.category_level,
                                      category_name: classification.category_name,
                                      category_description: classification.category_description,
                                      underwriting_guide: classification.underwriting_guide,
                                    }
                                  });
                                }
                              }}
                            >
                              {businessClassifications.map(bc => (
                                <Option key={bc.id} value={bc.category_name}>
                                  <Tag
                                    color={
                                      bc.category_name === '鼓励类' ? 'green' :
                                      bc.category_name === '一般类' ? 'blue' :
                                      bc.category_name === '谨慎类' ? 'orange' :
                                      bc.category_name === '限制类' ? 'red' :
                                      bc.category_name === '严格限制类' ? 'purple' : 'default'
                                    }
                                    style={{ marginRight: 8 }}
                                  >
                                    {bc.category_name}
                                  </Tag>
                                  {bc.category_description}
                                </Option>
                              ))}
                            </Select>
                          ) : field.key === 'businessClassification' && field.value !== '未匹配' ? (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <Tag
                                  color={
                                    field.value === '鼓励类' ? 'green' :
                                    field.value === '一般类' ? 'blue' :
                                    field.value === '谨慎类' ? 'orange' :
                                    field.value === '限制类' ? 'red' :
                                    field.value === '严格限制类' ? 'purple' : 'default'
                                  }
                                  style={{ fontSize: '14px', padding: '4px 12px' }}
                                >
                                  <BankOutlined style={{ marginRight: 4 }} />
                                  {field.value}
                                </Tag>
                                {field.aiRecommended && (
                                  <>
                                    <Tag color="cyan" style={{ fontSize: '12px' }}>
                                      <RobotOutlined style={{ marginRight: 4 }} />
                                      AI推荐
                                    </Tag>
                                    {field.confidence && (
                                      <Badge
                                        count={field.confidence === 'high' ? '高置信' : field.confidence === 'medium' ? '中置信' : '低置信'}
                                        style={{
                                          backgroundColor:
                                            field.confidence === 'high' ? '#52c41a' :
                                            field.confidence === 'medium' ? '#faad14' : '#ff4d4f'
                                        }}
                                      />
                                    )}
                                  </>
                                )}
                              </div>
                              {field.reasoning && (
                                <div style={{
                                  marginTop: '8px',
                                  padding: '8px 12px',
                                  backgroundColor: 'rgba(24, 144, 255, 0.06)',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  color: 'var(--text-secondary)',
                                  lineHeight: '1.5'
                                }}>
                                  <InfoCircleOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
                                  {field.reasoning}
                                </div>
                              )}
                            </>
                          ) : (
                            <div
                              style={field.highlight ? { color: 'var(--accent-purple)' } : undefined}
                            >
                              {field.value}
                            </div>
                          )}
                          {field.confidence && field.key !== 'businessClassification' && (
                            <span style={{ marginLeft: '8px', fontSize: '0.85em' }}>
                              {getConfidenceBadge(field.confidence)}
                            </span>
                          )}
                        </div>
                        {field.key !== 'businessClassification' && (
                          <Button
                            className="edit-button"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => setEditingField(field.key)}
                          />
                        )}
                      </>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        ))}
      </ExtractionResults>
    );
  };

  // 历史记录操作函数
  const handleSearchRecords = () => {
    let filteredRecords = contractRecordService.searchRecordsByProjectName(searchKeyword);

    if (selectedDateRange && selectedDateRange.length === 2) {
      const [start, end] = selectedDateRange;
      filteredRecords = contractRecordService.filterRecordsByDateRange(
        filteredRecords,
        start ? start.format('YYYY-MM-DD') : undefined,
        end ? end.format('YYYY-MM-DD') : undefined
      );
    }

    setRecords(filteredRecords);
  };

  const handleResetSearch = () => {
    setSearchKeyword('');
    setSelectedDateRange(null);
    loadRecords();
  };

  const handleDeleteRecord = (id: string) => {
    if (contractRecordService.deleteContractRecord(id)) {
      message.success('删除成功');
      loadRecords();
    } else {
      message.error('删除失败');
    }
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的记录');
      return;
    }

    if (contractRecordService.batchDeleteContractRecords(selectedRowKeys as string[])) {
      message.success(`成功删除 ${selectedRowKeys.length} 条记录`);
      setSelectedRowKeys([]);
      loadRecords();
    } else {
      message.error('批量删除失败');
    }
  };

  const handleViewRecord = (record: ContractRecord) => {
    setViewingRecord(record);
    setViewModalVisible(true);
  };

  const handleLoadRecordToAnalysis = (record: ContractRecord) => {
    setExtractedData(record.data);
    setCurrentRecordId(record.id);
    setCurrentProjectId(record.projectId || null);
    setCurrentBusinessNo(record.businessNo || null);
    setCurrentStep(3);
    setViewModalVisible(false);
    setActiveTab('analysis');
    message.success('已加载记录到合同解析');
  };

  // 处理导入到报价
  const handleImportToPricing = (record: ContractRecord) => {
    const analysisData = record.data;
    if (!analysisData) {
      message.error('该记录没有解析数据，无法导入');
      return;
    }

    // 生成映射预览数据
    const mappingPreview = generateMappingPreview(analysisData);
    setMappingPreviewData(mappingPreview);
    setCurrentMappingRecord(record);
    setMappingModalVisible(true);
  };

  // 生成映射预览数据
  const generateMappingPreview = (data: ContractAnalysisResult) => {
    const preview = [
      {
        pricingField: '项目性质',
        pricingFieldKey: 'projectNature',
        contractField: 'isRuralBuilding',
        contractFieldValue: data.isRuralBuilding ? '是' : '否',
        mappedValue: data.isRuralBuilding ? '农村自建房' : '非农村建筑',
        mappedValueKey: data.isRuralBuilding ? 'rural' : 'non_rural',
        editable: false,
      },
      {
        pricingField: '计算基数(元)',
        pricingFieldKey: 'baseAmount',
        contractField: data.isRuralBuilding ? 'buildingArea' : 'projectCost',
        contractFieldValue: data.isRuralBuilding
          ? `${data.buildingArea}㎡`
          : `${data.projectCost}万元`,
        mappedValue: data.isRuralBuilding
          ? data.buildingArea.toLocaleString()
          : (data.projectCost * 10000).toLocaleString(),
        mappedValueKey: data.isRuralBuilding
          ? data.buildingArea
          : data.projectCost * 10000,
        editable: true,
      },
      {
        pricingField: '合同类型',
        pricingFieldKey: 'contractType',
        contractField: 'contractType',
        contractFieldValue: data.contractType || '未明确',
        mappedValue: getContractTypeLabel(data.contractType),
        mappedValueKey: getContractTypeValue(data.contractType),
        editable: true,
      },
      {
        pricingField: '工程分类',
        pricingFieldKey: 'engineeringClass',
        contractField: 'engineeringClass',
        contractFieldValue: `${data.engineeringClass}类`,
        mappedValue: `${data.engineeringClass}类工程`,
        mappedValueKey: data.engineeringClass,
        editable: true,
      },
      {
        pricingField: '施工工期(天)',
        pricingFieldKey: 'durationDays',
        contractField: 'duration',
        contractFieldValue: `${data.duration}天`,
        mappedValue: `${data.duration}`,
        mappedValueKey: data.duration,
        editable: true,
      },
      {
        pricingField: '施工资质',
        pricingFieldKey: 'qualification',
        contractField: '-',
        contractFieldValue: '未提取',
        mappedValue: '二级资质',
        mappedValueKey: 'grade_2',
        editable: true,
        options: [
          { label: '特级资质', value: 'special' },
          { label: '一级资质', value: 'grade_1' },
          { label: '二级资质', value: 'grade_2' },
          { label: '三级资质', value: 'grade_3' },
        ],
      },
      {
        pricingField: '风险管理水平',
        pricingFieldKey: 'riskManagementLevel',
        contractField: '-',
        contractFieldValue: '未提取',
        mappedValue: '健全',
        mappedValueKey: 'sound',
        editable: true,
        options: [
          { label: '健全', value: 'sound' },
          { label: '较健全', value: 'relatively_sound' },
          { label: '不健全', value: 'poor' },
        ],
      },
      // ========== 保险方案录入模块 ==========
      {
        pricingField: '【主险】意外伤害每人保额',
        pricingFieldKey: 'coverageAmount',
        contractField: '-',
        contractFieldValue: '未提取',
        mappedValue: '800,000',
        mappedValueKey: 800000,
        editable: true,
        fieldType: 'mainInsurance',
      },
      {
        pricingField: '【附加险】意外伤害医疗',
        pricingFieldKey: 'medicalInsuranceEnabled',
        contractField: '-',
        contractFieldValue: '未提取',
        mappedValue: '不启用',
        mappedValueKey: false,
        editable: true,
        fieldType: 'insuranceToggle',
        options: [
          { label: '不启用', value: false },
          { label: '启用', value: true },
        ],
      },
      {
        pricingField: '  └─ 医疗每人保额(元)',
        pricingFieldKey: 'medicalCoverageAmount',
        contractField: '-',
        contractFieldValue: '未提取',
        mappedValue: '20,000',
        mappedValueKey: 20000,
        editable: true,
        fieldType: 'medicalCoverage',
        dependsOn: 'medicalInsuranceEnabled',
      },
      {
        pricingField: '  └─ 免赔额(元)',
        pricingFieldKey: 'medicalDeductible',
        contractField: '-',
        contractFieldValue: '未提取',
        mappedValue: '100',
        mappedValueKey: 100,
        editable: true,
        fieldType: 'medicalDeductible',
        dependsOn: 'medicalInsuranceEnabled',
        options: [
          { label: '0元', value: 0 },
          { label: '100元', value: 100 },
          { label: '200元', value: 200 },
          { label: '300元', value: 300 },
          { label: '400元', value: 400 },
          { label: '500元', value: 500 },
          { label: '1000元', value: 1000 },
          { label: '2000元', value: 2000 },
        ],
      },
      {
        pricingField: '  └─ 赔付比例(%)',
        pricingFieldKey: 'medicalPaymentRatio',
        contractField: '-',
        contractFieldValue: '未提取',
        mappedValue: '80',
        mappedValueKey: 80,
        editable: true,
        fieldType: 'medicalPaymentRatio',
        dependsOn: 'medicalInsuranceEnabled',
        min: 50,
        max: 100,
      },
      {
        pricingField: '【附加险】住院津贴',
        pricingFieldKey: 'allowanceInsuranceEnabled',
        contractField: '-',
        contractFieldValue: '未提取',
        mappedValue: '不启用',
        mappedValueKey: false,
        editable: true,
        fieldType: 'insuranceToggle',
        options: [
          { label: '不启用', value: false },
          { label: '启用', value: true },
        ],
      },
      {
        pricingField: '  └─ 津贴(元/人/天)',
        pricingFieldKey: 'allowanceDailyAmount',
        contractField: '-',
        contractFieldValue: '未提取',
        mappedValue: '50',
        mappedValueKey: 50,
        editable: true,
        fieldType: 'allowanceDaily',
        dependsOn: 'allowanceInsuranceEnabled',
      },
      {
        pricingField: '  └─ 免赔日数(天)',
        pricingFieldKey: 'allowanceDeductibleDays',
        contractField: '-',
        contractFieldValue: '未提取',
        mappedValue: '3天',
        mappedValueKey: 3,
        editable: true,
        fieldType: 'allowanceDeductibleDays',
        dependsOn: 'allowanceInsuranceEnabled',
        options: [
          { label: '0天', value: 0 },
          { label: '3天', value: 3 },
        ],
      },
      {
        pricingField: '  └─ 每次最高给付日数(天)',
        pricingFieldKey: 'allowanceMaxDailyDays',
        contractField: '-',
        contractFieldValue: '未提取',
        mappedValue: '30',
        mappedValueKey: 30,
        editable: true,
        fieldType: 'allowanceMaxDailyDays',
        dependsOn: 'allowanceInsuranceEnabled',
        min: 15,
        max: 180,
      },
      {
        pricingField: '  └─ 累计给付日数(天)',
        pricingFieldKey: 'allowanceCumulativeDays',
        contractField: '-',
        contractFieldValue: '未提取',
        mappedValue: '180',
        mappedValueKey: 180,
        editable: true,
        fieldType: 'allowanceCumulativeDays',
        dependsOn: 'allowanceInsuranceEnabled',
        min: 90,
        max: 365,
      },
      {
        pricingField: '【附加险】突发急性病身故',
        pricingFieldKey: 'acuteDiseaseInsuranceEnabled',
        contractField: '-',
        contractFieldValue: '未提取',
        mappedValue: '不启用',
        mappedValueKey: false,
        editable: true,
        fieldType: 'insuranceToggle',
        options: [
          { label: '不启用', value: false },
          { label: '启用', value: true },
        ],
      },
      {
        pricingField: '  └─ 急性病保额(元)',
        pricingFieldKey: 'acuteDiseaseCoverageAmount',
        contractField: '-',
        contractFieldValue: '未提取',
        mappedValue: '100,000',
        mappedValueKey: 100000,
        editable: true,
        fieldType: 'acuteDiseaseCoverage',
        dependsOn: 'acuteDiseaseInsuranceEnabled',
      },
      {
        pricingField: '【附加险】高原病保险',
        pricingFieldKey: 'plateauDiseaseInsuranceEnabled',
        contractField: '-',
        contractFieldValue: '未提取',
        mappedValue: '不启用',
        mappedValueKey: false,
        editable: true,
        fieldType: 'insuranceToggle',
        options: [
          { label: '不启用', value: false },
          { label: '启用', value: true },
        ],
      },
    ];

    return preview;
  };

  // 获取合同类型标签
  const getContractTypeLabel = (contractType: string): string => {
    const typeMap: Record<string, string> = {
      '总包、专业分包': '总包、专业分包',
      '一类工程劳务分包': '一类工程劳务分包',
      '二类工程劳务分包': '二类工程劳务分包',
      '三类工程劳务分包': '三类工程劳务分包',
      '四类工程劳务分包': '四类工程劳务分包',
      '未明确': '总包、专业分包（默认）',
    };
    return typeMap[contractType] || '总包、专业分包';
  };

  // 获取合同类型枚举值
  const getContractTypeValue = (contractType: string): string => {
    const typeMap: Record<string, string> = {
      '总包、专业分包': 'general_contract',
      '一类工程劳务分包': 'labor_class_1',
      '二类工程劳务分包': 'labor_class_2',
      '三类工程劳务分包': 'labor_class_3',
      '四类工程劳务分包': 'labor_class_4',
      '未明确': 'general_contract',
    };
    return typeMap[contractType] || 'general_contract';
  };

  // 更新映射值
  const updateMappingValue = (record: any, value: any) => {
    const updated = mappingPreviewData.map(item => {
      if (item.pricingFieldKey === record.pricingFieldKey) {
        if (record.options) {
          // 如果是下拉选项，需要更新label和key
          const option = record.options.find((opt: any) => opt.value === value);
          return {
            ...item,
            mappedValue: option ? option.label : value,
            mappedValueKey: value,
          };
        }

        // 特殊处理：医疗赔付比例字段
        if (record.fieldType === 'medicalPaymentRatio') {
          const numValue = typeof value === 'string' ? parseInt(value) : value;
          return {
            ...item,
            mappedValue: value, // 保持字符串用于显示
            mappedValueKey: isNaN(numValue) ? record.mappedValueKey : numValue, // 转换为数字用于计算
          };
        }

        // 特殊处理：住院津贴日数字段（每次最高给付日数、累计给付日数）
        if (record.fieldType === 'allowanceMaxDailyDays' || record.fieldType === 'allowanceCumulativeDays') {
          const numValue = typeof value === 'string' ? parseInt(value) : value;
          return {
            ...item,
            mappedValue: value, // 保持字符串用于显示
            mappedValueKey: isNaN(numValue) ? record.mappedValueKey : numValue, // 转换为数字用于计算
          };
        }

        // 特殊处理：保额字段（移除逗号并确保是数字）
        if (record.fieldType === 'mainInsurance' || record.fieldType === 'medicalCoverage' ||
            record.fieldType === 'allowanceDaily' || record.pricingFieldKey === 'acuteDiseaseCoverageAmount') {
          // 移除所有逗号和其他非数字字符（除了小数点和负号）
          const cleanValue = typeof value === 'string' ? value.replace(/,/g, '') : value;
          const numValue = parseFloat(cleanValue);

          // 格式化显示值（添加千位分隔符）
          const formattedValue = isNaN(numValue) ? value : numValue.toLocaleString();

          return {
            ...item,
            mappedValue: formattedValue,
            mappedValueKey: isNaN(numValue) ? record.mappedValueKey : numValue,
          };
        }

        return {
          ...item,
          mappedValue: value,
          mappedValueKey: value,
        };
      }
      return item;
    });
    setMappingPreviewData(updated);
  };

  // 确认映射并导入到报价页面
  const confirmMapping = () => {
    // 构建报价参数
    const pricingParams: any = {
      // 主险参数
      mainParams: {},
      // 附加险参数
      medicalParams: {},
      allowanceParams: {},
      acuteDiseaseParams: {},
      plateauDiseaseParams: {},
    };

    mappingPreviewData.forEach(item => {
      const key = item.pricingFieldKey;
      let value = item.mappedValueKey;

      // 类型转换：数字字段需要转换为数字类型
      const numericFields = [
        'coverageAmount',           // 主险保额
        'baseAmount',               // 计算基数
        'durationDays',             // 施工工期
        'engineeringClass',         // 工程分类（1-4）
        'medicalCoverageAmount',    // 医疗保额
        'medicalDeductible',        // 医疗免赔额
        'medicalPaymentRatio',      // 医疗赔付比例
        'allowanceDailyAmount',     // 住院津贴日额
        'allowanceDeductibleDays',  // 住院津贴免赔日数
        'allowanceMaxDailyDays',    // 每次最高给付日数
        'allowanceCumulativeDays',  // 累计给付日数
        'acuteDiseaseCoverageAmount', // 急性病保额
      ];

      if (numericFields.includes(key)) {
        // 先移除字符串中的逗号等分隔符,再转换为数字
        if (typeof value === 'string') {
          value = value.replace(/,/g, ''); // 移除千位分隔符
          value = parseFloat(value);
        }
        // 确保转换成功
        if (isNaN(value)) {
          console.warn(`字段 ${key} 的值 ${item.mappedValueKey} 无法转换为数字，使用默认值`);
          // 设置默认值
          if (key === 'coverageAmount') value = 800000;
          else if (key === 'baseAmount') value = 85000000;
          else if (key === 'durationDays') value = 730;
          else if (key === 'engineeringClass') value = 1;
          else if (key === 'medicalCoverageAmount') value = 20000;
          else if (key === 'medicalDeductible') value = 100;
          else if (key === 'medicalPaymentRatio') value = 80;
          else if (key === 'allowanceDailyAmount') value = 50;
          else if (key === 'allowanceDeductibleDays') value = 3;
          else if (key === 'allowanceMaxDailyDays') value = 30;
          else if (key === 'allowanceCumulativeDays') value = 180;
          else if (key === 'acuteDiseaseCoverageAmount') value = 100000;
        }
      }

      // 主险字段
      if (key === 'coverageAmount') {
        pricingParams.mainParams.coverageAmount = value;
      }
      // 附加医疗保险字段
      else if (key === 'medicalInsuranceEnabled') {
        pricingParams.medicalParams.enabled = value;
      } else if (key === 'medicalCoverageAmount') {
        pricingParams.medicalParams.coverageAmount = value;
      } else if (key === 'medicalDeductible') {
        pricingParams.medicalParams.deductible = value;
      } else if (key === 'medicalPaymentRatio') {
        pricingParams.medicalParams.paymentRatio = value;
      }
      // 附加住院津贴字段
      else if (key === 'allowanceInsuranceEnabled') {
        pricingParams.allowanceParams.enabled = value;
      } else if (key === 'allowanceDailyAmount') {
        pricingParams.allowanceParams.dailyAmount = value;
      } else if (key === 'allowanceDeductibleDays') {
        pricingParams.allowanceParams.deductibleDays = value;
      } else if (key === 'allowanceMaxDailyDays') {
        pricingParams.allowanceParams.maxPaymentDays = value;
      } else if (key === 'allowanceCumulativeDays') {
        pricingParams.allowanceParams.totalAllowanceDays = value;
      }
      // 附加急性病身故字段
      else if (key === 'acuteDiseaseInsuranceEnabled') {
        pricingParams.acuteDiseaseParams.enabled = value;
      } else if (key === 'acuteDiseaseCoverageAmount') {
        pricingParams.acuteDiseaseParams.coverageAmount = value;
      }
      // 附加高原病字段
      else if (key === 'plateauDiseaseInsuranceEnabled') {
        pricingParams.plateauDiseaseParams.enabled = value;
      }
      // 其他主险字段
      else {
        pricingParams.mainParams[key] = value;
      }
    });

    // 获取 projectId（从当前映射记录中）
    const projectId = currentMappingRecord?.projectId;

    // 保存导入参数到 localStorage
    if (projectId) {
      localStorage.setItem(`pricing_import_${projectId}`, JSON.stringify(pricingParams));
      // 跳转到报价页面，携带 projectId
      navigate(`/pricing/${projectId}`);
    } else {
      // 如果没有 projectId，使用 URL 参数方式（兼容旧逻辑）
      navigate(`/pricing?imported=${encodeURIComponent(JSON.stringify(pricingParams))}`);
    }

    setMappingModalVisible(false);
    message.success('已导入到智能报价模块！');
  };

  const steps = [
    {
      title: '上传合同',
      description: '选择并上传合同文件',
      icon: <InboxOutlined />,
    },
    {
      title: '文件处理',
      description: '正在上传和预处理文件',
      icon: <FileTextOutlined />,
    },
    {
      title: 'AI解析',
      description: '智能提取合同关键信息',
      icon: <RobotOutlined />,
    },
    {
      title: '确认信息',
      description: '核对并修正提取的信息',
      icon: <CheckCircleOutlined />,
    },
  ];

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 页面标题区域 */}
        <div style={{
          marginBottom: '24px',
          padding: '24px 32px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <FileTextOutlined style={{ fontSize: '28px' }} />
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
                  合同智能解析
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  AI驱动 · 自动提取合同关键信息 · 智能分类
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Tag color="white" style={{
                fontSize: '13px',
                padding: '6px 16px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                fontWeight: 500
              }}>
                🤖 AI驱动
              </Tag>
              <Tag color="white" style={{
                fontSize: '13px',
                padding: '6px 16px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                fontWeight: 500
              }}>
                ⚡ 智能提取
              </Tag>
            </div>
          </div>
        </div>

        <StyledCard
          bordered={false}
          style={{ boxShadow: 'none', background: 'transparent' }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'analysis',
                label: (
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>
                    <RobotOutlined style={{ marginRight: 6 }} />
                    合同解析
                  </span>
                ),
                children: (
                  <>
                    <StyledSteps current={currentStep} items={steps} />

                    <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <UploadArea>
                  <Dragger {...uploadProps} style={{
                    background: 'linear-gradient(135deg, #f6f9fc 0%, #e9ecef 100%)',
                    border: '3px dashed #cbd5e0',
                    borderRadius: '16px'
                  }}>
                    <p className="ant-upload-drag-icon" style={{ marginBottom: '16px' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                      }}>
                        <InboxOutlined style={{ fontSize: '40px', color: 'white' }} />
                      </div>
                    </p>
                    <p className="ant-upload-text" style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#262626',
                      marginBottom: '8px'
                    }}>
                      点击或拖拽文件到此区域上传
                    </p>
                    <p className="ant-upload-hint" style={{
                      fontSize: '14px',
                      color: '#8c8c8c',
                      marginBottom: '20px'
                    }}>
                      支持 PDF、Word 文档（.doc/.docx）、图片、纯文本文件
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      justifyContent: 'center',
                      flexWrap: 'wrap'
                    }}>
                      <Tag color="blue" style={{
                        fontSize: '13px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontWeight: 500
                      }}>
                        📄 PDF
                      </Tag>
                      <Tag color="green" style={{
                        fontSize: '13px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontWeight: 500
                      }}>
                        📝 Word
                      </Tag>
                      <Tag color="orange" style={{
                        fontSize: '13px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontWeight: 500
                      }}>
                        🖼️ OCR图片识别
                      </Tag>
                      <Tag color="default" style={{
                        fontSize: '13px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontWeight: 500
                      }}>
                        📃 TXT
                      </Tag>
                    </div>
                  </Dragger>
                </UploadArea>
              </motion.div>
            )}

            {(currentStep === 1 || currentStep === 2) && (
              <ProcessingCard
                key="processing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  position: 'relative',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: '4px solid #f0f0f0',
                    borderRadius: '50%'
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: '4px solid transparent',
                    borderTopColor: '#1890ff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <RobotOutlined style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '36px',
                    color: '#1890ff'
                  }} />
                </div>
                <h3 style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  marginBottom: '12px',
                  color: '#262626'
                }}>
                  {parsing && '正在解析文件内容...'}
                  {processing && '正在使用AI智能分析合同...'}
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: '#595959',
                  marginBottom: '8px'
                }}>
                  {parsing && parseResult && (
                    <>
                      正在使用<span style={{
                        color: '#1890ff',
                        fontWeight: 600,
                        padding: '0 6px'
                      }}>
                        {parseResult.method === 'pdf' ? 'PDF解析' :
                          parseResult.method === 'word' ? 'Word文档解析' :
                          parseResult.method === 'ocr' ? 'OCR文字识别' : '文本提取'}
                      </span>
                      提取文件内容...
                    </>
                  )}
                  {processing && '使用大模型提取合同关键信息，请稍候'}
                </p>
                <p style={{
                  fontSize: '13px',
                  color: '#8c8c8c',
                  marginBottom: '24px',
                  background: '#f5f5f5',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  display: 'inline-block'
                }}>
                  {uploadedFile && `📄 ${uploadedFile.name} (${formatFileSize(uploadedFile.size)})`}
                </p>
                <Progress
                  percent={parsing ? parseProgress : (processing ? 75 : 40)}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  trailColor="#f0f0f0"
                  strokeWidth={12}
                  status={parsing || processing ? 'active' : undefined}
                  showInfo={true}
                  style={{ marginBottom: '16px' }}
                />
                {parsing && parseResult?.method === 'ocr' && (
                  <Alert
                    message="图片OCR识别需要较长时间，请耐心等待"
                    type="info"
                    showIcon
                    style={{
                      marginTop: '16px',
                      borderRadius: '8px',
                      borderLeft: '4px solid #1890ff'
                    }}
                  />
                )}
              </ProcessingCard>
            )}

            {currentStep === 3 && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* 成功提示卡片 */}
                <div style={{
                  marginBottom: '24px',
                  padding: '20px 24px',
                  background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)',
                  borderRadius: '12px',
                  border: '2px solid #b7eb8f',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <CheckCircleOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#262626', marginBottom: '4px' }}>
                      🎉 AI解析完成
                    </div>
                    <div style={{ fontSize: '14px', color: '#595959' }}>
                      请仔细核对以下提取的信息，如有错误请点击字段旁的编辑按钮进行修正
                    </div>
                  </div>
                </div>

                {renderExtractionResults()}

                <ActionButtons>
                  <Button
                    size="large"
                    icon={<UploadOutlined />}
                    onClick={() => setCurrentStep(0)}
                    style={{
                      height: '48px',
                      fontSize: '16px',
                      fontWeight: 500,
                    }}
                  >
                    重新上传
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    icon={<CalculatorOutlined />}
                    onClick={handleConfirmData}
                    style={{
                      height: '48px',
                      fontSize: '16px',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #1890ff 0%, #52c41a 100%)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)',
                    }}
                  >
                    确认信息，开始报价
                  </Button>
                </ActionButtons>
              </motion.div>
            )}
          </AnimatePresence>
                  </>
                ),
              },
              {
                key: 'history',
                label: (
                  <span>
                    <HistoryOutlined />
                    历史记录
                    {records.length > 0 && (
                      <Badge count={records.length} style={{ marginLeft: 8 }} />
                    )}
                  </span>
                ),
                children: (
                  <div>
                    {/* 搜索和筛选区域 */}
                    <div style={{ marginBottom: '16px', padding: '16px', background: 'var(--neutral-50)', borderRadius: '8px' }}>
                      <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={8}>
                          <Input
                            placeholder="搜索项目名称"
                            prefix={<SearchOutlined />}
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            onPressEnter={handleSearchRecords}
                            allowClear
                          />
                        </Col>
                        <Col xs={24} sm={8}>
                          <DatePicker.RangePicker
                            style={{ width: '100%' }}
                            value={selectedDateRange}
                            onChange={setSelectedDateRange}
                            placeholder={['开始日期', '结束日期']}
                          />
                        </Col>
                        <Col xs={24} sm={8}>
                          <Space>
                            <Button type="primary" onClick={handleSearchRecords}>
                              搜索
                            </Button>
                            <Button onClick={handleResetSearch}>
                              重置
                            </Button>
                            {selectedRowKeys.length > 0 && (
                              <Popconfirm
                                title="确定要删除选中的记录吗？"
                                onConfirm={handleBatchDelete}
                                okText="确定"
                                cancelText="取消"
                              >
                                <Button danger icon={<DeleteOutlined />}>
                                  批量删除
                                </Button>
                              </Popconfirm>
                            )}
                          </Space>
                        </Col>
                      </Row>
                    </div>

                    {/* 历史记录表格 */}
                    <Table
                      rowKey="id"
                      rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                      }}
                      columns={[
                        {
                          title: '项目名称',
                          dataIndex: ['data', 'projectName'],
                          key: 'projectName',
                          ellipsis: true,
                          width: 200,
                        },
                        {
                          title: '业务流水号',
                          dataIndex: 'businessNo',
                          key: 'businessNo',
                          width: 150,
                          render: (businessNo: string) => (
                            <Tag color="blue" style={{ fontFamily: 'monospace' }}>
                              {businessNo || '-'}
                            </Tag>
                          ),
                        },
                        {
                          title: '文件名',
                          dataIndex: 'fileName',
                          key: 'fileName',
                          ellipsis: true,
                          width: 180,
                        },
                        {
                          title: '解析方式',
                          dataIndex: 'parseMethod',
                          key: 'parseMethod',
                          width: 100,
                          render: (method: string) => {
                            const config = {
                              pdf: { color: 'blue', text: 'PDF' },
                              word: { color: 'green', text: 'Word' },
                              ocr: { color: 'orange', text: 'OCR' },
                              text: { color: 'default', text: '文本' },
                            }[method] || { color: 'default', text: method };
                            return <Tag color={config.color}>{config.text}</Tag>;
                          },
                        },
                        {
                          title: '工程类别',
                          dataIndex: ['data', 'engineeringClass'],
                          key: 'engineeringClass',
                          width: 100,
                          render: (level: number) => {
                            const config = {
                              1: { color: 'success', text: '一类' },
                              2: { color: 'processing', text: '二类' },
                              3: { color: 'warning', text: '三类' },
                              4: { color: 'error', text: '四类' },
                            }[level] || { color: 'default', text: `${level}类` };
                            return <Tag color={config.color}>{config.text}</Tag>;
                          },
                        },
                        {
                          title: '计费模式',
                          dataIndex: ['data', 'isRuralBuilding'],
                          key: 'isRuralBuilding',
                          width: 100,
                          render: (isRural: boolean) => (
                            <Tag color={isRural ? 'orange' : 'blue'}>
                              {isRural ? '面积型' : '造价型'}
                            </Tag>
                          ),
                        },
                        {
                          title: '工程造价（万元）',
                          dataIndex: ['data', 'projectCost'],
                          key: 'projectCost',
                          width: 120,
                          render: (value: number) => value?.toLocaleString() || '-',
                        },
                        {
                          title: '上传时间',
                          dataIndex: 'uploadTime',
                          key: 'uploadTime',
                          width: 160,
                          render: (time: string) => contractRecordService.formatDateTime(time),
                        },
                        {
                          title: '操作',
                          key: 'actions',
                          width: 260,
                          fixed: 'right',
                          render: (_, record) => (
                            <Space size="small">
                              <Button
                                type="primary"
                                size="small"
                                icon={<CalculatorOutlined />}
                                onClick={() => handleImportToPricing(record)}
                              >
                                导入报价
                              </Button>
                              <Button
                                type="link"
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => handleViewRecord(record)}
                              >
                                查看
                              </Button>
                              <Popconfirm
                                title="确定要删除这条记录吗？"
                                onConfirm={() => handleDeleteRecord(record.id)}
                                okText="确定"
                                cancelText="取消"
                              >
                                <Button
                                  type="link"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                >
                                  删除
                                </Button>
                              </Popconfirm>
                            </Space>
                          ),
                        },
                      ]}
                      dataSource={records}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条记录`,
                      }}
                      scroll={{ x: 1200 }}
                    />
                  </div>
                ),
              },
            ]}
          />

          {/* 查看记录详情模态框 */}
          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FileTextOutlined style={{ marginRight: 8, fontSize: '18px', color: '#1890ff' }} />
                  <span style={{ fontSize: '16px', fontWeight: 600 }}>合同解析详情</span>
                </div>
                {viewingRecord && (
                  <Tag color="blue" style={{ fontSize: '12px' }}>
                    {viewingRecord.parseMethod.toUpperCase()} 解析
                  </Tag>
                )}
              </div>
            }
            open={viewModalVisible}
            onCancel={() => setViewModalVisible(false)}
            width={1100}
            footer={[
              <Button key="close" onClick={() => setViewModalVisible(false)}>
                关闭
              </Button>,
              <Button
                key="load"
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => viewingRecord && handleLoadRecordToAnalysis(viewingRecord)}
              >
                加载到解析
              </Button>,
            ]}
            bodyStyle={{ padding: '24px', background: '#fafafa' }}
          >
            {viewingRecord && (
              <div>
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

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>项目名称</div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#262626' }}>
                        {viewingRecord.data.projectName}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>业务流水号</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#262626' }}>
                        {viewingRecord.businessNo ? (
                          <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: '13px', padding: '4px 12px' }}>
                            {viewingRecord.businessNo}
                          </Tag>
                        ) : (
                          <Tag color="default" style={{ fontSize: '12px', padding: '4px 12px' }}>
                            未生成
                          </Tag>
                        )}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>施工方</div>
                      <div style={{ fontSize: '15px', fontWeight: 500, color: '#262626' }}>
                        {(() => {
                          const contractors = viewingRecord.data.contractors;
                          if (!contractors) return '未提取';
                          // 如果是字符串，直接返回
                          if (typeof contractors === 'string') return contractors;
                          // 如果是数组，使用 join 连接
                          if (Array.isArray(contractors) && contractors.length > 0) {
                            return contractors.join('、');
                          }
                          return '未提取';
                        })()}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>项目地点</div>
                      <div style={{ fontSize: '15px', fontWeight: 500, color: '#262626' }}>
                        <EnvironmentOutlined style={{ marginRight: 4, color: '#52c41a' }} />
                        {viewingRecord.data.location || '未提取'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>上传时间</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#595959' }}>
                        {contractRecordService.formatDateTime(viewingRecord.uploadTime)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 工程信息卡片 */}
                <div style={{
                  marginBottom: '20px',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)',
                  borderRadius: '12px',
                  border: '2px solid #b7eb8f'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <SettingOutlined style={{ fontSize: '20px', color: '#52c41a', marginRight: 8 }} />
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#262626' }}>工程信息</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div style={{
                      padding: '12px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #d9f7be'
                    }}>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '6px' }}>工程类别</div>
                      <Tag color={
                        viewingRecord.data.engineeringClass === 1 ? 'success' :
                        viewingRecord.data.engineeringClass === 2 ? 'processing' :
                        viewingRecord.data.engineeringClass === 3 ? 'warning' : 'error'
                      } style={{ fontSize: '14px', padding: '4px 12px' }}>
                        {viewingRecord.data.engineeringClass}类工程
                      </Tag>
                      <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '6px' }}>
                        {viewingRecord.data.classificationReason}
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #d9f7be'
                    }}>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '6px' }}>计费模式</div>
                      <Tag color={viewingRecord.data.isRuralBuilding ? 'orange' : 'blue'} style={{ fontSize: '14px', padding: '4px 12px' }}>
                        {viewingRecord.data.isRuralBuilding ? '面积型（农村自建房）' : '造价型'}
                      </Tag>
                    </div>

                    <div style={{
                      padding: '12px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #d9f7be'
                    }}>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '6px' }}>施工工期</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#1890ff' }}>
                        {viewingRecord.data.duration}
                        <span style={{ fontSize: '12px', fontWeight: 400, color: '#8c8c8c', marginLeft: 4 }}>天</span>
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #d9f7be'
                    }}>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '6px' }}>工程造价</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#fa8c16' }}>
                        {viewingRecord.data.projectCost?.toLocaleString() || 0}
                        <span style={{ fontSize: '12px', fontWeight: 400, color: '#8c8c8c', marginLeft: 4 }}>万元</span>
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #d9f7be'
                    }}>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '6px' }}>建筑面积</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#13c2c2' }}>
                        {viewingRecord.data.buildingArea?.toLocaleString() || 0}
                        <span style={{ fontSize: '12px', fontWeight: 400, color: '#8c8c8c', marginLeft: 4 }}>㎡</span>
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #d9f7be'
                    }}>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '6px' }}>施工人数</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#722ed1' }}>
                        {viewingRecord.data.workerCount || 0}
                        <span style={{ fontSize: '12px', fontWeight: 400, color: '#8c8c8c', marginLeft: 4 }}>人</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 业务分类卡片 - 独立板块 */}
                <div style={{
                  marginBottom: '20px',
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
                  borderRadius: '12px',
                  border: '2px solid #d3adf7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <BankOutlined style={{ fontSize: '18px', color: '#722ed1', marginRight: 8 }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#262626' }}>业务分类</span>
                  </div>
                  <div>
                    <Tag color="purple" style={{ fontSize: '14px', padding: '6px 16px', fontWeight: 500 }}>
                      {viewingRecord.data.businessCategory || '未分类'}
                    </Tag>
                  </div>
                </div>

                {/* 风险评估与费率卡片 */}
                <div style={{
                  marginBottom: '20px',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #fff7e6 0%, #fff9f0 100%)',
                  borderRadius: '12px',
                  border: '2px solid #ffd591'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <WarningOutlined style={{ fontSize: '20px', color: '#fa8c16', marginRight: 8 }} />
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#262626' }}>风险评估与费率</span>
                  </div>

                  {renderHistoricalRateComparison(
                    viewingRecord.data.engineeringClass,
                    viewingRecord.data.projectCost
                  )}
                </div>

                {/* 特殊特征 */}
                {viewingRecord.data.specialFeatures && viewingRecord.data.specialFeatures.length > 0 && (
                  <div style={{
                    marginBottom: '20px',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
                    borderRadius: '12px',
                    border: '2px solid #d3adf7'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <ThunderboltOutlined style={{ fontSize: '18px', color: '#722ed1', marginRight: 8 }} />
                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#262626' }}>特殊特征</span>
                      <Tag color="purple" style={{ marginLeft: 8, fontSize: '11px' }}>
                        {viewingRecord.data.specialFeatures.length} 个
                      </Tag>
                    </div>
                    <Space wrap size="middle">
                      {viewingRecord.data.specialFeatures.map((feature, index) => (
                        <Tag
                          key={index}
                          color="purple"
                          style={{
                            fontSize: '13px',
                            padding: '6px 14px',
                            borderRadius: '16px',
                            border: '1px solid #9254de'
                          }}
                        >
                          {feature}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}

                {/* 提示信息 */}
                <Alert
                  message={
                    <Space>
                      <InfoCircleOutlined style={{ fontSize: '16px' }} />
                      <span style={{ fontWeight: 600 }}>历史记录提示</span>
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 4 }}>此记录展示历史解析结果，仅供参考。</div>
                      <div style={{ color: '#1890ff', fontWeight: 500 }}>
                        如需更新信息，请重新上传文件进行解析。
                      </div>
                    </div>
                  }
                  type="info"
                  showIcon={false}
                  style={{
                    background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)',
                    border: '1px solid #91d5ff',
                    borderRadius: '8px'
                  }}
                />
              </div>
            )}
          </Modal>

          {/* 导入报价映射预览模态框 */}
          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CalculatorOutlined style={{ marginRight: 8, fontSize: '18px', color: '#1890ff' }} />
                  <span style={{ fontSize: '16px', fontWeight: 600 }}>导入智能报价</span>
                  {currentMappingRecord && (
                    <span style={{
                      fontSize: '13px',
                      color: '#666',
                      marginLeft: 12,
                      background: '#f0f0f0',
                      padding: '4px 12px',
                      borderRadius: '12px'
                    }}>
                      {currentMappingRecord.data?.projectName || '未命名合同'}
                    </span>
                  )}
                </div>
              </div>
            }
            open={mappingModalVisible}
            onCancel={() => setMappingModalVisible(false)}
            onOk={confirmMapping}
            okText="确认导入"
            cancelText="取消"
            width={1200}
            bodyStyle={{ padding: '24px', background: '#fafafa' }}
          >
            {/* 统计信息卡片 */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '16px 20px',
                borderRadius: '12px',
                color: 'white',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>自动映射字段</div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>
                  {mappingPreviewData.filter(item => !item.editable).length}
                  <span style={{ fontSize: '14px', fontWeight: 400, marginLeft: '4px' }}>个</span>
                </div>
              </div>

              <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                padding: '16px 20px',
                borderRadius: '12px',
                color: 'white',
                boxShadow: '0 4px 12px rgba(245, 87, 108, 0.3)'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>可修改字段</div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>
                  {mappingPreviewData.filter(item => item.editable).length}
                  <span style={{ fontSize: '14px', fontWeight: 400, marginLeft: '4px' }}>个</span>
                </div>
              </div>

              <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                padding: '16px 20px',
                borderRadius: '12px',
                color: 'white',
                boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>附加险选项</div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>
                  {mappingPreviewData.filter(item => item.fieldType === 'insuranceToggle').length}
                  <span style={{ fontSize: '14px', fontWeight: 400, marginLeft: '4px' }}>个</span>
                </div>
              </div>
            </div>

            {/* 字段映射区域 */}
            <Collapse
              defaultActiveKey={['basic', 'insurance']}
              bordered={false}
              style={{ background: 'white', borderRadius: '12px' }}
            >
              {/* 基础信息 */}
              <Panel
                header={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <SettingOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    <span style={{ fontWeight: 600 }}>基础信息</span>
                    <Tag color="blue" style={{ marginLeft: 12, fontSize: '11px' }}>
                      {mappingPreviewData.filter(item => !item.pricingField.includes('【') && !item.pricingField.includes('└─')).length} 个字段
                    </Tag>
                  </div>
                }
                key="basic"
                style={{ borderBottom: '1px solid #f0f0f0' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {mappingPreviewData
                    .filter(item => !item.pricingField.includes('【') && !item.pricingField.includes('└─'))
                    .map((item) => (
                      <div
                        key={item.pricingFieldKey}
                        style={{
                          border: '1px solid #e8e8e8',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          background: item.editable ? '#fafafa' : '#f6ffed',
                          transition: 'all 0.2s',
                          borderLeft: item.editable ? '3px solid #1890ff' : '3px solid #52c41a'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {item.fieldType === 'mainInsurance' && <SafetyOutlined style={{ marginRight: 6, color: '#52c41a' }} />}
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>
                              {item.pricingField}
                            </span>
                          </div>
                          <Tag
                            color={item.editable ? 'blue' : 'green'}
                            style={{ fontSize: '11px', margin: 0 }}
                          >
                            {item.editable ? '可修改' : '已锁定'}
                          </Tag>
                        </div>

                        {item.contractField !== '-' && (
                          <div style={{ fontSize: '11px', color: '#999', marginBottom: '6px' }}>
                            来源: <span style={{ fontWeight: 500 }}>{item.contractField}</span>
                            <span style={{ marginLeft: 6, color: '#bbb' }}>→</span>
                            <span style={{ marginLeft: 6, color: '#666' }}>{item.contractFieldValue}</span>
                          </div>
                        )}

                        <div>
                          {item.fieldType === 'insuranceToggle' ? (
                            <Select
                              style={{ width: '100%' }}
                              value={item.mappedValueKey}
                              onChange={(value) => updateMappingValue(item, value)}
                              size="small"
                            >
                              {item.options?.map((opt: any) => (
                                <Option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </Option>
                              ))}
                            </Select>
                          ) : item.options ? (
                            <Select
                              style={{ width: '100%' }}
                              value={item.mappedValueKey}
                              onChange={(value) => updateMappingValue(item, value)}
                              size="small"
                            >
                              {item.options.map((opt: any) => (
                                <Option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </Option>
                              ))}
                            </Select>
                          ) : (
                            <Input
                              value={item.mappedValue}
                              onChange={(e) => updateMappingValue(item, e.target.value)}
                              disabled={!item.editable}
                              size="small"
                              style={{ fontWeight: 500 }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </Panel>

              {/* 保险方案 */}
              <Panel
                header={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <SafetyOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                    <span style={{ fontWeight: 600 }}>保险方案</span>
                    <Tag color="green" style={{ marginLeft: 12, fontSize: '11px' }}>
                      主险 + {mappingPreviewData.filter(item => item.pricingField.includes('【附加险】')).length} 个附加险
                    </Tag>
                  </div>
                }
                key="insurance"
              >
                {/* 主险 */}
                <div style={{
                  marginBottom: '16px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)',
                  borderRadius: '12px',
                  border: '2px solid #52c41a'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <SafetyOutlined style={{ fontSize: '18px', color: '#52c41a', marginRight: 8 }} />
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#262626' }}>主险保障</span>
                    <Tag color="success" style={{ marginLeft: 8 }}>必选</Tag>
                  </div>

                  {mappingPreviewData
                    .filter(item => item.fieldType === 'mainInsurance')
                    .map((item) => (
                      <div key={item.pricingFieldKey} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: '0 0 120px', fontSize: '13px', fontWeight: 600, color: '#333' }}>
                          {item.pricingField.replace('【主险】', '')}
                        </div>
                        <Input
                          value={item.mappedValue}
                          onChange={(e) => updateMappingValue(item, e.target.value)}
                          size="small"
                          style={{ flex: 1, fontWeight: 600, fontSize: '14px' }}
                          suffix={<span style={{ fontSize: '12px', color: '#999' }}>元</span>}
                        />
                      </div>
                    ))}
                </div>

                {/* 附加险 */}
                <div style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #fff7e6 0%, #fff9f0 100%)',
                  borderRadius: '12px',
                  border: '2px solid #fa8c16'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <HeartOutlined style={{ fontSize: '18px', color: '#fa8c16', marginRight: 8 }} />
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#262626' }}>附加险保障</span>
                    <Tag color="warning" style={{ marginLeft: 8 }}>可选</Tag>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {mappingPreviewData
                      .filter(item => item.pricingField.includes('【附加险】') && !item.pricingField.includes('└─'))
                      .map((item) => {
                        const childFields = mappingPreviewData.filter(f => f.dependsOn === item.pricingFieldKey);
                        const isEnabled = item.mappedValueKey === true;

                        return (
                          <div
                            key={item.pricingFieldKey}
                            style={{
                              padding: '12px',
                              background: isEnabled ? 'white' : '#fafafa',
                              borderRadius: '8px',
                              border: isEnabled ? '2px solid #1890ff' : '1px solid #e8e8e8',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isEnabled ? '12px' : 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <ThunderboltOutlined style={{ marginRight: 6, color: isEnabled ? '#1890ff' : '#d9d9d9' }} />
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                  {item.pricingField.replace('【附加险】', '')}
                                </span>
                              </div>
                              <Select
                                style={{ width: 100 }}
                                value={item.mappedValueKey}
                                onChange={(value) => updateMappingValue(item, value)}
                                size="small"
                              >
                                {item.options?.map((opt: any) => (
                                  <Option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </Option>
                                ))}
                              </Select>
                            </div>

                            {isEnabled && childFields.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {childFields.map((childField) => (
                                  <div key={childField.pricingFieldKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '24px' }}>
                                    <span style={{ fontSize: '12px', color: '#666' }}>└─</span>
                                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#666', flex: '0 0 120px' }}>
                                      {childField.pricingField.replace('└─ ', '').split('(')[0]}
                                    </span>
                                    {childField.fieldType === 'medicalDeductible' ? (
                                      <Select
                                        style={{ flex: 1, fontSize: '13px' }}
                                        value={childField.mappedValueKey}
                                        onChange={(value) => updateMappingValue(childField, value)}
                                        size="small"
                                      >
                                        {childField.options?.map((opt: any) => (
                                          <Option key={opt.value} value={opt.value}>
                                            {opt.label}
                                          </Option>
                                        ))}
                                      </Select>
                                    ) : childField.fieldType === 'medicalPaymentRatio' ? (
                                      <Input
                                        value={childField.mappedValue}
                                        onChange={(e) => {
                                          // 允许输入任何值，实时更新显示
                                          updateMappingValue(childField, e.target.value);
                                        }}
                                        onBlur={(e) => {
                                          // 失去焦点时验证并修正
                                          let val = parseInt(e.target.value);
                                          if (isNaN(val)) val = childField.mappedValueKey;
                                          if (val < childField.min) val = childField.min;
                                          if (val > childField.max) val = childField.max;
                                          updateMappingValue(childField, val);
                                        }}
                                        size="small"
                                        style={{ flex: 1, fontSize: '13px' }}
                                        suffix={<span style={{ fontSize: '11px', color: '#999' }}>%</span>}
                                        min={childField.min}
                                        max={childField.max}
                                      />
                                    ) : childField.fieldType === 'allowanceDeductibleDays' ? (
                                      <Select
                                        style={{ flex: 1, fontSize: '13px' }}
                                        value={childField.mappedValueKey}
                                        onChange={(value) => updateMappingValue(childField, value)}
                                        size="small"
                                      >
                                        {childField.options?.map((opt: any) => (
                                          <Option key={opt.value} value={opt.value}>
                                            {opt.label}
                                          </Option>
                                        ))}
                                      </Select>
                                    ) : childField.fieldType === 'allowanceMaxDailyDays' || childField.fieldType === 'allowanceCumulativeDays' ? (
                                      <Input
                                        value={childField.mappedValue}
                                        onChange={(e) => {
                                          // 允许输入任何值，实时更新显示
                                          updateMappingValue(childField, e.target.value);
                                        }}
                                        onBlur={(e) => {
                                          // 失去焦点时验证并修正
                                          let val = parseInt(e.target.value);
                                          if (isNaN(val)) val = childField.mappedValueKey;
                                          if (val < childField.min) val = childField.min;
                                          if (val > childField.max) val = childField.max;
                                          updateMappingValue(childField, val);
                                        }}
                                        size="small"
                                        style={{ flex: 1, fontSize: '13px' }}
                                        suffix={<span style={{ fontSize: '11px', color: '#999' }}>天</span>}
                                        min={childField.min}
                                        max={childField.max}
                                      />
                                    ) : (
                                      <Input
                                        value={childField.mappedValue}
                                        onChange={(e) => updateMappingValue(childField, e.target.value)}
                                        size="small"
                                        style={{ flex: 1, fontSize: '13px' }}
                                        suffix={<span style={{ fontSize: '11px', color: '#999' }}>
                                          {childField.pricingField.includes('元/人/天') ? '元/人/天' : '元'}
                                        </span>}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </Panel>
            </Collapse>

            {/* 底部提示 */}
            <div style={{
              marginTop: '20px',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)',
              borderRadius: '8px',
              border: '1px solid #91d5ff'
            }}>
              <Space>
                <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                <Text style={{ fontSize: '13px', color: '#333' }}>
                  <span style={{ fontWeight: 600 }}>提示：</span>
                  已锁定的字段为自动映射（准确度高），可修改的字段为默认值或未提取字段。
                  启用附加险后，您可以设置对应的保额。
                </Text>
              </Space>
            </div>
          </Modal>
        </StyledCard>
      </motion.div>
    </PageContainer>
  );
};

export default ContractAnalysis;