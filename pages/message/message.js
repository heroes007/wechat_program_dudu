import { mockMessageList } from '../../utils/mock'
import { formatTime } from '../../utils/util'

Page({
  data: {
    messageList: [],
    totalUnread: 0
  },

  onLoad() {
    this.setMessageList()
  },

  onShow() {
    // 每次进入页面都刷新一次列表
    this.setMessageList()
  },

  setMessageList() {
    // 获取消息列表
    const messageList = [...mockMessageList]
    
    // 根据置顶和时间排序
    messageList.sort((a, b) => {
      // 先比较是否置顶
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      
      // 再比较时间
      return b.lastTime - a.lastTime
    })
    
    // 计算总未读数
    const totalUnread = messageList.reduce((sum, item) => sum + item.unreadCount, 0)
    
    this.setData({
      messageList,
      totalUnread
    })
    
    // 设置未读消息数
    if (totalUnread > 0) {
      wx.setTabBarBadge({
        index: 1, // 消息Tab的索引
        text: totalUnread.toString()
      })
    } else {
      wx.removeTabBarBadge({
        index: 1
      })
    }
  },

  // 打开聊天页面
  goToChat(e) {
    const { id } = e.currentTarget.dataset
    
    // 更新消息未读状态
    const { messageList } = this.data
    const updatedMessageList = messageList.map(item => {
      if (item.conversationID === id) {
        return { ...item, unreadCount: 0 }
      }
      return item
    })
    
    this.setData({
      messageList: updatedMessageList
    })
    
    // 重新计算总未读数
    const totalUnread = updatedMessageList.reduce((sum, item) => sum + item.unreadCount, 0)
    
    this.setData({
      totalUnread
    })
    
    // 更新TabBar角标
    if (totalUnread > 0) {
      wx.setTabBarBadge({
        index: 1,
        text: totalUnread.toString()
      })
    } else {
      wx.removeTabBarBadge({
        index: 1
      })
    }
    
    // 导航到聊天页面
    wx.navigateTo({
      url: `/pages/chat/chat?id=${id}`
    })
  },

  // 格式化时间
  formatTime(timestamp) {
    return formatTime(timestamp)
  },

  // 长按消息
  handleLongPress(e) {
    const { id } = e.currentTarget.dataset
    
    wx.showActionSheet({
      itemList: ['标记为已读', '置顶聊天', '删除'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.markAsRead(id)
            break
          case 1:
            this.togglePin(id)
            break
          case 2:
            this.deleteConversation(id)
            break
        }
      }
    })
  },

  // 标记为已读
  markAsRead(id) {
    const { messageList } = this.data
    const updatedMessageList = messageList.map(item => {
      if (item.conversationID === id) {
        return { ...item, unreadCount: 0 }
      }
      return item
    })
    
    this.setData({
      messageList: updatedMessageList
    })
    
    // 重新计算总未读数
    const totalUnread = updatedMessageList.reduce((sum, item) => sum + item.unreadCount, 0)
    
    this.setData({
      totalUnread
    })
    
    // 更新TabBar角标
    if (totalUnread > 0) {
      wx.setTabBarBadge({
        index: 1,
        text: totalUnread.toString()
      })
    } else {
      wx.removeTabBarBadge({
        index: 1
      })
    }
  },

  // 置顶/取消置顶聊天
  togglePin(id) {
    const { messageList } = this.data
    const updatedMessageList = messageList.map(item => {
      if (item.conversationID === id) {
        return { ...item, isPinned: !item.isPinned }
      }
      return item
    })
    
    // 根据置顶和时间排序
    updatedMessageList.sort((a, b) => {
      // 先比较是否置顶
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      
      // 再比较时间
      return b.lastTime - a.lastTime
    })
    
    this.setData({
      messageList: updatedMessageList
    })
  },

  // 删除会话
  deleteConversation(id) {
    wx.showModal({
      title: '删除会话',
      content: '确定要删除此会话吗？',
      success: (res) => {
        if (res.confirm) {
          const { messageList } = this.data
          const updatedMessageList = messageList.filter(item => item.conversationID !== id)
          
          // 重新计算总未读数
          const totalUnread = updatedMessageList.reduce((sum, item) => sum + item.unreadCount, 0)
          
          this.setData({
            messageList: updatedMessageList,
            totalUnread
          })
          
          // 更新TabBar角标
          if (totalUnread > 0) {
            wx.setTabBarBadge({
              index: 1,
              text: totalUnread.toString()
            })
          } else {
            wx.removeTabBarBadge({
              index: 1
            })
          }
        }
      }
    })
  }
}) 