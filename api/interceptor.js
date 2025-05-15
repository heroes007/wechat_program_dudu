// API请求拦截处理
import { request } from './http';

/**
 * 网络状态监听
 */
export const setupNetworkListener = () => {
  // 监听网络状态变化
  wx.onNetworkStatusChange((res) => {
    if (!res.isConnected) {
      wx.showToast({
        title: '网络连接已断开',
        icon: 'none',
        duration: 2000
      });
    } else {
      wx.showToast({
        title: `网络已连接 ${res.networkType}`,
        icon: 'none',
        duration: 2000
      });
    }
  });

  // 初始获取一次网络状态
  wx.getNetworkType({
    success: (res) => {
      if (res.networkType === 'none') {
        wx.showToast({
          title: '当前无网络连接',
          icon: 'none',
          duration: 2000
        });
      }
    }
  });
};

/**
 * 全局错误码处理
 * @param {Number} code 错误码
 * @param {String} message 错误信息
 */
export const handleErrorCode = (code, message) => {
  const errorMap = {
    401: () => {
      // 未登录或登录过期
      wx.removeStorageSync('token');
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      });
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/index'
        });
      }, 1500);
    },
    403: () => {
      // 权限不足
      wx.showToast({
        title: '权限不足',
        icon: 'none',
        duration: 2000
      });
    },
    404: () => {
      // 资源不存在
      wx.showToast({
        title: '请求的资源不存在',
        icon: 'none',
        duration: 2000
      });
    },
    500: () => {
      // 服务器错误
      wx.showToast({
        title: '服务器错误，请稍后再试',
        icon: 'none',
        duration: 2000
      });
    }
  };

  // 执行对应错误处理
  if (errorMap[code]) {
    errorMap[code]();
  } else {
    // 其他错误码统一处理
    wx.showToast({
      title: message || `请求失败(${code})`,
      icon: 'none',
      duration: 2000
    });
  }
};

/**
 * 请求超时处理
 * @param {Number} timeout 超时时间（毫秒）
 */
export const timeoutInterceptor = (timeout = 10000) => {
  // 重写request方法，添加超时处理
  const originalRequest = request;
  
  return (options) => {
    return Promise.race([
      originalRequest(options),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('请求超时，请检查网络'));
        }, timeout);
      })
    ]);
  };
};

/**
 * 初始化API拦截器
 */
export const initInterceptors = () => {
  // 初始化网络监听
  setupNetworkListener();
  
  // 可以在这里添加更多的拦截器初始化
  console.log('API拦截器初始化完成');
};

export default {
  setupNetworkListener,
  handleErrorCode,
  timeoutInterceptor,
  initInterceptors
}; 