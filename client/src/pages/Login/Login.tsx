import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-warm-white);
  padding: var(--space-xl);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 600px;
    height: 600px;
    background: var(--gradient-sky-blue);
    border-radius: 50%;
    opacity: 0.1;
    filter: blur(80px);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -50%;
    left: -10%;
    width: 600px;
    height: 600px;
    background: var(--gradient-blue-light);
    border-radius: 50%;
    opacity: 0.1;
    filter: blur(80px);
  }
`;

const LoginCard = styled.div`
  background: white;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-warm-lg);
  padding: var(--space-3xl);
  width: 100%;
  max-width: 440px;
  position: relative;
  z-index: 1;
  border: 1px solid var(--neutral-300);
`;

const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: var(--space-2xl);

  .logo {
    width: 72px;
    height: 72px;
    background: var(--gradient-blue-light);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 700;
    color: white;
    margin: 0 auto var(--space-lg);
    box-shadow: var(--shadow-glow);
    border: 3px solid var(--primary-blue);
  }

  .title {
    font-family: var(--font-display);
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--neutral-900);
    margin-bottom: var(--space-sm);
  }

  .subtitle {
    font-size: 0.95rem;
    color: var(--neutral-600);
  }
`;

const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: var(--space-lg);
  }

  .ant-input-affix-wrapper,
  .ant-input {
    background: var(--neutral-50) !important;
    border: 1px solid var(--neutral-300) !important;
    border-radius: var(--radius-md) !important;
    padding: 12px 16px !important;
    font-size: 0.95rem !important;
    transition: all var(--transition-fast) !important;

    &:hover {
      border-color: var(--primary-blue) !important;
      background: white !important;
    }

    &:focus,
    &.ant-input-affix-wrapper-focused {
      border-color: var(--primary-blue) !important;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
      background: white !important;
    }

    .ant-input {
      background: transparent !important;
      border: none !important;
      padding: 0 !important;
    }
  }

  .ant-input-prefix {
    color: var(--neutral-500);
    margin-right: var(--space-sm);
    font-size: 1.1rem;
  }

  .ant-form-item-explain-error {
    font-size: 0.85rem;
  }
`;

const LoginButton = styled(Button)`
  width: 100%;
  height: 46px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  background: var(--gradient-blue-light);
  border: none;
  box-shadow: var(--shadow-soft);
  transition: all var(--transition-normal);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-glow);
  }

  &:active {
    transform: translateY(0);
  }

  .anticon {
    font-size: 1.1rem;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: var(--space-xl) 0;
  color: var(--neutral-500);
  font-size: 0.85rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--neutral-300);
  }

  &::before {
    margin-right: var(--space-md);
  }

  &::after {
    margin-left: var(--space-md);
  }
`;

const DemoCredentials = styled.div`
  background: var(--bg-blue-50);
  border: 1px solid var(--primary-blue);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-top: var(--space-lg);

  .demo-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--primary-blue);
    margin-bottom: var(--space-sm);
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .demo-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-xs) 0;
    font-size: 0.9rem;
    color: var(--neutral-700);

    .label {
      font-weight: 500;
    }

    .value {
      font-family: var(--font-mono);
      background: white;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--neutral-300);
    }
  }
`;

const Footer = styled.div`
  text-align: center;
  margin-top: var(--space-xl);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--neutral-300);
  color: var(--neutral-600);
  font-size: 0.85rem;
`;

interface LoginFormData {
  username: string;
  password: string;
  remember?: boolean;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    // 检查是否已登录
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const onFinish = async (values: any) => {
    setLoading(true);

    try {
      // 模拟登录请求
      await new Promise(resolve => setTimeout(resolve, 800));

      // 从 localStorage 获取用户列表
      const usersStr = localStorage.getItem('system_users');
      let users = [];

      if (usersStr) {
        users = JSON.parse(usersStr);
      }

      // 查找匹配的用户（简化版：只检查用户名，实际项目应该检查密码）
      const user = users.find((u: any) =>
        u.username === values.username || u.email === values.username
      );

      if (user) {
        // 检查用户状态
        if (user.status !== 'active') {
          message.error('该账户已被禁用，请联系管理员');
          setLoading(false);
          return;
        }

        // 保存登录状态
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(user));

        message.success(`欢迎回来，${user.username}！`);

        // 跳转到首页
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 500);
      } else {
        // 使用演示账户登录
        if (values.username === 'admin' && values.password === 'admin123') {
          const demoUser = {
            id: '1',
            username: 'admin',
            email: 'admin@sichuanjiangong.com',
            role: 'admin',
            status: 'active',
            lastLogin: new Date().toLocaleString('zh-CN'),
            permissions: ['all'],
          };

          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('currentUser', JSON.stringify(demoUser));
          message.success('欢迎回来，管理员！');
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 500);
        } else {
          message.error('用户名或密码错误');
        }
      }
    } catch (error) {
      console.error('登录错误:', error);
      message.error('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LoginHeader>
          <div className="logo">川</div>
          <h1 className="title">四川建工意外险</h1>
          <p className="subtitle">智能报价系统 - 登录</p>
        </LoginHeader>

        <StyledForm
          form={form}
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名或邮箱' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名 / 邮箱"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
          </Form.Item>

          <Form.Item>
            <LoginButton
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<LoginOutlined />}
            >
              登录
            </LoginButton>
          </Form.Item>
        </StyledForm>

        <Divider>演示账户</Divider>

        <DemoCredentials>
          <div className="demo-title">
            <span>ℹ️</span>
            <span>测试账户</span>
          </div>
          <div className="demo-item">
            <span className="label">用户名:</span>
            <span className="value">admin</span>
          </div>
          <div className="demo-item">
            <span className="label">密码:</span>
            <span className="value">admin123</span>
          </div>
        </DemoCredentials>

        <Footer>
          <p>四川建工意外险智能报价系统 v1.0</p>
          <p>© 2024 All Rights Reserved</p>
        </Footer>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
