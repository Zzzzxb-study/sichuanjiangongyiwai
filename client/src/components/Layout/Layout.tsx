import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Button, message, Modal, Tag, Space } from 'antd';
import { useLocation, useNavigate, Outlet, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import {
  DashboardOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  HistoryOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoreOutlined,
  FolderOpenOutlined,
  ProjectOutlined,
  CopyOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = AntLayout;

const StyledLayout = styled(AntLayout)`
  min-height: 100vh;
  background: transparent;
`;

const StyledSider = styled(Sider)<{ $collapsed: boolean }>`
  background: white !important;
  box-shadow: var(--shadow-warm) !important;
  border-right: 1px solid var(--neutral-300) !important;
  position: fixed !important;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 1000;
  overflow: hidden !important;
  transition: width 0.2s !important;

  .ant-layout-sider-children {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;

    /* 自定义滚动条样式 */
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: var(--neutral-100);
    }

    &::-webkit-scrollbar-thumb {
      background: var(--neutral-300);
      border-radius: 3px;

      &:hover {
        background: var(--neutral-400);
      }
    }
  }

  .ant-layout-sider-trigger {
    background: var(--neutral-100) !important;
    color: var(--neutral-700) !important;
    border-top: 1px solid var(--neutral-300) !important;
    transition: all var(--transition-normal);
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2;

    &:hover {
      background: var(--primary-blue-light) !important;
      color: white !important;
    }
  }
`;

const MainLayout = styled(AntLayout)<{ $siderWidth: number }>`
  margin-left: ${props => props.$siderWidth}px;
  transition: margin-left 0.2s;
`;

const StyledHeader = styled(Header)`
  background: white !important;
  backdrop-filter: blur(15px);
  border-bottom: 1px solid var(--neutral-300) !important;
  box-shadow: var(--shadow-sm);
  padding: 0 var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const Logo = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--neutral-300);
  margin-bottom: var(--space-lg);
  position: relative;
`;

const LogoIcon = styled.div`
  width: 42px;
  height: 42px;
  background: var(--gradient-blue-light);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  font-size: 1.2rem;
  box-shadow: var(--shadow-soft);
  border: 2px solid var(--primary-blue);
  position: relative;
  overflow: hidden;
`;

const LogoText = styled.div`
  color: var(--neutral-900);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.1rem;
  line-height: 1.2;

  .subtitle {
    font-size: 0.75rem;
    opacity: 0.8;
    font-weight: 400;
    color: var(--neutral-600);
  }
`;

const StyledMenu = styled(Menu)`
  background: transparent !important;
  border: none !important;

  .ant-menu-item {
    color: var(--neutral-700) !important;
    margin: var(--space-xs) var(--space-md);
    border-radius: var(--radius-sm) !important;
    transition: all var(--transition-normal);
    border: 1px solid transparent;
    position: relative;

    &:hover {
      background: var(--neutral-100) !important;
      color: var(--primary-blue) !important;
      border-color: var(--neutral-300);
    }

    &.ant-menu-item-selected {
      background: var(--primary-blue-light) !important;
      color: white !important;
      font-weight: 600;
      border-color: var(--primary-blue);
      box-shadow: var(--shadow-soft);

      .anticon {
        color: white;
      }
    }

    .anticon {
      font-size: 1.2rem;
      color: var(--primary-blue);
      transition: all var(--transition-normal);
    }
  }

  .ant-menu-item-group-title {
    color: var(--neutral-600) !important;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: var(--space-md) var(--space-lg);
    margin-top: var(--space-lg);
    border-left: 2px solid var(--neutral-300);
    padding-left: var(--space-md);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-shrink: 0;
`;

// 项目信息标签 - 轻量化设计
const ProjectInfoTag = styled(Tag)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--neutral-100);
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--neutral-700);
  margin: 0;
  cursor: default;
  user-select: none;
  transition: all var(--transition-fast);

  .project-icon {
    font-size: 12px;
    color: var(--neutral-600);
  }

  .project-label {
    color: var(--neutral-600);
    font-weight: 400;
  }

  .project-value {
    color: var(--neutral-900);
    font-weight: 500;
    font-family: 'Courier New', monospace;
  }

  .copy-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    margin-left: 4px;
    cursor: pointer;
    color: var(--neutral-500);
    border-radius: 2px;
    transition: all var(--transition-fast);

    &:hover {
      color: var(--primary-blue);
      background: var(--primary-blue-light);
    }
  }

  @media (max-width: 768px) {
    font-size: 11px;
    padding: 3px 8px;

    .project-label {
      display: none;
    }
  }
