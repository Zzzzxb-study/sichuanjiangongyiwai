import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Slider,
  InputNumber,
  Select,
  Switch,
  Button,
  Tabs,
  Alert,
  Tooltip,
  Progress,
  Descriptions,
  Collapse,
  Modal,
  Input,
  message,
  Space,
  Typography,
} from 'antd';
import {
  SettingOutlined,
  InfoCircleOutlined,
  SafetyOutlined,
  HeartOutlined,
  BankOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
  CalculatorOutlined,
  FieldNumberOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  ColumnWidthOutlined,
  VerticalAlignTopOutlined,
  ExpandOutlined,
  CompressOutlined,
  FundOutlined,
  SaveOutlined,
  FileTextOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import {
  calculateComprehensivePricing,
  calculateK1,
  calculateK2,
  calculateK5,
  calculateM4,
  calculateM5,
  calculateAllowanceAM1,
  calculateAllowanceAM2,
  calculateAllowanceAM3,
  calculateAQ1,
  calculatePremiumRange,
} from '../../services/insuranceCalculationService';
import { savePricingPlan, getProjectFullInfo } from '../../services/pricingPlansApi';
import { linearInterpolationNodes, roundToDecimals } from '../../utils/insuranceUtils';
import {
  M1_MEDICAL_COVERAGE_NODES,
  M2_MEDICAL_DEDUCTIBLE_NODES,
  M3_MEDICAL_PAYMENT_RATIO_NODES,
} from '../../utils/insuranceUtils';
import {
  MainInsuranceParams,
  MedicalInsuranceParams,
  AllowanceInsuranceParams,
  AcuteDiseaseInsuranceParams,
  PlateauDiseaseInsuranceParams,
  ComprehensivePricingResult,
  ProjectNature,
  ContractType,
  EngineeringClass,
  ConstructionQualification,
  RiskManagementLevel,
  EnterpriseCategory,
  PersonRiskLevel,
  RegionLevel,
  SocialInsuranceStatus,
  OtherInsuranceStatus,
} from '../../types/insurance';
import {
  K4_ENGINEERING_TYPE_RANGES,
  K7_RISK_MANAGEMENT_RANGES,
  K3_CONTRACT_TYPE_FACTORS,
  AQ2_REGION_LEVEL_RANGES,
  AQ3_ENTERPRISE_CATEGORY_RANGES,
} from '../../utils/insuranceUtils';

const { Option } = Select;
const { Title, Paragraph } = Typography;

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

const ParameterPanel = styled(motion.div)`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06);

  .parameter-group {
    margin-bottom: var(--space-2xl);

    &:last-child {
      margin-bottom: 0;
    }

    .group-title {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 1.2rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: var(--space-lg);
      padding-bottom: var(--space-md);
      border-bottom: 3px solid transparent;
      border-image: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%) 1;
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      letter-spacing: 0.3px;

      .anticon {
        color: #3b82f6;
        font-size: 1.3rem;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.1) 100%);
        padding: 8px;
        border-radius: 8px;
      }
    }

    .parameter-item {
      margin-bottom: var(--space-md);
      padding: var(--space-lg);
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: var(--radius-lg);
      border: 1px solid rgba(148, 163, 184, 0.2);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%);
        opacity: 0;
        transition: opacity var(--transition-fast);
      }

      &::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, rgba(59, 130, 246, 0.03) 0%, transparent 70%);
        border-radius: 50%;
        transition: all 0.4s ease;
      }

      &:hover {
        border-color: #3b82f6;
        box-shadow: 0 12px 28px rgba(59, 130, 246, 0.15), 0 6px 14px rgba(59, 130, 246, 0.1);
        transform: translateY(-3px);

        &::before {
          opacity: 1;
        }

        &::after {
          width: 150px;
          height: 150px;
        }
      }

      .parameter-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-md);
        font-weight: 700;
        color: #334155;
        font-size: 0.95rem;
        letter-spacing: 0.2px;

        .label-left {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .tooltip-icon {
          color: #3b82f6;
          cursor: help;
          transition: all var(--transition-fast);

          &:hover {
            color: #1e40af;
            transform: scale(1.2) rotate(5deg);
          }
        }

        .factor-range {
          font-size: 0.8rem;
          color: #1e40af;
          font-weight: 700;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(96, 165, 250, 0.12) 100%);
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid rgba(59, 130, 246, 0.25);
          transition: all var(--transition-fast);

          &:hover {
            background: rgba(59, 130, 246, 0.15);
            border-color: rgba(59, 130, 246, 0.3);
          }
        }
      }

      .parameter-controls {
        display: flex;
        align-items: center;
        gap: var(--space-md);

        .ant-slider {
          flex: 1;

          .ant-slider-rail {
            background-color: var(--neutral-200);
            height: 6px;
            border-radius: 3px;
            transition: background-color 0.2s;
          }

          .ant-slider-track {
            background: var(--primary-blue);
            height: 6px;
            border-radius: 3px;
          }

          .ant-slider-handle {
            // 默认隐藏 - 极简风格
            opacity: 0;
            background: white;
            width: 16px;
            height: 16px;
            margin-top: -5px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
            cursor: pointer;
            border: none !important;
            outline: none !important;

            // 悬停或激活时显示
            &:hover,
            &:focus,
            &.ant-slider-handle-click-focused {
              opacity: 1;
              transform: scale(1.15);
              box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
              outline: none !important;
              border: none !important;
            }

            &:active {
              transform: scale(1.05);
              outline: none !important;
            }

            // 强制移除所有可能的边框和背景
            &::before,
            &::after {
              display: none !important;
            }
          }

          // 悬停整个slider时显示handle
          &:hover .ant-slider-handle {
            opacity: 1;
          }

          // 移除focus-visible的outline
          &:focus-visible {
            outline: none !important;
          }
        }

        .ant-input-number {
          min-width: 110px;
          border: none;
          border-bottom: 2px solid var(--neutral-300);
          border-radius: 0;
          background: transparent;
          transition: all var(--transition-fast);

          .ant-input-number-input {
            font-size: 1rem;
            font-weight: 600;
            color: var(--neutral-900);
          }

          &:hover {
            border-bottom-color: var(--neutral-400);
          }

          &:focus, &.ant-input-number-focused {
            border-bottom-color: var(--primary-blue);
            box-shadow: none;
          }

          // 移除上下箭头按钮
          .ant-input-number-handler {
            opacity: 0;
            transition: opacity var(--transition-fast);

            &:hover {
              opacity: 1;
            }
          }

          &:hover .ant-input-number-handler {
            opacity: 1;
          }
        }
      }

      .parameter-info {
        margin-top: var(--space-md);
        padding-top: var(--space-md);
        border-top: 1px dashed var(--neutral-300);
        font-size: 0.85rem;
        color: var(--neutral-600);
        display: flex;
        justify-content: space-between;
        align-items: center;

        .current-factor {
          font-weight: 700;
          color: var(--primary-blue);
          font-size: 1rem;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.1) 100%);
          padding: 4px 12px;
          border-radius: 6px;
        }
      }
    }
  }
`;

const ResultsPanel = styled(motion.div)`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: var(--neutral-900);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.2);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #3b82f6 100%);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }

  .results-header {
    text-align: center;
    margin-bottom: var(--space-xl);
    padding: var(--space-xl) var(--space-lg);
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(148, 163, 184, 0.15);
    position: relative;
    z-index: 1;

    .total-premium {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 3.2rem;
      font-weight: 800;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: var(--space-sm);
      animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      line-height: 1.2;
      text-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
      filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.2));
    }

    .premium-label {
      font-size: 1.1rem;
      color: #64748b;
      font-weight: 600;
      animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.1s backwards;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
  }

  .breakdown-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--space-md);
    margin-bottom: var(--space-xl);
    position: relative;
    z-index: 1;

    .breakdown-item {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: var(--radius-lg);
      padding: var(--space-lg) var(--space-md);
      text-align: center;
      border: 1px solid rgba(148, 163, 184, 0.2);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      cursor: default;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
        transform: scaleX(0);
        transition: transform var(--transition-normal);
        transform-origin: left;
      }

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        width: 80px;
        height: 80px;
        background: radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%);
        border-radius: 50%;
        transition: all 0.4s ease;
      }

      &:hover {
        transform: translateY(-6px) scale(1.02);
        box-shadow: 0 16px 32px rgba(59, 130, 246, 0.2), 0 8px 16px rgba(59, 130, 246, 0.15);
        border-color: rgba(59, 130, 246, 0.3);

        &::before {
          transform: scaleX(1);
        }

        &::after {
          width: 120px;
          height: 120px;
        }

        .item-value {
          transform: scale(1.1);
          color: #1e40af;
        }
      }

      .item-label {
        font-size: 0.85rem;
        color: #64748b;
        margin-bottom: var(--space-sm);
        font-weight: 600;
        letter-spacing: 0.3px;
        text-transform: uppercase;
      }

      .item-value {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 1.5rem;
        font-weight: 800;
        background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        transition: all var(--transition-fast);
        line-height: 1.3;
      }

      .item-rate {
        font-size: 0.75rem;
        color: #64748b;
        margin-top: var(--space-sm);
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        padding: 4px 10px;
        border-radius: 20px;
        display: inline-block;
        font-weight: 600;
        border: 1px solid rgba(148, 163, 184, 0.2);
      }
    }
  }

  .calculation-process {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: var(--radius-lg);
    padding: var(--space-xl);
    margin-bottom: var(--space-lg);
    border: 1px solid rgba(148, 163, 184, 0.2);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.06);
    position: relative;
    z-index: 1;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 12px 24px rgba(59, 130, 246, 0.15), 0 4px 12px rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.2);
    }

    .process-title {
      font-weight: 700;
      font-size: 1.15rem;
      color: #1e293b;
      margin-bottom: var(--space-lg);
      padding-bottom: var(--space-md);
      border-bottom: 3px solid transparent;
      border-image: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%) 1;
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      letter-spacing: 0.3px;

      .anticon {
        color: #3b82f6;
        font-size: 1.3rem;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.1) 100%);
        padding: 8px;
        border-radius: 8px;
      }
    }

    .formula {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      padding: var(--space-lg);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-md);
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 0.9rem;
      color: #334155;
      line-height: 1.9;
      border: 1px solid rgba(148, 163, 184, 0.3);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%);
      }
    }

    .formula .highlight {
      color: #1e40af;
      font-weight: 700;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(96, 165, 250, 0.15) 100%);
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .formula .result {
      color: #059669;
      font-weight: 800;
      font-size: 1.15rem;
      text-shadow: 0 1px 2px rgba(5, 150, 105, 0.2);
    }
  }
`;

const ResultSummary = styled(motion.div)<{ $layout?: 'horizontal' | 'vertical' }>`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: var(--neutral-900);
  border-radius: var(--radius-xl);
  padding: ${props => props.$layout === 'horizontal' ? 'var(--space-md)' : 'var(--space-lg)'};
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.2);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.12), 0 6px 16px rgba(0, 0, 0, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #3b82f6 100%);
  }

  .summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: ${props => props.$layout === 'horizontal' ? 'var(--space-sm)' : 'var(--space-md)'};
  }

  .summary-title {
    font-weight: 700;
    font-size: ${props => props.$layout === 'horizontal' ? '0.9rem' : '1rem'};
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: var(--space-sm);

    .anticon {
      color: #3b82f6;
      font-size: ${props => props.$layout === 'horizontal' ? '1rem' : '1.2rem'};
    }
  }

  .summary-toggle {
    color: #64748b;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.3s ease;

    .anticon {
      transition: transform 0.3s ease;
    }

    &.collapsed .anticon {
      transform: rotate(180deg);
    }
  }

  .summary-content {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: ${props => props.$layout === 'horizontal' ? 'var(--space-xs)' : 'var(--space-md)'};

    .summary-item {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: var(--radius-lg);
      padding: ${props => props.$layout === 'horizontal' ? 'var(--space-sm)' : 'var(--space-md)'};
      text-align: center;
      border: 1px solid rgba(148, 163, 184, 0.2);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      .item-label {
        font-size: ${props => props.$layout === 'horizontal' ? '0.7rem' : '0.8rem'};
        color: #64748b;
        margin-bottom: ${props => props.$layout === 'horizontal' ? '2px' : 'var(--space-xs)'};
        font-weight: 600;
      }

      .item-value {
        font-size: ${props => props.$layout === 'horizontal' ? '1.1rem' : '1.3rem'};
        font-weight: 800;
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }
  }
`;

const RangeDisplayContainer = styled.div<{ $layout?: 'horizontal' | 'vertical' }>`
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-radius: var(--radius-xl);
  padding: ${props => props.$layout === 'horizontal' ? 'var(--space-md)' : 'var(--space-xl)'};
  margin-bottom: var(--space-lg);
  border: 2px solid rgba(251, 191, 36, 0.2);
  box-shadow: 0 10px 30px rgba(251, 191, 36, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%);
  }

  .range-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: ${props => props.$layout === 'horizontal' ? 'var(--space-md)' : 'var(--space-lg)'};
    position: relative;
    z-index: 2;

    .range-title {
      font-weight: 700;
      font-size: ${props => props.$layout === 'horizontal' ? '1rem' : '1.2rem'};
      background: linear-gradient(135deg, #92400e 0%, #b45309 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      display: flex;
      align-items: center;
      gap: var(--space-sm);

      .anticon {
        color: #f59e0b;
        font-size: ${props => props.$layout === 'horizontal' ? '1.2rem' : '1.4rem'};
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%);
        padding: ${props => props.$layout === 'horizontal' ? '6px' : '8px'};
        border-radius: 10px;
      }
    }
  }

  .range-cards {
    display: grid;
    grid-template-columns: ${props => props.$layout === 'horizontal' ? '1fr' : 'repeat(3, 1fr)'};
    gap: ${props => props.$layout === 'horizontal' ? 'var(--space-sm)' : 'var(--space-md)'};
    margin-bottom: var(--space-lg);
    position: relative;
    z-index: 2;

    .range-card {
      background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
      border-radius: var(--radius-lg);
      padding: ${props => props.$layout === 'horizontal' ? 'var(--space-sm) var(--space-sm)' : 'var(--space-lg) var(--space-md)'};
      text-align: center;
      border: 2px solid;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        transition: all 0.3s ease;
      }

      &:hover {
        transform: ${props => props.$layout === 'horizontal' ? 'translateY(-2px)' : 'translateY(-4px)'};
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
      }

      &.min {
        border-color: rgba(34, 197, 94, 0.3);
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.1);

        &::before {
          background: linear-gradient(90deg, #22c55e 0%, #4ade80 100%);
        }

        &:hover {
          border-color: rgba(34, 197, 94, 0.5);
          box-shadow: 0 12px 28px rgba(34, 197, 94, 0.2);
        }

        .card-icon {
          background: linear-gradient(135deg, #22c55e 0%, #4ade80 100%);
          color: #ffffff;
        }

        .card-value {
          color: #22c55e;
        }

        .card-badge {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(74, 222, 128, 0.15) 100%);
          color: #16a34a;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
      }

      &.current {
        border-color: rgba(251, 191, 36, 0.4);
        box-shadow: 0 6px 20px rgba(251, 191, 36, 0.2);
        transform: ${props => props.$layout === 'horizontal' ? 'scale(1.02)' : 'scale(1.05)'};
        z-index: 3;

        &::before {
          background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
        }

        &:hover {
          transform: ${props => props.$layout === 'horizontal' ? 'scale(1.04) translateY(-2px)' : 'scale(1.08) translateY(-4px)'};
          box-shadow: 0 16px 32px rgba(251, 191, 36, 0.25);
        }

        .card-icon {
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
          color: #ffffff;
        }

        .card-value {
          color: #d97706;
          font-size: ${props => props.$layout === 'horizontal' ? '1.4rem' : '2rem'};
        }

        .card-badge {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(253, 224, 71, 0.2) 100%);
          color: #b45309;
          border: 1px solid rgba(251, 191, 36, 0.4);
        }
      }

      &.max {
        border-color: rgba(249, 115, 22, 0.3);
        box-shadow: 0 4px 12px rgba(249, 115, 22, 0.1);

        &::before {
          background: linear-gradient(90deg, #f97316 0%, #fb923c 100%);
        }

        &:hover {
          border-color: rgba(249, 115, 22, 0.5);
          box-shadow: 0 12px 28px rgba(249, 115, 22, 0.2);
        }

        .card-icon {
          background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
          color: #ffffff;
        }

        .card-value {
          color: #f97316;
        }

        .card-badge {
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(251, 146, 60, 0.15) 100%);
          color: #c2410c;
          border: 1px solid rgba(249, 115, 22, 0.3);
        }
      }

      .card-icon {
        width: ${props => props.$layout === 'horizontal' ? '36px' : '48px'};
        height: ${props => props.$layout === 'horizontal' ? '36px' : '48px'};
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto ${props => props.$layout === 'horizontal' ? 'var(--space-xs)' : 'var(--space-md)'};
        font-size: ${props => props.$layout === 'horizontal' ? '1.2rem' : '1.5rem'};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .card-label {
        font-size: ${props => props.$layout === 'horizontal' ? '0.75rem' : '0.85rem'};
        color: #78716c;
        font-weight: 600;
        margin-bottom: ${props => props.$layout === 'horizontal' ? '2px' : 'var(--space-sm)'};
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .card-value {
        font-size: ${props => props.$layout === 'horizontal' ? '1.2rem' : '1.6rem'};
        font-weight: 800;
        margin-bottom: ${props => props.$layout === 'horizontal' ? '2px' : 'var(--space-sm)'};
        line-height: 1.2;
        transition: all 0.3s ease;
      }

      .card-badge {
        display: inline-block;
        padding: ${props => props.$layout === 'horizontal' ? '2px 8px' : '4px 12px'};
        border-radius: 20px;
        font-size: ${props => props.$layout === 'horizontal' ? '0.65rem' : '0.75rem'};
        font-weight: 700;
      }
    }
  }

  .range-info {
    text-align: center;
    font-size: ${props => props.$layout === 'horizontal' ? '0.75rem' : '0.9rem'};
    color: #92400e;
    padding: ${props => props.$layout === 'horizontal' ? 'var(--space-sm)' : 'var(--space-md)'};
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-radius: var(--radius-lg);
    border: 1px solid rgba(251, 191, 36, 0.3);
    font-weight: 600;
    position: relative;
    z-index: 2;

    &::before {
      content: '💡';
      margin-right: 8px;
    }
  }
`;

const RateCardsContainer = styled.div<{ $layout?: 'horizontal' | 'vertical' }>`
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: var(--radius-xl);
  padding: ${props => props.$layout === 'horizontal' ? 'var(--space-md)' : 'var(--space-lg)'};
  margin-bottom: var(--space-lg);
  border: 2px solid rgba(34, 197, 94, 0.2);
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #22c55e 0%, #4ade80 50%, #22c55e 100%);
  }

  .rate-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: ${props => props.$layout === 'horizontal' ? 'var(--space-sm)' : 'var(--space-md)'};

    .rate-title {
      font-weight: 700;
      font-size: ${props => props.$layout === 'horizontal' ? '1rem' : '1.15rem'};
      background: linear-gradient(135deg, #166534 0%, #15803d 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      display: flex;
      align-items: center;
      gap: var(--space-sm);

      .anticon {
        color: #22c55e;
        font-size: ${props => props.$layout === 'horizontal' ? '1.2rem' : '1.4rem'};
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(74, 222, 128, 0.1) 100%);
        padding: ${props => props.$layout === 'horizontal' ? '6px' : '8px'};
        border-radius: 10px;
      }
    }
  }

  .rate-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: ${props => props.$layout === 'horizontal' ? 'var(--space-sm)' : 'var(--space-md)'};

    .rate-card {
      background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
      border-radius: var(--radius-lg);
      padding: ${props => props.$layout === 'horizontal' ? 'var(--space-md)' : 'var(--space-lg) var(--space-md)'};
      border: 2px solid rgba(34, 197, 94, 0.25);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #22c55e 0%, #4ade80 100%);
      }

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 24px rgba(34, 197, 94, 0.2);
        border-color: rgba(34, 197, 94, 0.4);
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-sm);

        .card-label {
          font-size: ${props => props.$layout === 'horizontal' ? '0.85rem' : '0.95rem'};
          color: #166534;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;

          .anticon {
            font-size: ${props => props.$layout === 'horizontal' ? '1rem' : '1.2rem'};
            color: #22c55e;
          }
        }

        .card-badge {
          padding: ${props => props.$layout === 'horizontal' ? '3px 8px' : '4px 10px'};
          border-radius: 12px;
          font-size: ${props => props.$layout === 'horizontal' ? '0.65rem' : '0.75rem'};
          font-weight: 700;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(74, 222, 128, 0.15) 100%);
          color: #15803d;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
      }

      .card-value {
        font-size: ${props => props.$layout === 'horizontal' ? '1.6rem' : '2rem'};
        font-weight: 800;
        background: linear-gradient(135deg, #166534 0%, #22c55e 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        line-height: 1.2;
        margin-bottom: var(--space-xs);
      }

      .card-desc {
        font-size: ${props => props.$layout === 'horizontal' ? '0.75rem' : '0.85rem'};
        color: #166534;
        font-weight: 600;
        opacity: 0.85;
        display: flex;
        align-items: center;
        gap: 4px;

        &::before {
          content: '💡';
          font-size: ${props => props.$layout === 'horizontal' ? '0.8rem' : '1rem'};
        }
      }
    }
  }
`;

const RangeDetailTable = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  border: 2px solid rgba(251, 191, 36, 0.15);
  box-shadow: 0 6px 20px rgba(251, 191, 36, 0.08);

  .detail-title {
    font-weight: 700;
    font-size: 1.05rem;
    background: linear-gradient(135deg, #92400e 0%, #b45309 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: var(--space-md);
    display: flex;
    align-items: center;
    gap: var(--space-sm);

    .anticon {
      color: #f59e0b;
      font-size: 1.2rem;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 191, 36, 0.15) 100%);
      padding: 6px;
      border-radius: 8px;
    }
  }

  .detail-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    border-radius: var(--radius-md);
    overflow: hidden;

    th {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      padding: var(--space-sm) var(--space-md);
      text-align: left;
      font-weight: 700;
      color: #92400e;
      border-bottom: 2px solid rgba(251, 191, 36, 0.3);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &:first-child {
        border-top-left-radius: var(--radius-sm);
      }

      &:last-child {
        border-top-right-radius: var(--radius-sm);
      }
    }

    td {
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid rgba(251, 191, 36, 0.1);
      color: #78716c;
      position: relative;

      &.coefficient-name {
        font-weight: 600;
        color: #1c1917;
        display: flex;
        align-items: center;
        gap: 8px;

        .coefficient-icon {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: #ffffff;
        }

        &.type-main {
          .coefficient-icon {
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
          }
        }

        &.type-acute {
          .coefficient-icon {
            background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
          }
        }

        &.type-plateau {
          .coefficient-icon {
            background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
          }
        }

        &.type-medical {
          .coefficient-icon {
            background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
          }
        }

        &.type-allowance {
          .coefficient-icon {
            background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
          }
        }
      }

      &.value-min {
        color: #16a34a;
        font-weight: 700;
        background: linear-gradient(90deg, rgba(34, 197, 94, 0.08) 0%, transparent 100%);

        &::before {
          content: '▼';
          margin-right: 4px;
          font-size: 0.7rem;
        }
      }

      &.value-current {
        color: #d97706;
        font-weight: 800;
        background: linear-gradient(90deg, rgba(251, 191, 36, 0.12) 0%, rgba(251, 191, 36, 0.05) 100%);
        position: relative;
        padding: var(--space-sm) var(--space-md);

        .current-value-wrapper {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          width: 100%;

          .value-number {
            flex-shrink: 0;
            min-width: 50px;
            text-align: left;
          }

          .progress-bar {
            flex: 1;
            position: relative;
            height: 8px;
            background: linear-gradient(90deg,
              rgba(34, 197, 94, 0.2) 0%,
              rgba(251, 191, 36, 0.3) 50%,
              rgba(249, 115, 22, 0.2) 100%
            );
            border-radius: 4px;
            overflow: visible;

            &::before {
              content: '';
              position: absolute;
              left: 0;
              top: 0;
              height: 100%;
              width: 100%;
              background: linear-gradient(90deg,
                rgba(34, 197, 94, 0.4) 0%,
                rgba(251, 191, 36, 0.5) 50%,
                rgba(249, 115, 22, 0.4) 100%
              );
              border-radius: 4px;
              opacity: 0.3;
            }

            .progress-marker {
              position: absolute;
              top: 50%;
              transform: translate(-50%, -50%);
              width: 14px;
              height: 14px;
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(251, 191, 36, 0.5),
                          0 0 0 4px rgba(251, 191, 36, 0.2);
              transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.2s ease;
              cursor: pointer;
              z-index: 1;

              &::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 6px;
                height: 6px;
                background: #ffffff;
                border-radius: 50%;
              }

              &:hover {
                transform: translate(-50%, -50%) scale(1.2);
                box-shadow: 0 3px 8px rgba(251, 191, 36, 0.6),
                            0 0 0 6px rgba(251, 191, 36, 0.3);
              }
            }
          }
        }

        &::after {
          content: '●';
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          color: #f59e0b;
          font-size: 0.6rem;
          animation: pulse 2s ease-in-out infinite;
        }
      }

      &.value-max {
        color: #c2410c;
        font-weight: 700;
        background: linear-gradient(90deg, transparent 0%, rgba(249, 115, 22, 0.08) 100%);
        text-align: right;

        &::after {
          content: '▲';
          margin-left: 4px;
          font-size: 0.7rem;
        }
      }
    }

    tbody tr {
      transition: all 0.2s ease;

      &:hover {
        background: rgba(251, 191, 36, 0.08);
        transform: scale(1.005);
        box-shadow: 0 2px 8px rgba(251, 191, 36, 0.1);
      }

      &:last-child td {
        border-bottom: none;
      }
    }
  }

  .detail-note {
    margin-top: var(--space-md);
    padding: var(--space-md) var(--space-lg);
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-left: 4px solid #f59e0b;
    border-radius: var(--radius-md);
    font-size: 0.85rem;
    color: #92400e;
    line-height: 1.8;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(251, 191, 36, 0.1);

    &::before {
      content: '💡';
      margin-right: 8px;
      font-size: 1rem;
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const ViewControlBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-lg);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

  .view-title {
    font-weight: 700;
    font-size: 1.1rem;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: var(--space-sm);

    .anticon {
      color: #3b82f6;
      font-size: 1.2rem;
    }
  }

  .view-controls {
    display: flex;
    gap: var(--space-sm);
  }

  .control-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: var(--space-sm) var(--space-md);
    border: 2px solid rgba(148, 163, 184, 0.3);
    background: white;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 600;
    font-size: 0.9rem;
    color: #475569;

    &:hover {
      border-color: #3b82f6;
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
    }

    &.active {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border-color: #3b82f6;
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

      &:hover {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: white;
      }
    }

    .anticon {
      font-size: 1rem;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: var(--space-md);
  justify-content: center;
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: 2px solid rgba(148, 163, 184, 0.2);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%);
  }

  .ant-btn {
    height: 48px;
    padding: 0 var(--space-xl);
    font-size: 1rem;
    font-weight: 700;
    border-radius: var(--radius-lg);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    letter-spacing: 0.5px;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
      transition: left 0.6s ease;
    }

    &:hover::before {
      left: 100%;
    }

    &:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 12px 28px rgba(59, 130, 246, 0.3);
    }

    &:active {
      transform: translateY(-1px) scale(0.98);
    }

    &.ant-btn-primary {
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      border: none;
      color: white;

      &:hover {
        background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
        box-shadow: 0 12px 28px rgba(59, 130, 246, 0.4);
      }
    }

    &.ant-btn-default {
      border-color: rgba(148, 163, 184, 0.4);
      color: #475569;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);

      &:hover {
        border-color: #3b82f6;
        color: #3b82f6;
        background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
      }
    }
  }
