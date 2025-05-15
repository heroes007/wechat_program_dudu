// app.js
import { initApiService, UserApi } from './api/index';

App({
  globalData: {
    userInfo: null,
    isLogin: false
  },
  onLaunch() {
    // 初始化API服务
    initApiService({
      baseUrl: 'http://60.205.120.120:8090', // 实际开发中替换为真实的API地址
      enableMock: false,  // 开发阶段启用模拟数据
      enableInterceptor: true
    });
    
    // 开发环境下关闭域名校验
    if (__wxConfig && __wxConfig.envVersion !== 'release') {
      wx.setStorageSync('debugInfo', {disableRequestDomainCheck: true});
    }

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录状态检查
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.isLogin = true
      // 获取用户信息
      this.getUserInfo()
    }
  },

  // 获取用户信息
  getUserInfo() {
    // 使用API服务获取用户信息
    UserApi.getUserInfo().then(userInfo => {
      console.log('userInfo', userInfo)
      this.globalData.userInfo = userInfo;
    }).catch(err => {
      console.error('获取用户信息失败', err);
      // 模拟数据兜底
      // this.globalData.userInfo = {
      //   nickName: '嘟嘟用户',
      //   avatarUrl: '/assets/images/default-avatar.png',
      //   gender: 1,
      //   age: 25,
      //   tags: ['旅行', '美食', '电影'],
      //   occupation: '工程师',
      //   school: '某某大学',
      //   location: '北京',
      //   signature: '这是一个示例签名'
      // }
    });
  }
}) 