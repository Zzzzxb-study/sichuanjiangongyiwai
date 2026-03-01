import winston from 'winston';
import path from 'path';

// 日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// 日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

// 日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}${
      info.stack ? '\n' + info.stack : ''
    }${
      info.metadata && Object.keys(info.metadata).length > 0
        ? '\n' + JSON.stringify(info.metadata, null, 2)
        : ''
    }`
  )
);

// 日志传输配置
const transports = [
  // 控制台输出
  new winston.transports.Console(),

  // 错误日志文件
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),

  // 所有日志文件
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// 创建logger实例
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false
});

// 开发环境下输出更详细的日志
if (process.env.NODE_ENV === 'development') {
  logger.level = 'debug';
}

export default logger;