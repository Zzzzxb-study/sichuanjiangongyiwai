import axios from 'axios';

/**
 * 创建axios实例，配置baseURL
 */
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:58080/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求拦截器
 */
api.interceptors.request.use(
  (config) => {
    console.log('Axios请求:', config.method?.toUpperCase(), config.url, config.params || config.data);
    return config;
  },
  (error) => {
    console.error('Axios请求错误:', error);
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 */
api.interceptors.response.use(
  (response) => {
    console.log('Axios响应:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Axios响应错误:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;
