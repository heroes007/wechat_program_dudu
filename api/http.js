// 基础请求封装
const BASE_URL = 'http://60.205.120.120:8090';
// 可以在此处配置你的实际API地址

/**
 * 基础请求方法
 * @param {Object} options - 请求选项
 * @returns {Promise} 请求promise
 */
export const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    const header = {
      'content-type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.header
    };

    wx.showLoading({
      title: '加载中',
      mask: true
    });

    wx.request({
      url: /^https?:\/\//.test(options.url) ? options.url : BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: (res) => {
        wx.hideLoading();
        
        // 假设后端接口返回格式为 { code: number, data: any, message: string }
        if (res.statusCode === 200) {
          // 业务状态判断
          if (res.data.code === 0 || res.data.code === 200) {
            resolve(res.data.data);
          } else if (res.data.code === 401) {
            // token失效，需要重新登录
            wx.removeStorageSync('token');
            wx.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none'
            });
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/login/index'
              });
            }, 1500);
            reject(res.data);
          } else {
            wx.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            });
            reject(res.data);
          }
        } else {
          wx.showToast({
            title: `网络错误(${res.statusCode})`,
            icon: 'none'
          });
          reject(res);
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '网络异常，请稍后再试',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
};

// HTTP方法封装
export const get = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'GET',
    data,
    ...options
  });
};

export const post = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  });
};

export const put = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  });
};

export const del = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options
  });
};

export default {
  get,
  post,
  put,
  delete: del,
  request
}; 