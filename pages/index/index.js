import { mockRecommendUsers } from '../../utils/mock'
import { formatAge, formatDistance } from '../../utils/util'

Page({
  data: {
    recommendUsers: [],
    currentIndex: 0,
    swiperHeight: 0,
    liveUsers: 156, // 模拟在线直播人数
    windowHeight: 0,
    windowWidth: 0,
    isSwiping: false,
    animation: {},
    swipeDirection: '', // 'left', 'right', or ''
  },

  onLoad() {
    // 获取设备信息
    const { windowHeight, windowWidth } = wx.getSystemInfoSync()
    this.setData({
      windowHeight,
      windowWidth,
      recommendUsers: mockRecommendUsers,
      swiperHeight: windowHeight * 1
    })
    
    // 创建动画实例
    this.animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease',
    })
  },

  // 滑动开始
  touchStart(e) {
    this.startX = e.touches[0].clientX
    this.startY = e.touches[0].clientY
  },

  // 滑动过程
  touchMove(e) {
    if (this.data.isSwiping) return
    
    const moveX = e.touches[0].clientX
    const moveY = e.touches[0].clientY
    
    // 计算X和Y方向的位移
    const deltaX = moveX - this.startX
    const deltaY = moveY - this.startY
    
    // 只处理水平方向的滑动
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
      // 设置滑动方向
      const direction = deltaX > 0 ? 'right' : 'left'
      
      // 设置卡片的平移
      this.animation.translateX(deltaX).step()
      
      this.setData({
        animation: this.animation.export(),
        swipeDirection: direction
      })
    }
  },

  // 滑动结束
  touchEnd(e) {
    if (this.data.isSwiping) return
    
    const endX = e.changedTouches[0].clientX
    const deltaX = endX - this.startX
    
    // 判断滑动方向和距离是否足够触发操作
    if (Math.abs(deltaX) > 100) {
      this.setData({ isSwiping: true })
      
      const direction = deltaX > 0 ? 'right' : 'left'
      this.handleSwipe(direction)
    } else {
      // 复位动画
      this.animation.translateX(0).step()
      this.setData({
        animation: this.animation.export(),
        swipeDirection: ''
      })
    }
  },

  // 处理滑动
  handleSwipe(direction) {
    const width = this.data.windowWidth
    const offsetX = direction === 'right' ? width : -width
    
    // 完成滑动动画
    this.animation.translateX(offsetX).step()
    this.setData({
      animation: this.animation.export()
    })
    
    // 延时后切换到下一个用户并重置位置
    setTimeout(() => {
      let { currentIndex, recommendUsers } = this.data
      currentIndex = (currentIndex + 1) % recommendUsers.length
      
      // 重置动画
      this.animation.translateX(0).step({ duration: 0 })
      
      this.setData({
        currentIndex,
        animation: this.animation.export(),
        isSwiping: false,
        swipeDirection: ''
      })
    }, 300)
  },

  // 点击喜欢按钮
  handleLike() {
    this.handleSwipe('right')
  },

  // 点击跳过按钮
  handleSkip() {
    this.handleSwipe('left')
  },
  
  // 格式化用户资料
  formatUserProfile(user) {
    const parts = []
    
    // 添加职业
    if (user.occupation) {
      parts.push(user.occupation)
    }
    
    // 添加学校
    if (user.school) {
      parts.push(user.school)
    }
    
    return parts.join(' · ')
  },
  
  // 格式化用户年龄和性别
  formatUserAge(user) {
    console.log('use1-------------------------', user)
    return formatAge(user.age, user.gender)
  },
  
  // 格式化距离
  formatDistance(distance) {
    return formatDistance(distance)
  },
  
  // 跳转到用户详情
  goToUserDetail() {
    const { currentIndex, recommendUsers } = this.data
    const userId = recommendUsers[currentIndex].id
    wx.navigateTo({
      url: `/pages/userDetail/userDetail?id=${userId}`
    })
  }
}) 