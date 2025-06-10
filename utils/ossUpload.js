// 腾讯云OSS上传工具
export class OssUpload {
  constructor() {
    // 腾讯云OSS配置
    this.config = {
      region: 'YOUR_REGION', // 替换为您的地域
      bucket: 'YOUR_BUCKET', // 替换为您的存储桶名称
      uploadUrl: 'YOUR_UPLOAD_URL' // 替换为您的上传地址
    }
  }

  // 上传单个文件
  uploadFile(filePath, fileName) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: this.config.uploadUrl,
        filePath: filePath,
        name: 'file',
        formData: {
          'key': fileName,
          'bucket': this.config.bucket
        },
        header: {
          'Authorization': 'Bearer ' + wx.getStorageSync('token')
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data.code === 200) {
              resolve(data.data.url)
            } else {
              reject(new Error(data.message || '上传失败'))
            }
          } catch (e) {
            reject(new Error('响应数据解析失败'))
          }
        },
        fail: (error) => {
          reject(error)
        }
      })
    })
  }

  // 批量上传文件
  uploadFiles(filePaths) {
    const uploadPromises = filePaths.map((filePath, index) => {
      const fileName = `avatar_${Date.now()}_${index}.jpg`
      return this.uploadFile(filePath, fileName)
    })
    
    return Promise.all(uploadPromises)
  }

  // 生成文件名
  generateFileName(prefix = 'file') {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${prefix}_${timestamp}_${random}.jpg`
  }
}

export default new OssUpload() 