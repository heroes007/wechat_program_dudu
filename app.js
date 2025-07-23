// app.js
import { initApiService, UserApi } from './api/index';

// 简单的事件总线
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  off(eventName, callback) {
    if (!this.events[eventName]) return;
    if (!callback) {
      delete this.events[eventName];
    } else {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
  }

  emit(eventName, ...args) {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(callback => {
      callback(...args);
    });
  }
}

App({
  globalData: {
    userInfo: null,
    isLogin: false,
    SDKAppID: 1600083035 // 替换为您的腾讯云IM应用SDKAppID，这里只是示例值
  },
  // 全局事件总线
  globalEvent: new EventEmitter(),
  
  onLaunch() {
    // 初始化API服务
    initApiService({
      baseUrl: 'https://dududate.com/api',
      // baseUrl: 'http://119.45.26.166:8090',
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
    // IM SDK将在需要时才初始化（分包加载时）
    // this.initIM();

    // 登录状态检查
    const token = wx.getStorageSync('token')
    console.log('token', token)
    // if (token) {
    //   this.globalData.isLogin = true
    //   // 获取用户信息
    //   this.getUserInfo()
    // } else {
    //   // 未登录，跳转到注册页面
    //   setTimeout(() => {
    //     wx.redirectTo({
    //       url: '/pages/user-package/register/register'
    //     })
    //   }, 100)
    // }

    this.initAIModel();
  },

  // 初始化IM（延迟到分包加载时）
  initIM() {
    return new Promise((resolve, reject) => {
      try {
        // 动态引入IM管理器（避免在主包中加载）
        const IMManager = require('./utils/im.js');
        
        // 设置SDKAppID
        IMManager.SDKAppID = this.globalData.SDKAppID;
        // 初始化IM SDK
        IMManager.init();
        
        // 监听IM事件
        this.listenIMEvents(IMManager);
        
        resolve(IMManager);
      } catch (error) {
        console.error('IM初始化失败:', error);
        reject(error);
      }
    });
  },


  // 初始化AI模型
  initAIModel() {
    wx.cloud.init({
      env: "cloud1-3gzkrcde229e333a",
    });
  },
  
  // 监听IM事件
  listenIMEvents(IMManager) {
    if (!IMManager) return;
    
    // 直接监听IM管理器的事件
    IMManager.on('ready', () => {
      console.log('IM已就绪');
      this.globalEvent.emit('im:ready');
    });
    
    IMManager.on('messageReceived', (messages) => {
      console.log('收到新消息', messages);
      this.globalEvent.emit('im:messageReceived', messages);
    });
  },

  // IM登录
  imLogin(userID, userSig, IMManager) {
    if (!IMManager) {
      throw new Error('IM管理器未初始化');
    }
    return IMManager.login(userID, userSig);
  },

  // 获取用户信息
  async getUserInfo() {
    const res = await UserApi.getUserInfo();
    const userInfo = res.user;
    wx.setStorageSync('userInfo', userInfo)
    
    // 用户信息获取成功后，尝试登录IM（只在需要时）
    if (userInfo && userInfo.userID) {
      // 延迟到用户访问聊天功能时才登录IM
      wx.setStorageSync('pendingIMLogin', userInfo.userID);
    }

    return userInfo;
  },
  
  // 登录IM系统（延迟到分包加载时）
  async loginIM(userID) {
    try {
      // 初始化IM SDK
      const IMManager = await this.initIM();
      
      // 这里应该从服务器获取userSig，这里使用简化方式
      // 实际开发中，应从服务器获取userSig
      const genTestUserSig = require('./pages/chat-package/TUIKit/debug/GenerateTestUserSig');
      
      const config = {
        userID: userID,
        SDKAPPID: this.globalData.SDKAppID,
        SECRETKEY: 'ccbe2a7880675d333a4ae8902fac40d171b7253cbad72fecf0e5ff58194a5ab3',
        EXPIRETIME: 604800
      };
      
      const { userSig } = genTestUserSig.genTestUserSig(config);
      
      // 登录IM
      await this.imLogin(userID, userSig, IMManager);
      console.log('IM登录成功');
    } catch (error) {
      console.error('IM登录失败', error);
      wx.showToast({
        title: 'IM登录失败',
        icon: 'none'
      });
    }
  }
}) 