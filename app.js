// app.js
App({
  globalData: {
    userInfo: null,
    isLogin: false
  },
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录状态检查
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.isLogin = true
      // 获取用户信息
      this.getUserInfo()
    }
  },

  // 获取用户信息
  getUserInfo() {
    // 这里可以接入实际的接口
    // 目前使用模拟数据
    this.globalData.userInfo = {
      nickName: '嘟嘟用户',
      avatarUrl: '/assets/images/default-avatar.png',
      gender: 1,
      age: 25,
      tags: ['旅行', '美食', '电影'],
      occupation: '工程师',
      school: '某某大学',
      location: '北京',
      signature: '这是一个示例签名'
    }
  }
}) 