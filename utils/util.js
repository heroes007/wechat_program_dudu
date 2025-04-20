// 格式化时间
export const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 一分钟内
  if (diff < 60 * 1000) {
    return '刚刚'
  }
  
  // 一小时内
  if (diff < 60 * 60 * 1000) {
    return Math.floor(diff / (60 * 1000)) + '分钟前'
  }
  
  // 一天内
  if (diff < 24 * 60 * 60 * 1000) {
    return Math.floor(diff / (60 * 60 * 1000)) + '小时前'
  }
  
  // 日期是今年的
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  if (year === now.getFullYear()) {
    return `${month}月${day}日`
  }
  
  return `${year}/${month}/${day}`
}

// 构建随机头像URL
export const getRandomAvatar = (userId) => {
  const index = Math.abs(hashCode(userId)) % 10 + 1
  return `/assets/images/avatar${index}.jpg`
}

// 简单的hash函数
export const hashCode = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}

// 获取用户年龄描述
export const formatAge = (age, gender) => {
  const genderText = gender === 1 ? '男' : gender === 2 ? '女' : ''
  return `${age}岁 · ${genderText}`
}

// 距离格式化
export const formatDistance = (distance) => {
  if (!distance) return ''
  
  if (distance < 1) {
    return '小于1km'
  }
  
  if (distance < 10) {
    return `${distance.toFixed(1)}km`
  }
  
  return `${Math.floor(distance)}km`
}

// 请求封装
export const request = (options) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'content-type': 'application/json',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(res)
        }
      },
      fail: reject
    })
  })
}

// 获取系统信息
export const getSystemInfo = () => {
  return wx.getSystemInfoSync()
} 