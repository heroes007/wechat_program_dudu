import { UserApi } from '../../../api/apis'

Page({
  data: {
    step: 5, // 当前步骤 1:昵称 2:性别 3:照片 4:地点 5:年龄
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
    regionArray: ['请选择', '请选择', '请选择'], // 省市区数组
    
    // 年龄相关
    selectedDate: '',
    selectedBirthDisplay: '',
    
    // 按钮状态
    isNextButtonDisabled: true
  },

  onLoad() {
    this.checkNextButtonStatus()
  },

  // 检查下一步按钮状态
  checkNextButtonStatus() {
    const { step, nickName, gender, avatarList, regionArray, selectedDate } = this.data
    let isDisabled = true

    switch (step) {
      case 1:
        // 昵称步骤：昵称不为空且长度在1-20之间
        isDisabled = !nickName || nickName.trim().length === 0 || nickName.trim().length > 20
        break
      case 2:
        // 性别步骤：必须选择性别
        isDisabled = !gender
        break
      case 3:
        // 照片步骤：至少上传一张照片
        isDisabled = avatarList.length === 0
        break
      case 4:
        // 地点步骤：必须选择省份和城市
        isDisabled = regionArray[0] === '请选择' || regionArray[1] === '请选择'
        break
      case 5:
        // 生日步骤：必须选择生日
        isDisabled = !selectedDate
        break
    }

    this.setData({ isNextButtonDisabled: isDisabled })
  },

  // 处理昵称输入
  handleNicknameInput(e) {
    const nickName = e.detail.value.trim()
    this.setData({ nickName }, () => {
      this.checkNextButtonStatus()
    })
  },

  // 选择性别
  selectGender(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({ gender }, () => {
      this.checkNextButtonStatus()
    })
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
                    that.setData({ avatarList }, () => {
                      that.checkNextButtonStatus()
                    })
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
    this.setData({ avatarList }, () => {
      this.checkNextButtonStatus()
    })
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

  // 地区选择器变化
  onRegionChange(e) {
    const regionArray = e.detail.value
    const selectedLocation = regionArray.join(' ')
    
    // 添加选择反馈
    wx.vibrateShort({
      type: 'light'
    })
    
    this.setData({
      regionArray,
      selectedLocation
    }, () => {
      this.checkNextButtonStatus()
    })
  },

  // 日期选择器变化
  onDateChange(e) {
    const selectedDate = e.detail.value
    const date = new Date(selectedDate)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    
    const selectedBirthDisplay = `${year}年${month}月${day}日`
    
    // 添加选择反馈
    wx.vibrateShort({
      type: 'light'
    })
    
    this.setData({
      selectedDate,
      selectedBirthDisplay
    }, () => {
      this.checkNextButtonStatus()
    })
  },



  // 下一步
  nextStep() {
    // 如果按钮被禁用，直接返回
    if (this.data.isNextButtonDisabled) {
      return
    }

    const { step, gender, avatarList, regionArray, selectedDate } = this.data
    
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
    
    if (step === 4 && (regionArray[0] === '请选择' || regionArray[1] === '请选择')) {
      wx.showToast({
        title: '请选择所在地',
        icon: 'none'
      })
      return
    }
    
    if (step === 5 && !selectedDate) {
      wx.showToast({
        title: '请选择出生日期',
        icon: 'none'
      })
      return
    }
    
    if (step < this.data.totalStep) {
      this.setData({
        step: step + 1
      }, () => {
        this.checkNextButtonStatus()
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
    const { nickName, gender, avatarList, selectedLocation, selectedDate } = this.data
    
    wx.showLoading({ title: '提交中...' })
    
    const birthDate = selectedDate
    
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
