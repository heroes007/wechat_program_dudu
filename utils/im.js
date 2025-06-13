// IM工具类
import TencentCloudChat from '@tencentcloud/chat';
import TIMUploadPlugin from 'tim-upload-plugin';
import LibGenerateTestUserSig from './lib-generate-test-usersig-es.min.js';

// 单例模式
let instance = null;

class IMManager {
  constructor() {
    if (instance) return instance;
    instance = this;

    const userInfo = wx.getStorageSync('userInfo');
    
    this.chat = null;
    this.isReady = false;
    this.SDKAppID = 1600083035;
    this.secretKey = 'ccbe2a7880675d333a4ae8902fac40d171b7253cbad72fecf0e5ff58194a5ab3';
    this.userID = userInfo.phonenumber;
    this.userSig = '';
  }

  // 初始化IM SDK
  init() {
    console.log('初始化IM SDK');
    if (this.chat) return this.chat;

    const options = {
      SDKAppID: this.SDKAppID
    };

    this.chat = TencentCloudChat.create(options);
    this.chat.setLogLevel(0); // 开发阶段使用，日志量较多
    this.chat.registerPlugin({'tim-upload-plugin': TIMUploadPlugin});
    
    // 监听事件
    this._registerListeners();

    console.log('初始化IM SDK', this.chat);

    const { userSig, SDKAppID } = genTestUserSig({
      SDKAppID: this.SDKAppID,
      secretKey: this.secretKey,
      userID: this.userID
    });

    this.login(this.userID, userSig);
    return this.chat;
  }

  // 注册事件监听
  _registerListeners() {
    console.log('注册事件监听');
    // SDK 准备就绪
    this.chat.on(TencentCloudChat.EVENT.SDK_READY, this._onSDKReady.bind(this));
    
    // SDK 未就绪
    this.chat.on(TencentCloudChat.EVENT.SDK_NOT_READY, this._onSDKNotReady.bind(this));
    
    // 收到新消息
    this.chat.on(TencentCloudChat.EVENT.MESSAGE_RECEIVED, this._onMessageReceived.bind(this));
    
    // 网络状态变化
    this.chat.on(TencentCloudChat.EVENT.NET_STATE_CHANGE, this._onNetStateChange.bind(this));
    
    // 被踢下线
    this.chat.on(TencentCloudChat.EVENT.KICKED_OUT, this._onKickedOut.bind(this));
  }

  // 登录IM
  login(userID, userSig) {
    this.userID = userID;
    this.userSig = userSig;
    
    return this.chat.login({userID, userSig});
  }

  // 登出IM
  logout() {
    return this.chat.logout();
  }

  // 获取会话列表
  getConversationList() {
    return this.chat.getConversationList();
  }

  // 获取指定会话的消息列表
  getMessageList(conversationID, count = 15) {
    return this.chat.getMessageList({
      conversationID,
      count
    });
  }

  // 发送文本消息
  sendTextMessage(to, text, conversationType = 'C2C', fn) {
    console.log('发送文本消息', to, text, conversationType);

    const toId = to.replace('C2C', '');

    const message = this.chat.createTextMessage({
      to: toId,
      conversationType,
      payload: { text }
    });

    fn && fn(message);
    
    console.log('message', message);

    return this.chat.sendMessage(message);
  }

  // 设置消息已读
  setMessageRead(conversationID) {
    return this.chat.setMessageRead({conversationID});
  }

  // SDK准备就绪
  _onSDKReady(event) {
    console.log('IM SDK 已经准备就绪');
    this.isReady = true;
    
    // 触发全局事件
    const globalEvent = getApp().globalEvent || {};
    if (globalEvent.emit) {
      globalEvent.emit('im:ready');
    }
  }

  // SDK未就绪
  _onSDKNotReady(event) {
    console.log('IM SDK 未准备就绪', event);
    this.isReady = false;
    
    // 触发全局事件
    const globalEvent = getApp().globalEvent || {};
    if (globalEvent.emit) {
      globalEvent.emit('im:notReady');
    }
  }

  // 收到新消息
  _onMessageReceived(event) {
    console.log('收到新消息', event.data);
    
    // 触发全局事件
    const globalEvent = getApp().globalEvent || {};
    if (globalEvent.emit) {
      globalEvent.emit('im:messageReceived', event.data);
    }
  }

  // 网络状态变化
  _onNetStateChange(event) {
    console.log('网络状态变化', event.data);
    
    // 触发全局事件
    const globalEvent = getApp().globalEvent || {};
    if (globalEvent.emit) {
      globalEvent.emit('im:netStateChange', event.data);
    }
  }

  // 被踢下线
  _onKickedOut(event) {
    console.log('被踢下线', event.data);
    
    // 触发全局事件
    const globalEvent = getApp().globalEvent || {};
    if (globalEvent.emit) {
      globalEvent.emit('im:kickedOut', event.data);
    }
  }
}

// 生成测试用户签名
function genTestUserSig(options) {
  const EXPIRETIME = 604800;

  const { SDKAppID, secretKey, userID } = options;
  const generator = new LibGenerateTestUserSig(SDKAppID, secretKey, EXPIRETIME);
  const userSig = generator.genTestUserSig(userID);
  return {
    SDKAppID,
    userSig,
  };
}

// 导出单例
export default new IMManager(); 