`;

// 添加全局关键帧动画和自定义样式
const GlobalStyles = styled.div`
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  // 自定义Tabs样式
  .ant-tabs {
    overflow: visible;

    .ant-tabs-nav {
      margin-bottom: var(--space-lg);

      &::before {
        border-bottom-color: var(--neutral-300);
      }
    }

    .ant-tabs-tab {
      border-radius: var(--radius-lg) !important;
      border: 2px solid var(--neutral-300) !important;
      margin-right: var(--space-sm) !important;
      padding: var(--space-sm) var(--space-lg) !important;
      font-weight: 600;
      font-size: 0.95rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: white;

      &:hover {
        color: var(--primary-blue);
        border-color: var(--primary-blue) !important;
        transform: translateY(-2px);
        box-shadow: var(--shadow-soft);
      }

      &.ant-tabs-tab-active {
        background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blueDark) 100%);
        border-color: var(--primary-blue) !important;
        color: white !important;

        .ant-tabs-tab-btn {
          color: white !important;
        }
      }

      .ant-tabs-tab-btn {
        outline: none;
      }
    }

    .ant-tabs-ink-bar {
      display: none;
    }
  }

  // 自定义Alert样式
  .ant-alert {
    border-radius: var(--radius-lg);
    border: 1px solid var(--neutral-300);
    box-shadow: var(--shadow-sm);
    padding: var(--space-md) var(--space-lg);

    &.ant-alert-info {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(96, 165, 250, 0.05) 100%);
      border-color: rgba(59, 130, 246, 0.3);

      .ant-alert-icon {
        color: var(--primary-blue);
      }
    }

    &.ant-alert-warning {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(251, 191, 36, 0.05) 100%);
      border-color: rgba(245, 158, 11, 0.3);

      .ant-alert-icon {
        color: #f59e0b;
      }
    }

    &.ant-alert-error {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(248, 113, 113, 0.05) 100%);
      border-color: rgba(239, 68, 68, 0.3);

      .ant-alert-icon {
        color: #ef4444;
      }
    }

    &.ant-alert-success {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(52, 211, 153, 0.05) 100%);
      border-color: rgba(16, 185, 129, 0.3);

      .ant-alert-icon {
        color: #10b981;
      }
    }
  }

  // 自定义Descriptions样式
  .ant-descriptions {
    .ant-descriptions-header {
      margin-bottom: var(--space-md);
    }

    .ant-descriptions-item-label {
      font-weight: 600;
      color: var(--neutral-700);
      background: linear-gradient(135deg, var(--neutral-50) 0%, var(--neutral-100) 100%);
    }

    .ant-descriptions-item-content {
      font-family: 'Courier New', monospace;
      color: var(--neutral-900);
      font-weight: 500;
    }
  }

  // 自定义Select样式
  .ant-select {
    .ant-select-selector {
      border-radius: var(--radius-md);
      border-color: var(--neutral-300);
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--primary-blue);
      }
    }

    &.ant-select-focused .ant-select-selector {
      border-color: var(--primary-blue);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
  }

  // 自定义Switch样式
  .ant-switch {
    &.ant-switch-checked {
      background: linear-gradient(90deg, var(--primary-blue) 0%, var(--primary-blueLight) 100%);
    }
  }

  // 自定义Tooltip样式
  .ant-tooltip {
    .ant-tooltip-inner {
      background: var(--neutral-900);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      font-size: 0.9rem;
    }

    .ant-tooltip-arrow-content {
      background: var(--neutral-900);
    }
  }
