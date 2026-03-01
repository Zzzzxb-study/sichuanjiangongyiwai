import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import calculationRoutes from './routes/calculation';
import contractRoutes from './routes/contract';
import historyRoutes from './routes/history';
import configRoutes from './routes/config';
import databaseRoutes from './routes/database';
import pricingPlansRoutes from './routes/pricingPlans';
import projectRoutes from './routes/project';
import { database } from './database/database';

// 加载环境变量
dotenv.config();

// 初始化数据库
try {
  database.connect();
  const stats = database.getStats();
  logger.info('数据库初始化成功', {
    totalRecords: stats.totalRecords,
    databaseSize: `${(stats.databaseSize / 1024).toFixed(2)} KB`,
    version: stats.version
  });
} catch (error) {
  logger.error('数据库初始化失败', error);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 58080;

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:30001',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  createParentPath: true,
}));

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// 路由
app.use('/api/calculation', calculationRoutes);
app.use('/api/contract', contractRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/config', configRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/pricing-plans', pricingPlansRoutes);
app.use('/api/projects', projectRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// 错误处理
app.use(errorHandler);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  logger.info(`服务器启动成功，端口: ${PORT}`);
  logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
});

export default app;