import { UserApi } from '../../../api/apis'

Page({
  data: {
    step: 'phone', // 'phone' or 'verify'
    phone: '',
    code: '',
    canSubmit: false,
    codeSent: false,
    countdown: 60,
    verifyText: '获取验证码'
  },

  onLoad() {
    // 页面加载
  },

  // 处理手机号输入
  handlePhoneInput(e) {
    const phone = e.detail.value
    
    // 验证手机号格式 (11位数字)
    const isValidPhone = /^1\d{10}$/.test(phone)
    
    this.setData({
      phone,
      canSubmit: isValidPhone && this.data.step === 'phone' || 
                (this.data.step === 'verify' && this.data.code.length === 6)
    })
  },
  
  // 处理验证码输入
  handleCodeInput(e) {
    const code = e.detail.value
    
    this.setData({
      code,
      canSubmit: code.length === 6 && this.data.phone.length === 11
    })
  },
  
  // 发送验证码
  sendVerifyCode() {
    if (this.data.codeSent) return // 如果已经发送过，等待倒计时结束
    
    const { phone } = this.data
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      })
      return
    }
    
    // 显示loading
    wx.showLoading({
      title: '发送中'
    })
    
    // 模拟API请求发送验证码
    setTimeout(() => {
      wx.hideLoading()
      
      // 发送成功，开始倒计时
      this.setData({
        codeSent: true,
        verifyText: `${this.data.countdown}s`
      })
      
      this.startCountdown()
      
      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      })
    }, 1000)
  },
  
  // 开始倒计时
  startCountdown() {
    let countdown = this.data.countdown
    
    const timer = setInterval(() => {
      countdown--
      
      if (countdown > 0) {
        this.setData({
          verifyText: `${countdown}s`
        })
      } else {
        // 倒计时结束
        clearInterval(timer)
        this.setData({
          codeSent: false,
          verifyText: '重新获取',
          countdown: 60
        })
      }
    }, 1000)
  },
  
  // 表单提交
  handleSubmit() {
    if (!this.data.canSubmit) return
    
    if (this.data.step === 'phone') {
      // 进入验证码页面
      this.setData({
        step: 'verify',
        canSubmit: false // 重置提交按钮状态
      })
      
      // 自动发送验证码
      this.sendVerifyCode()
    } else {
      // 提交登录/注册
      wx.showLoading({
        title: '登录中'
      })

      UserApi.login({
        phonenumber: this.data.phone,
        validCode: this.data.code
      }).then(res => {
        wx.hideLoading()
        
        // 登录成功，保存token
        wx.setStorageSync('token', res.data.token)
        
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          success: () => {
            // 获取用户信息并设置全局状态
            const app = getApp()
            app.getUserInfo().then(userInfo => {
              console.log('userInfo', userInfo)

              // 延迟返回，确保toast能显示
              setTimeout(() => {
                if (!userInfo.avatar) {
                  wx.navigateTo({
                    url: '/pages/user-package/completeInfo/completeInfo'
                  })
                } else {
                  wx.switchTab({
                    url: '/pages/index/index'
                  })
                }
              }, 1500)
            })
          }
        })
      })
    }
  },
  
  // 跳转到用户协议
  goToAgreement() {
    wx.showToast({
      title: '用户协议（功能开发中）',
      icon: 'none'
    })
  },
  
  // 跳转到隐私政策
  goToPrivacy() {
    wx.showToast({
      title: '隐私政策（功能开发中）',
      icon: 'none'
    })
  }
}) 