// app.js
import { initApiService, UserApi } from './api/index';
// 引入IM工具类
import IMManager from './utils/im';

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
    // 初始化腾讯云IM SDK
    this.initIM();

    // 登录状态检查
    const token = wx.getStorageSync('token')
    console.log('token', token)
    if (token) {
      this.globalData.isLogin = true
      // 获取用户信息
      this.getUserInfo()
    }

    this.initAIModel();
  },

  // 初始化IM
  initIM() {
    // 设置SDKAppID
    IMManager.SDKAppID = this.globalData.SDKAppID;
    // 初始化IM SDK
    IMManager.init();
    
    // 监听IM事件
    this.listenIMEvents();
  },


  // 初始化AI模型
  initAIModel() {
    wx.cloud.init({
      env: "cloud1-1gzx3mxd3248aafb",
    });
  },
  
  // 监听IM事件
  listenIMEvents() {
    // 监听IM就绪事件
    this.globalEvent.on('im:ready', () => {
      console.log('IM已就绪');
      // 可以在这里执行一些IM就绪后的操作
    });
    
    // 监听消息接收事件
    this.globalEvent.on('im:messageReceived', (messages) => {
      console.log('收到新消息', messages);
      // 可以在这里处理新消息，例如更新未读消息数等
    });
  },

  // IM登录
  imLogin(userID, userSig) {
    return IMManager.login(userID, userSig);
  },

  // 获取用户信息
  getUserInfo() {
    // 使用API服务获取用户信息
    UserApi.getUserInfo().then(userInfo => {
      console.log('userInfo', userInfo)
      wx.setStorageSync('userInfo', userInfo)
      
      // 用户信息获取成功后，尝试登录IM
      if (userInfo && userInfo.userID) {
        this.loginIM(userInfo.userID);
      }

      // 如果用户没有头像，则跳转至完善信息
      if (!userInfo.avatar) {
        wx.navigateTo({
          url: '/pages/completeInfo/completeInfo'
        })
      }
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
  },
  
  // 登录IM系统
  loginIM(userID) {
    // 这里应该从服务器获取userSig，这里使用简化方式
    // 实际开发中，应从服务器获取userSig
    const genTestUserSig = require('./TUIKit/debug/GenerateTestUserSig');
    
    const config = {
      userID: userID,
      SDKAPPID: this.globalData.SDKAppID,
      SECRETKEY: 'ccbe2a7880675d333a4ae8902fac40d171b7253cbad72fecf0e5ff58194a5ab3', // 使用im.js中的密钥
      EXPIRETIME: 604800
    };
    
    try {
      const { userSig } = genTestUserSig.genTestUserSig(config);
      
      // 登录IM
      this.imLogin(userID, userSig).then(() => {
        console.log('IM登录成功');
      }).catch(err => {
        console.error('IM登录失败', err);
        // 可以添加重试或提示用户
        wx.showToast({
          title: 'IM登录失败',
          icon: 'none'
        });
      });
    } catch (error) {
      console.error('生成UserSig失败', error);
      wx.showToast({
        title: '生成UserSig失败',
        icon: 'none'
      });
    }
  }
}) 