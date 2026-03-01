import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Tooltip,
  Modal,
  message,
  Popconfirm,
  Switch,
  Descriptions,
  Collapse,
  Dropdown,
  Form,
  Steps,
  InputNumber,
  Select,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  ReloadOutlined,
  EditOutlined,
  CalculatorOutlined,
  FundOutlined,
  SafetyOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  FieldNumberOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getPricingPlans,
  deletePricingPlan,
  togglePlanFavorite,
  updatePricingPlan,
  updatePricingPlanFull,
  exportPlanPDF,
  PricingPlan,
} from '../../services/pricingPlansApi';
import { getClausePdfPath } from '../../config/clauseFiles';
import {
  calculateComprehensivePricing,
} from '../../services/insuranceCalculationService';
import {
  MainInsuranceParams,
  MedicalInsuranceParams,
  AllowanceInsuranceParams,
  AcuteDiseaseInsuranceParams,
  PlateauDiseaseInsuranceParams,
  ProjectNature,
  ContractType,
  EngineeringClass,
  ConstructionQualification,
  RiskManagementLevel,
  PersonRiskLevel,
  RegionLevel,
  EnterpriseCategory,
  SocialInsuranceStatus,
  OtherInsuranceStatus,
  ComprehensivePricingResult,
} from '../../types/insurance';
import { exportToPDF, exportToImage } from '../../services/exportService';
import { exportHighFidelityPDF } from '../../services/highFidelityPdfExport';

const { Search } = Input;
const { Option } = Select;
const { Step } = Steps;

const PageContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
`;

const Header = styled.div`
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
`;

const ActionBar = styled.div`
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
`;

// 方案详情展示样式
const DetailContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'ref',
})`
  padding: 16px 0;
`;

const DetailSection = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;

  &.with-icon {
    color: #92400e;
  }
`;

const RateCardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
`;

const RateCard = styled.div`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    .card-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #92400e;
      font-weight: 500;
    }
  }

  .card-value {
    font-size: 28px;
    font-weight: 700;
    color: #78350f;
    margin-bottom: 8px;
  }

  .card-desc {
    font-size: 12px;
    color: #92400e;
    opacity: 0.85;
  }
