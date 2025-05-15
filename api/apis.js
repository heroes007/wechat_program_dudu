// API接口管理
import http from './http';

// 用户相关接口
export const UserApi = {
  // 登录
  login: (data) => http.post('/dudu/check', data),
  // 注册
  register: (data) => http.post('/dudu/register', data),
  // 获取用户信息
  getUserInfo: () => http.get('/dudu/getInfo'),
  // 更新用户信息
  updateUserInfo: (data) => http.put('/dudu/setInfo', data),
  // 上传头像
  uploadAvatar: (filePath) => {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: 'https://api.example.com/user/avatar',
        filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            resolve(data);
          } catch (e) {
            reject(e);
          }
        },
        fail: reject
      });
    });
  }
};

// 内容相关接口
export const ContentApi = {
  // 获取内容列表
  getList: (params) => http.get('/content/list', params),
  // 获取内容详情
  getDetail: (id) => http.get(`/content/detail/${id}`),
  // 发布内容
  publish: (data) => http.post('/content/publish', data),
  // 点赞
  like: (id) => http.post(`/content/like/${id}`),
  // 取消点赞
  cancelLike: (id) => http.post(`/content/cancelLike/${id}`),
  // 评论
  comment: (data) => http.post('/content/comment', data),
  // 获取评论列表
  getComments: (contentId, params) => http.get(`/content/comments/${contentId}`, params)
};

// 消息相关接口
export const MessageApi = {
  // 获取消息列表
  getList: (params) => http.get('/message/list', params),
  // 获取未读消息数量
  getUnreadCount: () => http.get('/message/unread/count'),
  // 标记消息为已读
  markAsRead: (ids) => http.post('/message/read', { ids }),
  // 删除消息
  delete: (ids) => http.post('/message/delete', { ids })
};

// 系统配置相关接口
export const ConfigApi = {
  // 获取系统配置
  getConfig: () => http.get('/config'),
  // 获取标签列表
  getTags: () => http.get('/config/tags')
};

export default {
  UserApi,
  ContentApi,
  MessageApi,
  ConfigApi
}; 