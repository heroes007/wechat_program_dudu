// TUIKitWChat/Chat/index.js
import constant from './utils/constant';
import TUICore, {
  TUIConstants,
} from '@tencentcloud/tui-core';
const app = getApp();
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    conversationID: {
      type: String,
      value: '',
      observer(conversationID) {
        this.setData({
          outsideConversation: true,
          currentConversationID: conversationID,
        });
      },
    },
    config: {
      type: Object,
      value: {},
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    isShowConversation: false,
    isShowConversationList: false,
    currentConversationID: '',
    unreadCount: 0,
    hasCallKit: false,
    innerConfig: {
      userID: '',
      userSig: '',
      type: 1,
      tim: null,
      SDKAppID: 0,
      enabledStatusComponents: false,
      enabledDisplayOnlineStatus: false
    },
    outsideConversation: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    init() {
      const innerConfig = this.data.innerConfig;
      innerConfig.userID = wx.$chat_userID;
      innerConfig.userSig = wx.$chat_userSig;
      innerConfig.tim = wx.$TUIKit;
      innerConfig.SDKAppID = wx.$chat_SDKAppID;
      
      if (this.properties.config) {
        Object.assign(innerConfig, this.properties.config);
      }
      
      if (this.data.outsideConversation) {
        this.createConversation({
          detail: {
            currentConversationID: this.data.currentConversationID,
            unreadCount: 0,
          },
        });
      } else {
        this.showConversationList();
      }
      
      this.setData(
        {
          innerConfig,
        },
        () => {
          this.initCallKit();
        },
      );
    },
    initCallKit() {
      if (TUICore.getService(TUIConstants.TUICalling.SERVICE.NAME)) {
        this.setData({
          hasCallKit: true,
        });
      }
    },
    createConversation(event) {
      this.setData(
        {
          isShowConversation: true,
          currentConversationID: event.detail.currentConversationID,
          unreadCount: event.detail.unreadCount,
        },
        () => {
          const TUIChat = this.selectComponent('#TUIChat');
          TUIChat.init();
          const timer = setTimeout(() => {
            const TUIConversation = this.selectComponent('#TUIConversation');
            if (TUIConversation) {
              TUIConversation.destroy();
            }
            clearTimeout(timer);
          }, 300);
        },
      );
    },
    showConversationList() {
      if (this.data.outsideConversation) {
        this.handleBack();
      } else {
        const TUIConversation = this.selectComponent('#TUIConversation');
        if (TUIConversation) {
          TUIConversation.init();
        }
        this.setData({
          isShowConversation: false,
        });
      }
    },
    async handleCall(event) {
      let { userIDList = [] } = event.detail;
      const { groupID = '', userID = '', type } = event.detail;
      if (userID) {
        userIDList = [userID];
      }
      TUICore.callService({
        serviceName: TUIConstants.TUICalling.SERVICE.NAME,
        method: TUIConstants.TUICalling.SERVICE.METHOD.START_CALL,
        params: {
          groupID,
          userIDList,
          type,
        },
      });
    },
    handleBack() {
      if (
        app.globalData
        && app.globalData.reportType !== constant.OPERATING_ENVIRONMENT
      ) {
        wx.navigateBack({
          delta: 1,
        });
      } else {
        wx.switchTab({
          url: '/pages/TUI-Index/index',
        });
      }
    },
    sendMessage(event) {
      const TUIChat = this.selectComponent('#TUIChat');
      if (TUIChat) {
        TUIChat.sendMessage(event);
      }
    },
  },
});
