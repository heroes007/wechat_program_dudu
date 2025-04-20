import { mockRecommendUsers } from '../../utils/mock'
import { formatAge, formatDistance } from '../../utils/util'

Page({
  data: {
    userId: '',
    userInfo: null,
    ageGenderText: '',
    profileText: '',
    distanceText: ''
  },

  onLoad(options) {
    const userId = options.id
    this.setData({ userId })
    
    // 获取用户数据
    this.getUserInfo(userId)
  },
  
  // 获取用户信息
  getUserInfo(userId) {
    // 从模拟数据中获取用户信息
    const userInfo = mockRecommendUsers.find(user => user.id === userId)
    
    if (userInfo) {
      // 格式化年龄性别文字
      const ageGenderText = formatAge(userInfo.age, userInfo.gender)
      
      // 格式化个人资料文字
      const profileParts = []
      if (userInfo.occupation) {
        profileParts.push(userInfo.occupation)
      }
      if (userInfo.school) {
        profileParts.push(userInfo.school)
      }
      const profileText = profileParts.join(' · ')
      
      // 格式化距离文字
      const distanceText = userInfo.distance ? 
        `距离 ${formatDistance(userInfo.distance)}` : 
        userInfo.location
      
      this.setData({
        userInfo,
        ageGenderText,
        profileText,
        distanceText
      })
    } else {
      wx.showToast({
        title: '用户不存在',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },
  
  // 跳过此用户
  handleSkip() {
    wx.navigateBack()
  },
  
  // 喜欢此用户
  handleLike() {
    // 这里可以添加喜欢的逻辑
    wx.showToast({
      title: '已喜欢',
      icon: 'success'
    })
    
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },
  
  // 聊天
  handleChat() {
    const { userInfo } = this.data
    
    // 创建会话ID
    const conversationID = `c${userInfo.id.replace('user', '')}`
    
    // 跳转到聊天页面
    wx.navigateTo({
      url: `/pages/chat/chat?id=${conversationID}`
    })
  }
}) 