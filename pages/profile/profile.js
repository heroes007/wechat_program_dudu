Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    isLogin: false,
    stats: {
      likeMe: 26,
      liked: 18,
      visitors: 105
    }
  },

  onLoad() {
    // 检查登录状态
    const app = getApp()
    const isLogin = app.globalData.isLogin
    
    if (isLogin) {
      this.setData({
        isLogin: true,
        hasUserInfo: true,
        userInfo: app.globalData.userInfo
      })
    }
  },
  
  onShow() {
    // 每次进入页面都检查一次登录状态
    const app = getApp()
    const isLogin = app.globalData.isLogin
    
    if (isLogin) {
      this.setData({
        isLogin: true,
        hasUserInfo: true,
        userInfo: app.globalData.userInfo
      })
    }
  },

  // 登录
  handleLogin() {
    // 这里应该跳转到登录页面
    wx.navigateTo({
      url: '/pages/register/register'
    })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录状态
          const app = getApp()
          app.globalData.isLogin = false
          app.globalData.userInfo = null
          
          // 清除存储的token
          wx.removeStorageSync('token')
          
          // 更新页面状态
          this.setData({
            isLogin: false,
            hasUserInfo: false,
            userInfo: null
          })
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  },

  // 编辑资料
  goToEditProfile() {
    wx.navigateTo({
      url: '/pages/editProfile/editProfile'
    })
  },

  // 查看喜欢我的人
  goToLikeMe() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 查看我喜欢的人
  goToLiked() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 查看访客记录
  goToVisitors() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 设置
  goToSettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },
  
  // 关于我们
  goToAbout() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }
}) 