Page({
  data: {
    userInfo: {},
    genderOptions: [
      { value: 0, label: '未设置' },
      { value: 1, label: '男' },
      { value: 2, label: '女' }
    ],
    genderIndex: 0,
    ageArray: Array.from({length: 52}, (_, i) => i + 18), // 18-69岁
    ageIndex: 0,
    signatureCount: 0,
    allTags: [
      '旅行', '美食', '电影', '音乐', '摄影', '阅读', '健身', 
      '游戏', '篮球', '足球', '羽毛球', '跑步', '舞蹈', '绘画', 
      '宠物', '美妆', '时尚', '数码', '编程', '动漫', '收藏'
    ],
    selectedTags: []
  },

  onLoad() {
    // 获取用户信息
    const app = getApp()
    if (app.globalData.userInfo) {
      const userInfo = app.globalData.userInfo
      
      // 设置性别索引
      const genderIndex = this.data.genderOptions.findIndex(item => item.value === userInfo.gender)
      
      // 设置年龄索引
      const ageIndex = this.data.ageArray.indexOf(userInfo.age)
      
      // 设置已选标签
      const selectedTags = userInfo.tags || []
      
      // 计算签名字数
      const signatureCount = userInfo.signature ? userInfo.signature.length : 0
      
      this.setData({
        userInfo,
        genderIndex: genderIndex !== -1 ? genderIndex : 0,
        ageIndex: ageIndex !== -1 ? ageIndex : 0,
        selectedTags,
        signatureCount
      })
    }
  },
  
  // 选择头像
  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 获取临时路径
        const tempFilePath = res.tempFilePaths[0]
        
        // 更新头像
        this.setData({
          'userInfo.avatarUrl': tempFilePath
        })
        
        // 这里实际项目中应该上传头像到服务器，然后获取URL
        wx.showToast({
          title: '头像更新成功',
          icon: 'success'
        })
      }
    })
  },
  
  // 性别选择变化
  handleGenderChange(e) {
    const genderIndex = parseInt(e.detail.value)
    this.setData({
      genderIndex,
      'userInfo.gender': this.data.genderOptions[genderIndex].value
    })
  },
  
  // 年龄选择变化
  handleAgeChange(e) {
    const ageIndex = parseInt(e.detail.value)
    this.setData({
      ageIndex,
      'userInfo.age': this.data.ageArray[ageIndex]
    })
  },
  
  // 切换标签选择
  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag
    let selectedTags = [...this.data.selectedTags]
    
    const index = selectedTags.indexOf(tag)
    if (index !== -1) {
      // 已选中，取消选中
      selectedTags.splice(index, 1)
    } else {
      // 未选中，添加选中
      if (selectedTags.length < 5) {
        selectedTags.push(tag)
      } else {
        wx.showToast({
          title: '最多选择5个标签',
          icon: 'none'
        })
        return
      }
    }
    
    this.setData({
      selectedTags
    })
  },
  
  // 监听签名输入
  handleSignatureInput(e) {
    const value = e.detail.value
    this.setData({
      signatureCount: value.length
    })
  },
  
  // 提交表单
  handleSubmit(e) {
    const formData = e.detail.value
    
    // 组合用户信息
    const updatedUserInfo = {
      ...this.data.userInfo,
      nickName: formData.nickName,
      gender: this.data.genderOptions[this.data.genderIndex].value,
      age: this.data.ageArray[this.data.ageIndex],
      occupation: formData.occupation,
      school: formData.school,
      location: formData.location,
      signature: formData.signature,
      tags: this.data.selectedTags
    }
    
    // 更新全局用户信息
    const app = getApp()
    app.globalData.userInfo = updatedUserInfo
    
    // 这里实际项目中应该调用API保存用户信息
    
    wx.showToast({
      title: '保存成功',
      icon: 'success',
      success: () => {
        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    })
  }
}) 