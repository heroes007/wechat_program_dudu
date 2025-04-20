import { mockMessageList, mockChatMessages } from '../../utils/mock'
import { formatTime } from '../../utils/util'

Page({
  data: {
    conversationID: '',
    userInfo: null,
    messages: [],
    inputValue: '',
    scrollIntoView: '',
    isLoading: true
  },

  onLoad(options) {
    const conversationID = options.id
    
    // 设置导航栏标题
    const conversation = mockMessageList.find(item => item.conversationID === conversationID)
    if (conversation) {
      wx.setNavigationBarTitle({
        title: conversation.nickName
      })
      
      // 获取用户信息
      this.setData({
        conversationID,
        userInfo: {
          nickName: conversation.nickName,
          avatarUrl: conversation.avatarUrl,
          gender: 0, // 模拟数据中不包含性别，这里给默认值
          age: 0,
          tags: [],
          occupation: '',
          school: '',
          location: '',
          signature: ''
        }
      })
      
      // 获取聊天消息
      this.loadMessages()
    } else {
      wx.showToast({
        title: '会话不存在',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },
  
  onReady() {
    // 设置键盘高度
    this.adjustKeyboardHeight()
  },

  // 加载消息
  loadMessages() {
    // 这里使用模拟数据，实际项目中应该使用IM SDK
    const messages = mockChatMessages(this.data.conversationID)
    
    this.setData({
      messages,
      isLoading: false
    }, () => {
      // 滚动到最新消息
      this.scrollToBottom()
    })
  },
  
  // 调整键盘高度
  adjustKeyboardHeight() {
    wx.onKeyboardHeightChange(res => {
      const { height } = res
      // 键盘高度变化时，可以调整页面布局
      if (height > 0) {
        // 键盘弹起
        this.scrollToBottom()
      }
    })
  },
  
  // 输入框变化
  handleInputChange(e) {
    this.setData({
      inputValue: e.detail.value
    })
  },
  
  // 发送消息
  sendMessage() {
    const { inputValue, messages, conversationID } = this.data
    
    if (!inputValue.trim()) return
    
    // 构建新消息
    const newMessage = {
      type: 'text',
      content: inputValue,
      time: Date.now(),
      sender: 'self'
    }
    
    // 更新消息列表
    const updatedMessages = [...messages, newMessage]
    
    this.setData({
      messages: updatedMessages,
      inputValue: ''
    }, () => {
      // 滚动到底部
      this.scrollToBottom()
      
      // 这里可以调用IM SDK发送消息
      console.log('发送消息:', newMessage)
      
      // 模拟对方回复
      this.simulateReply()
    })
  },
  
  // 模拟对方回复
  simulateReply() {
    const { messages, conversationID } = this.data
    
    // 随机回复内容
    const replies = [
      '好的，没问题',
      '嗯嗯，我知道了',
      '哈哈，有意思',
      '什么时候有空出来玩？',
      '我正好有空，我们聊聊吧'
    ]
    
    const randomReply = replies[Math.floor(Math.random() * replies.length)]
    
    // 2秒后回复
    setTimeout(() => {
      // 构建新消息
      const replyMessage = {
        type: 'text',
        content: randomReply,
        time: Date.now(),
        sender: conversationID.replace('c', 'user')
      }
      
      // 更新消息列表
      const updatedMessages = [...this.data.messages, replyMessage]
      
      this.setData({
        messages: updatedMessages
      }, () => {
        // 滚动到底部
        this.scrollToBottom()
      })
    }, 2000)
  },
  
  // 滚动到底部
  scrollToBottom() {
    const { messages } = this.data
    if (messages.length === 0) return
    
    const lastMessageId = `msg-${messages.length - 1}`
    this.setData({
      scrollIntoView: lastMessageId
    })
  },
  
  // 点击发送图片
  sendImage() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        
        // 构建新消息
        const newMessage = {
          type: 'image',
          content: tempFilePath,
          time: Date.now(),
          sender: 'self'
        }
        
        // 更新消息列表
        const updatedMessages = [...this.data.messages, newMessage]
        
        this.setData({
          messages: updatedMessages
        }, () => {
          // 滚动到底部
          this.scrollToBottom()
          
          // 这里可以调用IM SDK发送图片消息
          console.log('发送图片:', newMessage)
        })
      }
    })
  },
  
  // 点击发送语音
  handleVoiceStart() {
    // 这里需要使用录音API
    wx.showToast({
      title: '语音功能开发中',
      icon: 'none'
    })
  },
  
  // 格式化时间
  formatTime(timestamp) {
    return formatTime(timestamp)
  },
  
  // 查看用户信息
  viewUserProfile() {
    const { conversationID } = this.data
    const userId = conversationID.replace('c', 'user')
    
    wx.navigateTo({
      url: `/pages/userDetail/userDetail?id=${userId}`
    })
  }
}) 