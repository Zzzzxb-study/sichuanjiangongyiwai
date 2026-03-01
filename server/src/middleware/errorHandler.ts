import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('请求处理错误', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // 默认错误状态码
  let statusCode = error.statusCode || 500;
  let message = error.message || '服务器内部错误';

  // 根据错误类型设置状态码和消息
  switch (error.code) {
    case 'VALIDATION_ERROR':
      statusCode = 400;
      message = '请求参数验证失败';
      break;
    case 'CALCULATION_ERROR':
      statusCode = 400;
      message = '保费计算失败';
      break;
    case 'FILE_UPLOAD_ERROR':
      statusCode = 400;
      message = '文件上传失败';
      break;
    case 'DATABASE_ERROR':
      statusCode = 500;
      message = '数据库操作失败';
      break;
    case 'AI_SERVICE_ERROR':
      statusCode = 503;
      message = 'AI服务暂时不可用';
      break;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.message
    })
  });
};