`;

// 侧边栏底部用户信息区域
const SideBarFooter = styled.div`
  margin-top: auto;
  padding: var(--space-md);
  border-top: 1px solid var(--neutral-300);
  background: var(--neutral-50);
`;

const SideBarUserProfile = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: white;
  border: 1px solid var(--neutral-300);
  user-select: none;

  &:hover {
    background: var(--primary-blue-light);
    border-color: var(--primary-blue);
    box-shadow: var(--shadow-soft);

    .user-info {
      .name {
        color: white;
      }

      .role {
        color: rgba(255, 255, 255, 0.9);
      }
    }

    .avatar-wrapper {
      background: white;
      color: var(--primary-blue);
    }
  }

  .avatar-wrapper {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background: var(--gradient-blue-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: white;
    font-size: 1.1rem;
    flex-shrink: 0;
    transition: all var(--transition-fast);
    box-shadow: var(--shadow-sm);
  }

  .user-info {
    flex: 1;
    min-width: 0;

    .name {
      font-weight: 600;
      color: var(--neutral-900);
      font-size: 0.95rem;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color var(--transition-fast);
    }

    .role {
      font-size: 0.75rem;
      color: var(--neutral-600);
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color var(--transition-fast);
    }
  }

  .menu-icon {
    color: var(--neutral-500);
    transition: all var(--transition-fast);
  }

  &:hover .menu-icon {
    color: white;
  }

  ${props => props.$collapsed && `
    justify-content: center;
    padding: var(--space-sm);

    .user-info,
    .menu-icon {
      display: none;
    }

    .avatar-wrapper {
      width: 36px;
      height: 36px;
      font-size: 1rem;
    }
  `}
`;

// 用户菜单 Modal 样式
const UserModalMenu = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);

  .menu-item {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-lg);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-weight: 500;
    color: var(--neutral-800);

    &:hover {
      background: var(--bg-blue-50);
      color: var(--primary-blue);
    }

    .anticon {
      font-size: 1.1rem;
    }

    &.danger {
      color: var(--semantic-error);

      &:hover {
        background: rgba(239, 68, 68, 0.1);
        color: var(--semantic-error);
      }
    }
  }

  .menu-divider {
    height: 1px;
    background: var(--neutral-300);
    margin: var(--space-sm) 0;
  }
`;

const UserModalHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-xl) 0;
  border-bottom: 1px solid var(--neutral-300);
  margin-bottom: var(--space-lg);

  .avatar {
    width: 80px;
    height: 80px;
    border-radius: var(--radius-lg);
    background: var(--gradient-blue-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 700;
    color: white;
    box-shadow: var(--shadow-soft);
  }

  .user-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--neutral-900);
  }

  .user-role {
    font-size: 0.9rem;
    color: var(--neutral-600);
  }
`;

const StyledContent = styled(Content)`
  padding: var(--space-xl);
  background: transparent;
  min-height: calc(100vh - 64px);
`;

const ContentWrapper = styled(motion.div)`
  max-width: 1400px;
  margin: 0 auto;
`;

