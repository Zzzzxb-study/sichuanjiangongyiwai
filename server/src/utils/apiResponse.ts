import { ApiResponse } from '../types';

/**
 * API响应工具类
 * 用于创建标准化的API响应
 */
export class ResponseHelper {
  /**
   * 创建成功响应
   */
  static success<T = any>(message: string, data?: T): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  /**
   * 创建错误响应
   */
  static error(error: string): ApiResponse {
    return {
      success: false,
      error,
    };
  }

  /**
   * 创建带数据的成功响应
   */
  static data<T = any>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
    };
  }
}
