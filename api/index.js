// API模块入口文件
import http from './http';
import apis, { UserApi, ContentApi, MessageApi, ConfigApi } from './apis';
import interceptor from './interceptor';
import mock from './mock';

// 导出所有HTTP方法
export const { get, post, put, delete: del, request } = http;

// 导出所有API服务
export { UserApi, ContentApi, MessageApi, ConfigApi };

// 导出拦截器
export const { initInterceptors, handleErrorCode, setupNetworkListener } = interceptor;

// 导出模拟服务
export const { initMock } = mock;

/**
 * 初始化API服务
 * @param {Object} options 配置项
 * @param {Boolean} options.enableMock 是否启用模拟数据
 * @param {Boolean} options.enableInterceptor 是否启用拦截器
 * @param {String} options.baseUrl API基础地址
 */
export const initApiService = (options = {}) => {
  const { 
    enableMock = process.env.NODE_ENV !== 'production',
    enableInterceptor = true,
    baseUrl
  } = options;
  
  // 设置基础URL
  if (baseUrl) {
    http.BASE_URL = baseUrl;
  }
  
  // 初始化拦截器
  if (enableInterceptor) {
    initInterceptors();
  }
  
  // 初始化模拟数据
  if (enableMock) {
    initMock();
  }
  
  console.log('API服务初始化完成');
};

export default {
  http,
  apis,
  interceptor,
  mock,
  initApiService,
  ...apis
}; 