interface UserInfo {
  username: string;
  email: string;
  role: string;
  status: string;
}

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [siderWidth, setSiderWidth] = useState(280);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserInfo>({
    username: '加载中...',
    email: '',
    role: 'viewer',
    status: 'active',
  });
  // 项目信息状态
  const [currentProject, setCurrentProject] = useState<{
    projectId?: string;
    businessNo?: string;
    projectName?: string;
  } | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId?: string }>();

  // 监听折叠状态，更新侧边栏宽度
  React.useEffect(() => {
    setSiderWidth(collapsed ? 80 : 280);
  }, [collapsed]);

  // 当 URL 包含 projectId 时，加载项目信息
  useEffect(() => {
    if (projectId) {
      // 从 localStorage 加载项目信息
      const parseDataKey = `contract_parse_${projectId}`;
      const savedParseData = localStorage.getItem(parseDataKey);
      if (savedParseData) {
        try {
          const parseData = JSON.parse(savedParseData);
          setCurrentProject({
            projectId: parseData.projectId,
            businessNo: parseData.businessNo,
            projectName: parseData.data?.projectName,
          });
        } catch (error) {
          console.error('解析项目数据失败:', error);
          setCurrentProject(null);
        }
      } else {
        // 如果没有找到存储的数据，尝试从后端 API 获取
        // 这里可以添加 API 调用逻辑
        setCurrentProject({ projectId });
      }
    } else {
      // 如果 URL 中没有 projectId，清除当前项目信息
      setCurrentProject(null);
    }
  }, [projectId]);

  // 复制项目编号到剪贴板
  const handleCopyProjectNo = (businessNo: string) => {
    navigator.clipboard.writeText(businessNo).then(() => {
      message.success('项目编号已复制');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 从 localStorage 加载当前用户信息
  useEffect(() => {
    const loadCurrentUser = () => {
      try {
        // 优先从 currentUser 加载（登录时保存的用户信息）
        const currentUserStr = localStorage.getItem('currentUser');
        console.log('Layout: 正在加载当前用户，currentUser数据:', currentUserStr);

        if (currentUserStr) {
          const user = JSON.parse(currentUserStr);
          console.log('Layout: 解析后的当前用户:', user);

          const userInfo: UserInfo = {
            username: user.username || '未知用户',
            email: user.email || '',
            role: user.role || 'viewer',
            status: user.status || 'active',
          };
          console.log('Layout: 设置的用户信息:', userInfo);
          setCurrentUser(userInfo);
        } else {
          console.log('Layout: localStorage 中没有当前用户数据');
          // 如果没有当前用户信息，尝试从用户列表中加载
          const usersStr = localStorage.getItem('system_users');
          if (usersStr) {
            const users = JSON.parse(usersStr);
            if (users && users.length > 0) {
              const activeUser = users.find((u: any) => u.status === 'active') || users[0];
              const userInfo: UserInfo = {
                username: activeUser.username || '未知用户',
                email: activeUser.email || '',
                role: activeUser.role || 'viewer',
                status: activeUser.status || 'active',
              };
              setCurrentUser(userInfo);
            }
          }
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
      }
    };

    // 初始加载
    loadCurrentUser();

    // 监听 localStorage 变化（跨标签页同步）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser' || (e.key === 'system_users' && e.newValue)) {
        loadCurrentUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 监听同一页面的自定义事件
    const handleUserUpdate = () => {
      console.log('Layout: 收到 userUpdated 事件');
      loadCurrentUser();
    };

    window.addEventListener('userUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/contract',
      icon: <FileTextOutlined />,
      label: '合同解析',
    },
    {
      key: '/pricing',
      icon: <CalculatorOutlined />,
      label: '智能报价',
    },
    {
      key: '/pricing-plans',
      icon: <FolderOpenOutlined />,
      label: '我的方案',
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: '历史分析',
    },
    {
      key: '/config',
      icon: <SettingOutlined />,
      label: '系统配置',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    setUserMenuVisible(false);

    if (key === 'logout') {
      Modal.confirm({
        title: '退出登录',
        content: '您确定要退出登录吗？',
        okText: '确定',
        cancelText: '取消',
        onOk: () => {
          // 清除登录状态
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('currentUser');

          // 触发 storage 事件（用于其他标签页同步）
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'isLoggedIn',
            newValue: null,
            oldValue: 'true',
            storageArea: localStorage,
          }));

          // 跳转到登录页
          window.location.href = '/login';
        },
      });
    } else if (key === 'profile') {
      // 跳转到个人资料页面或打开个人资料模态框
      message.info('个人资料功能开发中...');
    }
  };

  // 角色映射为中文显示
  const getRoleDisplayName = (role: string): string => {
    const roleMap: Record<string, string> = {
      admin: '系统管理员',
      operator: '操作员',
      viewer: '查看者',
    };
    return roleMap[role] || role;
  };

  // 获取用户姓名的首字符作为头像
  const getUserAvatarChar = (username: string): string => {
    return username ? username.charAt(0).toUpperCase() : '用';
  };

  return (
    <StyledLayout>
      <StyledSider
        $collapsed={collapsed}
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={280}
        collapsedWidth={80}
      >
        <Logo
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <LogoIcon>川</LogoIcon>
          {!collapsed && (
            <LogoText>
              <div>四川建工意外险</div>
              <div className="subtitle">智能报价系统</div>
            </LogoText>
          )}
        </Logo>

        <StyledMenu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />

        <SideBarFooter>
          <SideBarUserProfile
            $collapsed={collapsed}
            onClick={() => setUserMenuVisible(true)}
          >
            <div className="avatar-wrapper">
              {getUserAvatarChar(currentUser.username)}
            </div>
            <div className="user-info">
              <div className="name">{currentUser.username}</div>
              <div className="role">{getRoleDisplayName(currentUser.role)}</div>
            </div>
            {!collapsed && <MoreOutlined className="menu-icon" />}
          </SideBarUserProfile>
        </SideBarFooter>
      </StyledSider>

      <MainLayout $siderWidth={siderWidth}>
        <StyledHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
            <motion.h1
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--neutral-900)',
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {menuItems.find(item => item.key === location.pathname)?.label || '工作台'}
            </motion.h1>
          </div>

          <HeaderActions>
            {currentProject?.businessNo && (
              <ProjectInfoTag>
                <ProjectOutlined className="project-icon" />
                <span className="project-label">项目编号：</span>
                <span className="project-value">{currentProject.businessNo}</span>
                <CopyOutlined
                  className="copy-button"
                  onClick={() => handleCopyProjectNo(currentProject.businessNo!)}
                  title="复制项目编号"
                />
              </ProjectInfoTag>
            )}
          </HeaderActions>
        </StyledHeader>

        <StyledContent>
          <ContentWrapper
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Outlet />
          </ContentWrapper>
        </StyledContent>
      </MainLayout>

      {/* 用户菜单 Modal */}
      <Modal
        open={userMenuVisible}
        onCancel={() => setUserMenuVisible(false)}
        footer={null}
        width={400}
        centered
        maskClosable
        destroyOnClose
      >
        <UserModalHeader>
          <div className="avatar">
            {getUserAvatarChar(currentUser.username)}
          </div>
          <div className="user-name">{currentUser.username}</div>
          <div className="user-role">{getRoleDisplayName(currentUser.role)}</div>
        </UserModalHeader>

        <UserModalMenu>
          <div
            className="menu-item"
            onClick={() => handleUserMenuClick({ key: 'profile' })}
          >
            <UserOutlined />
            <span>个人资料</span>
          </div>

          <div className="menu-divider"></div>

          <div
            className="menu-item danger"
            onClick={() => handleUserMenuClick({ key: 'logout' })}
          >
            <LogoutOutlined />
            <span>退出登录</span>
          </div>
        </UserModalMenu>
      </Modal>
    </StyledLayout>
  );
};

export default Layout;