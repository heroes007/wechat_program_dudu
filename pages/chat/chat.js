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
    isRecording: false, // 是否正在录音

    // 默认头像
    selfAvatar: '/assets/images/default-avatar.png',
    otherAvatar: '/assets/images/default-avatar.png',

    chatGuideVisible: false, // 聊天话题组件显示状态
    
    // 键盘适配相关
    keyboardHeight: 0, // 键盘高度
    inputAreaHeight: 60, // 输入区域高度
    safeAreaBottom: 0, // 底部安全区域高度
    bottomPlaceholderHeight: 20, // 底部占位高度
    showQuickReply: true, // 显示快捷回复
    inputPlaceholder: '在此输入', // 输入框占位文本
    
    // 表情包数据
    emojiList: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩'],
  },

  onLoad(options) {
    console.log('options', options);

    // 获取系统信息，包括状态栏高度和安全区域
    wx.getSystemInfo({
      success: (res) => {
        const { windowHeight, statusBarHeight, system, safeArea } = res;
        const isIOS = system.toLowerCase().includes('ios');
        
        // 计算安全区域底部高度
        const safeAreaBottom = safeArea ? (windowHeight - safeArea.bottom) : 0;
        
        this.setData({
          windowHeight,
          statusBarHeight,
          isIOS,
          safeAreaBottom,
          // 自定义导航栏总高度 = 状态栏高度 + 导航栏内容高度
          navBarHeight: statusBarHeight + 44
        });
        
        console.log('设备信息:', {
          windowHeight,
          statusBarHeight,
          isIOS,
          safeAreaBottom,
          navBarHeight: statusBarHeight + 44
        });
      }
    });

    // 监听键盘高度变化
    wx.onKeyboardHeightChange((res) => {
      console.log('键盘高度变化:', res.height);
      this.setData({
        keyboardHeight: res.height
      });
      
      // 键盘弹起时滚动到最新消息
      if (res.height > 0 && this.data.messageList.length > 0) {
        setTimeout(() => {
          const lastMessage = this.data.messageList[this.data.messageList.length - 1];
          this.setData({
            scrollToMessage: lastMessage.ID
          });
        }, 100);
      }
    });

    this.setData({
      conversationID: options.id,
      conversationType: options.type || 'C2C'
    });
    
    this.initIM();
    
    // 从会话ID中提取接收者ID
    if (this.data.conversationType === 'C2C') {
      console.log('从会话ID中提取接收者ID', this.data);
      // C2C会话格式为：C2C_USERID
      const receiverID = this.data.conversationID.replace('C2C_', '');
      this.setData({ receiverID });
    }

    // 监听IM消息接收事件
    const app = getApp();
    if (app.globalEvent) {
      app.globalEvent.on('im:messageReceived', this.onMessageReceived.bind(this));
    }

    // 获取会话信息
    this.getConversationProfile();

    // 获取消息列表
    this.getMessageList();
  },

  onUnload() {
    wx.$TUIKit && wx.$TUIKit.off(wx.TencentCloudChat.EVENT.SDK_READY, this.onSDKReady, this);
    
    // 移除事件监听
    const app = getApp();
    if (app.globalEvent) {
      app.globalEvent.off('im:messageReceived', this.onMessageReceived.bind(this));
    }
    
    // 移除键盘监听
    wx.offKeyboardHeightChange();
  },

  // 初始化IM
  initIM() {
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
    
    // 监听新消息事件
    wx.$TUIKit.on(wx.TencentCloudChat.EVENT.MESSAGE_RECEIVED, this.onNewMessageReceived, this);
  },

  onSDKReady() {
    const TUIKit = this.selectComponent('#TUIKit');
    TUIKit && TUIKit.init();
  },

  // 收到新消息（来自IM SDK）
  onNewMessageReceived(event) {
    const { data: messageList } = event;
    console.log('收到新消息:', messageList);
    
    // 过滤出属于当前会话的消息
    const validMessages = messageList.filter(message =>
      message.conversationID === this.data.conversationID
    );

    if (validMessages.length > 0) {
      // 添加新消息到列表
      this.addMessagesToList(validMessages);
      // 设置消息已读
      IMManager.setMessageRead && IMManager.setMessageRead(this.data.conversationID);
    }
  },

  // 收到新消息（来自全局事件）
  onMessageReceived(messageList) {
    // 过滤出属于当前会话的消息
    const validMessages = messageList.filter(message =>
      message.conversationID === this.data.conversationID
    );

    if (validMessages.length > 0) {
      // 添加新消息到列表
      this.addMessagesToList(validMessages);
      // 设置消息已读
      IMManager.setMessageRead && IMManager.setMessageRead(this.data.conversationID);
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

      console.log('getMessageList messageList', messageList);

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

      // 发送成功后，将消息添加到消息列表
      if (result && result.data && result.data.message) {
        this.addMessagesToList([result.data.message]);
      }

      // 重置输入框
      this.setData({
        inputMessage: ''
      });

      // 隐藏所有面板
      this.hideAllPanels();

      console.log('消息发送成功', result);
    } catch (error) {
      console.error('发送消息失败', error);
      wx.showToast({
        title: '发送失败',
        icon: 'error'
      });
    }
  },
  // 选择图片
  chooseImage() {
    this.hideAllPanels();
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.sendImageMessage(tempFilePath);
      },
      fail: (err) => {
        console.error('选择图片失败', err);
      }
    });
  },
  // 拍照
  takePhoto() {
    this.hideAllPanels();
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.sendImageMessage(tempFilePath);
      },
      fail: (err) => {
        console.error('拍照失败', err);
      }
    });
  },
  // 发送图片消息
  async sendImageMessage(filePath) {
    const { receiverID, conversationType } = this.data;

    try {
      wx.showLoading({
        title: '发送中...',
        mask: true
      });

      // 构建消息对象
      const to = conversationType === 'C2C' ? receiverID : this.data.conversationID.replace('GROUP_', '');

      // 发送图片消息
      const result = await IMManager.sendImageMessage(to, filePath, conversationType);

      // 发送成功后，将消息添加到消息列表
      if (result && result.data && result.data.message) {
        this.addMessagesToList([result.data.message]);
      }

      wx.hideLoading();
      console.log('图片发送成功', result);
    } catch (error) {
      wx.hideLoading();
      console.error('发送图片失败', error);
      wx.showToast({
        title: '发送失败',
        icon: 'error'
      });
    }
  },
  // 选择文件
  chooseFile() {
    this.hideAllPanels();
    wx.showToast({
      title: '文件功能暂未开放',
      icon: 'none'
    });
  },
  // 预览图片
  previewImage(e) {
    const { src } = e.currentTarget.dataset;
    const { messageList } = this.data;
    
    // 获取所有图片消息的URL
    const imageUrls = messageList
      .filter(msg => msg.type === 'TIMImageElem')
      .map(msg => msg.payload.imageInfoArray[0].url);

    wx.previewImage({
      current: src,
      urls: imageUrls
    });
  },
  // 输入框获得焦点
  onInputFocus(e) {
    console.log('输入框获得焦点', e);
    this.hideAllPanels();
    
    // 延迟滚动到最新消息，等待键盘完全弹起
    setTimeout(() => {
      if (this.data.messageList.length > 0) {
        const lastMessage = this.data.messageList[this.data.messageList.length - 1];
        this.setData({
          scrollToMessage: lastMessage.ID
        });
      }
    }, 300);
  },

  // 输入框失去焦点
  onInputBlur(e) {
    console.log('输入框失去焦点', e);
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
      isEmojiPanelVisible: false,
      isMorePanelVisible: false
    });
  },

  // 选择表情
  selectEmoji(e) {
    const emoji = e.currentTarget.dataset.emoji;
    const newMessage = this.data.inputMessage + emoji;
    this.setData({
      inputMessage: newMessage
    });
  },

  // 选择快捷回复
  selectQuickReply(e) {
    const text = e.currentTarget.dataset.text;
    this.showChatGuide();
    // this.setData({
    //   inputMessage: text
    // });
  },

  // 开始录音
  startRecording() {
    console.log('开始录音');
    this.setData({
      isRecording: true
    });
    
    // 震动反馈
    wx.vibrateShort();
    
    // 这里可以添加录音逻辑
  },

  // 停止录音
  stopRecording() {
    console.log('停止录音');
    this.setData({
      isRecording: false
    });
    
    // 这里可以添加停止录音和发送语音消息的逻辑
  },

  // 发送位置
  sendLocation() {
    console.log('发送位置');
    this.hideAllPanels();
    
    wx.chooseLocation({
      success: (res) => {
        console.log('选择的位置:', res);
        // 这里可以实现发送位置消息的逻辑
      },
      fail: (err) => {
        console.error('选择位置失败:', err);
      }
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 显示更多操作
  showMoreActions() {
    const actionList = ['查看资料', '消息通知', '清空聊天记录', '删除聊天'];
    
    wx.showActionSheet({
      itemList: actionList,
      success: (res) => {
        const index = res.tapIndex;
        switch (index) {
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
      fail: (res) => {
        console.log('用户取消操作');
      }
    });
  },

  // 查看资料
  viewProfile() {
    wx.showToast({
      title: '查看资料功能暂未实现',
      icon: 'none'
    });
  },

  // 切换消息通知
  toggleNotification() {
    wx.showToast({
      title: '通知设置功能暂未实现',
      icon: 'none'
    });
  },

  // 清空聊天记录
  clearChatHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确认要清空聊天记录吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          // 实现清空聊天记录的逻辑
          this.setData({
            messageList: []
          });
          wx.showToast({
            title: '已清空',
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
      content: '确认要删除该聊天吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          // 实现删除聊天的逻辑
          wx.showToast({
            title: '删除功能暂未实现',
            icon: 'none'
          });
        }
      }
    });
  },

  // 显示聊天话题
  showChatGuide() {
    this.setData({
      chatGuideVisible: true
    });
  },

  // 隐藏聊天话题
  hideChatGuide() {
    this.setData({
      chatGuideVisible: false
    });
  }
});