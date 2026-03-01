# 四川建工意外险智能报价系统

一个基于 React + Node.js 的智能保险报价系统，专为四川地区建筑工程意外险设计。

## 功能特性

### 核心功能
- 📊 **智能报价** - 根据工程信息自动生成多套保险方案
- 📄 **合同解析** - 支持 PDF/Word 合同文件的智能解析和关键信息提取
- 🔍 **全局搜索** - 快速查找项目、施工方、地点等信息
- 📈 **数据可视化** - 直观的保费范围分析和费率分析图表
- 💾 **方案管理** - 完整的方案创建、编辑、删除、导出功能
- ⚙️ **系统配置** - 灵活的费率节点、工程分类、AI 服务配置

### 特色亮点
- 🎨 **现代化 UI** - 基于 Ant Design + styled-components 的精美界面
- 🤖 **AI 智能助手** - 集成多种 AI 服务（DeepSeek、OpenAI、通义千问等）
- 📑 **PDF 导出** - 高保真报价单导出，自动合并保险条款
- 🚀 **高性能** - 基于 React 18 和 Framer Motion 的流畅动画
- 🔐 **安全可靠** - JWT 认证，数据加密存储

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **UI 库**: Ant Design 5
- **样式**: styled-components
- **动画**: Framer Motion
- **路由**: React Router 6
- **状态管理**: Redux Toolkit
- **图表**: ECharts
- **PDF**: html2canvas + jsPDF + react-pdf
- **其他**: axios, dayjs, xlsx

### 后端
- **框架**: Node.js + Express + TypeScript
- **数据库**: SQLite (better-sqlite3)
- **认证**: JWT + bcrypt
- **文件处理**: multer, express-fileupload
- **PDF 操作**: pdf-lib, pdf-parse
- **文档解析**: mammoth (Word)
- **日志**: Winston
- **定时任务**: node-cron
- **验证**: Joi

## 快速开始

### 环境要求
- Node.js >= 16
- npm >= 8

### 安装依赖

```bash
# 安装前端依赖
cd client
npm install

# 安装后端依赖
cd ../server
npm install
```

### 配置环境变量

创建 `client/.env`:
```env
BROWSER=none
PORT=30001
REACT_APP_API_URL=http://localhost:58080/api
```

### 启动项目

```bash
# 启动后端服务 (端口 58080)
cd server
npm run dev

# 启动前端服务 (端口 30001)
cd client
npm start
```

访问 http://localhost:30001 即可使用系统。

### 构建生产版本

```bash
# 构建前端
cd client
npm run build

# 构建后端
cd server
npm run build
```

## 项目结构

```
.
├── client/                 # 前端项目
│   ├── public/            # 静态资源
│   ├── src/
│   │   ├── components/    # 通用组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   ├── utils/         # 工具函数
│   │   └── App.tsx        # 应用入口
│   └── package.json
├── server/                # 后端项目
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── routes/        # 路由
│   │   ├── services/      # 业务逻辑
│   │   ├── models/        # 数据模型
│   │   ├── middleware/    # 中间件
│   │   └── index.ts       # 服务入口
│   ├── data/              # 数据库文件
│   └── package.json
├── .gitignore            # Git 忽略规则
└── README.md             # 项目文档
```

## 主要模块

### 1. 工作台 (Dashboard)
- 统计数据卡片（累计方案数、总保费、活跃方案）
- 最近记录列表（近 2 天方案）
- 全局智能搜索

### 2. 我的方案 (Pricing Plans)
- 方案列表（分页、搜索、排序）
- 方案详情 Modal
- 新建/编辑方案
- 导出 PDF（包含条款）

### 3. 合同上传 (Contract Upload)
- 支持 PDF/Word 上传
- AI 智能解析合同信息
- 自动填充报价表单

### 4. 系统配置 (System Configuration)
- AI 服务配置（DeepSeek、OpenAI、通义千问等）
- 工程分类管理
- 费率节点管理
- 业务分类配置

## API 接口

### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出

### 方案管理
- `GET /api/pricing-plans` - 获取方案列表
- `POST /api/pricing-plans` - 创建方案
- `GET /api/pricing-plans/:id` - 获取方案详情
- `PUT /api/pricing-plans/:id` - 更新方案
- `DELETE /api/pricing-plans/:id` - 删除方案
- `POST /api/pricing-plans/:id/export-pdf-merged` - 导出 PDF

### 合同解析
- `POST /api/contracts/upload` - 上传合同
- `POST /api/contracts/parse` - 解析合同

### 系统配置
- `GET /api/config/system` - 获取系统配置
- `PUT /api/config/system` - 更新系统配置
- `GET /api/config/ai-services` - 获取 AI 服务配置
- `POST /api/config/test-ai-connection` - 测试 AI 连接

## 开发说明

### 数据库
项目使用 SQLite 数据库，数据库文件位于 `server/data/` 目录：
- `insurance.db` - 主数据库
- `insurance_pricing.db` - 报价相关数据

**注意**: 数据库文件已添加到 `.gitignore`，不会被上传到 Git 仓库。

### AI 服务配置
系统支持多种 AI 服务，需要在系统配置页面配置相应的 API Key：
- DeepSeek
- OpenAI (GPT-4/GPT-3.5)
- 通义千问
- 文心一言

### PDF 导出
PDF 导出功能使用 html2canvas 捕获页面视觉效果，然后使用 jsPDF 转换为 PDF，最后在后端与保险条款 PDF 合并。

## 注意事项

1. **敏感信息**: 项目代码中不包含硬编码的 API 密钥或密码，所有敏感信息都通过环境变量或系统配置管理。
2. **数据库文件**: 数据库文件不会被提交到 Git 仓库，首次运行需要初始化数据库结构。
3. **环境变量**: 生产环境请确保正确配置 `REACT_APP_API_URL` 等环境变量。

## 许可证

本项目为商业项目，版权所有。

## 联系方式

如有问题或建议，请联系项目维护者。