`;

const RangeDisplayContainer = styled.div`
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const RangeCardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
`;

const RangeCard = styled.div<{ $type: 'min' | 'current' | 'max' }>`
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  border: 2px solid
    ${props =>
      props.$type === 'min'
        ? '#10b981'
        : props.$type === 'current'
        ? '#3b82f6'
        : '#ef4444'};

  .card-icon {
    font-size: 24px;
    margin-bottom: 8px;
    color: ${props =>
      props.$type === 'min'
        ? '#10b981'
        : props.$type === 'current'
        ? '#3b82f6'
        : '#ef4444'};
  }

  .card-label {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .card-value {
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .card-badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 12px;
    background: ${props =>
      props.$type === 'min'
        ? '#d1fae5'
        : props.$type === 'current'
        ? '#dbeafe'
        : '#fee2e2'};
    color: ${props =>
      props.$type === 'min'
        ? '#065f46'
        : props.$type === 'current'
        ? '#1e40af'
        : '#991b1b'};
    display: inline-block;
  }
`;

const RangeInfo = styled.div`
  text-align: center;
  font-size: 14px;
  color: #065f46;
  font-weight: 500;
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
`;

const InfoItem = styled.div`
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .label {
    color: #8c8c8c;
    font-size: 13px;
    margin-bottom: 4px;
  }

  .value {
    color: #1a1a1a;
    font-size: 15px;
    font-weight: 500;
  }
`;

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const PricingPlans: React.FC = () => {
  const navigate = useNavigate();
  // 获取 URL 参数中的 projectId（可选）
  const { projectId } = useParams<{ projectId?: string }>();

  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [keyword, setKeyword] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editStep, setEditStep] = useState(0);
  const [editForm] = Form.useForm();
  const [calculationResult, setCalculationResult] = useState<ComprehensivePricingResult | null>(null);
  const [currentViewingPlan, setCurrentViewingPlan] = useState<PricingPlan | null>(null);

  // 用于导出的容器引用 - 使用 Map 存储每个方案的 ref
  const detailRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 获取或创建 ref
  const getDetailRef = (planId: string) => (element: HTMLDivElement | null) => {
    if (element) {
      detailRefs.current.set(planId, element);
    } else {
      detailRefs.current.delete(planId);
    }
  };

  // 加载方案列表
  const loadPlans = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const response = await getPricingPlans({
        keyword: keyword || undefined,
        isFavorite: showFavoritesOnly || undefined,
        projectId: projectId || undefined, // 添加 projectId 筛选
        page,
        limit: pageSize,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      });

      setPlans(response.records);
      setPagination({
        current: response.pagination.current,
        pageSize: response.pagination.pageSize,
        total: response.pagination.total,
      });
    } catch (error) {
      message.error('加载方案列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [keyword, showFavoritesOnly, projectId]); // 添加 projectId 到依赖项

  // 监听 URL 参数中的 viewPlan 和 keyword，自动打开方案详情
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewPlanId = urlParams.get('viewPlan');
    const searchKeyword = urlParams.get('keyword');

    if (viewPlanId && plans.length > 0) {
      // 优先处理 viewPlan 参数
      const targetPlan = plans.find(plan => plan.id === viewPlanId);

      if (targetPlan) {
        // 延迟一下，确保列表已渲染
        setTimeout(() => {
          handleViewDetail(targetPlan);
          // 清除 URL 参数，避免重复触发
          navigate('/pricing-plans', { replace: true });
        }, 500);
      }
    } else if (searchKeyword && plans.length > 0) {
      // 处理 keyword 参数：搜索结果只有 1 条时，自动打开详情
      if (plans.length === 1) {
        // 只有 1 条搜索结果，自动打开详情
        setTimeout(() => {
          handleViewDetail(plans[0]);
          // 清除 URL 参数
          navigate('/pricing-plans', { replace: true });
        }, 500);
      } else {
        // 多条结果，查找精确匹配的项目名称
        const exactMatch = plans.find(plan =>
          plan.planName.toLowerCase() === searchKeyword.toLowerCase() ||
          plan.projectName?.toLowerCase() === searchKeyword.toLowerCase()
        );

        if (exactMatch) {
          setTimeout(() => {
            handleViewDetail(exactMatch);
            navigate('/pricing-plans', { replace: true });
          }, 500);
        }
      }
    }
  }, [plans]); // 依赖 plans 数组，当数据加载完成后检查

  // 删除方案
  const handleDelete = async (id: string) => {
    try {
      await deletePricingPlan(id);
      message.success('删除成功');
      loadPlans(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 切换收藏状态
  const handleToggleFavorite = async (plan: PricingPlan) => {
    try {
      console.log('切换收藏状态 - 方案ID:', plan.id, '当前状态:', plan.isFavorite);
      const result = await togglePlanFavorite(plan.id);
      console.log('切换收藏状态 - 后端返回:', result);

      // 显示成功提示
      message.success(result.isFavorite ? '已添加到收藏' : '已取消收藏');

      // 重新加载列表
      loadPlans(pagination.current, pagination.pageSize);
    } catch (error: any) {
      console.error('切换收藏状态失败:', error);
      message.error(error?.message || '操作失败，请重试');
    }
  };

  // 导出为PDF（高保真方案 - 使用 html2canvas 捕获页面）
  const handleExportToPDF = async (plan: PricingPlan) => {
    try {
      console.log('[handleExportToPDF] 开始高保真 PDF 导出，planId:', plan.id);

      // 等待 Modal 内容渲染完成
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 获取要导出的元素
      const element = detailRefs.current.get(plan.id);
      if (!element) {
        console.error('[handleExportToPDF] 找不到要导出的元素');
        message.error('无法导出，请重试');
        return;
      }

      console.log('[handleExportToPDF] 找到导出元素，开始捕获');

      // 显示加载提示
      const loadingMessage = message.loading('正在生成 PDF，请稍候...', 0);

      try {
        // 使用高保真导出（捕获页面视觉效果 + 合并条款）
        await exportHighFidelityPDF(plan.id, element, `${plan.planName}_报价单.pdf`);
        loadingMessage();
        message.success('PDF导出成功');
      } catch (error) {
        loadingMessage();
        console.error('[handleExportToPDF] 高保真导出失败:', error);
        // 如果高保真导出失败，降级到普通导出
        console.log('[handleExportToPDF] 降级到普通导出');
        await exportPlanPDF(plan.id, true);
        message.success('PDF导出成功（普通模式）');
      }
    } catch (error) {
      console.error('[handleExportToPDF] PDF导出完全失败:', error);
      message.error('PDF导出失败，请重试');
    }
  };

  // 导出为图片（保留原有功能）
  const handleExportToImage = async (plan: PricingPlan) => {
    console.log('[handleExportToImage] plan:', plan);
    console.log('[handleExportToImage] detailRefs Map:', detailRefs.current);

    // 等待 Modal 内容渲染完成
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('[handleExportToImage] 尝试获取元素，planId:', plan.id);
    console.log('[handleExportToImage] Map中的keys:', Array.from(detailRefs.current.keys()));

    const element = detailRefs.current.get(plan.id);
    if (!element) {
      console.error('[handleExportToImage] 找不到要导出的元素，planId:', plan.id);

      // 尝试使用 querySelector 作为备选方案
      const fallbackElement = document.querySelector('[data-export-container]');
      if (fallbackElement) {
        console.log('[handleExportToImage] 使用备选方案找到元素');
        try {
          await exportToImage(
            fallbackElement as HTMLElement,
            `${plan.planName}_${new Date().toLocaleDateString()}.png`
          );
          message.success('图片导出成功');
          return;
        } catch (error) {
          console.error('图片导出失败:', error);
        }
      }

      message.error('无法导出，请重试');
      return;
    }

    try {
      await exportToImage(
        element,
        `${plan.planName}_${new Date().toLocaleDateString()}.png`
      );
      message.success('图片导出成功');
    } catch (error) {
      console.error('图片导出失败:', error);
      message.error('图片导出失败，请重试');
    }
  };

  // 查看详情
  const handleViewDetail = (plan: PricingPlan) => {
    // 调试日志：检查plan对象的字段值
    console.log('=== 查看详情调试信息 ===');
    console.log('plan对象:', plan);
    console.log('plan.projectName:', plan.projectName);
    console.log('plan.projectId:', plan.projectId);
    console.log('plan.id:', plan.id);

    // 优先使用 plan 对象中保存的 contractor 和 projectLocation
    // 如果没有，再尝试从合同解析数据中获取
    let contractorFromContract = plan.contractor || '';
    let locationFromContract = plan.projectLocation || '';

    // 如果 plan 中没有这些数据，尝试从合同解析获取
    if ((!contractorFromContract || !locationFromContract) && plan.projectId) {
      const parseDataKey = `contract_parse_${plan.projectId}`;
      console.log('尝试读取合同解析数据，parseDataKey:', parseDataKey);

      const savedParseData = localStorage.getItem(parseDataKey);
      console.log('合同解析数据存在:', !!savedParseData);

      if (savedParseData) {
        try {
          const parseData = JSON.parse(savedParseData);
          console.log('合同解析数据:', parseData);
          console.log('合同解析data字段:', parseData.data);

          // 获取施工方名称（仅在 plan 中没有时才使用）
          if (!contractorFromContract && parseData.data?.contractors) {
            if (typeof parseData.data.contractors === 'string') {
              contractorFromContract = parseData.data.contractors;
            } else if (Array.isArray(parseData.data.contractors) && parseData.data.contractors.length > 0) {
              contractorFromContract = parseData.data.contractors.join('、');
            }
          }

          // 获取项目地点（仅在 plan 中没有时才使用）
          if (!locationFromContract && parseData.data?.location) {
            locationFromContract = parseData.data.location;
          }

          console.log('从合同解析获取 - 施工方:', contractorFromContract);
          console.log('从合同解析获取 - 项目地点:', locationFromContract);
        } catch (error) {
          console.error('解析合同数据失败:', error);
        }
      } else {
        console.log('未找到合同解析数据');
      }
    } else if (!plan.projectId) {
      console.log('方案没有projectId字段，无法从合同解析获取数据');
    }

    // 将数据附加到 plan 对象上
    const planWithContractData = {
      ...plan,
      contractorFromContract,
      locationFromContract,
    };

    console.log('最终方案数据:', {
      projectName: planWithContractData.projectName,
      contractorFromContract: planWithContractData.contractorFromContract,
      locationFromContract: planWithContractData.locationFromContract,
    });
    console.log('========================');

    setCurrentViewingPlan(planWithContractData);
    const { mainParams, calculationResult, medicalParams, allowanceParams, acuteDiseaseParams, plateauDiseaseParams } = planWithContractData;

    // 导出菜单项 - 在每个方案详情中单独定义，确保传递正确的 plan 对象
    const exportMenuItems: MenuProps['items'] = [
      {
        key: 'pdf',
        label: '导出为PDF',
        icon: <FilePdfOutlined />,
        onClick: () => handleExportToPDF(planWithContractData),
      },
      {
        key: 'image',
        label: '导出为图片',
        icon: <FileImageOutlined />,
        onClick: () => handleExportToImage(planWithContractData),
      },
    ];

    // 格式化货币
    const formatCurrency = (value: number) => {
      if (!value && value !== 0) return '-';
      return `¥${value.toLocaleString()}`;
    };

    // 获取项目性质名称
    const getProjectNatureName = (nature: string) => {
      return nature === 'non_rural' ? '非农村' : '农村';
    };

    // 获取合同类型名称
    const getContractTypeName = (type: string) => {
      const map: Record<string, string> = {
        general_contract: '总包/专业分包',
        labor_class_1: '一类工程劳务分包',
        labor_class_2: '二类工程劳务分包',
        labor_class_3: '三类工程劳务分包',
        labor_class_4: '四类工程劳务分包',
      };
      return map[type] || type;
    };

    Modal.info({
      title: planWithContractData.planName,
      width: 900,
      content: (
        <>
          {/* 导出按钮区域 */}
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <Dropdown menu={{ items: exportMenuItems }} trigger={['click']}>
              <Button type="primary" icon={<DownloadOutlined />}>
                导出方案
              </Button>
            </Dropdown>
          </div>
          <DetailContainer
            key={planWithContractData.id}  // 添加key强制重新渲染
            ref={getDetailRef(planWithContractData.id)}
            data-export-container="true"
          >
          {/* 费率范围分析 - 导出时排除 */}
          {calculationResult.premiumRange && (
            <DetailSection data-export-exclude="true">
              <SectionTitle className="with-icon">
                <InfoCircleOutlined />
                保费范围分析
              </SectionTitle>
              <RangeDisplayContainer>
                <RangeCardsContainer>
                  <RangeCard $type="min">
                    <div className="card-icon"><ArrowLeftOutlined /></div>
                    <div className="card-label">理论最低</div>
                    <div className="card-value">
                      {formatCurrency(calculationResult.premiumRange.minimum)}
                    </div>
                    <div className="card-badge">优惠最大</div>
                  </RangeCard>
                  <RangeCard $type="current">
                    <div className="card-icon"><FieldNumberOutlined /></div>
                    <div className="card-label">当前报价</div>
                    <div className="card-value">
                      {formatCurrency(calculationResult.totalPremium)}
                    </div>
                    <div className="card-badge">已选择</div>
                  </RangeCard>
                  <RangeCard $type="max">
                    <div className="card-icon"><ArrowRightOutlined /></div>
                    <div className="card-label">理论最高</div>
                    <div className="card-value">
                      {formatCurrency(calculationResult.premiumRange.maximum)}
                    </div>
                    <div className="card-badge">上限</div>
                  </RangeCard>
                </RangeCardsContainer>
                <RangeInfo>
                  当前配置可调区间：{formatCurrency(calculationResult.premiumRange.currentMinimum)} ~ {formatCurrency(calculationResult.premiumRange.currentMaximum)}
                </RangeInfo>
              </RangeDisplayContainer>
            </DetailSection>
          )}

          {/* 费率分析 - 导出时排除 */}
          {calculationResult.overallRateAnalysis && (
            <DetailSection data-export-exclude="true">
              <SectionTitle className="with-icon">
                <CalculatorOutlined />
                费率分析
              </SectionTitle>
              <RateCardsContainer>
                <RateCard>
                  <div className="card-header">
                    <div className="card-label">
                      <FundOutlined />
                      整体费率
                    </div>
                  </div>
                  <div className="card-value">
                    {calculationResult.overallRateAnalysis.overallRate?.toFixed(3)}‰
                  </div>
                  <div className="card-desc">
                    工程造价：{((calculationResult.overallRateAnalysis.constructionCost || 0) / 10000).toFixed(0)}万元 |{' '}
                    主险保额：{((calculationResult.overallRateAnalysis.coverageAmount || 0) / 10000).toFixed(0)}万元
                  </div>
                </RateCard>
                <RateCard>
                  <div className="card-header">
                    <div className="card-label">
                      <SafetyOutlined />
                      10万元保额费率
                    </div>
                  </div>
                  <div className="card-value">
                    {calculationResult.overallRateAnalysis.per100kCoverageRate?.toFixed(3)}‰
                  </div>
                  <div className="card-desc">标准化费率指标</div>
                </RateCard>
              </RateCardsContainer>
            </DetailSection>
          )}

          {/* 项目基本信息 */}
          <DetailSection>
            <SectionTitle>项目基本信息</SectionTitle>
            <div style={{
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #bae6fd'
            }}>
              <Descriptions column={2} size="small" bordered style={{ background: 'white' }}>
                <Descriptions.Item label="项目性质">
                  <Tag color={mainParams.projectNature === 'non_rural' ? 'blue' : 'green'}>
                    {getProjectNatureName(mainParams.projectNature)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="合同类型">
                  <Tag color="purple">{getContractTypeName(mainParams.contractType)}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="工程造价/面积">
                  <span style={{ fontWeight: 600, color: '#1a1a1a' }}>
                    {mainParams.projectNature === 'non_rural'
                      ? `${(mainParams.baseAmount / 10000).toFixed(2)}万元`
                      : `${mainParams.baseAmount}㎡`}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="工程类别">
                  <Tag color="orange">{mainParams.engineeringClass}类工程</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="施工期限">
                  <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{mainParams.durationDays}天</span>
                </Descriptions.Item>
                <Descriptions.Item label="项目名称" span={2}>
                  <span style={{ fontWeight: 600, color: '#1a1a1a' }}>
                    {planWithContractData.projectName || <span style={{ color: '#999', fontStyle: 'italic' }}>未填写</span>}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="施工方" span={2}>
                  <span style={{ fontWeight: 600, color: '#1a1a1a' }}>
                    {planWithContractData.contractorFromContract || <span style={{ color: '#999', fontStyle: 'italic' }}>未从合同解析获取</span>}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="项目地点" span={2}>
                  <span style={{ fontWeight: 600, color: '#1a1a1a' }}>
                    {planWithContractData.locationFromContract || <span style={{ color: '#999', fontStyle: 'italic' }}>未从合同解析获取</span>}
                  </span>
                </Descriptions.Item>
                {mainParams.region && (
                  <Descriptions.Item label="地区" span={2}>
                    <Tag color="cyan">{mainParams.region}</Tag>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          </DetailSection>

          {/* 保障内容 */}
          <DetailSection>
            <SectionTitle>保障内容</SectionTitle>
            <div style={{
              background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #fde047'
            }}>
              <Descriptions column={1} size="small" bordered style={{ background: 'white' }}>
                {/* 主险保额 */}
                <Descriptions.Item label={<span style={{ fontWeight: 600 }}>主险</span>}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <SafetyOutlined style={{ fontSize: '18px', color: '#f59e0b' }} />
                      <span style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>
                        每人保额 ¥{(mainParams.coverageAmount).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <a
                        href={getClausePdfPath('MAIN') || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '12px', color: '#1890ff' }}
                      >
                        <FilePdfOutlined /> 查看条款
                      </a>
                    </div>
                  </div>
                </Descriptions.Item>

                {/* 附加医疗险 */}
                {medicalParams && (
                  <Descriptions.Item label={<span style={{ fontWeight: 600 }}>附加医疗保险</span>}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <FundOutlined style={{ fontSize: '18px', color: '#10b981' }} />
                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>
                          每人保额 ¥{(medicalParams.coverageAmount || 0).toLocaleString()}
                        </span>
                        <Tag color="green" style={{ marginLeft: '8px' }}>意外伤害医疗</Tag>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginLeft: '30px', marginBottom: '8px' }}>
                        {medicalParams.deductible !== undefined && (
                          <Tag color="blue">免赔额 ¥{medicalParams.deductible.toLocaleString()}</Tag>
                        )}
                        {medicalParams.paymentRatio !== undefined && (
                          <Tag color="cyan">赔付比例 {medicalParams.paymentRatio}%</Tag>
                        )}
                      </div>
                      <div style={{ marginLeft: '30px' }}>
                        <a
                          href={getClausePdfPath('MEDICAL') || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '12px', color: '#1890ff' }}
                        >
                          <FilePdfOutlined /> 查看条款
                        </a>
                      </div>
                    </div>
                  </Descriptions.Item>
                )}

                {/* 住院津贴 */}
                {allowanceParams && (
                  <Descriptions.Item label={<span style={{ fontWeight: 600 }}>住院津贴保险</span>}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <CalculatorOutlined style={{ fontSize: '18px', color: '#3b82f6' }} />
                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>
                          {allowanceParams.dailyLimit || allowanceParams.dailyAmount || 0}元/人/天
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginLeft: '30px', marginBottom: '8px' }}>
                        {(allowanceParams.waitingDays !== undefined || allowanceParams.deductibleDays !== undefined) && (
                          <Tag color="orange">免赔{allowanceParams.waitingDays ?? allowanceParams.deductibleDays}天</Tag>
                        )}
                        {(allowanceParams.paymentDays || allowanceParams.maxPaymentDays) && (
                          <Tag color="blue">每次最高{allowanceParams.paymentDays || allowanceParams.maxPaymentDays}天</Tag>
                        )}
                        {(allowanceParams.totalAllowanceDays || allowanceParams.cumulativeDays) && (
                          <Tag color="purple">累计给付{allowanceParams.totalAllowanceDays || allowanceParams.cumulativeDays}天</Tag>
                        )}
                      </div>
                      <div style={{ marginLeft: '30px' }}>
                        <a
                          href={getClausePdfPath('ALLOWANCE') || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '12px', color: '#1890ff' }}
                        >
                          <FilePdfOutlined /> 查看条款
                        </a>
                      </div>
                    </div>
                  </Descriptions.Item>
                )}

                {/* 急性病 */}
                {acuteDiseaseParams && (
                  <Descriptions.Item label={<span style={{ fontWeight: 600 }}>突发急性病保险</span>}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <FieldNumberOutlined style={{ fontSize: '18px', color: '#ef4444' }} />
                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>
                          每人保额 ¥{(acuteDiseaseParams.coverageAmount || 0).toLocaleString()}
                        </span>
                        <Tag color="red" style={{ marginLeft: '8px' }}>突发急性病身故</Tag>
                      </div>
                      <div style={{ marginLeft: '30px' }}>
                        <a
                          href={getClausePdfPath('ACUTE_DISEASE') || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '12px', color: '#1890ff' }}
                        >
                          <FilePdfOutlined /> 查看条款
                        </a>
                      </div>
                    </div>
                  </Descriptions.Item>
                )}

                {/* 高原病 */}
                {plateauDiseaseParams && (
                  <Descriptions.Item label={<span style={{ fontWeight: 600 }}>附加高原病保险</span>}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <InfoCircleOutlined style={{ fontSize: '18px', color: '#8b5cf6' }} />
                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>
                          按保险条款约定
                        </span>
                        <Tag color="purple" style={{ marginLeft: '8px' }}>高原病</Tag>
                      </div>
                      <div style={{ marginLeft: '30px' }}>
                        <a
                          href={getClausePdfPath('PLATEAU_DISEASE') || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '12px', color: '#1890ff' }}
                        >
                          <FilePdfOutlined /> 查看条款
                        </a>
                      </div>
                    </div>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          </DetailSection>

          {/* 保费详情 */}
          <DetailSection>
            <SectionTitle>保费详情</SectionTitle>
            <div style={{
              background: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e879f9'
            }}>
              {/* 总保费卡片 */}
              <div style={{
                background: 'white',
                borderRadius: '8px',
                padding: '20px',
                borderLeft: '4px solid #a855f7'
              }}>
                <div style={{ fontSize: '13px', color: '#8c8c8c', marginBottom: '8px' }}>总保费</div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#a855f7' }}>
                  {formatCurrency(calculationResult.totalPremium)}
                </div>
              </div>
            </div>
          </DetailSection>

          {/* 方案描述 */}
          {plan.planDescription && (
            <DetailSection>
              <SectionTitle>方案描述</SectionTitle>
              <p style={{ color: '#595959', lineHeight: '1.6' }}>{plan.planDescription}</p>
            </DetailSection>
          )}

          {/* 标签和创建时间 */}
          <DetailSection>
            <InfoItem data-export-exclude="true">
              <div className="label">创建时间</div>
              <div className="value">{new Date(planWithContractData.createdAt).toLocaleString()}</div>
            </InfoItem>
            {planWithContractData.tags && planWithContractData.tags.length > 0 && (
              <InfoItem>
                <div className="label">标签</div>
                <TagContainer>
                  {planWithContractData.tags.map((tag, index) => (
                    <Tag key={index} color="blue">{tag}</Tag>
                  ))}
                </TagContainer>
              </InfoItem>
            )}
          </DetailSection>
        </DetailContainer>
        </>
      ),
    });
  };

  // 加载到计算器
  const handleLoadToCalculator = (plan: PricingPlan) => {
    // 将方案数据存储到 sessionStorage
    sessionStorage.setItem('loadedPlan', JSON.stringify(plan));

    // 尝试获取 projectId
    let targetProjectId = plan.projectId;

    // 如果方案没有 projectId，尝试从 localStorage 中查找匹配的合同解析数据
    if (!targetProjectId && plan.projectName) {
      // 遍历所有 localStorage 键，查找匹配的合同解析数据
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('contract_parse_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '');
            if (data.data?.projectName === plan.projectName) {
              targetProjectId = data.projectId;
              console.log('找到匹配的合同解析数据，projectId:', targetProjectId);
              break;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    // 导航到相应的路由
    if (targetProjectId) {
      // 同时存储 projectId 到 sessionStorage，供计算器使用
      sessionStorage.setItem('currentProjectId', targetProjectId);
      navigate(`/pricing/${targetProjectId}`);
    } else {
      navigate('/pricing-calculator');
    }

    message.success('方案已加载到计算器，请查看参数');
  };

  // 编辑方案
  const handleEdit = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setEditStep(0);

    // 如果详情Modal正在显示，关闭它以避免数据混淆
    if (currentViewingPlan) {
      setCurrentViewingPlan(null);
    }

    // 初始化表单数据
    editForm.setFieldsValue({
      planName: plan.planName,
      planDescription: plan.planDescription || '',
      projectName: plan.projectName || '',
      contractor: plan.contractor || '',
      projectLocation: plan.projectLocation || '',

      // 主险参数
      projectNature: plan.mainParams?.projectNature || ProjectNature.NON_RURAL,
      baseAmount: plan.mainParams?.baseAmount || 85000000,
      contractType: plan.mainParams?.contractType || ContractType.GENERAL_CONTRACT,
      engineeringClass: plan.mainParams?.engineeringClass || EngineeringClass.CLASS_2,
      durationDays: plan.mainParams?.durationDays || 730,
      qualification: plan.mainParams?.qualification || ConstructionQualification.GRADE_2,
      riskManagementLevel: plan.mainParams?.riskManagementLevel || RiskManagementLevel.SOUND,
      coverageAmount: plan.mainParams?.coverageAmount || 500000,

      // 医疗保险参数
      medicalEnabled: plan.medicalParams?.enabled || false,
      medicalCoverageAmount: plan.medicalParams?.coverageAmount || 20000,
      medicalDeductible: plan.medicalParams?.deductible || 100,
      medicalPaymentRatio: plan.medicalParams?.paymentRatio || 80,
      socialInsuranceStatus: plan.medicalParams?.socialInsuranceStatus || SocialInsuranceStatus.PARTICIPATED,
      otherInsuranceStatus: plan.medicalParams?.otherInsuranceStatus || OtherInsuranceStatus.NONE,

      // 住院津贴参数
      allowanceEnabled: plan.allowanceParams?.enabled || false,
      allowanceDailyAmount: plan.allowanceParams?.dailyAmount || 50,
      allowanceDeductibleDays: plan.allowanceParams?.deductibleDays || 3,
      allowanceMaxPaymentDays: plan.allowanceParams?.maxPaymentDays || 90,
      allowanceTotalDays: plan.allowanceParams?.totalAllowanceDays || 180,

      // 急性病参数
      acuteDiseaseEnabled: plan.acuteDiseaseParams?.enabled || false,
      acuteDiseaseCoverageAmount: plan.acuteDiseaseParams?.coverageAmount || 200000,
      personRiskLevel: plan.acuteDiseaseParams?.personRiskLevel || PersonRiskLevel.CLASS_B,
      regionLevel: plan.acuteDiseaseParams?.regionLevel || RegionLevel.CLASS_B,
      enterpriseCategory: plan.acuteDiseaseParams?.enterpriseCategory || EnterpriseCategory.CLASS_A,
      acuteDiseaseBaseAmount: plan.acuteDiseaseParams?.baseAmount || 8500,
      acuteDiseaseProjectNature: plan.acuteDiseaseParams?.projectNature || ProjectNature.NON_RURAL,

      // 高原病参数
      plateauDiseaseEnabled: plan.plateauDiseaseParams?.enabled || false,
      plateauDiseasePersonRiskLevel: plan.plateauDiseaseParams?.personRiskLevel || PersonRiskLevel.CLASS_B,
      plateauDiseaseRegionLevel: plan.plateauDiseaseParams?.regionLevel || RegionLevel.CLASS_B,
    });

    // 初始化计算结果
    setCalculationResult(plan.calculationResult || null);

    setEditModalVisible(true);
  };

  // 实时计算保费
  const recalculatePremium = async () => {
    try {
      const values = editForm.getFieldsValue();

      const mainParams: MainInsuranceParams = {
        projectNature: values.projectNature,
        baseAmount: values.baseAmount,
        contractType: values.contractType,
        engineeringClass: values.engineeringClass,
        durationDays: values.durationDays,
        qualification: values.qualification,
        riskManagementLevel: values.riskManagementLevel,
        coverageAmount: values.coverageAmount,
      };

      const medicalParams: MedicalInsuranceParams | undefined = values.medicalEnabled ? {
        enabled: true,
        coverageAmount: values.medicalCoverageAmount,
        deductible: values.medicalDeductible,
        paymentRatio: values.medicalPaymentRatio,
        socialInsuranceStatus: values.socialInsuranceStatus,
        otherInsuranceStatus: values.otherInsuranceStatus,
        globalFactors: {
          k3_contractType: 1,
          k4_engineeringType: 1,
          k5_durationFactor: 1,
          k6_qualificationFactor: 1,
          k7_riskManagementFactor: 1,
          k8_lossRecordFactor: 1.0,
        },
      } : undefined;

      const allowanceParams: AllowanceInsuranceParams | undefined = values.allowanceEnabled ? {
        enabled: true,
        dailyAmount: values.allowanceDailyAmount,
        deductibleDays: values.allowanceDeductibleDays,
        maxPaymentDays: values.allowanceMaxPaymentDays,
        totalAllowanceDays: values.allowanceTotalDays,
        globalFactors: {
          k3_contractType: 1,
          k4_engineeringType: 1,
          k5_durationFactor: 1,
          k6_qualificationFactor: 1,
          k7_riskManagementFactor: 1,
          k8_lossRecordFactor: 1.0,
        },
      } : undefined;

      const acuteDiseaseParams: AcuteDiseaseInsuranceParams | undefined = values.acuteDiseaseEnabled ? {
        enabled: true,
        coverageAmount: values.acuteDiseaseCoverageAmount,
        personRiskLevel: values.personRiskLevel,
        regionLevel: values.regionLevel,
        enterpriseCategory: values.enterpriseCategory,
        baseAmount: values.acuteDiseaseBaseAmount,
        projectNature: values.acuteDiseaseProjectNature,
      } : undefined;

      const plateauDiseaseParams: PlateauDiseaseInsuranceParams | undefined = values.plateauDiseaseEnabled ? {
        enabled: true,
        personRiskLevel: values.plateauDiseasePersonRiskLevel,
        regionLevel: values.plateauDiseaseRegionLevel,
        basePremium: 0,
        relatedPolicies: [],
      } : undefined;

      const result = await calculateComprehensivePricing({
        mainParams,
        medicalParams,
        allowanceParams,
        acuteDiseaseParams,
        plateauDiseaseParams,
      });

      setCalculationResult(result);
    } catch (error) {
      console.error('保费计算失败:', error);
    }
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      // 获取当前表单的值（不强制验证隐藏字段）
      const values = editForm.getFieldsValue();

      console.log('保存编辑 - 表单值:', values);
      console.log('保存编辑 - planName from form:', values.planName);
      console.log('保存编辑 - planName from editingPlan:', editingPlan?.planName);

      // 优先使用表单中的值，如果表单中没有则使用原始方案数据
      const planName = values.planName || editingPlan?.planName;

      if (!planName || !planName.trim()) {
        message.warning('方案名称不能为空');
        return;
      }

      // 验证关键字段（只在当前步骤验证可见字段）
      try {
        // 只验证当前可见步骤的字段
        const currentStepFields = editStep === 4
          ? ['baseAmount', 'coverageAmount']  // 第5步的必填字段
          : ['planName'];  // 第1步的必填字段

        // 获取当前可见的表单项并验证
        const visibleFields = currentStepFields.filter(field => {
          const fieldElements = document.querySelectorAll(`[name="${field}"]`);
          return fieldElements.length > 0;
        });

        if (visibleFields.length > 0) {
          await editForm.validateFields(visibleFields);
        }
      } catch (error) {
        console.error('表单验证失败:', error);
        message.error('请完善必填字段');
        return;
      }

      // 构建主险参数（优先使用表单值，否则使用原始数据）
      const mainParams: MainInsuranceParams = {
        projectNature: values.projectNature || editingPlan?.mainParams?.projectNature || ProjectNature.NON_RURAL,
        baseAmount: values.baseAmount || editingPlan?.mainParams?.baseAmount || 85000000,
        contractType: values.contractType || editingPlan?.mainParams?.contractType || ContractType.GENERAL_CONTRACT,
        engineeringClass: values.engineeringClass || editingPlan?.mainParams?.engineeringClass || EngineeringClass.CLASS_2,
        durationDays: values.durationDays || editingPlan?.mainParams?.durationDays || 730,
        qualification: values.qualification || editingPlan?.mainParams?.qualification || ConstructionQualification.GRADE_2,
        riskManagementLevel: values.riskManagementLevel || editingPlan?.mainParams?.riskManagementLevel || RiskManagementLevel.SOUND,
        coverageAmount: values.coverageAmount || editingPlan?.mainParams?.coverageAmount || 500000,
      };

      // 构建医疗保险参数
      const medicalParams: MedicalInsuranceParams | undefined = values.medicalEnabled ? {
        enabled: true,
        coverageAmount: values.medicalCoverageAmount,
        deductible: values.medicalDeductible,
        paymentRatio: values.medicalPaymentRatio,
        socialInsuranceStatus: values.socialInsuranceStatus,
        otherInsuranceStatus: values.otherInsuranceStatus,
        globalFactors: {
          k3_contractType: 1,
          k4_engineeringType: 1,
          k5_durationFactor: 1,
          k6_qualificationFactor: 1,
          k7_riskManagementFactor: 1,
          k8_lossRecordFactor: 1.0,
        },
      } : undefined;

      // 构建住院津贴参数
      const allowanceParams: AllowanceInsuranceParams | undefined = values.allowanceEnabled ? {
        enabled: true,
        dailyAmount: values.allowanceDailyAmount,
        deductibleDays: values.allowanceDeductibleDays,
        maxPaymentDays: values.allowanceMaxPaymentDays,
        totalAllowanceDays: values.allowanceTotalDays,
        globalFactors: {
          k3_contractType: 1,
          k4_engineeringType: 1,
          k5_durationFactor: 1,
          k6_qualificationFactor: 1,
          k7_riskManagementFactor: 1,
          k8_lossRecordFactor: 1.0,
        },
      } : undefined;

      // 构建急性病参数
      const acuteDiseaseParams: AcuteDiseaseInsuranceParams | undefined = values.acuteDiseaseEnabled ? {
        enabled: true,
        coverageAmount: values.acuteDiseaseCoverageAmount,
        personRiskLevel: values.personRiskLevel,
        regionLevel: values.regionLevel,
        enterpriseCategory: values.enterpriseCategory,
        baseAmount: values.acuteDiseaseBaseAmount,
        projectNature: values.acuteDiseaseProjectNature,
      } : undefined;

      // 构建高原病参数
      const plateauDiseaseParams: PlateauDiseaseInsuranceParams | undefined = values.plateauDiseaseEnabled ? {
        enabled: true,
        personRiskLevel: values.plateauDiseasePersonRiskLevel,
        regionLevel: values.plateauDiseaseRegionLevel,
        basePremium: 0,
        relatedPolicies: [],
      } : undefined;

      // 使用当前计算结果或重新计算
      let finalCalculationResult = calculationResult;
      if (!finalCalculationResult) {
        finalCalculationResult = await calculateComprehensivePricing({
          mainParams,
          medicalParams,
          allowanceParams,
          acuteDiseaseParams,
          plateauDiseaseParams,
        });
      }

      await updatePricingPlanFull(editingPlan!.id, {
        planName: planName.trim(),
        planDescription: (values.planDescription || editingPlan?.planDescription || '').trim(),
        projectName: (values.projectName || editingPlan?.projectName)?.trim(),
        contractor: (values.contractor || editingPlan?.contractor)?.trim(),
        projectLocation: (values.projectLocation || editingPlan?.projectLocation)?.trim(),
        mainParams,
        medicalParams,
        allowanceParams,
        acuteDiseaseParams,
        plateauDiseaseParams,
        calculationResult: finalCalculationResult,
      });

      message.success('更新成功');
      setEditModalVisible(false);
      setEditingPlan(null); // 清除编辑状态

      // 刷新列表
      await loadPlans(pagination.current, pagination.pageSize);

      // 如果详情Modal正在显示当前编辑的方案，需要刷新详情数据
      if (currentViewingPlan?.id === editingPlan!.id) {
        // 获取更新后的方案数据
        const updatedPlans = await getPricingPlans({
          page: pagination.current,
          limit: pagination.pageSize,
        });
        const updatedPlan = updatedPlans.records.find(p => p.id === editingPlan!.id);
        if (updatedPlan) {
          setCurrentViewingPlan(updatedPlan);
        }
      }
    } catch (error: any) {
      console.error('更新失败:', error);
      message.error(error?.message || '更新失败');
    }
  };

  // 下一步
  const nextStep = () => {
    editForm.validateFields().then(() => {
      setEditStep(editStep + 1);
    });
  };

  // 上一步
  const prevStep = () => {
    setEditStep(editStep - 1);
  };

  const columns = [
    {
      title: '方案名称',
      dataIndex: 'planName',
      key: 'planName',
      width: 250,
      ellipsis: true,
      render: (text: string, record: PricingPlan) => (
        <Space>
          {record.isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '总保费',
      dataIndex: ['calculationResult', 'totalPremium'],
      key: 'totalPremium',
      width: 120,
      render: (value: number) => `¥${value?.toLocaleString()}`,
    },
    {
      title: '工程造价',
      dataIndex: ['mainParams', 'baseAmount'],
      key: 'baseAmount',
      width: 120,
      render: (value: number) => `${(value / 10000).toFixed(0)}万`,
    },
    {
      title: '工程类别',
      dataIndex: ['mainParams', 'engineeringClass'],
      key: 'engineeringClass',
      width: 100,
      render: (value: number) => `${value}类`,
    },
    {
      title: '附加险',
      key: 'additionalInsurances',
      width: 150,
      render: (_: any, record: PricingPlan) => {
        const items = [];
        if (record.medicalParams) items.push('医疗');
        if (record.allowanceParams) items.push('住院津贴');
        if (record.acuteDiseaseParams) items.push('急性病');
        if (record.plateauDiseaseParams) items.push('高原病');
        return items.length > 0 ? items.join('、') : '无';
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: PricingPlan) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="加载到计算器">
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => handleLoadToCalculator(record)}
            />
          </Tooltip>
          <Tooltip title={record.isFavorite ? '取消收藏' : '收藏'}>
            <Button
              type="text"
              icon={record.isFavorite ? <StarFilled /> : <StarOutlined />}
              onClick={() => handleToggleFavorite(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个方案吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <Header>
        <Title>我的报价方案</Title>
      </Header>

      <Card>
        <ActionBar>
          <Search
            placeholder="搜索方案名称"
            allowClear
            style={{ width: 300 }}
            onSearch={setKeyword}
            enterButton={<SearchOutlined />}
          />
          <Space>
            <span>只看收藏：</span>
            <Switch
              checked={showFavoritesOnly}
              onChange={setShowFavoritesOnly}
            />
          </Space>
        </ActionBar>

        <Table
          columns={columns}
          dataSource={plans}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              loadPlans(page, pageSize);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 编辑方案弹窗 - 分步表单 */}
      <Modal
        title="编辑报价方案"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingPlan(null);
          setCalculationResult(null);
        }}
        footer={null}
        width={900}
        style={{ top: 20 }}
      >
        <Form form={editForm} layout="vertical">
          <Steps current={editStep} style={{ marginBottom: 24 }}>
            <Step title="方案信息" />
            <Step title="项目基本信息" />
            <Step title="主险保障" />
            <Step title="附加保障" />
            <Step title="完成" />
          </Steps>

          {/* 步骤1: 方案信息 */}
          {editStep === 0 && (
            <div>
              <Form.Item
                label="方案名称"
                name="planName"
                rules={[{ required: true, message: '请输入方案名称' }]}
              >
                <Input maxLength={200} showCount />
              </Form.Item>

              <Form.Item label="方案描述" name="planDescription">
                <Input.TextArea rows={4} maxLength={1000} showCount />
              </Form.Item>

              <Form.Item label="项目名称" name="projectName">
                <Input placeholder="选填" />
              </Form.Item>

              <Form.Item label="施工方" name="contractor">
                <Input placeholder="选填" />
              </Form.Item>

              <Form.Item label="项目地点" name="projectLocation">
                <Input placeholder="选填" />
              </Form.Item>

              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Button onClick={() => setEditModalVisible(false)}>
                  取消
                </Button>
                <Button type="primary" onClick={nextStep}>
                  下一步
                </Button>
              </div>
            </div>
          )}

          {/* 步骤2: 项目基本信息 */}
          {editStep === 1 && (
            <div>
              <Form.Item
                label="项目性质"
                name="projectNature"
                rules={[{ required: true, message: '请选择项目性质' }]}
              >
                <Select>
                  <Option value={ProjectNature.NON_RURAL}>非农村</Option>
                  <Option value={ProjectNature.RURAL}>农村</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="工程造价(元)"
                name="baseAmount"
                rules={[
                  { required: true, message: '请输入工程造价' },
                  { type: 'number', min: 1, message: '工程造价必须大于0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={10000}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value ? parseFloat(value.replace(/\$\s?|(,*)/g, '')) : 0 as any}
                  onChange={recalculatePremium}
                />
              </Form.Item>

              <Form.Item
                label="合同类型"
                name="contractType"
                rules={[{ required: true, message: '请选择合同类型' }]}
              >
                <Select onChange={recalculatePremium}>
                  <Option value={ContractType.GENERAL_CONTRACT}>总包/专业分包</Option>
                  <Option value={ContractType.LABOR_CLASS_1}>一类工程劳务分包</Option>
                  <Option value={ContractType.LABOR_CLASS_2}>二类工程劳务分包</Option>
                  <Option value={ContractType.LABOR_CLASS_3}>三类工程劳务分包</Option>
                  <Option value={ContractType.LABOR_CLASS_4}>四类工程劳务分包</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="工程类别"
                name="engineeringClass"
                rules={[{ required: true, message: '请选择工程类别' }]}
              >
                <Select onChange={recalculatePremium}>
                  <Option value={EngineeringClass.CLASS_1}>一类工程</Option>
                  <Option value={EngineeringClass.CLASS_2}>二类工程</Option>
                  <Option value={EngineeringClass.CLASS_3}>三类工程</Option>
                  <Option value={EngineeringClass.CLASS_4}>四类工程</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="施工期限(天)"
                name="durationDays"
                rules={[{ required: true, message: '请输入施工期限' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={3650}
                  onChange={recalculatePremium}
                />
              </Form.Item>

              <Form.Item
                label="施工企业资质"
                name="qualification"
                rules={[{ required: true, message: '请选择施工企业资质' }]}
              >
                <Select onChange={recalculatePremium}>
                  <Option value={ConstructionQualification.SPECIAL}>特级</Option>
                  <Option value={ConstructionQualification.GRADE_1}>一级</Option>
                  <Option value={ConstructionQualification.GRADE_2}>二级</Option>
                  <Option value={ConstructionQualification.GRADE_3}>三级</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="风险管理水平"
                name="riskManagementLevel"
                rules={[{ required: true, message: '请选择风险管理水平' }]}
              >
                <Select onChange={recalculatePremium}>
                  <Option value={RiskManagementLevel.SOUND}>健全</Option>
                  <Option value={RiskManagementLevel.RELATIVELY_SOUND}>较健全</Option>
                  <Option value={RiskManagementLevel.POOR}>不健全</Option>
                </Select>
              </Form.Item>

              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Button onClick={prevStep}>上一步</Button>
                <Button type="primary" onClick={nextStep}>
                  下一步
                </Button>
              </div>
            </div>
          )}

          {/* 步骤3: 主险保障 */}
          {editStep === 2 && (
            <div>
              <Form.Item
                label="主险保额(元/人)"
                name="coverageAmount"
                rules={[
                  { required: true, message: '请输入主险保额' },
                  { type: 'number', min: 10000, message: '保额不能低于1万元' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={10000}
                  step={10000}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value ? parseFloat(value.replace(/\$\s?|(,*)/g, '')) : 10000 as any}
                  onChange={recalculatePremium}
                />
              </Form.Item>

              <Divider />

              {calculationResult && (
                <div>
                  <h4>保费预览</h4>
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="主险保费">
                      ¥{calculationResult.mainInsurance?.premium?.toLocaleString() || 0}
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              )}

              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Button onClick={prevStep}>上一步</Button>
                <Button type="primary" onClick={nextStep}>
                  下一步
                </Button>
              </div>
            </div>
          )}

          {/* 步骤4: 附加保障 */}
          {editStep === 3 && (
            <div>
              <h4>附加医疗保险</h4>
              <Form.Item label="启用医疗保险" name="medicalEnabled" valuePropName="checked">
                <Switch onChange={recalculatePremium} />
              </Form.Item>

              <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.medicalEnabled !== currentValues.medicalEnabled}>
                {({ getFieldValue }) =>
                  getFieldValue('medicalEnabled') ? (
                    <>
                      <Form.Item label="医疗保额(元/人)" name="medicalCoverageAmount">
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          step={1000}
                          onChange={recalculatePremium}
                        />
                      </Form.Item>

                      <Form.Item label="免赔额(元)" name="medicalDeductible">
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          onChange={recalculatePremium}
                        />
                      </Form.Item>

                      <Form.Item label="赔付比例(%)" name="medicalPaymentRatio">
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          max={100}
                          onChange={recalculatePremium}
                        />
                      </Form.Item>
                    </>
                  ) : null
                }
              </Form.Item>

              <Divider />

              <h4>住院津贴保险</h4>
              <Form.Item label="启用住院津贴" name="allowanceEnabled" valuePropName="checked">
                <Switch onChange={recalculatePremium} />
              </Form.Item>

              <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.allowanceEnabled !== currentValues.allowanceEnabled}>
                {({ getFieldValue }) =>
                  getFieldValue('allowanceEnabled') ? (
                    <>
                      <Form.Item label="日津贴(元/人/天)" name="allowanceDailyAmount">
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          onChange={recalculatePremium}
                        />
                      </Form.Item>

                      <Form.Item label="免赔天数" name="allowanceDeductibleDays">
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          onChange={recalculatePremium}
                        />
                      </Form.Item>

                      <Form.Item label="单次最高赔付天数" name="allowanceMaxPaymentDays">
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          onChange={recalculatePremium}
                        />
                      </Form.Item>

                      <Form.Item label="总津贴天数" name="allowanceTotalDays">
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          onChange={recalculatePremium}
                        />
                      </Form.Item>
                    </>
                  ) : null
                }
              </Form.Item>

              <Divider />

              <h4>突发急性病保险</h4>
              <Form.Item label="启用急性病保险" name="acuteDiseaseEnabled" valuePropName="checked">
                <Switch onChange={recalculatePremium} />
              </Form.Item>

              <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.acuteDiseaseEnabled !== currentValues.acuteDiseaseEnabled}>
                {({ getFieldValue }) =>
                  getFieldValue('acuteDiseaseEnabled') ? (
                    <>
                      <Form.Item label="急性病保额(元/人)" name="acuteDiseaseCoverageAmount">
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          step={10000}
                          onChange={recalculatePremium}
                        />
                      </Form.Item>

                      <Form.Item label="人员风险等级" name="personRiskLevel">
                        <Select onChange={recalculatePremium}>
                          <Option value={PersonRiskLevel.CLASS_A}>A类水平(低风险)</Option>
                          <Option value={PersonRiskLevel.CLASS_B}>B类水平(中风险)</Option>
                          <Option value={PersonRiskLevel.CLASS_C}>C类水平(高风险)</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item label="地区等级" name="regionLevel">
                        <Select onChange={recalculatePremium}>
                          <Option value={RegionLevel.CLASS_A}>一类地区</Option>
                          <Option value={RegionLevel.CLASS_B}>二类地区</Option>
                          <Option value={RegionLevel.CLASS_C}>三类地区</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item label="企业类别" name="enterpriseCategory">
                        <Select onChange={recalculatePremium}>
                          <Option value={EnterpriseCategory.CLASS_A}>一类企业</Option>
                          <Option value={EnterpriseCategory.CLASS_B}>二类企业</Option>
                          <Option value={EnterpriseCategory.CLASS_C}>三类企业</Option>
                        </Select>
                      </Form.Item>
                    </>
                  ) : null
                }
              </Form.Item>

              <Divider />

              <h4>高原病保险</h4>
              <Form.Item label="启用高原病保险" name="plateauDiseaseEnabled" valuePropName="checked">
                <Switch onChange={recalculatePremium} />
              </Form.Item>

              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Button onClick={prevStep}>上一步</Button>
                <Button type="primary" onClick={nextStep}>
                  下一步
                </Button>
              </div>
            </div>
          )}

          {/* 步骤5: 完成 */}
          {editStep === 4 && (
            <div>
              <h3>方案总览</h3>

              {calculationResult && (
                <div style={{
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: '1px solid #bae6fd'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>总保费</div>
                    <div style={{ fontSize: '36px', fontWeight: 700, color: '#1e40af' }}>
                      ¥{calculationResult.totalPremium?.toLocaleString() || 0}
                    </div>
                  </div>

                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="主险保费">
                      ¥{calculationResult.mainInsurance?.premium?.toLocaleString() || 0}
                    </Descriptions.Item>
                    {calculationResult.medicalInsurance && (
                      <Descriptions.Item label="医疗保险保费">
                        ¥{calculationResult.medicalInsurance.premium?.toLocaleString() || 0}
                      </Descriptions.Item>
                    )}
                    {calculationResult.allowanceInsurance && (
                      <Descriptions.Item label="住院津贴保费">
                        ¥{calculationResult.allowanceInsurance.premium?.toLocaleString() || 0}
                      </Descriptions.Item>
                    )}
                    {calculationResult.acuteDiseaseInsurance && (
                      <Descriptions.Item label="急性病保险保费">
                        ¥{calculationResult.acuteDiseaseInsurance.premium?.toLocaleString() || 0}
                      </Descriptions.Item>
                    )}
                    {calculationResult.plateauDiseaseInsurance && (
                      <Descriptions.Item label="高原病保险保费">
                        ¥{calculationResult.plateauDiseaseInsurance.premium?.toLocaleString() || 0}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </div>
              )}

              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Button onClick={prevStep}>上一步</Button>
                <Button onClick={() => setEditModalVisible(false)}>
                  取消
                </Button>
                <Button type="primary" onClick={handleSaveEdit}>
                  保存修改
                </Button>
              </div>
            </div>
          )}
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default PricingPlans;
