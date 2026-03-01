import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Empty, Spin, Typography } from 'antd';
import {
  SearchOutlined,
  CalculatorOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getPricingPlans, PricingPlan } from '../../services/pricingPlansApi';

const { Title, Text } = Typography;
const { Search } = Input;

const PageContainer = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;
`;

const LayoutContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  align-items: start;
`;

const StatCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  .stat-value {
    font-size: 36px;
    font-weight: 700;
    color: #1890ff;
    margin-bottom: 8px;
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .stat-label {
    font-size: 14px;
    color: #666;
    font-weight: 500;
  }
`;

const RecentItem = styled(motion.div)`
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #e6f7ff;
    border-color: #91d5ff;
    transform: translateX(4px);
  }

  .item-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    color: white;
    margin-right: 16px;
    flex-shrink: 0;
  }

  .item-content {
    flex: 1;
    min-width: 0;

    .item-title {
      font-size: 15px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-time {
      font-size: 12px;
      color: #999;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .item-action {
    color: #1890ff;
    margin-left: 12px;
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 24px;

  .search-wrapper {
    position: relative;
    background: white;
    border-radius: 16px;
    padding: 8px;
    box-shadow: 0 4px 20px rgba(24, 144, 255, 0.08);
    border: 2px solid transparent;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 6px 24px rgba(24, 144, 255, 0.15);
      border-color: #e6f7ff;
    }

    &:focus-within {
      box-shadow: 0 6px 24px rgba(24, 144, 255, 0.2);
      border-color: #1890ff;
    }
  }

  .ant-input-search {
    .ant-input {
      border: none;
      box-shadow: none;
      padding: 12px 20px;
      font-size: 15px;
      background: transparent;

      &::placeholder {
        color: #999;
        font-size: 14px;
      }

      &:hover {
        border-color: transparent;
      }

      &:focus {
        border-color: transparent;
        box-shadow: none;
      }
    }

    .ant-input-search-button {
      border-radius: 12px;
      height: 48px;
      padding: 0 28px;
      background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
      border: none;
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
      transition: all 0.3s ease;

      &:hover {
        background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
        box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
      }

      .anticon {
        font-size: 18px;
      }
    }
  }

  .search-hint {
    position: absolute;
    top: 100%;
    left: 20px;
    margin-top: 8px;
    font-size: 12px;
    color: #999;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .search-wrapper:hover .search-hint {
    opacity: 1;
  }
`;

const SearchIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SectionTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;

  .icon {
    color: #1890ff;
  }
`;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [recentPlans, setRecentPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [stats, setStats] = useState({
    totalPlans: 0,
    totalPremium: 0,
    recentCount: 0
  });

  // 加载最近方案和统计数据
  useEffect(() => {
    loadRecentData();
  }, []);

  const loadRecentData = async () => {
    setLoading(true);
    try {
      // 获取前 100 条方案用于统计和筛选
      const response = await getPricingPlans({
        page: 1,
        limit: 100,
        sortBy: 'createdAt', // 使用驼峰命名，对应数据库的 created_at
        sortOrder: 'DESC',
      });

      const allPlans = response.records;

      // 筛选近2天（48小时）内生成的方案
      const twoDaysAgo = new Date();
      twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

      const recentPlans = allPlans.filter(plan => {
        const createdDate = new Date(plan.createdAt);
        return createdDate >= twoDaysAgo;
      });

      setRecentPlans(recentPlans.slice(0, 5)); // 最多显示5条

      // 计算统计数据
      // 注意：totalPremium 是基于当前获取的100条数据计算的，不是全局总和
      setStats({
        totalPlans: response.pagination.total, // 使用总数
        totalPremium: allPlans.reduce((sum, plan) => sum + (plan.totalPremium || 0), 0), // 前100条的总保费
        recentCount: recentPlans.length, // 近2天的方案数
      });
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 全局搜索处理
  const handleSearch = (keyword: string) => {
    if (keyword.trim()) {
      navigate(`/pricing-plans?keyword=${encodeURIComponent(keyword.trim())}`);
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 跳转到方案详情
  const handlePlanClick = (planId: string) => {
    // 跳转到方案列表页，并携带 planId 参数
    navigate(`/pricing-plans?viewPlan=${planId}`);
  };

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 页面标题 */}
        <div style={{ marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0, color: '#1a1a1a' }}>
            工作台
          </Title>
          <Text style={{ fontSize: 15, color: '#666' }}>
            四川建工意外险智能报价系统
          </Text>
        </div>

        <LayoutContainer>
          {/* 全局搜索 */}
          <SearchContainer>
              <div className="search-wrapper">
                <Search
                  placeholder="搜索项目名称、施工方、地点..."
                  size="large"
                  enterButton={
                    <SearchIconWrapper>
                      <SearchOutlined />
                      搜索
                    </SearchIconWrapper>
                  }
                  onSearch={handleSearch}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  value={searchKeyword}
                  loading={loading}
                />
                <div className="search-hint">💡 智能提示：搜索唯一结果将自动打开详情</div>
              </div>
            </SearchContainer>

            {/* 统计卡片 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={8}>
                <StatCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="stat-value">{stats.totalPlans}</div>
                  <div className="stat-label">累计生成方案数</div>
                </StatCard>
              </Col>
              <Col xs={24} sm={8}>
                <StatCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="stat-value">¥{(stats.totalPremium / 10000).toFixed(1)}万</div>
                  <div className="stat-label">累计总保费</div>
                </StatCard>
              </Col>
              <Col xs={24} sm={8}>
                <StatCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="stat-value">{stats.recentCount}</div>
                  <div className="stat-label">最近活跃方案</div>
                </StatCard>
              </Col>
            </Row>

            {/* 最近记录 */}
            <Card
              bordered={false}
              style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
              title={
                <SectionTitle style={{ margin: 0 }}>
                  <ClockCircleOutlined className="icon" />
                  最近记录
                </SectionTitle>
              }
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin size="large" />
                </div>
              ) : recentPlans.length === 0 ? (
                <Empty
                  description="暂无最近记录"
                  style={{ padding: '40px 0' }}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                recentPlans.map((plan, index) => (
                  <RecentItem
                    key={plan.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                    onClick={() => handlePlanClick(plan.id)}
                  >
                    <div className="item-icon">
                      <CalculatorOutlined />
                    </div>
                    <div className="item-content">
                      <div className="item-title">{plan.planName}</div>
                      <div className="item-time">
                        <ClockCircleOutlined />
                        {formatTime(plan.updatedAt)}
                      </div>
                    </div>
                    <ArrowRightOutlined className="item-action" />
                  </RecentItem>
                ))
              )}
            </Card>
        </LayoutContainer>
      </motion.div>
    </PageContainer>
  );
};

export default Dashboard;
