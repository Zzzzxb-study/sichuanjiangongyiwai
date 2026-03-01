import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import styled, { createGlobalStyle } from 'styled-components';
import { theme } from './styles/theme';
import { ProjectProvider } from './contexts/ProjectContext';

// Import pages
import Login from './pages/Login/Login';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import ContractAnalysis from './pages/ContractAnalysis/ContractAnalysis';
import PricingCalculator from './pages/PricingCalculator/PricingCalculator';
import PricingPlans from './pages/PricingPlans/PricingPlans';
import HistoryAnalysis from './pages/HistoryAnalysis/HistoryAnalysis';
import SystemConfiguration from './pages/SystemConfiguration/SystemConfiguration';

// 路由保护组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    // 检查登录状态
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      setIsAuthenticated(isLoggedIn === 'true');
    };

    checkAuth();

    // 监听存储变化（跨标签页同步）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isLoggedIn') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 显示加载状态
  if (isAuthenticated === null) {
    return (
      <LoadingWrapper>
        <Spin size="large" tip="加载中..." />
      </LoadingWrapper>
    );
  }

  // 未登录则重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const LoadingWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--neutral-50);
`;

// Global styles with CSS variables
const GlobalStyle = createGlobalStyle`
  :root {
    /* Colors - 明亮浅色主题 */
    --primary-blue: ${theme.colors.primary.blue};
    --primary-blue-light: ${theme.colors.primary.blueLight};
    --primary-blue-dark: ${theme.colors.primary.blueDark};
    --primary-sky: ${theme.colors.primary.sky};

    --accent-gold: ${theme.colors.accent.gold};
    --accent-gold-light: ${theme.colors.accent.goldLight};
    --accent-gold-dark: ${theme.colors.accent.goldDark};

    --secondary-blue: ${theme.colors.secondary.blue};
    --secondary-cyan: ${theme.colors.secondary.cyan};
    --secondary-green: ${theme.colors.secondary.green};
    --secondary-mint: ${theme.colors.secondary.mint};
    --secondary-red: ${theme.colors.secondary.red};
    --secondary-orange: ${theme.colors.secondary.orange};

    --neutral-50: ${theme.colors.neutral[50]};
    --neutral-100: ${theme.colors.neutral[100]};
    --neutral-200: ${theme.colors.neutral[200]};
    --neutral-300: ${theme.colors.neutral[300]};
    --neutral-400: ${theme.colors.neutral[400]};
    --neutral-500: ${theme.colors.neutral[500]};
    --neutral-600: ${theme.colors.neutral[600]};
    --neutral-700: ${theme.colors.neutral[700]};
    --neutral-800: ${theme.colors.neutral[800]};
    --neutral-900: ${theme.colors.neutral[900]};

    /* Semantic colors */
    --semantic-success: ${theme.colors.semantic.success};
    --semantic-error: ${theme.colors.semantic.error};

    /* Background colors */
    --bg-blue-50: ${theme.colors.backgrounds.blue50};
    --bg-blue-100: ${theme.colors.backgrounds.blue100};

    /* Gradients */
    --gradient-warm-white: ${theme.colors.gradients.warmWhite};
    --gradient-blue-light: ${theme.colors.gradients.blueLight};
    --gradient-sky-blue: ${theme.colors.gradients.skyBlue};
    --gradient-soft-shadow: ${theme.colors.gradients.softShadow};

    /* Typography */
    --font-display: ${theme.fonts.display};
    --font-body: ${theme.fonts.body};
    --font-mono: ${theme.fonts.mono};

    /* Spacing */
    --space-xs: ${theme.spacing.xs};
    --space-sm: ${theme.spacing.sm};
    --space-md: ${theme.spacing.md};
    --space-lg: ${theme.spacing.lg};
    --space-xl: ${theme.spacing.xl};
    --space-2xl: ${theme.spacing['2xl']};
    --space-3xl: ${theme.spacing['3xl']};

    /* Border radius */
    --radius-sm: ${theme.borderRadius.sm};
    --radius-md: ${theme.borderRadius.md};
    --radius-lg: ${theme.borderRadius.lg};
    --radius-xl: ${theme.borderRadius.xl};
    --radius-2xl: ${theme.borderRadius['2xl']};

    /* Shadows */
    --shadow-sm: ${theme.shadows.sm};
    --shadow-md: ${theme.shadows.md};
    --shadow-lg: ${theme.shadows.lg};
    --shadow-xl: ${theme.shadows.xl};
    --shadow-warm: ${theme.shadows.warm};
    --shadow-warm-lg: ${theme.shadows.warmLg};
    --shadow-soft: ${theme.shadows.soft};
    --shadow-glow: ${theme.shadows.glow};

    /* Transitions */
    --transition-fast: ${theme.transitions.fast};
    --transition-normal: ${theme.transitions.normal};
    --transition-slow: ${theme.transitions.slow};
  }

  * {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    font-family: var(--font-body);
    font-size: 14px;
    line-height: 1.6;
    color: var(--neutral-700);
    background: var(--neutral-50);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    min-height: 100vh;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
    font-weight: 600;
    line-height: 1.3;
    margin: 0;
    color: var(--neutral-900);
  }

  p {
    margin: 0 0 1rem 0;
    color: var(--neutral-700);
  }

  a {
    color: var(--primary-blue);
    text-decoration: none;
    transition: color var(--transition-fast);

    &:hover {
      color: var(--primary-blue-dark);
    }
  }

  /* 滚动条 - 浅色风格 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--neutral-100);
    border-radius: var(--radius-sm);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--neutral-300);
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast);

    &:hover {
      background: var(--primary-blue);
    }
  }

  /* Ant Design 浅色主题定制 */
  .ant-btn-primary {
    background: var(--gradient-blue-light);
    border: none;
    box-shadow: var(--shadow-soft);
    font-weight: 600;
    transition: all var(--transition-normal);

    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-glow);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .ant-input {
    background: white;
    border: 1px solid var(--neutral-300);
    color: var(--neutral-900);

    &::placeholder {
      color: var(--neutral-500);
    }

    &:hover {
      border-color: var(--primary-blue);
    }
  }

  .ant-input:focus,
  .ant-input-focused {
    background: white;
    border-color: var(--primary-blue);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .ant-select {
    .ant-select-selector {
      background: white !important;
      border: 1px solid var(--neutral-300) !important;
      color: var(--neutral-900) !important;
    }

    .ant-select-selection-placeholder {
      color: var(--neutral-500) !important;
    }

    &:hover .ant-select-selector {
      border-color: var(--primary-blue) !important;
    }
  }

  .ant-select-focused .ant-select-selector {
    background: white !important;
    border-color: var(--primary-blue) !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
  }

  .ant-picker {
    background: white;
    border: 1px solid var(--neutral-300);

    input {
      color: var(--neutral-900);
    }

    &:hover {
      border-color: var(--primary-blue);
    }
  }

  .ant-picker:hover,
  .ant-picker-focused {
    border-color: var(--primary-blue);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .ant-switch-checked {
    background-color: var(--primary-blue);
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
  }

  .ant-progress-bg {
    background: var(--gradient-blue-light);
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
  }

  .ant-steps-item-finish .ant-steps-item-icon {
    background: var(--primary-blue);
    border-color: var(--primary-blue);
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
  }

  .ant-steps-item-process .ant-steps-item-icon {
    background: var(--primary-sky);
    border-color: var(--primary-sky);
    box-shadow: 0 0 15px rgba(0, 163, 255, 0.4);
  }

  /* Card 浅色风格 */
  .ant-card {
    background: white !important;
    border: 1px solid var(--neutral-300) !important;
    box-shadow: var(--shadow-warm) !important;
    border-radius: var(--radius-xl) !important;

    .ant-card-head {
      background: white !important;
      border-bottom: 2px solid var(--neutral-300) !important;

      .ant-card-head-title {
        color: var(--neutral-900) !important;
      }
    }

    .ant-card-body {
      color: var(--neutral-700) !important;
    }
  }

  /* Table 浅色风格 */
  .ant-table {
    background: transparent !important;
    color: var(--neutral-700);

    .ant-table-thead > tr > th {
      background: var(--gradient-warm-white) !important;
      color: var(--neutral-900) !important;
      border-bottom: 2px solid var(--neutral-300) !important;
      font-weight: 600;
    }

    .ant-table-tbody > tr {
      background: transparent !important;

      > td {
        border-bottom: 1px solid var(--neutral-200) !important;
        color: var(--neutral-700) !important;
      }

      &:hover > td {
        background: var(--neutral-100) !important;
      }
    }
  }

  /* Modal 浅色风格 */
  .ant-modal-content {
    background: white !important;
    border: 1px solid var(--neutral-300) !important;
    box-shadow: var(--shadow-warm-lg) !important;
    border-radius: var(--radius-xl) !important;

    .ant-modal-header {
      background: transparent !important;
      border-bottom: 2px solid var(--neutral-300) !important;

      .ant-modal-title {
        color: var(--neutral-900) !important;
      }
    }

    .ant-modal-close-x {
      color: var(--neutral-500) !important;

      &:hover {
        color: var(--primary-blue) !important;
      }
    }
  }

  /* Tag 浅色风格 */
  .ant-tag {
    background: var(--neutral-100) !important;
    border: 1px solid var(--neutral-300) !important;
    color: var(--neutral-700) !important;

    &.ant-tag-success {
      background: rgba(110, 231, 183, 0.15) !important;
      border-color: rgba(110, 231, 183, 0.4) !important;
      color: var(--secondary-green) !important;
    }

    &.ant-tag-warning {
      background: rgba(245, 158, 11, 0.15) !important;
      border-color: rgba(245, 158, 11, 0.4) !important;
      color: var(--secondary-orange) !important;
    }

    &.ant-tag-error {
      background: rgba(239, 68, 68, 0.15) !important;
      border-color: rgba(239, 68, 68, 0.4) !important;
      color: var(--secondary-red) !important;
    }

    &.ant-tag-processing {
      background: rgba(59, 130, 246, 0.15) !important;
      border-color: rgba(59, 130, 246, 0.4) !important;
      color: var(--primary-blue) !important;
    }
  }

  /* Loading 浅色风格 */
  .ant-spin-dot-item {
    background-color: var(--primary-blue);
  }

  /* Notification 浅色风格 */
  .ant-notification {
    .ant-notification-notice {
      background: white !important;
      border: 1px solid var(--neutral-300) !important;
      box-shadow: var(--shadow-warm-lg) !important;
    }
  }

  .ant-message {
    .ant-message-notice {
      .ant-message-notice-content {
        background: white !important;
        border: 1px solid var(--neutral-300) !important;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-warm);
      }
    }
  }

  /* Loading animations */
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

  /* Dropdown Menu 浅色风格 */
  .ant-dropdown {
    z-index: 99999 !important;
  }

  /* 确保所有 Dropdown 相关的弹出层都在最上层 */
  .ant-dropdown-dropdown,
  .ant-dropdown-menu,
  .ant-dropdown-menu-item,
  .ant-dropdown-arrow {
    z-index: 99999 !important;
  }

  /* 确保挂载到 body 的 Dropdown 不会被遮挡 */
  body > .ant-dropdown {
    z-index: 99999 !important;
  }

  body > .ant-dropdown-dropdown {
    z-index: 99999 !important;
  }

  .ant-dropdown-dropdown {
    background: white !important;
    border: 1px solid var(--neutral-300) !important;
    box-shadow: var(--shadow-warm-lg) !important;
    border-radius: var(--radius-lg) !important;
    padding: 8px !important;
    min-width: 180px;
    position: fixed !important;
  }

  .ant-dropdown-menu {
    background: transparent !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
  }

  .ant-dropdown-menu-item {
    color: var(--neutral-800) !important;
    padding: 10px 12px !important;
    border-radius: var(--radius-sm) !important;
    margin: 2px 0 !important;
    transition: all var(--transition-fast) !important;
    font-weight: 500;

    &:hover {
      background: var(--bg-blue-50) !important;
      color: var(--primary-blue) !important;
    }

    .anticon {
      color: var(--neutral-600);
      margin-right: 8px;
    }

    &:hover .anticon {
      color: var(--primary-blue);
    }

    &.ant-dropdown-menu-item-danger {
      color: var(--semantic-error) !important;

      &:hover {
        background: rgba(225, 29, 72, 0.1) !important;
        color: var(--semantic-error) !important;
      }

      .anticon {
        color: var(--semantic-error);
      }
    }
  }

  .ant-dropdown-menu-item-divider {
    background: var(--neutral-300) !important;
    margin: 8px 0 !important;
  }

  .ant-dropdown-arrow {
    &:before,
    &:after {
      background: white !important;
      border: 1px solid var(--neutral-300) !important;
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
      opacity: 0.5;
    }
  }

  .fade-in-up {
    animation: fadeInUp 0.6s ease-out;
  }

  .slide-in-right {
    animation: slideInRight 0.4s ease-out;
  }

  .pulse {
    animation: pulse 2s infinite;
  }

  /* Print styles */
  @media print {
    body {
      background: white !important;
      color: black !important;
    }

    .ant-layout-sider,
    .ant-layout-header {
      display: none !important;
    }

    .ant-layout-content {
      margin: 0 !important;
      padding: 20px !important;
    }
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    html, body {
      font-size: 13px;
    }

    .ant-layout-sider {
      position: fixed !important;
      z-index: 1000;
      height: 100vh;
      transform: translateX(-100%) !important;
      transition: transform 0.3s ease !important;

      &.ant-layout-sider-collapsed {
        transform: translateX(0) !important;
      }
    }

    /* 当侧边栏展开时添加遮罩层 */
    .ant-layout-sider:not(.ant-layout-sider-closed) ~ .ant-layout {
      &::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
      }
    }

    .ant-layout-content {
      margin-left: 0 !important;
      padding: var(--space-md) !important;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    :root {
      --primary-blue: #0000FF;
      --secondary-mint: #00FF00;
      --neutral-900: #000000;
      --neutral-700: #333333;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

const AppContainer = styled.div`
  min-height: 100vh;
  background: var(--neutral-50);
  position: relative;

  > * {
    position: relative;
    z-index: 1;
  }
`;

const ErrorBoundary = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-xl);
  text-align: center;
  background: var(--neutral-50);

  .error-icon {
    font-size: 4rem;
    color: var(--secondary-red);
    margin-bottom: var(--space-lg);
  }

  .error-title {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 700;
    color: var(--neutral-900);
    margin-bottom: var(--space-md);
  }

  .error-message {
    color: var(--neutral-600);
    font-size: 1.1rem;
    margin-bottom: var(--space-xl);
    max-width: 500px;
  }

  .error-actions {
    display: flex;
    gap: var(--space-md);
  }
`;

// Error Boundary Component
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundary>
          <div className="error-icon">⚠️</div>
          <h1 className="error-title">系统出现错误</h1>
          <p className="error-message">
            很抱歉，四川建工意外险智能报价系统遇到了一个错误。
            请刷新页面重试，如果问题持续存在，请联系系统管理员。
          </p>
          <div className="error-actions">
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'var(--primary-blue)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              刷新页面
            </button>
            <button
              onClick={() => this.setState({ hasError: false })}
              style={{
                background: 'transparent',
                color: 'var(--primary-blue)',
                border: '2px solid var(--primary-blue)',
                padding: '12px 24px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              重试
            </button>
          </div>
        </ErrorBoundary>
      );
    }

    return this.props.children;
  }
}

// Main App Component
const App: React.FC = () => {
  return (
    <AppErrorBoundary>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: theme.colors.accent.gold,
            colorSuccess: theme.colors.secondary.green,
            colorWarning: theme.colors.secondary.orange,
            colorError: theme.colors.secondary.red,
            colorInfo: theme.colors.secondary.blue,
            fontFamily: theme.fonts.body,
            fontSize: 14,
            borderRadius: 8,
            wireframe: false,
          },
          components: {
            Button: {
              primaryShadow: theme.shadows.md,
              defaultShadow: theme.shadows.sm,
            },
            Card: {
              headerBg: theme.colors.neutral[50],
              boxShadowTertiary: theme.shadows.lg,
            },
            Table: {
              headerBg: 'transparent',
              headerColor: theme.colors.neutral[900],
              rowHoverBg: theme.colors.neutral[100],
            },
            Menu: {
              itemBg: 'transparent',
              itemSelectedBg: theme.colors.primary.blueLight,
              itemSelectedColor: '#ffffff',
              itemHoverBg: theme.colors.neutral[100],
            },
          },
        }}
      >
        <GlobalStyle />
        <AppContainer>
          <ProjectProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="contract" element={<ContractAnalysis />} />
                  <Route path="pricing/:projectId?" element={<PricingCalculator />} />
                  <Route path="pricing-calculator" element={<PricingCalculator />} />
                  <Route path="pricing-plans/:projectId?" element={<PricingPlans />} />
                  <Route path="history" element={<HistoryAnalysis />} />
                  <Route path="config" element={<SystemConfiguration />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </ProjectProvider>
        </AppContainer>
      </ConfigProvider>
    </AppErrorBoundary>
  );
};

export default App;