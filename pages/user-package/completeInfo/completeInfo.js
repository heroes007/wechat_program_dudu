import { UserApi } from '../../../api/apis'

Page({
  data: {
    step: 1, // 当前步骤 1:昵称 2:性别 3:照片 4:地点 5:年龄
    totalStep: 5,
    
    // 昵称相关
    nickName: '', // 用户昵称
    
    // 性别相关
    gender: '', // 'male' or 'female'
    
    // 照片相关
    avatarList: [], // 上传的照片列表
    maxPhotos: 9, // 最大上传照片数量
    
    // 地点相关
    selectedLocation: '',
    locationList: ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '重庆', '西安', '武汉', '苏州', '天津'],
    
    // 年龄相关
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    yearList: [],
    monthList: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    dayList: []
  },

  onLoad() {
    this.initYearList()
    this.initDayList()
  },

  // 初始化年份列表
  initYearList() {
    const currentYear = new Date().getFullYear()
    const yearList = []
    for (let i = currentYear - 60; i <= currentYear - 18; i++) {
      yearList.push(i + '年')
    }
    this.setData({ yearList })
  },

  // 初始化日期列表
  initDayList() {
    const dayList = []
    for (let i = 1; i <= 31; i++) {
      dayList.push(i + '日')
    }
    this.setData({ dayList })
  },

  // 处理昵称输入
  handleNicknameInput(e) {
    const nickName = e.detail.value.trim()
    this.setData({ nickName })
  },

  // 选择性别
  selectGender(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({ gender })
  },

  // 选择照片
  chooseImage() {
    const { avatarList, maxPhotos } = this.data
    const remainingCount = maxPhotos - avatarList.length
    
    if (remainingCount <= 0) {
      wx.showToast({
        title: '最多只能上传9张照片',
        icon: 'none'
      })
      return
    }

    wx.chooseMedia({
      count: remainingCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        console.log('res', res)
        this.uploadImages(res.tempFiles)
      }
    })
  },

  uploadImages(tempFiles) {
    const that = this
    console.log('tempFiles', tempFiles)
    wx.showLoading({ title: '上传中...' })
    let completeSign = 0
    tempFiles.forEach(item => {
        wx.uploadFile({
            url: 'https://dududate.com/api/dudu/system/file/upload',
            filePath: item.tempFilePath,
            name: 'file',
            header: {
                'Authorization': wx.getStorageSync('token')
            },
            success(res) {
                const resData = JSON.parse(res.data)
                if (resData.code === 0 || resData.code === 200) {
                    const avatarList = that.data.avatarList
                    avatarList.push(resData.msg)
                    that.setData({ avatarList })
                    completeSign++
                    if (completeSign === tempFiles.length) {
                        wx.hideLoading()
                        wx.showToast({
                            title: '上传成功',
                            icon: 'success'
                        })
                    }
                } else {
                    wx.showToast({
                        title: resData.message || '上传失败',
                        icon: 'none'
                    })
                }
            },
            fail(err) {
                console.error('上传失败', err)
            }
        })
    })
  },

  // 删除照片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const avatarList = this.data.avatarList.filter((_, i) => i !== index)
    this.setData({ avatarList })
  },

  // 预览照片
  previewImage(e) {
    const index = e.currentTarget.dataset.index
    const { avatarList } = this.data
    
    wx.previewImage({
      current: avatarList[index],
      urls: avatarList
    })
  },

  // 选择地点
  selectLocation(e) {
    const location = e.currentTarget.dataset.location
    this.setData({ selectedLocation: location })
  },

  // 年份选择
  onYearChange(e) {
    const index = e.detail.value
    this.setData({
      birthYear: this.data.yearList[index]
    })
  },

  // 月份选择
  onMonthChange(e) {
    const index = e.detail.value
    this.setData({
      birthMonth: this.data.monthList[index]
    })
    // 更新日期列表（考虑不同月份的天数）
    this.updateDayList(index + 1)
  },

  // 日期选择
  onDayChange(e) {
    const index = e.detail.value
    this.setData({
      birthDay: this.data.dayList[index]
    })
  },

  // 更新日期列表
  updateDayList(month) {
    const year = parseInt(this.data.birthYear)
    let maxDay = 31
    
    if ([4, 6, 9, 11].includes(month)) {
      maxDay = 30
    } else if (month === 2) {
      maxDay = this.isLeapYear(year) ? 29 : 28
    }
    
    const dayList = []
    for (let i = 1; i <= maxDay; i++) {
      dayList.push(i + '日')
    }
    this.setData({ dayList })
  },

  // 判断是否为闰年
  isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
  },

  // 下一步
  nextStep() {
    const { step, gender, avatarList, selectedLocation, birthYear, birthMonth, birthDay } = this.data
    
    // 验证当前步骤的必填项
    if (step === 1 && !this.data.nickName) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }
    
    if (step === 2 && !gender) {
      wx.showToast({
        title: '请选择性别',
        icon: 'none'
      })
      return
    }
    
    if (step === 3 && avatarList.length === 0) {
      wx.showToast({
        title: '请至少上传一张照片',
        icon: 'none'
      })
      return
    }
    
    if (step === 4 && !selectedLocation) {
      wx.showToast({
        title: '请选择所在地',
        icon: 'none'
      })
      return
    }
    
    if (step === 5 && (!birthYear || !birthMonth || !birthDay)) {
      wx.showToast({
        title: '请选择出生日期',
        icon: 'none'
      })
      return
    }
    
    if (step < this.data.totalStep) {
      this.setData({
        step: step + 1
      })
    } else {
      // 最后一步，提交数据
      this.submitInfo()
    }
  },

  // 上一步
  prevStep() {
    if (this.data.step > 1) {
      this.setData({
        step: this.data.step - 1
      })
    } else {
      wx.navigateBack()
    }
  },

  // 提交信息
  submitInfo() {
    const { nickName, gender, avatarList, selectedLocation, birthYear, birthMonth, birthDay } = this.data
    
    wx.showLoading({ title: '提交中...' })
    
    const birthDate = `${birthYear.replace('年', '')}-${(this.data.monthList.indexOf(birthMonth) + 1).toString().padStart(2, '0')}-${birthDay.replace('日', '').padStart(2, '0')}`
    
    const profileData = {
      nickName: nickName,
      sex: gender === 'male' ? 0 : 1,
      avatars: avatarList,
      location: selectedLocation,
      birthDate: birthDate,
      avatar: avatarList[0] || 'https://dudu-1353584706.cos.ap-nanjing.myqcloud.com/liu.jpg'
    }
    
    UserApi.updateProfile(profileData)
      .then(res => {
        wx.hideLoading()
        wx.showToast({
          title: '信息完善成功',
          icon: 'success',
          success: () => {
            UserApi.getUserInfo().then(userInfo => {
              wx.setStorageSync('userInfo', userInfo)
            })
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/index/index'
              })
            }, 1500)
          }
        })
      })
      .catch(error => {
        wx.hideLoading()
        wx.showToast({
          title: '提交失败，请重试',
          icon: 'none'
        })
        console.error('提交信息失败:', error)
      })
  },

  // 跳过当前步骤
  skipStep() {
    if (this.data.step < this.data.totalStep) {
      this.setData({
        step: this.data.step + 1
      })
    } else {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  }
})
