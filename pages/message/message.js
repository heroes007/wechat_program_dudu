import { formatTime } from '../../utils/util'
import IMManager from '../../utils/im'

Page({
  data: {
    messageList: [],
    totalUnread: 0
  },

  onLoad() {
    // 监听IM消息接收事件
    const app = getApp();
    app.globalEvent.on('im:messageReceived', this.onMessageReceived.bind(this));
    app.globalEvent.on('im:ready', this.getConversationList.bind(this));
    
    // 开启下拉刷新
    // wx.enablePullDownRefresh();  // 这不是有效的API，已在page.json中配置
  },

  onPullDownRefresh() {
    // 下拉刷新
    this.getConversationList().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onShow() {
    // 每次进入页面都刷新一次列表
    this.getConversationList();
  },

  onUnload() {
    // 取消监听
    const app = getApp();
    app.globalEvent.off('im:messageReceived', this.onMessageReceived.bind(this));
    app.globalEvent.off('im:ready', this.getConversationList.bind(this));
  },

  // 接收新消息时更新会话列表
  onMessageReceived(messageList) {
    // 收到新消息后刷新会话列表
    this.getConversationList();
  },

  // 获取会话列表
  async getConversationList() {
    try {
      // 判断IM是否就绪
      if (!IMManager.isReady) {
        console.log('IM SDK未就绪，等待就绪...');
        
        // 添加超时等待逻辑
        let waitTime = 0;
        const maxWaitTime = 10000; // 最大等待10秒
        const checkInterval = 500; // 每500ms检查一次
        
        return new Promise((resolve) => {
          const waitInterval = setInterval(() => {
            waitTime += checkInterval;
            
            if (IMManager.isReady) {
              clearInterval(waitInterval);
              console.log('IM SDK已就绪，开始获取会话列表');
              this.getConversationList().then(resolve);
            } else if (waitTime >= maxWaitTime) {
              clearInterval(waitInterval);
              console.error('等待IM SDK就绪超时');
              wx.showToast({
                title: '消息同步失败，请重试',
                icon: 'none'
              });
              resolve();
            }
          }, checkInterval);
        });
      }

      const { data: conversationList } = await IMManager.getConversationList();
      console.log('会话列表：', conversationList);

      // 转换会话数据为页面需要的格式
      const messageList = conversationList.map(item => {
        const conversationID = item.conversationID;
        const isPinned = item.isPinned;
        const unreadCount = item.unreadCount;
        const lastMessage = this.getLastMessageContent(item.lastMessage);
        const lastTime = item.lastMessage?.lastTime || 0;
        
        // 获取会话资料
        let avatarUrl = '/assets/images/default-avatar.png'; // 默认头像
        let nickName = '未知用户';
        
        if (item.type === 'C2C') {
          // 单聊
          avatarUrl = item.userProfile?.avatar || avatarUrl;
          nickName = item.userProfile?.nick || item.userProfile?.userID || nickName;
        } else if (item.type === 'GROUP') {
          // 群聊
          avatarUrl = item.groupProfile?.avatar || avatarUrl;
          nickName = item.groupProfile?.name || '群聊';
        }
        
        return {
          conversationID,
          isPinned,
          unreadCount,
          lastMessage,
          lastTime,
          avatarUrl,
          nickName,
          type: item.type
        };
      });
      
      // 根据置顶和时间排序
      messageList.sort((a, b) => {
        // 先比较是否置顶
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        // 再比较时间
        return b.lastTime - a.lastTime;
      });
      
      // 计算总未读数
      const totalUnread = messageList.reduce((sum, item) => sum + item.unreadCount, 0);
      
      this.setData({
        messageList,
        totalUnread
      });
      
      // 设置未读消息数
      if (totalUnread > 0) {
        wx.setTabBarBadge({
          index: 1, // 消息Tab的索引
          text: totalUnread.toString()
        });
      } else {
        wx.removeTabBarBadge({
          index: 1
        });
      }
    } catch (error) {
      console.error('获取会话列表失败', error);
    }
  },

  // 获取最后一条消息内容
  getLastMessageContent(lastMessage) {
    if (!lastMessage) return '暂无消息';
    
    const { type, payload } = lastMessage;
    
    switch(type) {
      case 'TIMTextElem':
        return payload.text || '文本消息';
      case 'TIMImageElem':
        return '[图片]';
      case 'TIMSoundElem':
        return '[语音]';
      case 'TIMVideoElem':
        return '[视频]';
      case 'TIMFileElem':
        return '[文件]';
      case 'TIMFaceElem':
        return '[表情]';
      case 'TIMLocationElem':
        return '[位置]';
      case 'TIMCustomElem':
        return '[自定义消息]';
      default:
        return '未知消息类型';
    }
  },

  // 打开聊天页面
  goToChat(e) {
    const { id } = e.currentTarget.dataset;
    
    // 设置会话已读
    IMManager.setMessageRead(id);
    
    // 刷新会话列表
    this.getConversationList();
    
    // 导航到聊天页面
    const conversation = this.data.messageList.find(item => item.conversationID === id);
    if (conversation) {
      wx.navigateTo({
        url: `/pages/chat/chat?id=${id}&type=${conversation.type}`
      });
    }
  },

  // 格式化时间
  formatTime(timestamp) {
    return formatTime(timestamp);
  },

  // 长按消息
  handleLongPress(e) {
    const { id } = e.currentTarget.dataset;
    const conversation = this.data.messageList.find(item => item.conversationID === id);
    
    const options = [];
    if (conversation?.unreadCount > 0) {
      options.push('标记为已读');
    }
    options.push(conversation?.isPinned ? '取消置顶' : '置顶聊天');
    options.push('删除');
    
    wx.showActionSheet({
      itemList: options,
      success: (res) => {
        // 因为选项数组是动态的，所以需要检查当前点击的是哪个选项
        const tapIndex = res.tapIndex;
        const selectedOption = options[tapIndex];
        
        if (selectedOption === '标记为已读') {
          this.markAsRead(id);
        } else if (selectedOption === '置顶聊天' || selectedOption === '取消置顶') {
          this.togglePin(id);
        } else if (selectedOption === '删除') {
          this.deleteConversation(id);
        }
      }
    });
  },

  // 标记为已读
  markAsRead(id) {
    IMManager.setMessageRead(id).then(() => {
      // 刷新会话列表
      this.getConversationList();
    }).catch(error => {
      console.error('设置已读失败', error);
      wx.showToast({
        title: '设置已读失败',
        icon: 'none'
      });
    });
  },

  // 置顶/取消置顶聊天
  togglePin(id) {
    const conversation = this.data.messageList.find(item => item.conversationID === id);
    if (!conversation) return;
    
    // 调用IM SDK的置顶/取消置顶API
    IMManager.chat.pinConversation({
      conversationID: id,
      isPinned: !conversation.isPinned
    }).then(() => {
      // 刷新会话列表
      this.getConversationList();
    }).catch(error => {
      console.error('设置置顶失败', error);
      wx.showToast({
        title: '设置置顶失败',
        icon: 'none'
      });
    });
  },

  // 删除会话
  deleteConversation(id) {
    wx.showModal({
      title: '删除会话',
      content: '确定要删除此会话吗？',
      success: (res) => {
        if (res.confirm) {
          // 调用IM SDK的删除会话API
          IMManager.chat.deleteConversation(id).then(() => {
            // 刷新会话列表
            this.getConversationList();
          }).catch(error => {
            console.error('删除会话失败', error);
            wx.showToast({
              title: '删除会话失败',
              icon: 'none'
            });
          });
        }
      }
    });
  }
}) 