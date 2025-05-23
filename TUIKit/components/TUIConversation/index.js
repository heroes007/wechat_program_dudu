import constant from '../../utils/constant';
import useChatEngine from '../../utils/useChatEngine';

// TUIKitWChat/Conversation/index.js
const app = getApp();

Component({
  /**
   * 组件的初始数据
   */
  data: {
    conversationList: [],
    currentConversationID: '',
    showSelectTag: false,
    array: [
      { id: 1, name: '发起会话' },
      { id: 2, name: '发起群聊' },
      { id: 3, name: '加入群聊' },
    ],
    index: Number,
    unreadCount: 0,
    conversationInfomation: {},
    transChenckID: '',
    userIDList: [],
    statusList: [],
    currentUserIDList: [],
    showConversationList: true,
    showCreateConversation: false,
    showCreateGroup: false,
    showJoinGroup: false,
    handleChangeStatus: false,
    storageList: [],
    showConversation: false,
    isInit: false,
    isExistNav: false,
    config: {
      type: Object,
      value: {},
      observer(newVal) {
        this.setData({ config: newVal });
      },
    },
  },
  lifetimes: {
    detached() {
      wx.$TUIKit.off(wx.TencentCloudChat.EVENT.CONVERSATION_LIST_UPDATED, this.onConversationListUpdated, this);
      wx.$TUIKit.off(wx.TencentCloudChat.EVENT.USER_STATUS_UPDATED, this.onUserStatusUpdate, this);
      this.setData({
        isInit: false,
      });
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    init() {
      this.initEvent();
      this.setData({
        showConversation: true,
      });
      this.initUserStatus();
      this.setBackIcon();
      useChatEngine();
    },

    destroy() {
      this.setData({
        showConversation: false,
        isExistNav: false,
      });
    },

    initEvent() {
      if (!this.data.isInit) {
        wx.$TUIKit.on(wx.TencentCloudChat.EVENT.CONVERSATION_LIST_UPDATED, this.onConversationListUpdated, this);
        wx.$TUIKit.on(wx.TencentCloudChat.EVENT.USER_STATUS_UPDATED, this.onUserStatusUpdate, this);
        this.getConversationList();
        this.setData({
          isInit: true,
        });
      }
    },

    initUserStatus() {
      wx.getStorageInfo({
        success(res) {
          wx.setStorage({
            key: 'storageList',
            data: res.keys,
          });
        },
      });
      this.setData({
        handleChangeStatus: wx.getStorageSync(app?.globalData?.userInfo?.userID) ? wx.getStorageSync(app?.globalData?.userInfo?.userID) : true,
      }, () => {
        if (!wx.getStorageSync('storageList').includes('showOnlineStatus')) {
          this.handleChangeStatus();
        }
      });
    },

    setBackIcon() {
      const pages = getCurrentPages();
      const prevPages = pages[pages.length - 2];
      if (prevPages && prevPages.route) {
        this.setData({
          isExistNav: true,
        });
      }
    },

    goBack() {
      if (app.globalData && app.globalData.reportType !== constant.OPERATING_ENVIRONMENT) {
        wx.navigateBack();
      } else {
        wx.switchTab({
          url: '/pages/TUI-Index/index',
        });
      }
    },
    // 更新会话列表
    onConversationListUpdated(event) {
      this.handleConversationList(event.data);
    },
    getConversationList() {
      if (this.data.conversationList.length === 0) {
        wx.$TUIKit.getConversationList().then((imResponse) => {
          this.handleConversationList(imResponse.data.conversationList);
        });
      }
    },
    handleConversationList(conversationList) {
      this.setData({
        conversationList,
      });
      this.filterUserIDList(conversationList);
    },
    // 过滤会话列表，找出C2C会话，以及需要订阅状态的userIDList
    filterUserIDList(conversationList) {
      if (conversationList.length === 0) return;
      const userIDList = [];
      conversationList.forEach((element) => {
        if (element.type === wx.TencentCloudChat.TYPES.CONV_C2C) {
          userIDList.push(element.userProfile.userID);
        }
      });
      const currentUserID = wx.getStorageSync('currentUserID');
      if (currentUserID.includes(wx.$chat_userID)) {
        const currentStatus = wx.getStorageSync(wx.$chat_userID);
        if (currentStatus) {
          this.subscribeOnlineStatus(userIDList);
        }
      } else {
        this.subscribeOnlineStatus(userIDList);
      }
    },
    transCheckID(event) {
      this.setData({
        transChenckID: event.detail.checkID,
      });
    },
    // 更新状态
    onUserStatusUpdate(event) {
      event.data.forEach((element) => {
        const index = this.data.statusList.findIndex(item => item.userID === element.userID);
        if (index === -1) {
          return;
        }
        this.data.statusList[index] = element;
        this.setData({
          statusList: this.data.statusList,
        });
      });
    },
    // 跳转到子组件需要的参数
    handleRoute(event) {
      const flagIndex = this.data.conversationList.findIndex(item => item.conversationID === event.currentTarget.id);
      this.setData({
        index: flagIndex,
      });
      this.getConversationList();
      this.setData({
        currentConversationID: event.currentTarget.id,
        unreadCount: this.data.conversationList[this.data.index].unreadCount,
      });
      this.triggerEvent('createConversation', { currentConversationID: event.currentTarget.id,
        unreadCount: this.data.conversationList[this.data.index].unreadCount });
    },
    // 展示发起会话/发起群聊/加入群聊
    showSelectedTag() {
      this.setData({
        showSelectTag: !this.data.showSelectTag,
      });
    },
    handleOnTap(event) {
      this.setData({
        showSelectTag: false,
      }, () => {
        switch (event.currentTarget.dataset.id) {
          case 1:
            this.setData({
              showCreateConversation: true,
              showConversationList: false,
            });
            break;
          case 2:
            this.setData({
              showCreateGroup: true,
              showConversationList: false,
            });
            break;
          case 3:
            this.setData({
              showJoinGroup: true,
              showConversationList: false,
            });
            break;
          default:
            break;
        }
      });
    },
    // 点击空白区域关闭showMore弹窗
    handleEditToggle() {
      this.setData({
        showSelectTag: false,
      });
    },
    toggleConversation() {
      this.setData({
        showConversationList: true,
        showCreateConversation: false,
        showCreateGroup: false,
        showJoinGroup: false,
      });
    },
    handleCreateConversation(event) {
      this.triggerEvent('createConversation', { currentConversationID: event.detail.currentConversationID });
    },
    // 处理当前登录账号是否开启在线状态
    handleChangeStatus() {
      const currentID = wx.$chat_userID;
      const cacheList = wx.getStorageSync('currentUserID');
      const nowList = [];
      nowList.push(wx.$chat_userID);
      if (cacheList.length === 0 || !cacheList.includes(wx.$chat_userID)) {
        wx.setStorage({
          key: 'currentUserID',
          data: wx.getStorageSync('currentUserID').concat(nowList),
        });
      }
      wx.setStorage({
        key: currentID,
        data: this.data.handleChangeStatus,
      });
    },
    // 订阅在线状态
    subscribeOnlineStatus(userIDList) {
      wx.$TUIKit.getUserStatus({ userIDList }).then((imResponse) => {
        const { successUserList } = imResponse.data;
        this.setData({
          statusList: successUserList,
        });
      })
        .catch((imError) => {
          console.warn('开启在线状态功能,' + '\n'
          + '1. 需要您开通旗舰版套餐：https://buy.cloud.tencent.com/avc ;' + '\n'
          + '2. 进入 IM 控制台开启"用户状态查询及状态变更通知"开关: https://console.cloud.tencent.com/im/login-message');
        });
      this.subscribeUserStatus({ userIDList });
    },
    subscribeUserStatus({ userIDList }) {
      // 检查是否禁用了在线状态功能
      if (this.data.config && (this.data.config.enabledStatusComponents === false || 
          this.data.config.enabledDisplayOnlineStatus === false)) {
        console.log('Online status feature is disabled');
        return Promise.resolve({ data: { failureUserList: [] } });
      }
      
      try {
        // 原有逻辑，调用 subscribeUserStatus
        return wx.$TUIKit.subscribeUserStatus({ userIDList });
      } catch (error) {
        // 如果调用失败，说明套餐不支持，返回空结果
        console.warn('subscribeUserStatus failed, possibly not supported in current package');
        return Promise.resolve({ data: { failureUserList: [] } });
      }
    },
    learnMore() {
      if (app.globalData && app.globalData.reportType !== constant.OPERATING_ENVIRONMENT) return;
      wx.navigateTo({
        url: '/pages/TUI-User-Center/webview/webview?url=https://cloud.tencent.com/product/im',
      });
    },
  },
});