`;

const PricingCalculator: React.FC = () => {
  // 获取 URL 参数中的 projectId
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();

  // ========== 状态管理 ==========
  const [activeTab, setActiveTab] = useState('main');
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<ComprehensivePricingResult | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // 引导卡片可见性：当没有 projectId 且没有加载方案时显示
  const [showGuideCard, setShowGuideCard] = useState(false);

  // 校验 projectId - 支持从方案中沿用项目编号，但不强制跳转
  useEffect(() => {
    console.log('[PricingCalculator] useEffect 触发');
    console.log('[PricingCalculator] URL中的projectId:', projectId);

    // 优先检查 URL 中的 projectId
    if (projectId) {
      console.log('[PricingCalculator] 使用URL中的项目ID:', projectId);
      setShowGuideCard(false);

      // 尝试从 localStorage 加载合同解析数据
      const parseDataKey = `contract_parse_${projectId}`;
      const savedParseData = localStorage.getItem(parseDataKey);
      if (savedParseData) {
        try {
          const parseData = JSON.parse(savedParseData);
          console.log('加载的合同解析数据:', parseData);
          // 可以在这里预填充一些字段，如果需要的话
        } catch (error) {
          console.error('解析合同数据失败:', error);
        }
      }
      return;
    }

    // 如果 URL 中没有 projectId，检查 sessionStorage 中是否有 currentProjectId
    const sessionProjectId = sessionStorage.getItem('currentProjectId');
    console.log('[PricingCalculator] sessionStorage中的currentProjectId:', sessionProjectId);

    if (sessionProjectId) {
      console.log('[PricingCalculator] 使用sessionStorage中的项目ID:', sessionProjectId);
      setShowGuideCard(false);
      // 不需要在这里更新 URL，继续使用当前的 projectId (undefined)
      // 但在保存时会使用 sessionProjectId
      return;
    }

    // 最后检查 sessionStorage 中是否有加载的方案
    const loadedPlanData = sessionStorage.getItem('loadedPlan');
    console.log('[PricingCalculator] sessionStorage中的loadedPlan:', loadedPlanData ? '存在' : '不存在');

    if (loadedPlanData) {
      try {
        const plan = JSON.parse(loadedPlanData);
        console.log('[PricingCalculator] 方案数据:', plan);
        console.log('[PricingCalculator] 方案中的projectId:', plan.projectId);

        if (plan.projectId) {
          console.log('[PricingCalculator] 从方案中沿用项目ID');
          sessionStorage.setItem('currentProjectId', plan.projectId);
          setShowGuideCard(false);
          return;
        } else {
          console.log('[PricingCalculator] 方案中没有projectId字段');
        }
      } catch (error) {
        console.error('[PricingCalculator] 解析方案数据失败:', error);
      }
    }

    // 既没有 URL 中的 projectId，也没有其他来源的 projectId，显示引导卡片
    console.log('[PricingCalculator] 显示引导卡片，不强制跳转');
    setShowGuideCard(true);
  }, [projectId]);

  // 视图布局状态：'horizontal' | 'vertical'
  const [viewLayout, setViewLayout] = useState<'horizontal' | 'vertical'>(() => {
    const saved = localStorage.getItem('pricing-view-layout');
    return (saved === 'vertical' ? 'vertical' : 'horizontal');
  });

  // 结果面板折叠状态
  const [resultCollapsed, setResultCollapsed] = useState(false);

  // 保存方案弹窗状态
  const [savePlanModalVisible, setSavePlanModalVisible] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);

  // 项目基本信息字段
  const [projectName, setProjectName] = useState('');
  const [contractor, setContractor] = useState('');
  const [projectLocation, setProjectLocation] = useState('');

  // 切换结果面板折叠状态
  const handleToggleCollapse = () => {
    setResultCollapsed(!resultCollapsed);
  };

  // 打开保存方案弹窗
  const handleOpenSavePlanModal = async () => {
    if (!result) {
      message.warning('请先进行保费计算');
      return;
    }
    // 生成默认方案名称
    const defaultName = `方案_${new Date().toLocaleDateString()}_${mainParams.baseAmount / 10000}万元`;
    setPlanName(defaultName);
    setPlanDescription('');

    // 尝试从合同解析数据中获取项目名称、施工方、地点
    if (projectId) {
      try {
        const parseDataKey = `contract_parse_${projectId}`;
        const savedParseData = localStorage.getItem(parseDataKey);

        console.log('=== 保存方案 - 读取合同解析数据 ===');
        console.log('projectId:', projectId);
        console.log('parseDataKey:', parseDataKey);
        console.log('savedParseData存在:', !!savedParseData);

        if (savedParseData) {
          const parseData = JSON.parse(savedParseData);
          console.log('合同解析完整数据:', parseData);
          console.log('合同解析data字段:', parseData.data);

          // 获取项目名称 - 使用正确的字段名
          const projectName = parseData.data?.projectName || '';
          console.log('提取的项目名称:', projectName);

          // 获取施工方名称
          let contractor = '';
          if (parseData.data?.contractors) {
            if (typeof parseData.data.contractors === 'string') {
              contractor = parseData.data.contractors;
            } else if (Array.isArray(parseData.data.contractors) && parseData.data.contractors.length > 0) {
              contractor = parseData.data.contractors.join('、');
            }
          }
          console.log('提取的施工方:', contractor);

          // 获取项目地点
          const projectLocation = parseData.data?.location || '';
          console.log('提取的项目地点:', projectLocation);

          setProjectName(projectName);
          setContractor(contractor);
          setProjectLocation(projectLocation);

          console.log('自动填充完成 - 项目名称:', projectName, '施工方:', contractor, '项目地点:', projectLocation);
        } else {
          console.log('未找到合同解析数据，parseDataKey:', parseDataKey);
          setProjectName('');
          setContractor('');
          setProjectLocation('');
        }
      } catch (error) {
        console.error('读取合同解析数据失败:', error);
        setProjectName('');
        setContractor('');
        setProjectLocation('');
      }
    } else {
      console.log('没有projectId，无法获取合同解析数据');
      setProjectName('');
      setContractor('');
      setProjectLocation('');
    }

    setSavePlanModalVisible(true);
  };

  // 保存方案
  const handleSavePlan = async () => {
    if (!planName.trim()) {
      message.warning('请输入方案名称');
      return;
    }

    if (!result) {
      message.warning('没有可保存的计算结果');
      return;
    }

    // 获取 projectId - 优先使用 URL 中的，其次使用 sessionStorage 中的
    const effectiveProjectId = projectId || sessionStorage.getItem('currentProjectId');

    if (!effectiveProjectId) {
      message.error('项目ID缺失，无法保存方案。请从合同解析或我的方案加载到计算器');
      return;
    }

    console.log('保存方案使用的 projectId:', effectiveProjectId, '(来源:', projectId ? 'URL' : 'sessionStorage', ')');

    setSavingPlan(true);

    try {
      // 构建请求数据，只包含启用的附加险
      const requestData: any = {
        planName: planName.trim(),
        planDescription: planDescription.trim(),
        projectName: projectName.trim(),
        contractor: contractor.trim(),
        projectLocation: projectLocation.trim(),
        mainParams,
        calculationResult: result,
        projectId: effectiveProjectId, // 使用有效的 projectId（URL 或 sessionStorage）
      };

      // 只添加启用的附加险参数，并进行字段映射
      if (medicalParams.enabled) {
        requestData.medicalParams = medicalParams;
      }
      if (allowanceParams.enabled) {
        // 映射住院津贴参数字段名以匹配后端API
        requestData.allowanceParams = {
          dailyLimit: allowanceParams.dailyAmount,
          waitingDays: allowanceParams.deductibleDays,
          paymentDays: allowanceParams.maxPaymentDays,
          totalAllowanceDays: allowanceParams.totalAllowanceDays, // 累计给付天数
        };
      }
      if (acuteDiseaseParams.enabled) {
        requestData.acuteDiseaseParams = acuteDiseaseParams;
      }
      if (plateauDiseaseParams.enabled) {
        requestData.plateauDiseaseParams = plateauDiseaseParams;
      }

      console.log('保存方案数据:', requestData);

      const response = await savePricingPlan(requestData);
      console.log('保存方案响应:', response);

      message.success('方案保存成功');
      setSavePlanModalVisible(false);
      setPlanName('');
      setPlanDescription('');
      setProjectName('');
      setContractor('');
      setProjectLocation('');
    } catch (error: any) {
      console.error('保存方案失败:', error);
      // 显示更详细的错误信息
      const errorMessage = error?.message || '方案保存失败，请重试';
      message.error(errorMessage);
    } finally {
      setSavingPlan(false);
    }
  };

  // 取消保存方案
  const handleCancelSavePlan = () => {
    setSavePlanModalVisible(false);
    setPlanName('');
    setPlanDescription('');
  };

  // K4、K7和K8的用户输入值
  const [k4Value, setK4Value] = useState<number>(1.4); // 二类工程默认中值
  const [k7Value, setK7Value] = useState<number>(0.7); // 健全默认中值
  const [k8LossRate, setK8LossRate] = useState<number>(30); // 经验/预期赔付率（%）

  // MF4、MF7的用户输入值（附加医疗保险独立使用）
  const [mf4Value, setMf4Value] = useState<number>(1.4); // 二类工程默认中值
  const [mf7Value, setMf7Value] = useState<number>(0.7); // 健全默认中值

  // AK4和AK7的用户输入值（附加住院津贴独立使用）
  const [ak4Value, setAk4Value] = useState<number>(1.4); // 二类工程默认中值
  const [ak7Value, setAk7Value] = useState<number>(0.7); // 健全默认中值

  // AQ3的用户输入值（附加急性病身故保险使用）
  const [aq3Value, setAq3Value] = useState<number>(0.9); // A类企业默认值

  // AQ2的用户输入值（附加急性病身故保险使用）
  const [aq2Value, setAq2Value] = useState<number>(0.8); // A类地区默认值

  // 主险参数
  const [mainParams, setMainParams] = useState<MainInsuranceParams>({
    projectNature: ProjectNature.NON_RURAL,
    baseAmount: 85000000, // 元（8500万元）
    contractType: ContractType.GENERAL_CONTRACT,
    engineeringClass: EngineeringClass.CLASS_2,
    durationDays: 730, // 2年
    qualification: ConstructionQualification.GRADE_2,
    riskManagementLevel: RiskManagementLevel.SOUND,
    lossRecordFactor: undefined,
    coverageAmount: 500000, // 50万
  });

  // 加载保存的方案数据
  useEffect(() => {
    const loadedPlanData = sessionStorage.getItem('loadedPlan');
    if (loadedPlanData) {
      try {
        const plan = JSON.parse(loadedPlanData);

        // 加载主险参数
        if (plan.mainParams) {
          setMainParams(plan.mainParams);
        }

        // 加载 K4、K7、K8 值
        if (plan.calculationResult?.mainInsurance?.factors) {
          const factors = plan.calculationResult.mainInsurance.factors;
          if (factors.k4_engineeringType) setK4Value(factors.k4_engineeringType);
          if (factors.k7_riskManagementFactor) setK7Value(factors.k7_riskManagementFactor);
          if (factors.k8_lossRecordFactor) setK8LossRate(
            factors.k8_lossRecordFactor < 0.7 ? 30 :
            factors.k8_lossRecordFactor < 0.9 ? 45 :
            factors.k8_lossRecordFactor < 1.1 ? 70 : 90
          );
        }

        // 加载附加医疗保险参数
        if (plan.medicalParams?.enabled) {
          setMedicalParams(plan.medicalParams);
          if (plan.calculationResult?.medicalInsurance?.rateFactors) {
            const factors = plan.calculationResult.medicalInsurance.rateFactors;
            if (factors.mf4_engineeringType) setMf4Value(factors.mf4_engineeringType);
            if (factors.mf7_riskManagementFactor) setMf7Value(factors.mf7_riskManagementFactor);
          }
        }

        // 加载住院津贴参数
        if (plan.allowanceParams?.enabled) {
          setAllowanceParams(plan.allowanceParams);
          if (plan.calculationResult?.allowanceInsurance?.rateFactors) {
            const factors = plan.calculationResult.allowanceInsurance.rateFactors;
            if (factors.k4_engineeringType) setAk4Value(factors.k4_engineeringType);
            if (factors.k7_riskManagementFactor) setAk7Value(factors.k7_riskManagementFactor);
          }
        }

        // 加载急性病参数
        if (plan.acuteDiseaseParams?.enabled) {
          setAcuteDiseaseParams(plan.acuteDiseaseParams);
          if (plan.calculationResult?.acuteDiseaseInsurance?.parameterFactors) {
            const factors = plan.calculationResult.acuteDiseaseInsurance.parameterFactors;
            if (factors.aq3_companyRiskManagement) setAq3Value(factors.aq3_companyRiskManagement);
            if (factors.aq2_region) setAq2Value(factors.aq2_region);
          }
        }

        // 加载高原病参数
        if (plan.plateauDiseaseParams?.enabled) {
          setPlateauDiseaseParams(plan.plateauDiseaseParams);
        }

        // 显示加载成功消息
        message.success(`已加载方案：${plan.planName}`);

        // 清除 sessionStorage 中的方案数据
        sessionStorage.removeItem('loadedPlan');
      } catch (error) {
        console.error('加载方案失败:', error);
        message.error('加载方案失败');
      }
    }
  }, []);

  // 加载历史记录数据（从历史记录页面跳转）
  useEffect(() => {
    const loadedContractData = sessionStorage.getItem('loadedContractData');
    if (loadedContractData) {
      try {
        const contractData = JSON.parse(loadedContractData);

        // 填充项目基本信息字段
        if (contractData.projectName) {
          setProjectName(contractData.projectName);
        }
        if (contractData.contractor) {
          setContractor(contractData.contractor);
        }
        if (contractData.projectLocation) {
          setProjectLocation(contractData.projectLocation);
        }

        // 可选：也可以填充其他参数
        if (contractData.baseAmount && contractData.baseAmount > 0) {
          setMainParams(prev => ({
            ...prev,
            baseAmount: contractData.baseAmount
          }));
        }

        // 清除 sessionStorage
        sessionStorage.removeItem('loadedContractData');

        console.log('已加载历史记录数据:', contractData);
      } catch (error) {
        console.error('加载历史记录数据失败:', error);
      }
    }
  }, []);

  // 当工程类别改变时，更新K4为中值
  useEffect(() => {
    const k4Range = K4_ENGINEERING_TYPE_RANGES[mainParams.engineeringClass];
    if (k4Range) {
      setK4Value((k4Range.min + k4Range.max) / 2);
    }
  }, [mainParams.engineeringClass]);

  // 当风险管理水平改变时，更新K7为中值
  useEffect(() => {
    const k7Range = K7_RISK_MANAGEMENT_RANGES[mainParams.riskManagementLevel];
    if (k7Range) {
      setK7Value((k7Range.min + k7Range.max) / 2);
    }
  }, [mainParams.riskManagementLevel]);

  // 当工程类别改变时，更新MF4为中值（附加医疗保险独立使用）
  useEffect(() => {
    const k4Range = K4_ENGINEERING_TYPE_RANGES[mainParams.engineeringClass];
    if (k4Range) {
      setMf4Value((k4Range.min + k4Range.max) / 2);
    }
  }, [mainParams.engineeringClass]);

  // 当风险管理水平改变时，更新MF7为中值（附加医疗保险独立使用）
  useEffect(() => {
    const k7Range = K7_RISK_MANAGEMENT_RANGES[mainParams.riskManagementLevel];
    if (k7Range) {
      setMf7Value((k7Range.min + k7Range.max) / 2);
    }
  }, [mainParams.riskManagementLevel]);

  // 当工程类别改变时，更新AK4为中值（附加住院津贴独立使用）
  useEffect(() => {
    const k4Range = K4_ENGINEERING_TYPE_RANGES[mainParams.engineeringClass];
    if (k4Range) {
      setAk4Value((k4Range.min + k4Range.max) / 2);
    }
  }, [mainParams.engineeringClass]);

  // 当风险管理水平改变时，更新AK7为中值（附加住院津贴独立使用）
  useEffect(() => {
    const k7Range = K7_RISK_MANAGEMENT_RANGES[mainParams.riskManagementLevel];
    if (k7Range) {
      setAk7Value((k7Range.min + k7Range.max) / 2);
    }
  }, [mainParams.riskManagementLevel]);

  // 获取K4和K7的区间
  const k4Range = useMemo(
    () => K4_ENGINEERING_TYPE_RANGES[mainParams.engineeringClass],
    [mainParams.engineeringClass]
  );

  const k7Range = useMemo(
    () => K7_RISK_MANAGEMENT_RANGES[mainParams.riskManagementLevel],
    [mainParams.riskManagementLevel]
  );

  // 接收从合同解析导入的参数
  useEffect(() => {
    let importedParams: any = null;

    // 方式1：从 localStorage 读取（有 projectId 的情况）
    if (projectId) {
      const importKey = `pricing_import_${projectId}`;
      const importedParamStr = localStorage.getItem(importKey);
      if (importedParamStr) {
        try {
          importedParams = JSON.parse(importedParamStr);
          // 清除已使用的导入数据
          localStorage.removeItem(importKey);
        } catch (error) {
          console.error('解析 localStorage 导入参数失败:', error);
        }
      }
    }

    // 方式2：从 URL 参数读取（兼容旧逻辑）
    if (!importedParams) {
      const urlParams = new URLSearchParams(window.location.search);
      const importedParamStr = urlParams.get('imported');

      if (importedParamStr) {
        try {
          importedParams = JSON.parse(decodeURIComponent(importedParamStr));
        } catch (error) {
          console.error('解析 URL 导入参数失败:', error);
        }
      }
    }

    if (importedParams) {
      // 应用导入的参数到mainParams
      setMainParams((prevParams) => ({
        ...prevParams,
        ...importedParams.mainParams,
      }));

      // 应用附加医疗保险参数
      if (importedParams.medicalParams) {
        setMedicalParams((prev) => ({
          ...prev,
          ...importedParams.medicalParams,
        }));
      }

      // 应用附加住院津贴参数
      if (importedParams.allowanceParams) {
        setAllowanceParams((prev) => ({
          ...prev,
          ...importedParams.allowanceParams,
        }));
      }

      // 应用附加急性病身故参数
      if (importedParams.acuteDiseaseParams) {
        setAcuteDiseaseParams((prev) => ({
          ...prev,
          ...importedParams.acuteDiseaseParams,
        }));
      }

      // 应用附加高原病参数
      if (importedParams.plateauDiseaseParams) {
        setPlateauDiseaseParams((prev) => ({
          ...prev,
          ...importedParams.plateauDiseaseParams,
        }));
      }

      // 显示导入成功提示
      setTimeout(() => {
        message.success('已从合同解析导入参数！请确认各字段是否正确。');
      }, 500);

      // 清除URL中的参数
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [projectId]);

  // ========== 计算M系数辅助函数 ==========

  // 计算M1：保额调整系数
  const calculateM1 = (coverageAmount: number): number => {
    return linearInterpolationNodes(coverageAmount, M1_MEDICAL_COVERAGE_NODES);
  };

  // 计算M2：免赔额调整系数
  const calculateM2 = (deductible: number): number => {
    return linearInterpolationNodes(deductible, M2_MEDICAL_DEDUCTIBLE_NODES);
  };

  // 计算M3：给付比例调整系数
  const calculateM3 = (paymentRatio: number): number => {
    return linearInterpolationNodes(paymentRatio, M3_MEDICAL_PAYMENT_RATIO_NODES);
  };

  // 附加医疗保险参数
  const [medicalParams, setMedicalParams] = useState<MedicalInsuranceParams>({
    enabled: false,
    coverageAmount: 20000,
    deductible: 100,
    paymentRatio: 80,
    socialInsuranceStatus: SocialInsuranceStatus.PARTICIPATED,
    otherInsuranceStatus: OtherInsuranceStatus.NONE,
    globalFactors: {} as any,
  });

  // 附加住院津贴保险参数
  const [allowanceParams, setAllowanceParams] = useState<AllowanceInsuranceParams>({
    enabled: false,
    dailyAmount: 50,
    deductibleDays: 3,
    maxPaymentDays: 90,
    totalAllowanceDays: 180,
    globalFactors: {} as any,
  });

  // 附加急性病身故保险参数
  const [acuteDiseaseParams, setAcuteDiseaseParams] = useState<AcuteDiseaseInsuranceParams>({
    enabled: false,
    coverageAmount: 200000,
    personRiskLevel: PersonRiskLevel.CLASS_B,
    regionLevel: RegionLevel.CLASS_B,
    enterpriseCategory: EnterpriseCategory.CLASS_A,
    baseAmount: 8500,
    projectNature: ProjectNature.NON_RURAL,
  });

  // 附加高原病保险参数
  const [plateauDiseaseParams, setPlateauDiseaseParams] = useState<PlateauDiseaseInsuranceParams>({
    enabled: false,
    personRiskLevel: PersonRiskLevel.CLASS_B,
    regionLevel: RegionLevel.CLASS_B,
    basePremium: 0,
    relatedPolicies: [],
  });

  // 获取AQ3的区间
  const aq3Range = useMemo(
    () => AQ3_ENTERPRISE_CATEGORY_RANGES[acuteDiseaseParams.enterpriseCategory],
    [acuteDiseaseParams.enterpriseCategory]
  );

  // 获取AQ2的区间
  const aq2Range = useMemo(
    () => AQ2_REGION_LEVEL_RANGES[acuteDiseaseParams.regionLevel],
    [acuteDiseaseParams.regionLevel]
  );

  // 当企业分类改变时，更新AQ3为中值（附加急性病身故保险使用）
  useEffect(() => {
    if (aq3Range) {
      setAq3Value((aq3Range.min + aq3Range.max) / 2);
    }
  }, [aq3Range]);

  // 当区域等级改变时，更新AQ2为中值（附加急性病身故保险使用）
  useEffect(() => {
    if (aq2Range) {
      setAq2Value((aq2Range.min + aq2Range.max) / 2);
    }
  }, [aq2Range]);

  // ========== 计算逻辑 ==========

  // 根据经验/预期赔付率计算K8系数（线性插值）
  const calculateK8FromLossRate = (lossRate: number): number => {
    if (lossRate <= 30) {
      // 30%及以下: [0.5，0.7]
      return 0.5 + (lossRate / 30) * 0.2;
    } else if (lossRate <= 60) {
      // (30％，60％]: (0.7，0.9]
      return 0.7 + ((lossRate - 30) / 30) * 0.2;
    } else if (lossRate <= 80) {
      // (60％，80％]: (0.9，1.1]
      return 0.9 + ((lossRate - 60) / 20) * 0.2;
    } else {
      // >80％: (1.1，1.2]
      const clampedRate = Math.min(lossRate, 100);
      return 1.1 + ((clampedRate - 80) / 20) * 0.1;
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    setCalculationError(null);

    // 模拟计算延迟
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      // 计算K8系数
      const k8Factor = calculateK8FromLossRate(k8LossRate);

      // 创建一个包含K4、K7和K8值的主险参数副本
      const mainParamsWithK4K7 = {
        ...mainParams,
        lossRecordFactor: k8Factor,
      };

      const calculationResult = calculateComprehensivePricing({
        mainParams: mainParamsWithK4K7,
        medicalParams: medicalParams.enabled ? medicalParams : undefined,
        allowanceParams: allowanceParams.enabled ? allowanceParams : undefined,
        acuteDiseaseParams: acuteDiseaseParams.enabled ? acuteDiseaseParams : undefined,
        plateauDiseaseParams: plateauDiseaseParams.enabled ? plateauDiseaseParams : undefined,
      });

      // 手动设置K4、K7和K8的值到结果中
      calculationResult.mainInsurance.factors.k4_engineeringType = k4Value;
      calculationResult.mainInsurance.factors.k7_riskManagementFactor = k7Value;
      calculationResult.mainInsurance.factors.k8_lossRecordFactor = k8Factor;

      // 手动设置AQ2和AQ3的值到结果中（附加急性病身故保险）
      if (calculationResult.acuteDiseaseInsurance) {
        calculationResult.acuteDiseaseInsurance.parameterFactors.aq2_region = aq2Value;
        calculationResult.acuteDiseaseInsurance.parameterFactors.aq3_companyRiskManagement = aq3Value;
      }

      // 重新计算主险保费（使用正确的K4、K7和K8值）
      const { calculateMainInsurance } = require('../../services/insuranceCalculationService');
      const recalculatedMain = calculateMainInsurance(mainParams, {
        ...calculationResult.mainInsurance.factors,
        k4_engineeringType: k4Value,
        k7_riskManagementFactor: k7Value,
        k8_lossRecordFactor: k8Factor,
      });

      calculationResult.mainInsurance = recalculatedMain;

      // 如果启用了医疗保险，设置MF4和MF7的值并重新计算
      if (calculationResult.medicalInsurance) {
        // 重新计算医疗保险保费（使用正确的MF4和MF7值）
        const { calculateMedicalInsurance } = require('../../services/insuranceCalculationService');

        // 从重新计算后的主险factors中获取基础值，并使用独立的MF4和MF7
        const medicalGlobalFactors = {
          k1_costFactor: recalculatedMain.factors.k1_costFactor,
          k2_areaFactor: recalculatedMain.factors.k2_areaFactor,
          k3_contractType: recalculatedMain.factors.k3_contractType,
          k4_engineeringType: mf4Value,  // 医疗险独立的MF4
          k5_durationFactor: recalculatedMain.factors.k5_durationFactor,
          k6_qualificationFactor: recalculatedMain.factors.k6_qualificationFactor,
          k7_riskManagementFactor: mf7Value,  // 医疗险独立的MF7
          k8_lossRecordFactor: 1.0,  // 附加险不使用K8，设为1.0
        };

        const medicalParamsWithMF4MF7 = {
          ...medicalParams,
          globalFactors: medicalGlobalFactors
        };

        const recalculatedMedical = calculateMedicalInsurance(medicalParamsWithMF4MF7, {
          projectNature: mainParams.projectNature,
          baseAmount: mainParams.baseAmount
        });

        calculationResult.medicalInsurance = recalculatedMedical;
      }

      // 如果启用了住院津贴，设置AK4和AK7的值并重新计算
      if (calculationResult.allowanceInsurance) {
        // 重新计算住院津贴保费（使用正确的AK4和AK7值）
        const { calculateAllowanceInsurance } = require('../../services/insuranceCalculationService');

        // 从重新计算后的主险factors中获取基础值，并使用独立的AK4和AK7
        const allowanceGlobalFactors = {
          k1_costFactor: recalculatedMain.factors.k1_costFactor,
          k2_areaFactor: recalculatedMain.factors.k2_areaFactor,
          k3_contractType: recalculatedMain.factors.k3_contractType,
          k4_engineeringType: ak4Value,  // 住院津贴独立的AK4
          k5_durationFactor: recalculatedMain.factors.k5_durationFactor,
          k6_qualificationFactor: recalculatedMain.factors.k6_qualificationFactor,
          k7_riskManagementFactor: ak7Value,  // 住院津贴独立的AK7
          k8_lossRecordFactor: 1.0,  // 附加险不使用K8，设为1.0
        };

        const allowanceParamsWithAK = {
          ...allowanceParams,
          globalFactors: allowanceGlobalFactors
        };

        const recalculatedAllowance = calculateAllowanceInsurance(allowanceParamsWithAK, mainParams);

        calculationResult.allowanceInsurance = recalculatedAllowance;
      }

      // 重新计算总保费，确保与分项保费之和一致
      let totalPremium = calculationResult.mainInsurance.premium;
      if (calculationResult.medicalInsurance) {
        totalPremium += calculationResult.medicalInsurance.premium;
      }
      if (calculationResult.allowanceInsurance) {
        totalPremium += calculationResult.allowanceInsurance.premium;
      }
      if (calculationResult.acuteDiseaseInsurance) {
        totalPremium += calculationResult.acuteDiseaseInsurance.premium;
      }
      if (calculationResult.plateauDiseaseInsurance) {
        totalPremium += calculationResult.plateauDiseaseInsurance.premium;
      }
      calculationResult.totalPremium = totalPremium;

      // 重新计算整体费率分析，确保基于最新的总保费
      const overallRate = (totalPremium / mainParams.baseAmount) * 1000; // ‰
      const per100kCoverageRate = overallRate / (mainParams.coverageAmount / 100000); // ‰
      calculationResult.overallRateAnalysis = {
        overallRate: roundToDecimals(overallRate, 4),
        per100kCoverageRate: roundToDecimals(per100kCoverageRate, 4),
        constructionCost: mainParams.baseAmount,
        coverageAmount: mainParams.coverageAmount,
      };

      // 更新 factorRanges 中的 current 值，确保与用户选择的值一致
      if (calculationResult.factorRanges) {
        if (calculationResult.factorRanges.k4) {
          calculationResult.factorRanges.k4.current = k4Value;
        }
        if (calculationResult.factorRanges.k7) {
          calculationResult.factorRanges.k7.current = k7Value;
        }
        if (calculationResult.factorRanges.k8) {
          calculationResult.factorRanges.k8.current = k8Factor;
        }
        if (calculationResult.factorRanges.mf4) {
          calculationResult.factorRanges.mf4.current = mf4Value;
        }
        if (calculationResult.factorRanges.mf7) {
          calculationResult.factorRanges.mf7.current = mf7Value;
        }
        if (calculationResult.factorRanges.ak4) {
          calculationResult.factorRanges.ak4.current = ak4Value;
        }
        if (calculationResult.factorRanges.ak7) {
          calculationResult.factorRanges.ak7.current = ak7Value;
        }
        if (calculationResult.factorRanges.aq2) {
          calculationResult.factorRanges.aq2.current = aq2Value;
        }
        if (calculationResult.factorRanges.aq3) {
          calculationResult.factorRanges.aq3.current = aq3Value;
        }
      }

      // 重新计算保费范围，确保基于最新的保费和系数值
      const updatedPremiumRange = calculatePremiumRange(
        mainParams,
        calculationResult.mainInsurance,
        calculationResult.medicalInsurance,
        calculationResult.allowanceInsurance,
        calculationResult.acuteDiseaseInsurance,
        calculationResult.plateauDiseaseInsurance
      );
      calculationResult.premiumRange = updatedPremiumRange.premiumRange;
      // 同步更新 factorRanges（使用最新的 current 值）
      calculationResult.factorRanges = updatedPremiumRange.factorRanges;
      // 再次更新 factorRanges 的 current 值（确保使用最新的状态值）
      if (calculationResult.factorRanges) {
        if (calculationResult.factorRanges.k4) {
          calculationResult.factorRanges.k4.current = k4Value;
        }
        if (calculationResult.factorRanges.k7) {
          calculationResult.factorRanges.k7.current = k7Value;
        }
        if (calculationResult.factorRanges.k8) {
          calculationResult.factorRanges.k8.current = k8Factor;
        }
        if (calculationResult.factorRanges.mf4) {
          calculationResult.factorRanges.mf4.current = mf4Value;
        }
        if (calculationResult.factorRanges.mf7) {
          calculationResult.factorRanges.mf7.current = mf7Value;
        }
        if (calculationResult.factorRanges.ak4) {
          calculationResult.factorRanges.ak4.current = ak4Value;
        }
        if (calculationResult.factorRanges.ak7) {
          calculationResult.factorRanges.ak7.current = ak7Value;
        }
        if (calculationResult.factorRanges.aq2) {
          calculationResult.factorRanges.aq2.current = aq2Value;
        }
        if (calculationResult.factorRanges.aq3) {
          calculationResult.factorRanges.aq3.current = aq3Value;
        }
      }

      setResult(calculationResult);
    } catch (error) {
      console.error('计算错误:', error);
      const errorMessage = error instanceof Error ? error.message : '计算过程中发生未知错误';
      setCalculationError(errorMessage);
    } finally {
      setCalculating(false);
    }
  };

  // 初始计算
  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听附加险enabled状态变化，自动重新计算
  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    medicalParams.enabled,
    allowanceParams.enabled,
    acuteDiseaseParams.enabled,
    plateauDiseaseParams.enabled,
  ]);

  // ========== 辅助函数 ==========

  const formatCurrency = (value: number): string => {
    return `¥${value.toLocaleString()}`;
  };

  const getEngineeringClassName = (classNum: EngineeringClass): string => {
    switch (classNum) {
      case EngineeringClass.CLASS_1:
        return '一类工程';
      case EngineeringClass.CLASS_2:
        return '二类工程';
      case EngineeringClass.CLASS_3:
        return '三类工程';
      case EngineeringClass.CLASS_4:
        return '四类工程';
      default:
        return '';
    }
  };

  const getRiskManagementName = (level: RiskManagementLevel): string => {
    switch (level) {
      case RiskManagementLevel.SOUND:
        return '健全';
      case RiskManagementLevel.RELATIVELY_SOUND:
        return '较健全';
      case RiskManagementLevel.POOR:
        return '不健全';
      default:
        return '';
    }
  };

  // ========== 图表配置 ==========

  const getChartOption = () => {
    if (!result) return {};

    // 计算总保费
    const totalPremium = result.totalPremium;

    const data = [
      {
        value: result.mainInsurance.premium,
        name: '主险',
        itemStyle: { color: '#1890ff' },
      },
    ];

    if (result.medicalInsurance) {
      data.push({
        value: result.medicalInsurance.premium,
        name: '附加医疗保险',
        itemStyle: { color: '#52c41a' },
      });
    }

    if (result.allowanceInsurance) {
      data.push({
        value: result.allowanceInsurance.premium,
        name: '附加住院津贴',
        itemStyle: { color: '#faad14' },
      });
    }

    if (result.acuteDiseaseInsurance) {
      data.push({
        value: result.acuteDiseaseInsurance.premium,
        name: '附加急性病',
        itemStyle: { color: '#f5222d' },
      });
    }

    if (result.plateauDiseaseInsurance) {
      data.push({
        value: result.plateauDiseaseInsurance.premium,
        name: '附加高原病',
        itemStyle: { color: '#722ed1' },
      });
    }

    return {
      title: {
        text: '保费构成分析',
        left: 'center',
        textStyle: {
          color: '#1a2332',
          fontSize: 16,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: ¥{c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'middle',
        itemWidth: 15,
        itemHeight: 15,
        textStyle: {
          fontSize: 13,
          color: '#333',
        },
        // 使用formatter在legend中显示详细信息
        formatter: (name: string) => {
          const item = data.find((d) => d.name === name);
          if (!item) return name;
          const percentage = ((item.value / totalPremium) * 100).toFixed(1);
          return `${name}: ¥${item.value.toLocaleString()} (${percentage}%)`;
        },
      },
      series: [
        {
          name: '保费构成',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['38%', '50%'],
          avoidLabelOverlap: true,
          data,
          // 完全隐藏饼图上的标签
          label: {
            show: false,
          },
          // 隐藏引导线
          labelLine: {
            show: false,
          },
          // 鼠标悬停时显示标签
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              formatter: '{b}\n¥{c}\n({d}%)',
              position: 'outside',
            },
            labelLine: {
              show: true,
              length: 15,
              length2: 10,
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
  };

  // ========== 渲染保费范围显示 ==========

  const renderPremiumRange = () => {
    if (!result?.premiumRange) return null;

    const { premiumRange, factorRanges } = result;
    const { minimum, maximum, currentMinimum, currentMaximum } = premiumRange;

    // 计算当前值在范围内的位置（百分比）
    const totalRange = maximum - minimum;
    const rangePercent = totalRange > 0 ? ((maximum - minimum) / maximum * 100) : 0;

    // 准备系数范围数据，并添加类型分类
    const getCoefficientType = (name: string) => {
      if (name.includes('MF4') || name.includes('MF7')) return 'medical';
      if (name.includes('AK4') || name.includes('AK7')) return 'allowance';
      if (name.includes('K4') || name.includes('K7') || name.includes('K8')) return 'main';
      if (name.includes('AQ')) return 'acute';
      if (name.includes('R1') || name.includes('R2')) return 'plateau';
      return 'main';
    };

    const getCoefficientIcon = (name: string) => {
      if (name.includes('K4')) return 'K4';
      if (name.includes('K7')) return 'K7';
      if (name.includes('K8')) return 'K8';
      if (name.includes('AQ1')) return 'Q1';
      if (name.includes('AQ2')) return 'Q2';
      if (name.includes('AQ3')) return 'Q3';
      if (name.includes('MF4')) return 'MF4';
      if (name.includes('MF7')) return 'MF7';
      if (name.includes('AK4')) return 'AK4';
      if (name.includes('AK7')) return 'AK7';
      if (name.includes('R1')) return 'R1';
      if (name.includes('R2')) return 'R2';
      return name.slice(-2);
    };

    const factorData = factorRanges ? [
      factorRanges.k4,
      factorRanges.k7,
      factorRanges.k8,
      factorRanges.mf4,
      factorRanges.mf7,
      factorRanges.ak4,
      factorRanges.ak7,
      factorRanges.aq1,
      factorRanges.aq2,
      factorRanges.aq3,
      factorRanges.r1,
      factorRanges.r2,
    ].filter(Boolean) : [];

    return (
      <RangeDisplayContainer $layout={viewLayout}>
        <div className="range-header">
          <div className="range-title">
            <FieldNumberOutlined />
            保费范围分析
          </div>
        </div>

        <div className="range-cards">
          <div className="range-card min">
            <div className="card-icon">
              <ArrowLeftOutlined />
            </div>
            <div className="card-label">理论最低</div>
            <div className="card-value">{formatCurrency(minimum)}</div>
            <div className="card-badge">优惠最大</div>
          </div>

          <div className="range-card current">
            <div className="card-icon">
              <FieldNumberOutlined />
            </div>
            <div className="card-label">当前报价</div>
            <div className="card-value">{formatCurrency(result.totalPremium)}</div>
            <div className="card-badge">已选择</div>
          </div>

          <div className="range-card max">
            <div className="card-icon">
              <ArrowRightOutlined />
            </div>
            <div className="card-label">理论最高</div>
            <div className="card-value">{formatCurrency(maximum)}</div>
            <div className="card-badge">上限</div>
          </div>
        </div>

        <div className="range-info">
          当前配置可调区间：{formatCurrency(currentMinimum)} ~ {formatCurrency(currentMaximum)}
          （浮动范围：{rangePercent.toFixed(1)}%）
        </div>

        {factorData.length > 0 && (
          <Collapse
            style={{ marginTop: '1rem' }}
            ghost
            items={[
              {
                key: 'factorDetails',
                label: (
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#92400e' }}>
                    <InfoCircleOutlined style={{ marginRight: 8, color: '#f59e0b' }} />
                    查看灵活系数详情
                  </span>
                ),
                children: (
                  <RangeDetailTable>
                    <div className="detail-title">
                      <CalculatorOutlined />
                      灵活系数取值范围
                    </div>
                    <table className="detail-table">
                      <thead>
                        <tr>
                          <th>系数名称</th>
                          <th>最低值</th>
                          <th>当前值</th>
                          <th>最高值</th>
                        </tr>
                      </thead>
                      <tbody>
                        {factorData.map((factor: any, index: number) => {
                          const coefType = getCoefficientType(factor.name);
                          const coefIcon = getCoefficientIcon(factor.name);

                          // 计算当前值在范围内的位置百分比
                          const range = factor.max - factor.min;
                          const positionPercent = range > 0
                            ? ((factor.current - factor.min) / range) * 100
                            : 50;

                          return (
                            <tr key={index}>
                              <td className={`coefficient-name type-${coefType}`}>
                                <span className="coefficient-icon">{coefIcon}</span>
                                {factor.name}
                              </td>
                              <td className="value-min">{factor.min.toFixed(2)}</td>
                              <td className="value-current">
                                <div className="current-value-wrapper">
                                  <span className="value-number">{factor.current.toFixed(2)}</span>
                                  <div className="progress-bar">
                                    <div
                                      className="progress-marker"
                                      style={{
                                        left: `${Math.min(100, Math.max(0, positionPercent))}%`
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="value-max">{factor.max.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="detail-note">
                      说明：保费范围基于灵活系数的取值区间计算。固定系数（如K1、K2、K3、K5、K6等）不参与范围计算。
                      通过调整灵活系数，保费可在理论最低值和最高值之间变化。
                      图标含义：蓝色(K系-主险工程系数) | 橙色(AQ系-急性病) | 紫色(R系-高原病) | 绿色(MF系-医疗保险工程系数) | 青色(AK系-住院津贴工程系数)
                    </div>
                  </RangeDetailTable>
                ),
              },
            ]}
          />
        )}
      </RangeDisplayContainer>
    );
  };

  // ========== 渲染费率分析卡片 ==========

  const renderRateCards = () => {
    if (!result?.overallRateAnalysis) return null;

    const { overallRateAnalysis } = result;
    const { overallRate, per100kCoverageRate, constructionCost, coverageAmount } = overallRateAnalysis;

    return (
      <RateCardsContainer $layout={viewLayout}>
        <div className="rate-header">
          <div className="rate-title">
            <CalculatorOutlined />
            费率分析
          </div>
        </div>

        <div className="rate-cards">
          <div className="rate-card">
            <div className="card-header">
              <div className="card-label">
                <FundOutlined />
                整体费率
              </div>
            </div>
            <div className="card-value">{overallRate.toFixed(3)}‰</div>
            <div className="card-desc">
              工程造价：{(constructionCost / 10000).toFixed(0)}万元 |
              主险保额：{(coverageAmount / 10000).toFixed(0)}万元
            </div>
          </div>

          <div className="rate-card">
            <div className="card-header">
              <div className="card-label">
                <SafetyOutlined />
                10万元保额费率
              </div>
            </div>
            <div className="card-value">{per100kCoverageRate.toFixed(3)}‰</div>
            <div className="card-desc">标准化费率指标</div>
          </div>
        </div>
      </RateCardsContainer>
    );
  };

  // ========== 渲染主险计算过程 ==========

  const renderMainInsuranceCalculationProcess = () => {
    if (!result) return null;

    const { mainInsurance } = result;
    const f = mainInsurance.factors;

    // 根据项目类型显示基准费率
    const baseRateText = mainParams.projectNature === ProjectNature.NON_RURAL
      ? `0.0436‰（造价型，每万元保额）`
      : `0.069元/㎡（面积型，每万元保额）`;

    // K1或K2
    const k1Text = `K1 = ${f.k1_costFactor?.toFixed(2) || '-'} (造价${(mainParams.baseAmount / 10000).toFixed(2)}万元)`;
    const k2Text = `K2 = ${f.k2_areaFactor?.toFixed(2) || '-'} (面积${mainParams.baseAmount}㎡)`;

    // K3
    const k3Text = `K3 = ${f.k3_contractType.toFixed(2)} (${mainParams.contractType === ContractType.GENERAL_CONTRACT ? '总包/专业分包' : '劳务分包'})`;

    // K4（使用当前状态中的k4Value）
    const k4Text = `K4 = ${k4Value.toFixed(2)} (${getEngineeringClassName(mainParams.engineeringClass)}, 范围[${k4Range.min}, ${k4Range.max}])`;

    // K5
    const k5Text = `K5 = ${f.k5_durationFactor.toFixed(2)} (工期${mainParams.durationDays}天，约${Math.floor(mainParams.durationDays / 365)}年)`;

    // K6
    const k6Text = `K6 = ${f.k6_qualificationFactor.toFixed(2)} (${mainParams.qualification || '不分类'})`;

    // K7（使用当前状态中的k7Value）
    const k7Text = `K7 = ${k7Value.toFixed(2)} (${getRiskManagementName(mainParams.riskManagementLevel)}, 范围[${k7Range.min}, ${k7Range.max}])`;

    // K8（经验/预期赔付率调整系数）
    const getK8Range = (rate: number) => {
      if (rate <= 30) return '[0.5，0.7]';
      if (rate <= 60) return '(0.7，0.9]';
      if (rate <= 80) return '(0.9，1.1]';
      return '(1.1，1.2]';
    };
    const k8Text = `K8 = ${f.k8_lossRecordFactor?.toFixed(2) || '-'} (经验赔付率${k8LossRate}%, 区间${getK8Range(k8LossRate)})`;

    // 计算调整系数之积（使用实际计算时采用的系数值）
    const factorProduct = (
      (f.k1_costFactor || f.k2_areaFactor || 1) *
      f.k3_contractType *
      f.k4_engineeringType *
      f.k5_durationFactor *
      f.k6_qualificationFactor *
      f.k7_riskManagementFactor *
      f.k8_lossRecordFactor
    ).toFixed(4);

    // 保费计算公式（根据项目类型）
    const coverageFactor = (mainParams.coverageAmount / 10000).toFixed(2);
    let premiumFormula = '';
    let calculationDetail = '';

    if (mainParams.projectNature === ProjectNature.NON_RURAL) {
      // 造价型：工程造价(元) × (每人保额/10000) × 基准费率(‰转换为小数) × 各调整系数之积
      // 公式中不显示单位，只显示纯数字计算
      const baseRateDecimal = '0.0000436'; // 0.0436‰转换为小数
      premiumFormula = `${mainParams.baseAmount} × ${coverageFactor} × ${baseRateDecimal} × ${factorProduct}`;
      calculationDetail = `= ${mainParams.baseAmount} × ${coverageFactor} × ${baseRateDecimal} × ${factorProduct}`;
    } else {
      // 面积型：工程面积(㎡) × (每人保额/10000) × 基准保费(元/㎡) × 各调整系数之积
      // 公式中不显示单位，只显示纯数字计算
      premiumFormula = `${mainParams.baseAmount} × ${coverageFactor} × 0.069 × ${factorProduct}`;
      calculationDetail = `= ${mainParams.baseAmount} × ${coverageFactor} × 0.069 × ${factorProduct}`;
    }

    return (
      <div className="calculation-process">
        <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="计费模式">
            {mainParams.projectNature === ProjectNature.NON_RURAL ? '造价型' : '面积型'}
          </Descriptions.Item>
          <Descriptions.Item label="基准费率/保费">{baseRateText}</Descriptions.Item>
          {mainParams.projectNature === ProjectNature.NON_RURAL ? (
            <Descriptions.Item label="K1系数">{k1Text}</Descriptions.Item>
          ) : (
            <Descriptions.Item label="K2系数">{k2Text}</Descriptions.Item>
          )}
          <Descriptions.Item label="K3系数">{k3Text}</Descriptions.Item>
          <Descriptions.Item label="K4系数">{k4Text}</Descriptions.Item>
          <Descriptions.Item label="K5系数">{k5Text}</Descriptions.Item>
          <Descriptions.Item label="K6系数">{k6Text}</Descriptions.Item>
          <Descriptions.Item label="K7系数">{k7Text}</Descriptions.Item>
          <Descriptions.Item label="K8系数">{k8Text}</Descriptions.Item>
          <Descriptions.Item label="调整系数之积">
            <span style={{ color: '#1890ff', fontWeight: 600 }}>{factorProduct}</span>
          </Descriptions.Item>
        </Descriptions>

        <div className="formula">
          <div>保费计算公式：</div>
          <div className="highlight">{premiumFormula}</div>
          <div style={{ marginTop: 8 }} className="result">
            {calculationDetail}
          </div>
          <div style={{ marginTop: 8, fontSize: '1.1em' }} className="result">
            = {formatCurrency(mainInsurance.premium)}
          </div>
        </div>
      </div>
    );
  };

  // ========== 渲染医疗保险计算过程 ==========

  const renderMedicalInsuranceCalculationProcess = () => {
    // 由于未启用时面板不显示，这里直接计算和显示结果
    if (!result?.medicalInsurance) {
      return (
        <div className="calculation-process">
          <Alert
            message="暂无计算结果"
            description="请点击【确认计算保费】按钮重新计算。"
            type="warning"
            showIcon
          />
        </div>
      );
    }

    const { medicalInsurance } = result;
    const pf = medicalInsurance.parameterFactors;
    const rf = medicalInsurance.rateFactors;

    // 基准费率/保费显示
    const baseRateText = mainParams.projectNature === ProjectNature.NON_RURAL
      ? `0.33‰（造价型，基准费率）`
      : `0.9元/㎡（面积型，基准保费）`;

    // MP系列系数（医疗参数调整系数）
    // MP1作为独立的保额系数显示在公式中，不包含在系数列表里
    const mp1Text = `保额系数 = ${(medicalParams.coverageAmount / 10000).toFixed(4)} (每人保险金额${medicalParams.coverageAmount.toLocaleString()}元 ÷ 10000)`;
    const mp2Text = `MP2 = ${pf.mp2_deductible.toFixed(2)} (免赔额${medicalParams.deductible}元，线性插值)`;
    const mp3Text = `MP3 = ${pf.mp3_paymentRatio.toFixed(2)} (给付比例${medicalParams.paymentRatio}%，线性插值)`;
    const mp4Text = `MP4 = ${pf.mp4_socialInsurance.toFixed(2)} (${medicalParams.socialInsuranceStatus === SocialInsuranceStatus.PARTICIPATED ? '参加社保' : '未参加社保'})`;
    const mp5Text = `MP5 = ${pf.mp5_otherInsurance.toFixed(2)} (${medicalParams.otherInsuranceStatus === OtherInsuranceStatus.HAS ? '有其他医疗保险' : '无其他医疗保险'})`;

    // MF系列系数（医疗险费率调整系数，独立于主险K系列）
    const mf1Text = mainParams.projectNature === ProjectNature.NON_RURAL
      ? `MF1 = ${rf.mf1_costFactor?.toFixed(2) || '-'} (造价${(mainParams.baseAmount / 10000).toFixed(2)}万元)`
      : `MF2 = ${rf.mf2_areaFactor?.toFixed(2) || '-'} (面积${mainParams.baseAmount}㎡)`;
    const mf3Text = `MF3 = ${rf.mf3_contractType.toFixed(2)} (合同类型系数)`;
    const mf4Text = `MF4 = ${mf4Value.toFixed(2)} (工程类型系数)`;
    const mf5Text = `MF5 = ${rf.mf5_durationFactor.toFixed(2)} (工期${mainParams.durationDays}天，约${Math.floor(mainParams.durationDays / 365)}年)`;
    const mf6Text = `MF6 = ${rf.mf6_qualificationFactor.toFixed(2)} (资质系数)`;
    const mf7Text = `MF7 = ${mf7Value.toFixed(2)} (风险管理系数)`;

    // 计算所有系数之积（MP2-MP5系列 × MF系列，不包含MP1）
    // MP1作为独立的保额系数显示在公式中
    const allFactorsProduct = (
      pf.mp2_deductible *
      pf.mp3_paymentRatio *
      pf.mp4_socialInsurance *
      pf.mp5_otherInsurance *
      (rf.mf1_costFactor || rf.mf2_areaFactor || 1) *
      rf.mf3_contractType *
      mf4Value *  // 使用当前状态的 mf4Value
      rf.mf5_durationFactor *
      rf.mf6_qualificationFactor *
      mf7Value  // 使用当前状态的 mf7Value
      // 注意：附加医疗保险使用MP和MF系列，MP1单独作为保额系数
    ).toFixed(4);

    // 保费计算公式
    let premiumFormula = '';
    let calculationDetail = '';
    const coverageFactor = (medicalParams.coverageAmount / 10000).toFixed(4);

    if (mainParams.projectNature === ProjectNature.NON_RURAL) {
      // 造价型：每人保险金额/10000 × 工程造价(元) × 0.00033 × 全部系数之积
      premiumFormula = `${coverageFactor} × ${mainParams.baseAmount} × 0.00033 × ${allFactorsProduct}`;
      calculationDetail = `= ${coverageFactor} × ${mainParams.baseAmount} × 0.00033 × ${allFactorsProduct}`;
    } else {
      // 面积型：每人保险金额/10000 × 工程面积(㎡) × 0.9 × 全部系数之积
      premiumFormula = `${coverageFactor} × ${mainParams.baseAmount} × 0.9 × ${allFactorsProduct}`;
      calculationDetail = `= ${coverageFactor} × ${mainParams.baseAmount} × 0.9 × ${allFactorsProduct}`;
    }

    return (
      <div className="calculation-process">
        <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="计费模式">
            {mainParams.projectNature === ProjectNature.NON_RURAL ? '造价型' : '面积型'}
          </Descriptions.Item>
          <Descriptions.Item label="基准费率/保费">{baseRateText}</Descriptions.Item>

          <Descriptions.Item label="保额系数">{mp1Text}</Descriptions.Item>
          <Descriptions.Item label="MP2系数（免赔额）">{mp2Text}</Descriptions.Item>
          <Descriptions.Item label="MP3系数（给付比例）">{mp3Text}</Descriptions.Item>
          <Descriptions.Item label="MP4系数（社保）">{mp4Text}</Descriptions.Item>
          <Descriptions.Item label="MP5系数（其他医保）">{mp5Text}</Descriptions.Item>

          <Descriptions.Item label="MF1/MF2系数">{mf1Text}</Descriptions.Item>
          <Descriptions.Item label="MF3系数">{mf3Text}</Descriptions.Item>
          <Descriptions.Item label="MF4系数">{mf4Text}</Descriptions.Item>
          <Descriptions.Item label="MF5系数">{mf5Text}</Descriptions.Item>
          <Descriptions.Item label="MF6系数">{mf6Text}</Descriptions.Item>
          <Descriptions.Item label="MF7系数">{mf7Text}</Descriptions.Item>

          <Descriptions.Item label="全部系数之积">
            <span style={{ color: '#1890ff', fontWeight: 600 }}>{allFactorsProduct}</span>
          </Descriptions.Item>
        </Descriptions>

        <div className="formula">
          <div>保费计算公式：</div>
          <div className="highlight">{premiumFormula}</div>
          <div style={{ marginTop: 8 }} className="result">
            {calculationDetail}
          </div>
          <div style={{ marginTop: 8, fontSize: '1.1em' }} className="result">
            = {formatCurrency(medicalInsurance.premium)}
          </div>
        </div>
      </div>
    );
  };

  // ========== 渲染住院津贴计算过程 ==========

  const renderAllowanceInsuranceCalculationProcess = () => {
    // 由于未启用时面板不显示，这里直接计算和显示结果
    if (!result?.allowanceInsurance) {
      return (
        <div className="calculation-process">
          <Alert
            message="暂无计算结果"
            description="请点击【确认计算保费】按钮重新计算。"
            type="warning"
            showIcon
          />
        </div>
      );
    }

    const { allowanceInsurance } = result;
    const pf = allowanceInsurance.parameterFactors;
    const rf = allowanceInsurance.rateFactors;

    // 基准费率显示
    const baseRateText = mainParams.projectNature === ProjectNature.NON_RURAL
      ? `0.004‰（造价型，基准费率）`
      : `0.016元/㎡（面积型，基准保费）`;

    // AM系列系数（住院津贴参数调整系数）
    const dailyAmountMultiplier = (allowanceParams.dailyAmount / 10).toFixed(2);
    const am1Text = `AM1 = ${pf.am1_deductibleDays.toFixed(2)} (免赔${allowanceParams.deductibleDays}天，0天=1.22, 3天=1.00，线性插值)`;
    const am2Text = `AM2 = ${pf.am2_maxPaymentDays.toFixed(2)} (每次最高${allowanceParams.maxPaymentDays}天，线性插值)`;
    const am3Text = `AM3 = ${pf.am3_totalAllowanceDays.toFixed(2)} (累计${allowanceParams.totalAllowanceDays}天，线性插值)`;

    // 获取系数范围（用于显示）
    const k4Range = K4_ENGINEERING_TYPE_RANGES[mainParams.engineeringClass];
    const k7Range = K7_RISK_MANAGEMENT_RANGES[mainParams.riskManagementLevel];

    // AK系列系数（住院津贴费率调整系数，继承自主险K系列）
    const ak1Text = mainParams.projectNature === ProjectNature.NON_RURAL
      ? `AK1 = ${rf.k1_costFactor?.toFixed(2) || '-'} (造价${(mainParams.baseAmount / 10000).toFixed(2)}万元)`
      : `AK2 = ${rf.k2_areaFactor?.toFixed(2) || '-'} (面积${mainParams.baseAmount}㎡)`;
    const ak3Text = `AK3 = ${rf.k3_contractType.toFixed(2)} (合同类型系数)`;
    const ak4Text = `AK4 = ${ak4Value.toFixed(2)} (工程类型系数，范围[${k4Range?.min || '-'}, ${k4Range?.max || '-'}])`;
    const ak5Text = `AK5 = ${rf.k5_durationFactor.toFixed(2)} (工期${mainParams.durationDays}天，约${Math.floor(mainParams.durationDays / 365)}年)`;
    const ak6Text = `AK6 = ${rf.k6_qualificationFactor.toFixed(2)} (资质系数)`;
    const ak7Text = `AK7 = ${ak7Value.toFixed(2)} (风险管理系数，范围[${k7Range?.min || '-'}, ${k7Range?.max || '-'}])`;

    // 计算所有系数之积（AM系列 × AK系列，包括K1/K2但不包括津贴倍数）
    const allFactorsProduct = (
      pf.am1_deductibleDays *
      pf.am2_maxPaymentDays *
      pf.am3_totalAllowanceDays *
      (rf.k1_costFactor || rf.k2_areaFactor || 1) *  // K1或K2
      rf.k3_contractType *
      ak4Value *  // 使用当前状态的 ak4Value
      rf.k5_durationFactor *
      rf.k6_qualificationFactor *
      ak7Value  // 使用当前状态的 ak7Value
    ).toFixed(4);

    // 保费计算公式
    let premiumFormula = '';
    let calculationDetail = '';

    if (mainParams.projectNature === ProjectNature.NON_RURAL) {
      // 造价型：工程造价(元) × 0.004‰ × (日津贴/10) × AM系数 × AK系数
      // 0.004‰ = 0.000004
      premiumFormula = `${mainParams.baseAmount} × 0.000004 × ${dailyAmountMultiplier} × ${allFactorsProduct}`;
      calculationDetail = `= ${mainParams.baseAmount} × 0.000004 × ${dailyAmountMultiplier} × ${allFactorsProduct}`;
    } else {
      // 面积型：工程面积(㎡) × 0.016元/㎡ × (日津贴/10) × AM系数 × AK系数
      premiumFormula = `${mainParams.baseAmount} × 0.016 × ${dailyAmountMultiplier} × ${allFactorsProduct}`;
      calculationDetail = `= ${mainParams.baseAmount} × 0.016 × ${dailyAmountMultiplier} × ${allFactorsProduct}`;
    }

    return (
      <div className="calculation-process">
        <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="计费模式">
            {mainParams.projectNature === ProjectNature.NON_RURAL ? '造价型' : '面积型'}
          </Descriptions.Item>
          <Descriptions.Item label="基准费率">{baseRateText}</Descriptions.Item>

          <Descriptions.Item label="津贴金额倍数">{dailyAmountMultiplier} (日津贴{allowanceParams.dailyAmount}元 ÷ 10)</Descriptions.Item>

          <Descriptions.Item label="AM1系数（免赔日数）">{am1Text}</Descriptions.Item>
          <Descriptions.Item label="AM2系数（每次给付日数）">{am2Text}</Descriptions.Item>
          <Descriptions.Item label="AM3系数（累计给付日数）">{am3Text}</Descriptions.Item>

          <Descriptions.Item label="AK1/AK2系数">{ak1Text}</Descriptions.Item>
          <Descriptions.Item label="AK3系数">{ak3Text}</Descriptions.Item>
          <Descriptions.Item label="AK4系数">{ak4Text}</Descriptions.Item>
          <Descriptions.Item label="AK5系数">{ak5Text}</Descriptions.Item>
          <Descriptions.Item label="AK6系数">{ak6Text}</Descriptions.Item>
          <Descriptions.Item label="AK7系数">{ak7Text}</Descriptions.Item>

          <Descriptions.Item label="全部系数之积">
            <span style={{ color: '#1890ff', fontWeight: 600 }}>{allFactorsProduct}</span>
          </Descriptions.Item>
        </Descriptions>

        <div className="formula">
          <div>保费计算公式：</div>
          <div className="highlight">{premiumFormula}</div>
          <div style={{ marginTop: 8 }} className="result">
            {calculationDetail}
          </div>
          <div style={{ marginTop: 8, fontSize: '1.1em' }} className="result">
            = {formatCurrency(allowanceInsurance.premium)}
          </div>
        </div>
      </div>
    );
  };

  // ========== 渲染急性病身故计算过程 ==========

  const renderAcuteDiseaseInsuranceCalculationProcess = () => {
    // 由于未启用时面板不显示，这里直接计算和显示结果
    if (!result?.acuteDiseaseInsurance) {
      return (
        <div className="calculation-process">
          <Alert
            message="暂无计算结果"
            description="请点击【确认计算保费】按钮重新计算。"
            type="warning"
            showIcon
          />
        </div>
      );
    }

    const { acuteDiseaseInsurance } = result;
    const pf = acuteDiseaseInsurance.parameterFactors;

    // 基准费率显示
    const baseRateText = mainParams.projectNature === ProjectNature.NON_RURAL
      ? `0.006‰（造价型，基准费率）`
      : `0.015元/㎡（面积型，基准保费）`;

    // 保额系数
    const coverageFactorText = acuteDiseaseInsurance.coverageFactor.toFixed(4);

    // AQ系列系数（急性病参数调整系数）
    const aq1Text = `AQ1 = ${pf.aq1_personRisk.toFixed(2)} (被保险人风险状况: ${
      acuteDiseaseParams.personRiskLevel === PersonRiskLevel.CLASS_A ? 'A类（低风险）' :
      acuteDiseaseParams.personRiskLevel === PersonRiskLevel.CLASS_B ? 'B类（中风险）' :
      'C类（高风险）'
    })`;
    const aq2Text = `AQ2 = ${pf.aq2_region.toFixed(2)} (所在区域等级: ${
      acuteDiseaseParams.regionLevel === RegionLevel.CLASS_A ? 'A类（优/低风险）' :
      acuteDiseaseParams.regionLevel === RegionLevel.CLASS_B ? 'B类（良/中风险）' :
      'C类（一般/高风险）'
    })`;
    const aq3Text = `AQ3 = ${pf.aq3_companyRiskManagement.toFixed(2)} (企业分类: ${
      acuteDiseaseParams.enterpriseCategory === EnterpriseCategory.CLASS_A ? 'A类企业' :
      acuteDiseaseParams.enterpriseCategory === EnterpriseCategory.CLASS_B ? 'B类企业' :
      'C类企业'
    })`;

    // 计算所有系数之积（保额系数 × AQ1 × AQ2 × AQ3）
    const allFactorsProduct = (
      acuteDiseaseInsurance.coverageFactor *
      pf.aq1_personRisk *
      pf.aq2_region *
      pf.aq3_companyRiskManagement
    ).toFixed(4);

    // 保费计算公式
    let premiumFormula = '';
    let calculationDetail = '';

    if (mainParams.projectNature === ProjectNature.NON_RURAL) {
      // 造价型：工程造价(元) × 保额系数 × 0.006‰ × AQ系数
      // 0.006‰ = 0.000006
      premiumFormula = `${mainParams.baseAmount} × ${coverageFactorText} × 0.000006 × ${(
        pf.aq1_personRisk *
        pf.aq2_region *
        pf.aq3_companyRiskManagement
      ).toFixed(4)}`;
      calculationDetail = `= ${mainParams.baseAmount} × ${coverageFactorText} × 0.000006 × ${(
        pf.aq1_personRisk *
        pf.aq2_region *
        pf.aq3_companyRiskManagement
      ).toFixed(4)}`;
    } else {
      // 面积型：工程面积(㎡) × 保额系数 × 0.015元/㎡ × AQ系数
      premiumFormula = `${mainParams.baseAmount} × ${coverageFactorText} × 0.015 × ${(
        pf.aq1_personRisk *
        pf.aq2_region *
        pf.aq3_companyRiskManagement
      ).toFixed(4)}`;
      calculationDetail = `= ${mainParams.baseAmount} × ${coverageFactorText} × 0.015 × ${(
        pf.aq1_personRisk *
        pf.aq2_region *
        pf.aq3_companyRiskManagement
      ).toFixed(4)}`;
    }

    return (
      <div className="calculation-process">
        <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="计费模式">
            {mainParams.projectNature === ProjectNature.NON_RURAL ? '造价型' : '面积型'}
          </Descriptions.Item>
          <Descriptions.Item label="基准费率">{baseRateText}</Descriptions.Item>

          <Descriptions.Item label="保额系数">{coverageFactorText} (保额{acuteDiseaseParams.coverageAmount}元 ÷ 10000)</Descriptions.Item>

          <Descriptions.Item label="AQ1系数（被保险人风险状况）">{aq1Text}</Descriptions.Item>
          <Descriptions.Item label="AQ2系数（所在区域等级）">{aq2Text}</Descriptions.Item>
          <Descriptions.Item label="AQ3系数（风险管理水平）">{aq3Text}</Descriptions.Item>

          <Descriptions.Item label="全部系数之积">
            <span style={{ color: '#1890ff', fontWeight: 600 }}>{allFactorsProduct}</span>
          </Descriptions.Item>
        </Descriptions>

        <div className="formula">
          <div>保费计算公式：</div>
          <div className="highlight">{premiumFormula}</div>
          <div style={{ marginTop: 8 }} className="result">
            {calculationDetail}
          </div>
          <div style={{ marginTop: 8, fontSize: '1.1em' }} className="result">
            = {formatCurrency(acuteDiseaseInsurance.premium)}
          </div>
        </div>
      </div>
    );
  };

  // ========== 渲染高原病计算过程 ==========

  const renderPlateauDiseaseInsuranceCalculationProcess = () => {
    if (!result?.plateauDiseaseInsurance) {
      return (
        <div className="calculation-process">
          <Alert
            message="暂无计算结果"
            description="请点击【确认计算保费】按钮重新计算。"
            type="warning"
            showIcon
          />
        </div>
      );
    }

    const { plateauDiseaseInsurance } = result;
    const factors = plateauDiseaseInsurance.factors;

    // 基础加费比例
    const baseRateText = `${plateauDiseaseInsurance.baseRate}%（基础加费比例）`;

    // R1系数（被保险人风险状况）
    const r1Text = `R1 = ${factors.r1_personRisk.toFixed(2)} (高原适应力: ${
      plateauDiseaseParams.personRiskLevel === PersonRiskLevel.CLASS_A ? 'A类（低风险）' :
      plateauDiseaseParams.personRiskLevel === PersonRiskLevel.CLASS_B ? 'B类（中风险）' :
      'C类（高风险）'
    })`;

    // R2系数（区域等级）
    const r2Text = `R2 = ${factors.r2_region.toFixed(2)} (海拔风险: ${
      plateauDiseaseParams.regionLevel === RegionLevel.CLASS_A ? 'A类（优/低风险）' :
      plateauDiseaseParams.regionLevel === RegionLevel.CLASS_B ? 'B类（良/中风险）' :
      'C类（一般/高风险）'
    })`;

    // 计算实际加费比例
    const actualRateText = `${plateauDiseaseInsurance.actualRate.toFixed(2)}%`;

    // 保费计算公式
    const premiumFormula = `${plateauDiseaseInsurance.basePremium.toLocaleString()} × ${plateauDiseaseInsurance.actualRate.toFixed(2)}%`;
    const calculationDetail = `= ${plateauDiseaseInsurance.basePremium.toLocaleString()} × ${plateauDiseaseInsurance.actualRate.toFixed(2)}%`;

    return (
      <div className="calculation-process">
        <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="基础加费比例">{baseRateText}</Descriptions.Item>

          <Descriptions.Item label="R1系数（被保险人风险状况）">{r1Text}</Descriptions.Item>
          <Descriptions.Item label="R2系数（区域等级）">{r2Text}</Descriptions.Item>

          <Descriptions.Item label="实际加费比例">
            <span style={{ color: '#1890ff', fontWeight: 600 }}>{actualRateText}</span>
          </Descriptions.Item>

          <Descriptions.Item label="计算基数（关联险种保费）">
            {plateauDiseaseInsurance.basePremium.toLocaleString()}元
          </Descriptions.Item>
        </Descriptions>

        <div className="formula">
          <div>保费计算公式：</div>
          <div className="highlight">{premiumFormula}</div>
          <div style={{ marginTop: 8 }} className="result">
            {calculationDetail}
          </div>
          <div style={{ marginTop: 8, fontSize: '1.1em' }} className="result">
            = {formatCurrency(plateauDiseaseInsurance.premium)}
          </div>
        </div>
      </div>
    );
  };

  // ========== 渲染组件 ==========

  const renderMainInsuranceTab = () => (
    <ParameterPanel
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="parameter-group">
        <div className="group-title">
          <InfoCircleOutlined />
          基础工程参数
        </div>

        <div className="parameter-item">
          <div className="parameter-label">
            <div className="label-left">
              项目性质
              <Tooltip title="非农村项目按工程造价计算，农村建房按建筑面积计算">
                <InfoCircleOutlined className="tooltip-icon" />
              </Tooltip>
            </div>
          </div>
          <Select
            style={{ width: '100%' }}
            value={mainParams.projectNature}
            onChange={(value) => {
              setMainParams({ ...mainParams, projectNature: value });
              // 移除自动计算，改为点击确认按钮触发
            }}
          >
            <Option value={ProjectNature.NON_RURAL}>非农村项目（造价型）</Option>
            <Option value={ProjectNature.RURAL}>农村建房项目（面积型）</Option>
          </Select>
        </div>

        <div className="parameter-item">
          <div className="parameter-label">
            <div className="label-left">
              {mainParams.projectNature === ProjectNature.NON_RURAL ? '工程造价（元）' : '工程面积（㎡）'}
              <Tooltip title={mainParams.projectNature === ProjectNature.NON_RURAL ? '影响K1系数' : '影响K2系数'}>
                <InfoCircleOutlined className="tooltip-icon" />
              </Tooltip>
            </div>
            {mainParams.projectNature === ProjectNature.NON_RURAL && (
              <div className="factor-range">
                K1: {calculateK1(mainParams.baseAmount / 10000).toFixed(2)}
              </div>
            )}
            {mainParams.projectNature === ProjectNature.RURAL && (
              <div className="factor-range">
                K2: {calculateK2(mainParams.baseAmount).toFixed(2)}
              </div>
            )}
          </div>
          <div className="parameter-controls">
            <Slider
              min={mainParams.projectNature === ProjectNature.NON_RURAL ? 10000 : 50}
              max={mainParams.projectNature === ProjectNature.NON_RURAL ? 1000000000 : 50000}
              step={mainParams.projectNature === ProjectNature.NON_RURAL ? 10000 : 50}
              value={mainParams.baseAmount}
              onChange={(value) => {
                setMainParams({ ...mainParams, baseAmount: value });
              }}
              tooltip={{ open: false }}
            />
            <InputNumber
              min={mainParams.projectNature === ProjectNature.NON_RURAL ? 10000 : 50}
              max={mainParams.projectNature === ProjectNature.NON_RURAL ? 1000000000 : 50000}
              step={mainParams.projectNature === ProjectNature.NON_RURAL ? 10000 : 50}
              value={mainParams.baseAmount}
              onChange={(value) => {
                setMainParams({ ...mainParams, baseAmount: value || 0 });
              }}
              formatter={(value) =>
                mainParams.projectNature === ProjectNature.NON_RURAL
                  ? `${value?.toLocaleString()}`
                  : `${value}㎡`
              }
              parser={(value) =>
                Number(
                  value!
                    .replace(/¥\s?|(,*)/g, '')
                    .replace('㎡', '')
                )
              }
              // 移除自动计算，改为点击确认按钮触发
            />
          </div>
        </div>

        <div className="parameter-item">
          <div className="parameter-label">
            <div className="label-left">
              施工合同类型
              <Tooltip title="影响K3系数">
                <InfoCircleOutlined className="tooltip-icon" />
              </Tooltip>
            </div>
            <div className="factor-range">
              K3: {K3_CONTRACT_TYPE_FACTORS[mainParams.contractType]?.toFixed(2) || '1.00'}
            </div>
          </div>
          <Select
            style={{ width: '100%' }}
            value={mainParams.contractType}
            onChange={(value) => {
              setMainParams({ ...mainParams, contractType: value });
              // 移除自动计算，改为点击确认按钮触发
            }}
          >
            <Option value={ContractType.GENERAL_CONTRACT}>总包、专业分包（1.00）</Option>
            <Option value={ContractType.SPECIAL_SUBCONTRACT}>专业分包（1.00）</Option>
            <Option value={ContractType.LABOR_CLASS_1}>一类工程劳务分包（4.00）</Option>
            <Option value={ContractType.LABOR_CLASS_2}>二类工程劳务分包（5.00）</Option>
            <Option value={ContractType.LABOR_CLASS_3}>三类工程劳务分包（6.00）</Option>
            <Option value={ContractType.LABOR_CLASS_4}>四类工程劳务分包（7.00）</Option>
          </Select>
        </div>

        <div className="parameter-item">
          <div className="parameter-label">
            <div className="label-left">
              工程类别
              <Tooltip title="影响K4系数范围">
                <InfoCircleOutlined className="tooltip-icon" />
              </Tooltip>
            </div>
            <div className="factor-range">
              K4范围: [{k4Range.min}, {k4Range.max}]
            </div>
          </div>
          <Select
            style={{ width: '100%' }}
            value={mainParams.engineeringClass}
            onChange={(value) => {
              setMainParams({ ...mainParams, engineeringClass: value });
              // 移除自动计算，改为点击确认按钮触发
            }}
          >
            <Option value={EngineeringClass.CLASS_1}>一类工程（室内装修、普通住宅/厂房）</Option>
            <Option value={EngineeringClass.CLASS_2}>二类工程（火电/风电、机电安装）</Option>
            <Option value={EngineeringClass.CLASS_3}>三类工程（水利工程、公路建设）</Option>
            <Option value={EngineeringClass.CLASS_4}>四类工程（高架桥、钢结构、隧道）</Option>
          </Select>
        </div>

        <div className="parameter-item">
          <div className="parameter-label">
            <div className="label-left">
              K4系数（工程类型风险）
              <Tooltip title="请在范围内选择合适的K4值">
                <InfoCircleOutlined className="tooltip-icon" />
              </Tooltip>
            </div>
            <div className="factor-range">
              当前值: {k4Value.toFixed(2)}
            </div>
          </div>
          <div className="parameter-controls">
            <Slider
              min={k4Range.min}
              max={k4Range.max}
              step={0.01}
              value={k4Value}
              onChange={(value) => {
                setK4Value(value);
                // 移除自动计算，改为点击确认按钮触发
              }}
              tooltip={{ open: false }}
            />
            <InputNumber
              min={k4Range.min}
              max={k4Range.max}
              step={0.01}
              precision={2}
              value={k4Value}
              onChange={(value) => {
                setK4Value(value || k4Range.min);
              }}
              // 移除自动计算，改为点击确认按钮触发
              // 移除自动计算，改为点击确认按钮触发
            />
          </div>
        </div>

        <div className="parameter-item">
          <div className="parameter-label">
            <div className="label-left">
              施工期限（天）
              <Tooltip title="影响K5系数，工期越长系数越高">
                <InfoCircleOutlined className="tooltip-icon" />
              </Tooltip>
            </div>
            <div className="factor-range">
              K5: {calculateK5(mainParams.durationDays).toFixed(2)}
            </div>
          </div>
          <div className="parameter-controls">
            <Slider
              min={30}
              max={3650}
              step={30}
              value={mainParams.durationDays}
              onChange={(value) => {
                setMainParams({ ...mainParams, durationDays: value });
              }}
              tooltip={{ open: false }}
            />
            <InputNumber
              min={30}
              max={3650}
              step={30}
              value={mainParams.durationDays}
              onChange={(value) => {
                setMainParams({ ...mainParams, durationDays: value || 0 });
              }}
              formatter={(value) => `${value}天`}
              parser={(value) => Number(value!.replace('天', ''))}
              // 移除自动计算，改为点击确认按钮触发
            />
          </div>
          <div className="parameter-info">
            <span>折合约 {Math.floor(mainParams.durationDays / 365)} 年 {mainParams.durationDays % 365} 天</span>
          </div>
        </div>

        <div className="parameter-item">
          <div className="parameter-label">
            <div className="label-left">
              施工资质等级
              <Tooltip title="影响K6系数">
                <InfoCircleOutlined className="tooltip-icon" />
              </Tooltip>
            </div>
            <div className="factor-range">K6: {
              mainParams.qualification === ConstructionQualification.SPECIAL ? '0.90' :
              mainParams.qualification === ConstructionQualification.GRADE_1 ? '0.95' :
              mainParams.qualification === ConstructionQualification.GRADE_2 ? '1.00' :
              mainParams.qualification === ConstructionQualification.GRADE_3 ? '1.10' : '1.20'
            }</div>
          </div>
          <Select
            style={{ width: '100%' }}
            value={mainParams.qualification}
            onChange={(value) => {
              setMainParams({ ...mainParams, qualification: value });
              // 移除自动计算，改为点击确认按钮触发
            }}
          >
            <Option value={ConstructionQualification.SPECIAL}>特级（0.90）</Option>
            <Option value={ConstructionQualification.GRADE_1}>一级（0.95）</Option>
            <Option value={ConstructionQualification.GRADE_2}>二级（1.00）</Option>
            <Option value={ConstructionQualification.GRADE_3}>三级（1.10）</Option>
            <Option value={ConstructionQualification.UNGRADED}>不分类（1.20）</Option>
          </Select>
        </div>

        <div className="parameter-item">
          <div className="parameter-label">
            <div className="label-left">
              企业风险管理水平
              <Tooltip title="影响K7系数范围">
                <InfoCircleOutlined className="tooltip-icon" />
              </Tooltip>
            </div>
            <div className="factor-range">
              K7范围: [{k7Range.min}, {k7Range.max}]
            </div>
          </div>
          <Select
            style={{ width: '100%' }}
            value={mainParams.riskManagementLevel}
            onChange={(value) => {
              setMainParams({ ...mainParams, riskManagementLevel: value });
              // 移除自动计算，改为点击确认按钮触发
            }}
          >
            <Option value={RiskManagementLevel.SOUND}>健全（A类）</Option>
            <Option value={RiskManagementLevel.RELATIVELY_SOUND}>较健全（B类）</Option>
            <Option value={RiskManagementLevel.POOR}>不健全（C类）</Option>
          </Select>
        </div>

        <div className="parameter-item">
          <div className="parameter-label">
            <div className="label-left">
              K7系数（企业风险管理水平）
              <Tooltip title="请在范围内选择合适的K7值">
                <InfoCircleOutlined className="tooltip-icon" />
              </Tooltip>
            </div>
            <div className="factor-range">
              当前值: {k7Value.toFixed(2)}
            </div>
          </div>
          <div className="parameter-controls">
            <Slider
              min={k7Range.min}
              max={k7Range.max}
              step={0.01}
              value={k7Value}
              onChange={(value) => {
                setK7Value(value);
                // 移除自动计算，改为点击确认按钮触发
              }}
              tooltip={{ open: false }}
            />
            <InputNumber
              min={k7Range.min}
              max={k7Range.max}
              step={0.01}
              precision={2}
              value={k7Value}
              onChange={(value) => {
                setK7Value(value || k7Range.min);
              }}
              // 移除自动计算，改为点击确认按钮触发
              // 移除自动计算，改为点击确认按钮触发
            />
          </div>
        </div>

        <div className="parameter-item">
          <div className="parameter-label">
            <div className="label-left">
              每人保险金额（元）
              <Tooltip title="保额越高，保费越高">
                <InfoCircleOutlined className="tooltip-icon" />
              </Tooltip>
            </div>
          </div>
          <div className="parameter-controls">
            <Slider
              min={100000}
              max={2000000}
              step={50000}
              value={mainParams.coverageAmount}
              onChange={(value) => {
                setMainParams({ ...mainParams, coverageAmount: value });
              }}
              tooltip={{ open: false }}
            />
            <InputNumber
              min={100000}
              max={2000000}
              step={50000}
              value={mainParams.coverageAmount}
              onChange={(value) => {
                setMainParams({ ...mainParams, coverageAmount: value || 0 });
              }}
              formatter={(value) => `¥${value?.toLocaleString()}`}
              parser={(value) => Number(value!.replace(/¥\s?|(,*)/g, ''))}
              // 移除自动计算，改为点击确认按钮触发
            />
          </div>
        </div>

        <div className="parameter-item">
          <div className="parameter-label">
            <div className="label-left">
              经验/预期赔付率（%）
              <Tooltip title="影响K8系数，赔付率越高系数越大">
                <InfoCircleOutlined className="tooltip-icon" />
              </Tooltip>
            </div>
            <div className="factor-range">
              K8: {calculateK8FromLossRate(k8LossRate).toFixed(2)}
            </div>
          </div>
          <div className="parameter-controls">
            <Slider
              min={0}
              max={100}
              step={5}
              value={k8LossRate}
              onChange={(value) => {
                setK8LossRate(value);
                // 移除自动计算，改为点击确认按钮触发
              }}
              marks={{
                0: '0%',
                30: '30%',
                60: '60%',
                80: '80%',
                100: '100%'
              }}
              tooltip={{ open: false }}
            />
            <InputNumber
              min={0}
              max={100}
              step={5}
              value={k8LossRate}
              onChange={(value) => {
                setK8LossRate(value || 0);
                // 移除自动计算，改为点击确认按钮触发
              }}
              formatter={(value) => `${value}%`}
              parser={(value) => Number(value!.replace('%', ''))}
              // 移除自动计算，改为点击确认按钮触发
              // 移除自动计算，改为点击确认按钮触发
            />
          </div>
          <div className="parameter-info">
            <span>
              {k8LossRate <= 30 && '区间: [0.5, 0.7]'}
              {(k8LossRate > 30 && k8LossRate <= 60) && '区间: (0.7, 0.9]'}
              {(k8LossRate > 60 && k8LossRate <= 80) && '区间: (0.9, 1.1]'}
              {k8LossRate > 80 && '区间: (1.1, 1.2]'}
            </span>
          </div>
        </div>

        {/* 确认计算按钮 */}
        <div className="parameter-item" style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed #d9d9d9' }}>
          <Button
            type="primary"
            size="large"
            block
            onClick={handleCalculate}
            loading={calculating}
            icon={<CalculatorOutlined />}
            style={{
              height: '48px',
              fontSize: '16px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
            }}
          >
            {calculating ? '计算中...' : '确认计算保费'}
          </Button>
          <div style={{ textAlign: 'center', marginTop: '8px', color: '#8c8c8c', fontSize: '12px' }}>
            修改参数后请点击此按钮同步计算
          </div>
        </div>
      </div>
    </ParameterPanel>
  );

  const renderMedicalInsuranceTab = () => (
    <ParameterPanel
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="parameter-item" style={{ marginBottom: '20px' }}>
        <div className="parameter-label">
          是否启用附加医疗保险
          <Switch
            checked={medicalParams.enabled}
            onChange={(checked) => {
              setMedicalParams({ ...medicalParams, enabled: checked });
            }}
          />
        </div>
      </div>

      {medicalParams.enabled && (
        <>
          <div className="parameter-group">
            <div className="group-title">
              <HeartOutlined />
              医疗保险参数
            </div>

            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  每人保险金额（元）
                  <Tooltip title="影响MP1系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  MP1: {calculateM1(medicalParams.coverageAmount).toFixed(2)}
                </div>
              </div>
              <div className="parameter-controls">
                <Slider
                  min={2000}
                  max={200000}
                  step={1000}
                  value={medicalParams.coverageAmount}
                  onChange={(value) => {
                    setMedicalParams({ ...medicalParams, coverageAmount: value });
                  }}
                  tooltip={{ open: false }}
                />
                <InputNumber
                  min={2000}
                  max={200000}
                  step={1000}
                  value={medicalParams.coverageAmount}
                  onChange={(value) => {
                    setMedicalParams({ ...medicalParams, coverageAmount: value || 0 });
                  }}
                  formatter={(value) => `¥${value?.toLocaleString()}`}
                  parser={(value) => Number(value!.replace(/¥\s?|(,*)/g, ''))}
                  // 移除自动计算，改为点击确认按钮触发
                />
              </div>
            </div>

            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  免赔额（元）
                  <Tooltip title="影响MP2系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  MP2: {calculateM2(medicalParams.deductible).toFixed(2)}
                </div>
              </div>
              <div className="parameter-controls">
                <Slider
                  min={0}
                  max={2000}
                  step={50}
                  value={medicalParams.deductible}
                  onChange={(value) => {
                    setMedicalParams({ ...medicalParams, deductible: value });
                  }}
                  tooltip={{ open: false }}
                />
                <InputNumber
                  min={0}
                  max={2000}
                  step={50}
                  value={medicalParams.deductible}
                  onChange={(value) => {
                    setMedicalParams({ ...medicalParams, deductible: value || 0 });
                  }}
                  formatter={(value) => `¥${value}`}
                  parser={(value) => Number(value!.replace(/¥\s?|(,*)/g, ''))}
                  // 移除自动计算，改为点击确认按钮触发
                />
              </div>
            </div>

            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  给付比例（%）
                  <Tooltip title="影响MP3系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  MP3: {calculateM3(medicalParams.paymentRatio).toFixed(2)}
                </div>
              </div>
              <div className="parameter-controls">
                <Slider
                  min={50}
                  max={100}
                  step={5}
                  value={medicalParams.paymentRatio}
                  onChange={(value) => {
                    setMedicalParams({ ...medicalParams, paymentRatio: value });
                  }}
                  tooltip={{ open: false }}
                />
                <InputNumber
                  min={50}
                  max={100}
                  step={5}
                  value={medicalParams.paymentRatio}
                  onChange={(value) => {
                    setMedicalParams({ ...medicalParams, paymentRatio: value || 0 });
                  }}
                  formatter={(value) => `${value}%`}
                  parser={(value) => Number(value!.replace('%', ''))}
                  // 移除自动计算，改为点击确认按钮触发
                />
              </div>
            </div>

            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  是否参加社保/公费医疗
                  <Tooltip title="影响MP4系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  MP4: {calculateM4(medicalParams.socialInsuranceStatus).toFixed(2)}
                </div>
              </div>
              <Select
                style={{ width: '100%' }}
                value={medicalParams.socialInsuranceStatus}
                onChange={(value) => {
                  setMedicalParams({ ...medicalParams, socialInsuranceStatus: value });
                  // 移除自动计算，改为点击确认按钮触发
                }}
              >
                <Option value={SocialInsuranceStatus.PARTICIPATED}>参加（1.00）</Option>
                <Option value={SocialInsuranceStatus.NOT_PARTICIPATED}>未参加（1.50）</Option>
              </Select>
            </div>

            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  是否有其他费用补偿型医疗保险
                  <Tooltip title="影响MP5系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  MP5: {calculateM5(medicalParams.otherInsuranceStatus).toFixed(2)}
                </div>
              </div>
              <Select
                style={{ width: '100%' }}
                value={medicalParams.otherInsuranceStatus}
                onChange={(value) => {
                  setMedicalParams({ ...medicalParams, otherInsuranceStatus: value });
                  // 移除自动计算，改为点击确认按钮触发
                }}
              >
                <Option value={OtherInsuranceStatus.HAS}>有（0.90）</Option>
                <Option value={OtherInsuranceStatus.NONE}>无或无法准确获取（1.00）</Option>
              </Select>
            </div>
          </div>

          <div className="parameter-group">
            <div className="group-title">
              <SettingOutlined />
              工程费率因子（MF1-MF7）
            </div>

            <Alert
              message="费率因子继承说明"
              description="MF1-MF7继承自主险的K1-K7系数，由主险参数决定。以下为当前主险参数对应的系数值："
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {/* MF1/MF2: 造价或面积调整系数 */}
            {mainParams.projectNature === ProjectNature.NON_RURAL && (
              <div className="parameter-item">
                <div className="parameter-label">
                  <div className="label-left">
                    MF1 - 工程造价调整系数
                    <Tooltip title="继承自主险K1系数">
                      <InfoCircleOutlined className="tooltip-icon" />
                    </Tooltip>
                  </div>
                  <div className="factor-range">
                    MF1: {calculateK1(mainParams.baseAmount / 10000).toFixed(2)}
                  </div>
                </div>
                <div className="parameter-info">
                  <span>工程造价：{(mainParams.baseAmount / 10000).toFixed(2)}万元</span>
                </div>
              </div>
            )}

            {mainParams.projectNature === ProjectNature.RURAL && (
              <div className="parameter-item">
                <div className="parameter-label">
                  <div className="label-left">
                    MF2 - 工程面积调整系数
                    <Tooltip title="继承自主险K2系数">
                      <InfoCircleOutlined className="tooltip-icon" />
                    </Tooltip>
                  </div>
                  <div className="factor-range">
                    MF2: {calculateK2(mainParams.baseAmount).toFixed(2)}
                  </div>
                </div>
                <div className="parameter-info">
                  <span>工程面积：{mainParams.baseAmount}㎡</span>
                </div>
              </div>
            )}

            {/* MF3: 施工合同类型系数 */}
            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  MF3 - 施工合同类型系数
                  <Tooltip title="继承自主险K3系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  MF3: {K3_CONTRACT_TYPE_FACTORS[mainParams.contractType]?.toFixed(2) || '1.00'}
                </div>
              </div>
              <div className="parameter-info">
                <span>
                  {mainParams.contractType === ContractType.GENERAL_CONTRACT && '总包、专业分包'}
                  {mainParams.contractType === ContractType.SPECIAL_SUBCONTRACT && '专业分包'}
                  {mainParams.contractType === ContractType.LABOR_CLASS_1 && '一类工程劳务分包'}
                  {mainParams.contractType === ContractType.LABOR_CLASS_2 && '二类工程劳务分包'}
                  {mainParams.contractType === ContractType.LABOR_CLASS_3 && '三类工程劳务分包'}
                  {mainParams.contractType === ContractType.LABOR_CLASS_4 && '四类工程劳务分包'}
                </span>
              </div>
            </div>

            {/* MF4: 工程类型系数 */}
            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  MF4 - 工程类型系数
                  <Tooltip title="继承自主险K4系数，可在范围内调整">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  MF4范围: [{k4Range?.min || '-'}, {k4Range?.max || '-'}]
                </div>
              </div>
              <div className="parameter-controls">
                <Slider
                  min={k4Range?.min || 1}
                  max={k4Range?.max || 2.5}
                  step={0.01}
                  value={mf4Value}
                  onChange={(value) => {
                    setMf4Value(value);
                  }}
                  tooltip={{ open: false }}
                />
                <InputNumber
                  min={k4Range?.min || 1}
                  max={k4Range?.max || 2.5}
                  step={0.01}
                  precision={2}
                  value={mf4Value}
                  onChange={(value) => {
                    setMf4Value(value || k4Range?.min || 1);
                  }}
                />
              </div>
              <div className="parameter-info">
                <span>
                  {mainParams.engineeringClass === EngineeringClass.CLASS_1 && '一类工程'}
                  {mainParams.engineeringClass === EngineeringClass.CLASS_2 && '二类工程'}
                  {mainParams.engineeringClass === EngineeringClass.CLASS_3 && '三类工程'}
                  {mainParams.engineeringClass === EngineeringClass.CLASS_4 && '四类工程'}
                </span>
                <span className="current-factor">当前值: {mf4Value.toFixed(2)}</span>
              </div>
            </div>

            {/* MF5: 施工期限系数 */}
            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  MF5 - 施工期限系数
                  <Tooltip title="继承自主险K5系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  MF5: {calculateK5(mainParams.durationDays).toFixed(2)}
                </div>
              </div>
              <div className="parameter-info">
                <span>施工期限：{mainParams.durationDays}天（约{Math.floor(mainParams.durationDays / 365)}年）</span>
              </div>
            </div>

            {/* MF6: 施工资质系数 */}
            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  MF6 - 施工资质系数
                  <Tooltip title="继承自主险K6系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  MF6: {
                    mainParams.qualification === ConstructionQualification.SPECIAL ? '0.90' :
                    mainParams.qualification === ConstructionQualification.GRADE_1 ? '0.95' :
                    mainParams.qualification === ConstructionQualification.GRADE_2 ? '1.00' :
                    mainParams.qualification === ConstructionQualification.GRADE_3 ? '1.10' :
                    mainParams.qualification === ConstructionQualification.UNGRADED ? '1.20' : '-'
                  }
                </div>
              </div>
              <div className="parameter-info">
                <span>
                  {mainParams.qualification === ConstructionQualification.SPECIAL && '特级'}
                  {mainParams.qualification === ConstructionQualification.GRADE_1 && '一级'}
                  {mainParams.qualification === ConstructionQualification.GRADE_2 && '二级'}
                  {mainParams.qualification === ConstructionQualification.GRADE_3 && '三级'}
                  {mainParams.qualification === ConstructionQualification.UNGRADED && '不分类'}
                </span>
              </div>
            </div>

            {/* MF7: 企业风险管理水平系数 */}
            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  MF7 - 企业风险管理水平系数
                  <Tooltip title="继承自主险K7系数，可在范围内调整">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  MF7范围: [{k7Range?.min || '-'}, {k7Range?.max || '-'}]
                </div>
              </div>
              <div className="parameter-controls">
                <Slider
                  min={k7Range?.min || 0.5}
                  max={k7Range?.max || 1.5}
                  step={0.01}
                  value={mf7Value}
                  onChange={(value) => {
                    setMf7Value(value);
                  }}
                  tooltip={{ open: false }}
                />
                <InputNumber
                  min={k7Range?.min || 0.5}
                  max={k7Range?.max || 1.5}
                  step={0.01}
                  precision={2}
                  value={mf7Value}
                  onChange={(value) => {
                    setMf7Value(value || k7Range?.min || 0.5);
                  }}
                />
              </div>
              <div className="parameter-info">
                <span>
                  {mainParams.riskManagementLevel === RiskManagementLevel.SOUND && '健全'}
                  {mainParams.riskManagementLevel === RiskManagementLevel.RELATIVELY_SOUND && '较健全'}
                  {mainParams.riskManagementLevel === RiskManagementLevel.POOR && '不健全'}
                </span>
                <span className="current-factor">当前值: {mf7Value.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Alert
            message="费率因子说明"
            description={
              <div>
                <div>附加医疗保险使用MP1-MP5医疗参数调整因子和MF1-MF7工程费率因子：</div>
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  • MP1-MP5：医疗专用参数（保额、免赔额、给付比例、社保、其他医保）</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  • MF1-MF7：工程费率因子（继承自主险K1-K7，系数值相同）</div>
                <div style={{ marginTop: 8, fontSize: '12px', color: '#1890ff' }}>
                  注：MF1-MF7系数值由主险参数决定，可在主险页面查看具体数值
                </div>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* 确认计算按钮 */}
          <div className="parameter-item" style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed #d9d9d9' }}>
            <Button
              type="primary"
              size="large"
              block
              onClick={handleCalculate}
              loading={calculating}
              icon={<CalculatorOutlined />}
              style={{
                height: '48px',
                fontSize: '16px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
              }}
            >
              {calculating ? '计算中...' : '确认计算保费'}
            </Button>
            <div style={{ textAlign: 'center', marginTop: '8px', color: '#8c8c8c', fontSize: '12px' }}>
              修改医疗参数后请点击此按钮同步计算
            </div>
          </div>
        </>
      )}
    </ParameterPanel>
  );

  const renderAllowanceInsuranceTab = () => (
    <ParameterPanel
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="parameter-item" style={{ marginBottom: '20px' }}>
        <div className="parameter-label">
          是否启用附加住院津贴保险
          <Switch
            checked={allowanceParams.enabled}
            onChange={(checked) => {
              setAllowanceParams({ ...allowanceParams, enabled: checked });
            }}
          />
        </div>
      </div>

      {allowanceParams.enabled && (
        <>
          <div className="parameter-group">
            <div className="group-title">
              <BankOutlined />
              住院津贴参数
            </div>

            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  每人每日津贴金额（元/天）
                  <Tooltip title="影响津贴倍数（日限额/10）">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  倍数: {(allowanceParams.dailyAmount / 10).toFixed(2)}
                </div>
              </div>
              <div className="parameter-controls">
                <Slider
                  min={10}
                  max={200}
                  step={10}
                  value={allowanceParams.dailyAmount}
                  onChange={(value) => {
                    setAllowanceParams({ ...allowanceParams, dailyAmount: value });
                  }}
                  tooltip={{ open: false }}
                />
                <InputNumber
                  min={10}
                  max={200}
                  step={10}
                  value={allowanceParams.dailyAmount}
                  onChange={(value) => {
                    setAllowanceParams({ ...allowanceParams, dailyAmount: value || 0 });
                  }}
                  formatter={(value) => `¥${value}/天`}
                  parser={(value) => Number(value!.replace(/¥\s?|\/天|(,*)/g, ''))}
                  // 移除自动计算，改为点击确认按钮触发
                />
              </div>
            </div>

            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  免赔日数（天）
                  <Tooltip title="影响AM1系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  AM1: {calculateAllowanceAM1(allowanceParams.deductibleDays).toFixed(2)}
                </div>
              </div>
              <div className="parameter-controls">
                <Slider
                  min={0}
                  max={3}
                  step={1}
                  value={allowanceParams.deductibleDays}
                  onChange={(value) => {
                    setAllowanceParams({ ...allowanceParams, deductibleDays: value });
                  }}
                  tooltip={{ open: false }}
                />
                <InputNumber
                  min={0}
                  max={3}
                  step={1}
                  value={allowanceParams.deductibleDays}
                  onChange={(value) => {
                    setAllowanceParams({ ...allowanceParams, deductibleDays: value || 0 });
                  }}
                  formatter={(value) => `${value}天`}
                  parser={(value) => Number(value!.replace('天', ''))}
                  // 移除自动计算，改为点击确认按钮触发
                />
              </div>
              <div className="parameter-info">
                <span>0天免赔系数最高(1.22)，3天免赔系数为1.00</span>
              </div>
            </div>

            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  每次最高给付日数（天）
                  <Tooltip title="影响AM2系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  AM2: {calculateAllowanceAM2(allowanceParams.maxPaymentDays).toFixed(2)}
                </div>
              </div>
              <div className="parameter-controls">
                <Slider
                  min={15}
                  max={180}
                  step={15}
                  value={allowanceParams.maxPaymentDays}
                  onChange={(value) => {
                    setAllowanceParams({ ...allowanceParams, maxPaymentDays: value });
                  }}
                  tooltip={{ open: false }}
                />
                <InputNumber
                  min={15}
                  max={180}
                  step={15}
                  value={allowanceParams.maxPaymentDays}
                  onChange={(value) => {
                    setAllowanceParams({ ...allowanceParams, maxPaymentDays: value || 0 });
                  }}
                  formatter={(value) => `${value}天`}
                  parser={(value) => Number(value!.replace('天', ''))}
                  // 移除自动计算，改为点击确认按钮触发
                />
              </div>
            </div>

            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  累计给付日数（天）
                  <Tooltip title="影响AM3系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  AM3: {calculateAllowanceAM3(allowanceParams.totalAllowanceDays).toFixed(2)}
                </div>
              </div>
              <div className="parameter-controls">
                <Slider
                  min={90}
                  max={365}
                  step={15}
                  value={allowanceParams.totalAllowanceDays}
                  onChange={(value) => {
                    setAllowanceParams({ ...allowanceParams, totalAllowanceDays: value });
                  }}
                  tooltip={{ open: false }}
                />
                <InputNumber
                  min={90}
                  max={365}
                  step={15}
                  value={allowanceParams.totalAllowanceDays}
                  onChange={(value) => {
                    setAllowanceParams({ ...allowanceParams, totalAllowanceDays: value || 0 });
                  }}
                  formatter={(value) => `${value}天`}
                  parser={(value) => Number(value!.replace('天', ''))}
                  // 移除自动计算，改为点击确认按钮触发
                />
              </div>
            </div>
          </div>

          <div className="parameter-group">
            <div className="group-title">
              <SettingOutlined />
              工程费率因子（AK1-AK7）
            </div>

            <Alert
              message="费率因子继承说明"
              description="AK1-AK7继承自主险的K1-K7系数，由主险参数决定。以下为当前主险参数对应的系数值："
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {/* AK1/AK2: 造价或面积调整系数 */}
            {mainParams.projectNature === ProjectNature.NON_RURAL && (
              <div className="parameter-item">
                <div className="parameter-label">
                  <div className="label-left">
                    AK1 - 工程造价调整系数
                    <Tooltip title="继承自主险K1系数">
                      <InfoCircleOutlined className="tooltip-icon" />
                    </Tooltip>
                  </div>
                  <div className="factor-range">
                    AK1: {calculateK1(mainParams.baseAmount / 10000).toFixed(2)}
                  </div>
                </div>
                <div className="parameter-info">
                  <span>工程造价：{(mainParams.baseAmount / 10000).toFixed(2)}万元</span>
                </div>
              </div>
            )}

            {mainParams.projectNature === ProjectNature.RURAL && (
              <div className="parameter-item">
                <div className="parameter-label">
                  <div className="label-left">
                    AK2 - 工程面积调整系数
                    <Tooltip title="继承自主险K2系数">
                      <InfoCircleOutlined className="tooltip-icon" />
                    </Tooltip>
                  </div>
                  <div className="factor-range">
                    AK2: {calculateK2(mainParams.baseAmount).toFixed(2)}
                  </div>
                </div>
                <div className="parameter-info">
                  <span>工程面积：{mainParams.baseAmount}㎡</span>
                </div>
              </div>
            )}

            {/* AK3: 施工合同类型系数 */}
            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  AK3 - 施工合同类型系数
                  <Tooltip title="继承自主险K3系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  AK3: {K3_CONTRACT_TYPE_FACTORS[mainParams.contractType]?.toFixed(2) || '1.00'}
                </div>
              </div>
              <div className="parameter-info">
                <span>
                  {mainParams.contractType === ContractType.GENERAL_CONTRACT && '总包、专业分包'}
                  {mainParams.contractType === ContractType.SPECIAL_SUBCONTRACT && '专业分包'}
                  {mainParams.contractType === ContractType.LABOR_CLASS_1 && '一类工程劳务分包'}
                  {mainParams.contractType === ContractType.LABOR_CLASS_2 && '二类工程劳务分包'}
                  {mainParams.contractType === ContractType.LABOR_CLASS_3 && '三类工程劳务分包'}
                  {mainParams.contractType === ContractType.LABOR_CLASS_4 && '四类工程劳务分包'}
                </span>
              </div>
            </div>

            {/* AK4: 工程类型系数（范围系数，可调整） */}
            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  AK4 - 工程类型系数
                  <Tooltip title="继承自主险K4系数，可在范围内调整">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  AK4范围: [{k4Range?.min || '-'}, {k4Range?.max || '-'}]
                </div>
              </div>
              <div className="parameter-controls">
                <Slider
                  min={k4Range?.min || 1}
                  max={k4Range?.max || 2.5}
                  step={0.01}
                  value={ak4Value}
                  onChange={(value) => {
                    setAk4Value(value);
                  }}
                  tooltip={{ open: false }}
                />
                <InputNumber
                  min={k4Range?.min || 1}
                  max={k4Range?.max || 2.5}
                  step={0.01}
                  precision={2}
                  value={ak4Value}
                  onChange={(value) => {
                    setAk4Value(value || k4Range?.min || 1);
                  }}
                />
              </div>
              <div className="parameter-info">
                <span>
                  {mainParams.engineeringClass === EngineeringClass.CLASS_1 && '一类工程'}
                  {mainParams.engineeringClass === EngineeringClass.CLASS_2 && '二类工程'}
                  {mainParams.engineeringClass === EngineeringClass.CLASS_3 && '三类工程'}
                  {mainParams.engineeringClass === EngineeringClass.CLASS_4 && '四类工程'}
                </span>
                <span className="current-factor">当前值: {ak4Value.toFixed(2)}</span>
              </div>
            </div>

            {/* AK5: 施工期限系数 */}
            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  AK5 - 施工期限系数
                  <Tooltip title="继承自主险K5系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  AK5: {calculateK5(mainParams.durationDays).toFixed(2)}
                </div>
              </div>
              <div className="parameter-info">
                <span>施工期限：{mainParams.durationDays}天（约{Math.floor(mainParams.durationDays / 365)}年）</span>
              </div>
            </div>

            {/* AK6: 施工资质系数 */}
            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  AK6 - 施工资质系数
                  <Tooltip title="继承自主险K6系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  AK6: {
                    mainParams.qualification === ConstructionQualification.SPECIAL ? '0.90' :
                    mainParams.qualification === ConstructionQualification.GRADE_1 ? '0.95' :
                    mainParams.qualification === ConstructionQualification.GRADE_2 ? '1.00' :
                    mainParams.qualification === ConstructionQualification.GRADE_3 ? '1.10' :
                    mainParams.qualification === ConstructionQualification.UNGRADED ? '1.20' : '-'
                  }
                </div>
              </div>
              <div className="parameter-info">
                <span>
                  {mainParams.qualification === ConstructionQualification.SPECIAL && '特级'}
                  {mainParams.qualification === ConstructionQualification.GRADE_1 && '一级'}
                  {mainParams.qualification === ConstructionQualification.GRADE_2 && '二级'}
                  {mainParams.qualification === ConstructionQualification.GRADE_3 && '三级'}
                  {mainParams.qualification === ConstructionQualification.UNGRADED && '不分类'}
                </span>
              </div>
            </div>

            {/* AK7: 企业风险管理水平系数 */}
            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  AK7 - 企业风险管理水平系数
                  <Tooltip title="继承自主险K7系数，可在范围内调整">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  当前值: {ak7Value.toFixed(2)}
                </div>
              </div>
              <div className="parameter-controls">
                <Slider
                  min={k7Range?.min || 0.5}
                  max={k7Range?.max || 1.5}
                  step={0.01}
                  value={ak7Value}
                  onChange={(value) => {
                    setAk7Value(value);
                  }}
                  tooltip={{ open: false }}
                />
                <InputNumber
                  min={k7Range?.min || 0.5}
                  max={k7Range?.max || 1.5}
                  step={0.01}
                  precision={2}
                  value={ak7Value}
                  onChange={(value) => {
                    setAk7Value(value || k7Range?.min || 0.5);
                  }}
                />
              </div>
              <div className="parameter-info">
                <span>
                  {mainParams.riskManagementLevel === RiskManagementLevel.SOUND &&
                    '风险管理规章制度健全、人员专业能力高、定期进行安全教育培训 (0.5≤AK7<0.9)'}
                  {mainParams.riskManagementLevel === RiskManagementLevel.RELATIVELY_SOUND &&
                    '风险管理规章制度较为健全、人员专业能力较高、能进行安全教育培训 (0.9≤AK7<1.2)'}
                  {mainParams.riskManagementLevel === RiskManagementLevel.POOR &&
                    '风险管理规章制度不健全、人员专业能力不高、从未进行安全教育培训 (1.2≤AK7≤1.5)'}
                </span>
              </div>
            </div>
          </div>

          <Alert
            message="费率因子说明"
            description="附加住院津贴保险使用AM1-AM3津贴参数调整因子和AK1-AK7工程费率因子："
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* 确认计算按钮 */}
          <div className="parameter-item" style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed #d9d9d9' }}>
            <Button
              type="primary"
              size="large"
              block
              onClick={handleCalculate}
              loading={calculating}
              icon={<CalculatorOutlined />}
              style={{
                height: '48px',
                fontSize: '16px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
              }}
            >
              {calculating ? '计算中...' : '确认计算保费'}
            </Button>
            <div style={{ textAlign: 'center', marginTop: '8px', color: '#8c8c8c', fontSize: '12px' }}>
              修改住院津贴参数后请点击此按钮同步计算
            </div>
          </div>
        </>
      )}
    </ParameterPanel>
  );

  const renderAcuteDiseaseTab = () => (
    <ParameterPanel
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="parameter-item" style={{ marginBottom: '20px' }}>
        <div className="parameter-label">
          是否启用附加急性病身故保险
          <Switch
            checked={acuteDiseaseParams.enabled}
            onChange={(checked) => {
              setAcuteDiseaseParams({ ...acuteDiseaseParams, enabled: checked });
            }}
          />
        </div>
      </div>

      {acuteDiseaseParams.enabled && (
        <>
          <div className="parameter-group">
            <div className="group-title">
              <ThunderboltOutlined />
              急性病保险参数
            </div>

            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  每人保险金额（元）
                  <Tooltip title="保额越高，保费越高">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  保额系数: {(acuteDiseaseParams.coverageAmount / 10000).toFixed(2)}
                </div>
              </div>
              <div className="parameter-controls">
                <Slider
                  min={50000}
                  max={1000000}
                  step={50000}
                  value={acuteDiseaseParams.coverageAmount}
                  onChange={(value) => {
                    setAcuteDiseaseParams({ ...acuteDiseaseParams, coverageAmount: value });
                  }}
                  tooltip={{ open: false }}
                />
                <InputNumber
                  min={50000}
                  max={1000000}
                  step={50000}
                  value={acuteDiseaseParams.coverageAmount}
                  onChange={(value) => {
                    setAcuteDiseaseParams({ ...acuteDiseaseParams, coverageAmount: value || 0 });
                  }}
                  formatter={(value) => `¥${value?.toLocaleString()}`}
                  parser={(value) => Number(value!.replace(/¥\s?|(,*)/g, ''))}
                  // 移除自动计算，改为点击确认按钮触发
                />
              </div>
            </div>

            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  被保险人风险状况
                  <Tooltip title="影响AQ1系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  AQ1: {calculateAQ1(acuteDiseaseParams.personRiskLevel).toFixed(2)}
                </div>
              </div>
              <Select
                style={{ width: '100%' }}
                value={acuteDiseaseParams.personRiskLevel}
                onChange={(value) => {
                  setAcuteDiseaseParams({ ...acuteDiseaseParams, personRiskLevel: value });
                  // 移除自动计算，改为点击确认按钮触发
                }}
              >
                <Option value={PersonRiskLevel.CLASS_A}>A类水平（低风险，0.8）</Option>
                <Option value={PersonRiskLevel.CLASS_B}>B类水平（中风险，1.0）</Option>
                <Option value={PersonRiskLevel.CLASS_C}>C类水平（高风险，1.2）</Option>
              </Select>
            </div>

            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  所在区域等级
                  <Tooltip title="影响AQ2系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  AQ2范围: [{aq2Range?.min || '-'}, {aq2Range?.max || '-'}]
                </div>
              </div>
              <Select
                style={{ width: '100%' }}
                value={acuteDiseaseParams.regionLevel}
                onChange={(value) => {
                  setAcuteDiseaseParams({ ...acuteDiseaseParams, regionLevel: value });
                }}
              >
                <Option value={RegionLevel.CLASS_A}>A类地区（优/低风险，0.7-0.9）</Option>
                <Option value={RegionLevel.CLASS_B}>B类地区（良/中风险，0.9-1.0]</Option>
                <Option value={RegionLevel.CLASS_C}>C类地区（一般/高风险，1.0-1.3]</Option>
              </Select>
            </div>

            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  AQ2系数（区域风险）
                  <Tooltip title={`请在范围内选择合适的AQ2值 [${aq2Range?.min || '-'}, ${aq2Range?.max || '-'}]`}>
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  当前值: {aq2Value.toFixed(2)}
                </div>
              </div>
              <div className="parameter-controls">
                <Slider
                  min={aq2Range?.min || 0.7}
                  max={aq2Range?.max || 1.3}
                  step={0.01}
                  value={aq2Value}
                  onChange={(value) => {
                    setAq2Value(value);
                  }}
                  tooltip={{ open: false }}
                />
                <InputNumber
                  min={aq2Range?.min || 0.7}
                  max={aq2Range?.max || 1.3}
                  step={0.01}
                  precision={2}
                  value={aq2Value}
                  onChange={(value) => {
                    setAq2Value(value || aq2Range?.min || 0.7);
                  }}
                />
              </div>
            </div>

            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  企业分类等级
                  <Tooltip title="影响AQ3系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  AQ3范围: [{aq3Range?.min || '-'}, {aq3Range?.max || '-'}]
                </div>
              </div>
              <Select
                style={{ width: '100%' }}
                value={acuteDiseaseParams.enterpriseCategory}
                onChange={(value) => {
                  setAcuteDiseaseParams({ ...acuteDiseaseParams, enterpriseCategory: value });
                }}
              >
                <Option value={EnterpriseCategory.CLASS_A}>A类企业（0.9）</Option>
                <Option value={EnterpriseCategory.CLASS_B}>B类企业（0.9-1.0]</Option>
                <Option value={EnterpriseCategory.CLASS_C}>C类企业（1.0-1.5]</Option>
              </Select>
            </div>

            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  AQ3系数（企业分类风险）
                  <Tooltip title={`请在范围内选择合适的AQ3值 [${aq3Range?.min || '-'}, ${aq3Range?.max || '-'}]`}>
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
                <div className="factor-range">
                  当前值: {aq3Value.toFixed(2)}
                </div>
              </div>
              <div className="parameter-controls">
                <Slider
                  min={aq3Range?.min || 0.9}
                  max={aq3Range?.max || 1.5}
                  step={0.01}
                  value={aq3Value}
                  onChange={(value) => {
                    setAq3Value(value);
                  }}
                  tooltip={{ open: false }}
                />
                <InputNumber
                  min={aq3Range?.min || 0.9}
                  max={aq3Range?.max || 1.5}
                  step={0.01}
                  precision={2}
                  value={aq3Value}
                  onChange={(value) => {
                    setAq3Value(value || aq3Range?.min || 0.9);
                  }}
                />
              </div>
            </div>
          </div>

          <Alert
            message="费率因子说明"
            description="附加急性病身故保险使用独立的AQ1-AQ3参数调整系数，不继承主险的K因子。计费基数与主险保持一致。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* 确认计算按钮 */}
          <div className="parameter-item" style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed #d9d9d9' }}>
            <Button
              type="primary"
              size="large"
              block
              onClick={handleCalculate}
              loading={calculating}
              icon={<CalculatorOutlined />}
              style={{
                height: '48px',
                fontSize: '16px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
              }}
            >
              {calculating ? '计算中...' : '确认计算保费'}
            </Button>
            <div style={{ textAlign: 'center', marginTop: '8px', color: '#8c8c8c', fontSize: '12px' }}>
              修改急性病参数后请点击此按钮同步计算
            </div>
          </div>
        </>
      )}
    </ParameterPanel>
  );

  const renderPlateauDiseaseTab = () => (
    <ParameterPanel
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="parameter-item" style={{ marginBottom: '20px' }}>
        <div className="parameter-label">
          是否启用附加高原病保险
          <Switch
            checked={plateauDiseaseParams.enabled}
            onChange={(checked) => {
              setPlateauDiseaseParams({ ...plateauDiseaseParams, enabled: checked });
            }}
          />
        </div>
      </div>

      {plateauDiseaseParams.enabled && (
        <>
          <div className="parameter-group">
            <div className="group-title">
              <EnvironmentOutlined />
              高原病保险参数
            </div>

            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  被保险人风险状况（高原适应力）
                  <Tooltip title="影响R1系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
              </div>
              <Select
                style={{ width: '100%' }}
                value={plateauDiseaseParams.personRiskLevel}
                onChange={(value) => {
                  setPlateauDiseaseParams({ ...plateauDiseaseParams, personRiskLevel: value });
                  // 移除自动计算，改为点击确认按钮触发
                }}
              >
                <Option value={PersonRiskLevel.CLASS_A}>高原适应力强（0.8）</Option>
                <Option value={PersonRiskLevel.CLASS_B}>高原适应力中等（1.0）</Option>
                <Option value={PersonRiskLevel.CLASS_C}>高原适应力弱（1.2）</Option>
              </Select>
            </div>

            <div className="parameter-item">
              <div className="parameter-label">
                <div className="label-left">
                  销售/目的地区域（海拔风险）
                  <Tooltip title="影响R2系数">
                    <InfoCircleOutlined className="tooltip-icon" />
                  </Tooltip>
                </div>
              </div>
              <Select
                style={{ width: '100%' }}
                value={plateauDiseaseParams.regionLevel}
                onChange={(value) => {
                  setPlateauDiseaseParams({ ...plateauDiseaseParams, regionLevel: value });
                  // 移除自动计算，改为点击确认按钮触发
                }}
              >
                <Option value={RegionLevel.CLASS_A}>低海拔风险（0.7）</Option>
                <Option value={RegionLevel.CLASS_B}>中海拔风险（0.9）</Option>
                <Option value={RegionLevel.CLASS_C}>高海拔风险（1.0）</Option>
              </Select>
            </div>
          </div>

          <Alert
            message="费率计算说明"
            description="附加高原病保险保费 = 主险保费 × 8.1% × R1 × R2。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* 确认计算按钮 */}
          <div className="parameter-item" style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed #d9d9d9' }}>
            <Button
              type="primary"
              size="large"
              block
              onClick={handleCalculate}
              loading={calculating}
              icon={<CalculatorOutlined />}
              style={{
                height: '48px',
                fontSize: '16px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
              }}
            >
              {calculating ? '计算中...' : '确认计算保费'}
            </Button>
            <div style={{ textAlign: 'center', marginTop: '8px', color: '#8c8c8c', fontSize: '12px' }}>
              修改高原病参数后请点击此按钮同步计算
            </div>
          </div>
        </>
      )}
    </ParameterPanel>
  );

  const tabItems = [
    {
      key: 'main',
      label: (
        <span>
          <SafetyOutlined />
          主险配置
        </span>
      ),
      children: renderMainInsuranceTab(),
    },
    {
      key: 'medical',
      label: (
        <span>
          <HeartOutlined />
          附加医疗保险
        </span>
      ),
      children: renderMedicalInsuranceTab(),
    },
    {
      key: 'allowance',
      label: (
        <span>
          <BankOutlined />
          附加住院津贴
        </span>
      ),
      children: renderAllowanceInsuranceTab(),
    },
    {
      key: 'acute',
      label: (
        <span>
          <ThunderboltOutlined />
          附加急性病
        </span>
      ),
      children: renderAcuteDiseaseTab(),
    },
    {
      key: 'plateau',
      label: (
        <span>
          <EnvironmentOutlined />
          附加高原病
        </span>
      ),
      children: renderPlateauDiseaseTab(),
    },
  ];

  return (
    <>
      <GlobalStyles />
      <PageContainer>
        {/* 引导卡片 - 当没有项目时显示 */}
        {showGuideCard && (
          <StyledCard
            style={{
              marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              border: '1px solid #BFDBFE',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
              <div style={{
                fontSize: '2.5rem',
                color: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)',
              }}>
                <CalculatorOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  color: '#1E293B',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  margin: '0 0 0.5rem 0',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  欢迎使用智能报价计算器
                </h3>
                <p style={{
                  color: '#7A746E',
                  marginBottom: '1.25rem',
                  fontSize: '0.95rem',
                  marginTop: '0.5rem',
                  lineHeight: '1.6',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  为了更好地为您服务，请先选择一个操作方式：
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<FileTextOutlined />}
                    onClick={() => navigate('/contract')}
                    style={{
                      background: '#3B82F6',
                      borderColor: '#3B82F6',
                      color: 'white',
                      height: '44px',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#2563EB';
                      e.currentTarget.style.borderColor = '#2563EB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#3B82F6';
                      e.currentTarget.style.borderColor = '#3B82F6';
                    }}
                  >
                    上传合同智能解析
                  </Button>
                  <Button
                    size="large"
                    icon={<HistoryOutlined />}
                    onClick={() => navigate('/pricing-plans')}
                    style={{
                      background: 'white',
                      color: '#3B82F6',
                      border: '1px solid #BFDBFE',
                      height: '44px',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      borderRadius: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3B82F6';
                      e.currentTarget.style.background = '#EFF6FF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#BFDBFE';
                    }}
                  >
                    加载已保存的方案
                  </Button>
                  <Button
                    size="large"
                    onClick={() => setShowGuideCard(false)}
                    style={{
                      background: 'transparent',
                      color: '#7A746E',
                      border: '1px dashed #D4D0CB',
                      height: '44px',
                      fontSize: '0.95rem',
                      borderRadius: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#3B82F6';
                      e.currentTarget.style.borderColor = '#3B82F6';
                      e.currentTarget.style.background = '#EFF6FF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#7A746E';
                      e.currentTarget.style.borderColor = '#D4D0CB';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    跳过，直接使用计算器
                  </Button>
                </div>
              </div>
            </div>
          </StyledCard>
        )}

        {/* 视图控制栏 */}
        <ViewControlBar>
          <div className="view-title">
            <CalculatorOutlined />
            智能报价计算器
          </div>
          <div className="view-controls">
            <button
              className={`control-btn ${viewLayout === 'horizontal' ? 'active' : ''}`}
              onClick={() => {
                setViewLayout('horizontal');
                localStorage.setItem('pricing-view-layout', 'horizontal');
              }}
            >
              <ColumnWidthOutlined />
              左右分栏
            </button>
            <button
              className={`control-btn ${viewLayout === 'vertical' ? 'active' : ''}`}
              onClick={() => {
                setViewLayout('vertical');
                localStorage.setItem('pricing-view-layout', 'vertical');
              }}
            >
              <VerticalAlignTopOutlined />
              上下布局
            </button>
          </div>
        </ViewControlBar>

        <Row gutter={[24, 24]}>
          {/* 参数面板 */}
          <Col span={viewLayout === 'horizontal' ? 16 : 24}>
            <StyledCard
              title={
                <>
                  <SettingOutlined />
                  智能报价系统
                </>
              }
            >
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                type="card"
                size="large"
              />
            </StyledCard>
          </Col>

          {/* 结果面板 */}
          <Col span={viewLayout === 'horizontal' ? 8 : 24}>
            <AnimatePresence>
              {result && (
                <>
                  {/* 折叠摘要 */}
                  {resultCollapsed && (
                    <ResultSummary
                      key="summary"
                      $layout={viewLayout}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      onClick={handleToggleCollapse}
                    >
                      <div className="summary-header">
                        <div className="summary-title">
                          <CalculatorOutlined />
                          计算结果
                        </div>
                        <div className={`summary-toggle ${resultCollapsed ? 'collapsed' : ''}`}>
                          <ExpandOutlined />
                          展开详情
                        </div>
                      </div>
                      <div className="summary-content">
                        <div className="summary-item">
                          <div className="item-label">总保费</div>
                          <div className="item-value">{formatCurrency(result.totalPremium)}</div>
                        </div>
                        <div className="summary-item">
                          <div className="item-label">主险</div>
                          <div className="item-value">{formatCurrency(result.mainInsurance.premium)}</div>
                        </div>
                        <div className="summary-item">
                          <div className="item-label">附加险</div>
                          <div className="item-value">
                            {formatCurrency(
                              (result.medicalInsurance?.premium || 0) +
                              (result.allowanceInsurance?.premium || 0) +
                              (result.acuteDiseaseInsurance?.premium || 0) +
                              (result.plateauDiseaseInsurance?.premium || 0)
                            )}
                          </div>
                        </div>
                      </div>
                    </ResultSummary>
                  )}

                  {/* 完整结果面板 */}
                  {!resultCollapsed && (
                    <ResultsPanel
                      key="results"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.6 }}
                    >
                      {/* 折叠按钮 */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          zIndex: 10,
                        }}
                      >
                        <Button
                          type="text"
                          icon={<CompressOutlined />}
                          onClick={handleToggleCollapse}
                          size="small"
                          style={{
                            color: '#64748b',
                            fontSize: '0.85rem',
                          }}
                        >
                          收起
                        </Button>
                      </div>

                      <div className="results-header">
                        <div className="total-premium">
                          {calculating ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                              <Progress type="circle" size={60} percent={100} />
                            </div>
                          ) : (
                            formatCurrency(result.totalPremium)
                          )}
                        </div>
                        <div className="premium-label">总保费</div>
                      </div>

                      {renderPremiumRange()}

                      {renderRateCards()}

                {!calculating && (
                  <>
                    {calculationError && (
                      <Alert
                        message="计算警告"
                        description={calculationError}
                        type="warning"
                        showIcon
                        closable
                        style={{ marginBottom: '1rem' }}
                        onClose={() => setCalculationError(null)}
                      />
                    )}

                    <div className="breakdown-grid">
                      <div className="breakdown-item">
                        <div className="item-label">主险</div>
                        <div className="item-value">{formatCurrency(result.mainInsurance.premium)}</div>
                        <div className="item-rate">{result.mainInsurance.actualRate.toFixed(2)}‰</div>
                      </div>

                      {result.medicalInsurance && (
                        <div className="breakdown-item">
                          <div className="item-label">附加医疗保险</div>
                          <div className="item-value">{formatCurrency(result.medicalInsurance.premium)}</div>
                          <div className="item-rate">{result.medicalInsurance.actualRate.toFixed(2)}‰</div>
                        </div>
                      )}

                      {result.allowanceInsurance && (
                        <div className="breakdown-item">
                          <div className="item-label">附加住院津贴</div>
                          <div className="item-value">{formatCurrency(result.allowanceInsurance.premium)}</div>
                          <div className="item-rate">{result.allowanceInsurance.actualRate.toFixed(2)}‰</div>
                        </div>
                      )}

                      {result.acuteDiseaseInsurance && (
                        <div className="breakdown-item">
                          <div className="item-label">附加急性病</div>
                          <div className="item-value">{formatCurrency(result.acuteDiseaseInsurance.premium)}</div>
                          <div className="item-rate">{result.acuteDiseaseInsurance.actualRate.toFixed(2)}‰</div>
                        </div>
                      )}

                      {result.plateauDiseaseInsurance && (
                        <div className="breakdown-item">
                          <div className="item-label">附加高原病</div>
                          <div className="item-value">{formatCurrency(result.plateauDiseaseInsurance.premium)}</div>
                          <div className="item-rate">{result.plateauDiseaseInsurance.actualRate.toFixed(2)}%</div>
                        </div>
                      )}
                    </div>

                    <Collapse
                      defaultActiveKey={['main']}
                      style={{ marginTop: '1.5rem' }}
                      items={[
                        {
                          key: 'main',
                          label: (
                            <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                              <CalculatorOutlined style={{ marginRight: 8 }} />
                              主险保费计算过程
                            </span>
                          ),
                          children: <div>{renderMainInsuranceCalculationProcess()}</div>,
                        },
                        ...(result?.medicalInsurance
                          ? [
                              {
                                key: 'medical',
                                label: (
                                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                                    <HeartOutlined style={{ marginRight: 8 }} />
                                    附加医疗保险保费计算过程
                                  </span>
                                ),
                                children: <div>{renderMedicalInsuranceCalculationProcess()}</div>,
                              },
                            ]
                          : []),
                        ...(result?.allowanceInsurance
                          ? [
                              {
                                key: 'allowance',
                                label: (
                                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                                    <BankOutlined style={{ marginRight: 8 }} />
                                    附加住院津贴保费计算过程
                                  </span>
                                ),
                                children: <div>{renderAllowanceInsuranceCalculationProcess()}</div>,
                              },
                            ]
                          : []),
                        ...(result?.acuteDiseaseInsurance
                          ? [
                              {
                                key: 'acute',
                                label: (
                                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                                    <ThunderboltOutlined style={{ marginRight: 8 }} />
                                    附加急性病身故保费计算过程
                                  </span>
                                ),
                                children: <div>{renderAcuteDiseaseInsuranceCalculationProcess()}</div>,
                              },
                            ]
                          : []),
                        ...(result?.plateauDiseaseInsurance
                          ? [
                              {
                                key: 'plateau',
                                label: (
                                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                                    <EnvironmentOutlined style={{ marginRight: 8 }} />
                                    附加高原病保费计算过程
                                  </span>
                                ),
                                children: <div>{renderPlateauDiseaseInsuranceCalculationProcess()}</div>,
                              },
                            ]
                          : []),
                      ]}
                    />

                    <ActionButtons>
                      <Button
                        size="large"
                        icon={<SaveOutlined />}
                        style={{
                          background: 'white',
                          border: '1px solid var(--neutral-300)',
                          color: 'var(--neutral-900)',
                        }}
                        onClick={handleOpenSavePlanModal}
                      >
                        保存方案
                      </Button>
                    </ActionButtons>
                  </>
                )}
              </ResultsPanel>
              )}
            </>
          )}
        </AnimatePresence>
        </Col>

        {result && viewLayout === 'vertical' && (
          <Col span={24}>
            <StyledCard title="保费构成分析" style={{ marginTop: '1.5rem' }}>
              <ReactECharts option={getChartOption()} style={{ height: '300px' }} />
            </StyledCard>
          </Col>
        )}
      </Row>

      {/* 保存方案弹窗 */}
      <Modal
        title="保存报价方案"
        open={savePlanModalVisible}
        onOk={handleSavePlan}
        onCancel={handleCancelSavePlan}
        confirmLoading={savingPlan}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            方案名称 <span style={{ color: '#ff4d4f' }}>*</span>
          </label>
          <Input
            placeholder="请输入方案名称"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            maxLength={200}
            showCount
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            方案描述
          </label>
          <Input.TextArea
            placeholder="请输入方案描述（可选）"
            value={planDescription}
            onChange={(e) => setPlanDescription(e.target.value)}
            rows={4}
            maxLength={1000}
            showCount
          />
        </div>
        <div style={{ marginTop: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            项目名称
          </label>
          <Input
            placeholder="请输入项目名称（可选）"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            maxLength={200}
          />
        </div>
        <div style={{ marginTop: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            施工方
          </label>
          <Input
            placeholder="请输入施工方（可选）"
            value={contractor}
            onChange={(e) => setContractor(e.target.value)}
            maxLength={200}
          />
        </div>
        <div style={{ marginTop: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            项目地点
          </label>
          <Input
            placeholder="请输入项目地点（可选）"
            value={projectLocation}
            onChange={(e) => setProjectLocation(e.target.value)}
            maxLength={200}
          />
        </div>
        {result && (
          <Alert
            message="将保存以下信息"
            description={
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                <div>• 总保费：¥{result.totalPremium.toLocaleString()}</div>
                <div>• 工程造价：¥{(mainParams.baseAmount / 10000).toFixed(0)}万元</div>
                <div>• 主险保额：¥{(mainParams.coverageAmount / 10000).toFixed(0)}万元</div>
                <div>• 工程类别：{mainParams.engineeringClass}类工程</div>
              </div>
            }
            type="info"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}
      </Modal>
      </PageContainer>
    </>
  );
};

export default PricingCalculator;
