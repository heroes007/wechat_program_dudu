import TencentCloudChat from '@tencentcloud/chat';
import TIMUploadPlugin from 'tim-upload-plugin';
import { genTestUserSig } from '../../TUIKit/debug/GenerateTestUserSig';
import IMManager from '../../utils/im';
import { formatTime } from '../../utils/util';

Page({
  data: {
    config: {
      userID: 'test', //User ID
      SDKAPPID: 1600083035, // Your SDKAppID
      SECRETKEY: 'ccbe2a7880675d333a4ae8902fac40d171b7253cbad72fecf0e5ff58194a5ab3', // Your secretKey
      EXPIRETIME: 604800,
    },
    conversationID: '',
    conversationType: '', // 会话类型：C2C或GROUP
    receiverID: '', // 接收者ID（单聊时使用）
    messageList: [], // 消息列表
    inputMessage: '', // 输入框的文本
    scrollToMessage: '', // 滚动到指定消息
    conversation: {}, // 会话信息
    isLoading: false, // 是否正在加载更多消息

    // 面板控制
    isVoiceInputActive: false, // 语音输入是否激活
    isEmojiPanelVisible: false, // 表情面板是否可见
    isMorePanelVisible: false, // 更多功能面板是否可见

    // 默认头像
    selfAvatar: '/assets/images/default-avatar.png',
    otherAvatar: '/assets/images/default-avatar.png'
  },
  onLoad(options) {
    console.log('options', options);

    // 获取系统信息，包括状态栏高度
    wx.getSystemInfo({
      success: (res) => {
        const { windowHeight, statusBarHeight, system } = res;
        const isIOS = system.toLowerCase().includes('ios');
        
        this.setData({
          windowHeight,
          statusBarHeight,
          isIOS,
          // 自定义导航栏总高度 = 状态栏高度 + 导航栏内容高度
          navBarHeight: statusBarHeight + 44
        });
        
        console.log('设备信息:', {
          windowHeight,
          statusBarHeight,
          isIOS,
          navBarHeight: statusBarHeight + 44
        });
      }
    });
    this.setData({
      conversationID: options.id,
      conversationType: options.type || 'C2C'
    });
    const userSig = genTestUserSig(this.data.config).userSig;
    wx.$TUIKit = TencentCloudChat.create({
      SDKAppID: this.data.config.SDKAPPID
    });
    wx.$chat_SDKAppID = this.data.config.SDKAPPID;
    wx.$chat_userID = this.data.config.userID;
    wx.$chat_userSig = userSig;
    wx.TencentCloudChat = TencentCloudChat;
    wx.$TUIKit.registerPlugin({ 'tim-upload-plugin': TIMUploadPlugin });
    wx.$TUIKit.login({
      userID: this.data.config.userID,
      userSig
    });
    wx.setStorage({
      key: 'currentUserID',
      data: [],
    });
    wx.$TUIKit.on(wx.TencentCloudChat.EVENT.SDK_READY, this.onSDKReady, this);

    // 从会话ID中提取接收者ID
    if (this.data.conversationType === 'C2C') {
      console.log('从会话ID中提取接收者ID', this.data);
      // C2C会话格式为：C2C_USERID
      const receiverID = this.data.conversationID.replace('C2C_', '');
      this.setData({ receiverID });
    }

    // 监听IM消息接收事件
    const app = getApp();
    app.globalEvent.on('im:messageReceived', this.onMessageReceived.bind(this));

    // 获取会话信息
    this.getConversationProfile();

    // 获取消息列表
    this.getMessageList();

    // 如果需要获取位置信息
    this.getUserLocation();
  },
  
  // 获取用户位置
  getUserLocation() {
    // 实际应用中，应该从服务器获取对方的位置信息
    // 这里仅作为示例展示
    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        // 这里可以将位置信息发送到服务器，或者与对方位置进行计算
        console.log('当前位置', res);
        
        // 模拟计算距离
        const distance = '4km';
        this.setData({
          'conversation.distance': distance
        });
      },
      fail: (err) => {
        console.error('获取位置失败', err);
      }
    });
  },
  onUnload() {
    wx.$TUIKit.logout();
    wx.$TUIKit.off(wx.TencentCloudChat.EVENT.SDK_READY, this.onSDKReady, this);

    // 取消事件监听
    const app = getApp();
    app.globalEvent.off('im:messageReceived', this.onMessageReceived.bind(this));
  },
  onSDKReady() {
    const TUIKit = this.selectComponent('#TUIKit');
    TUIKit.init();
  },
  // 收到新消息
  onMessageReceived(messageList) {
    // 过滤出属于当前会话的消息
    const validMessages = messageList.filter(message =>
      message.conversationID === this.data.conversationID
    );

    if (validMessages.length > 0) {
      // 添加新消息到列表
      this.addMessagesToList(validMessages);
      // 设置消息已读
      IMManager.setMessageRead(this.data.conversationID);
    }
  },
  // 获取会话信息
  async getConversationProfile() {
    try {
      const { data: { conversationList } } = await IMManager.getConversationList();
      const conversation = conversationList.find(item => item.conversationID === this.data.conversationID);

      if (conversation) {
        let nickname = '';
        let avatar = this.data.otherAvatar;
        let status = '15分钟前';
        let lastAction = '刚刚';
        let distance = '4km';

        if (conversation.type === 'C2C') {
          // 单聊
          nickname = conversation.userProfile?.nick || conversation.userProfile?.userID || '对方';
          avatar = conversation.userProfile?.avatar || this.data.otherAvatar;
          
          // 这里可以根据实际需求获取用户状态信息
          // 示例代码，实际应根据业务需求调整
          if (conversation.lastMessage) {
            // 计算最后消息时间
            const lastMsgTime = new Date(conversation.lastMessage.lastTime * 1000);
            status = this.formatStatusTime(lastMsgTime);
          }
        } else if (conversation.type === 'GROUP') {
          // 群聊
          nickname = conversation.groupProfile?.name || '群聊';
          avatar = conversation.groupProfile?.avatar || this.data.otherAvatar;
          status = `${conversation.groupProfile?.memberCount || 0}人`;
        }

        this.setData({
          conversation: {
            ...conversation,
            nickname,
            avatar,
            status,
            lastAction,
            distance
          },
          otherAvatar: avatar
        });

        // 隐藏小程序默认导航栏，使用自定义导航栏
        wx.hideNavigationBarLoading();
      }
    } catch (error) {
      console.error('获取会话信息失败', error);
    }
  },
  
  // 格式化状态时间显示
  formatStatusTime(date) {
    const now = new Date();
    const diff = now - date; // 时间差（毫秒）
    
    // 小于1分钟显示"刚刚"
    if (diff < 60 * 1000) {
      return '刚刚';
    }
    
    // 小于1小时显示"xx分钟前"
    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`;
    }
    
    // 小于24小时显示"xx小时前"
    if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
    }
    
    // 大于24小时显示日期
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },
  // 获取消息列表
  async getMessageList() {
    try {
      this.setData({ isLoading: true });

      const { data: result } = await IMManager.getMessageList(this.data.conversationID, 20);
      const { messageList, isCompleted } = result;

      // 处理消息，添加UI需要的属性
      const formattedMessages = this.formatMessages(messageList);

      this.setData({
        messageList: formattedMessages,
        isLoading: false
      });

      // 滚动到最新消息
      if (formattedMessages.length > 0) {
        this.setData({
          scrollToMessage: formattedMessages[formattedMessages.length - 1].ID
        });
      }

      // 设置消息已读
      IMManager.setMessageRead(this.data.conversationID);
    } catch (error) {
      console.error('获取消息列表失败', error);
      this.setData({ isLoading: false });
    }
  },
  // 格式化消息，添加UI需要的属性
  formatMessages(messages) {
    const { selfAvatar, otherAvatar } = this.data;
    const userInfo = getApp().globalData.userInfo || {};
    const selfID = IMManager.userID;

    // 时间间隔阈值（5分钟，单位毫秒）
    const timeThreshold = 5 * 60 * 1000;

    return messages.map((message, index) => {
      // 是否是自己发送的消息
      const isSelf = message.flow === 'out';

      // 获取头像
      let avatar = isSelf ? (userInfo.avatarUrl || selfAvatar) : otherAvatar;

      // 如果有发送者资料，优先使用
      if (!isSelf && message.from) {
        avatar = message.senderProfile?.avatar || otherAvatar;
      }

      // 计算是否显示时间
      let isShowTime = false;
      if (index === 0) {
        // 第一条消息总是显示时间
        isShowTime = true;
      } else {
        // 与前一条消息时间间隔超过阈值，显示时间
        const prevMsg = messages[index - 1];
        isShowTime = (message.time - prevMsg.time) > timeThreshold;
      }

      // 格式化时间
      const messageTime = new Date(message.time * 1000);
      const timeFormatted = this.formatMessageTime(messageTime);

      return {
        ...message,
        avatar,
        isShowTime,
        timeFormatted,
        nick: message.senderProfile?.nick || message.from
      };
    });
  },
  // 加载更多消息
  async loadMoreMessages() {
    if (this.data.isLoading || this.data.messageList.length === 0) return;

    const firstMessage = this.data.messageList[0];
    if (!firstMessage) return;

    try {
      this.setData({ isLoading: true });

      const { data: result } = await IMManager.chat.getMessageList({
        conversationID: this.data.conversationID,
        nextReqMessageID: firstMessage.ID,
        count: 15
      });

      const { messageList, isCompleted } = result;
      if (messageList.length === 0) {
        this.setData({ isLoading: false });
        return;
      }

      // 处理消息，添加UI需要的属性
      const formattedMessages = this.formatMessages(messageList);

      // 添加到现有消息列表前面
      this.setData({
        messageList: [...formattedMessages, ...this.data.messageList],
        isLoading: false
      });
    } catch (error) {
      console.error('加载更多消息失败', error);
      this.setData({ isLoading: false });
    }
  },
  // 添加新消息到列表
  addMessagesToList(messages) {
    const formattedMessages = this.formatMessages(messages);
    const updatedMessageList = [...this.data.messageList, ...formattedMessages];

    this.setData({
      messageList: updatedMessageList,
      scrollToMessage: formattedMessages[formattedMessages.length - 1].ID
    });
  },
  // 格式化消息时间显示
  formatMessageTime(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 判断是否是今天
    if (date >= today) {
      return formatTime(date, 'HH:mm');
    }

    // 判断是否是昨天
    if (date >= yesterday && date < today) {
      return `昨天 ${formatTime(date, 'HH:mm')}`;
    }

    // 判断是否是今年
    if (date.getFullYear() === now.getFullYear()) {
      return formatTime(date, 'MM-DD HH:mm');
    }

    // 其他情况
    return formatTime(date, 'YYYY-MM-DD HH:mm');
  },
  // 输入框内容变化
  onInputChange(e) {
    this.setData({
      inputMessage: e.detail.value
    });
  },
  // 发送文本消息
  async sendMessage() {
    const { inputMessage, receiverID, conversationType } = this.data;
    if (!inputMessage.trim()) return;

    try {
      // 构建消息对象
      const to = conversationType === 'C2C' ? receiverID : this.data.conversationID.replace('GROUP_', '');

      // 发送消息
      const result = await IMManager.sendTextMessage(to, inputMessage, conversationType);

      // 重置输入框
      this.setData({
        inputMessage: ''
      });

      // 隐藏所有面板
      this.hideAllPanels();

      // 添加消息到列表
      this.addMessagesToList([result.data.message]);
    } catch (error) {
      console.error('发送消息失败', error);
      wx.showToast({
        title: '发送失败',
        icon: 'none'
      });
    }
  },
  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.sendImageMessage(tempFilePath);
      }
    });
  },
  // 拍摄照片
  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.sendImageMessage(tempFilePath);
      }
    });
  },
  // 发送图片消息
  async sendImageMessage(filePath) {
    try {
      const { receiverID, conversationType } = this.data;
      const to = conversationType === 'C2C' ? receiverID : this.data.conversationID.replace('GROUP_', '');

      // 创建图片消息
      const message = IMManager.chat.createImageMessage({
        to,
        conversationType,
        payload: {
          file: filePath
        }
      });

      // 发送消息
      const result = await IMManager.chat.sendMessage(message);

      // 隐藏所有面板
      this.hideAllPanels();

      // 添加消息到列表
      this.addMessagesToList([result.data.message]);
    } catch (error) {
      console.error('发送图片失败', error);
      wx.showToast({
        title: '发送图片失败',
        icon: 'none'
      });
    }
  },
  // 预览图片
  previewImage(e) {
    const { src } = e.currentTarget.dataset;

    // 获取所有图片消息的URL
    const imageUrls = this.data.messageList
      .filter(message => message.type === 'TIMImageElem')
      .map(message => message.payload.imageInfoArray[0].url);

    wx.previewImage({
      current: src,
      urls: imageUrls
    });
  },
  // 切换语音输入
  toggleVoiceInput() {
    this.setData({
      isVoiceInputActive: !this.data.isVoiceInputActive,
      isEmojiPanelVisible: false,
      isMorePanelVisible: false
    });
  },
  // 切换表情面板
  toggleEmojiPanel() {
    this.setData({
      isEmojiPanelVisible: !this.data.isEmojiPanelVisible,
      isMorePanelVisible: false,
      isVoiceInputActive: false
    });
  },
  // 切换更多功能面板
  toggleMorePanel() {
    this.setData({
      isMorePanelVisible: !this.data.isMorePanelVisible,
      isEmojiPanelVisible: false,
      isVoiceInputActive: false
    });
  },
  // 隐藏所有面板
  hideAllPanels() {
    this.setData({
      isMorePanelVisible: false,
      isEmojiPanelVisible: false,
      isVoiceInputActive: false
    });
  },
  // 开始录音
  startRecording() {
    // 实现录音功能
    wx.showToast({
      title: '开始录音',
      icon: 'none'
    });
  },
  // 停止录音
  stopRecording() {
    // 实现停止录音并发送语音消息
    wx.showToast({
      title: '录音功能暂未实现',
      icon: 'none'
    });
  },
  // 返回上一页
  goBack() {
    // 添加触觉反馈
    wx.vibrateShort({
      type: 'light'
    });
    
    // 返回上一页
    wx.navigateBack({
      delta: 1,
      fail: () => {
        // 如果没有上一页，则跳转到首页
        wx.reLaunch({
          url: '/pages/index/index'
        });
      }
    });
  },
  // 显示更多操作菜单
  showMoreActions() {
    const items = ['查看资料', '设置消息免打扰', '清空聊天记录', '删除聊天'];
    
    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        const tapIndex = res.tapIndex;
        switch (tapIndex) {
          case 0:
            this.viewProfile();
            break;
          case 1:
            this.toggleNotification();
            break;
          case 2:
            this.clearChatHistory();
            break;
          case 3:
            this.deleteChat();
            break;
        }
      },
      fail: (err) => {
        console.log('用户取消操作', err);
      }
    });
  },
  // 查看用户资料
  viewProfile() {
    wx.showToast({
      title: '查看资料功能开发中',
      icon: 'none'
    });
  },
  // 切换消息免打扰
  toggleNotification() {
    wx.showToast({
      title: '消息免打扰设置开发中',
      icon: 'none'
    });
  },
  // 清空聊天记录
  clearChatHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空聊天记录吗？此操作无法撤销。',
      confirmText: '清空',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            messageList: []
          });
          wx.showToast({
            title: '聊天记录已清空',
            icon: 'success'
          });
        }
      }
    });
  },
  // 删除聊天
  deleteChat() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个聊天吗？此操作无法撤销。',
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          // 这里应该调用删除会话的API
          wx.showToast({
            title: '聊天已删除',
            icon: 'success'
          });
          // 返回上一页
          setTimeout(() => {
            this.goBack();
          }, 1000);
        }
      }
    });
  }
});