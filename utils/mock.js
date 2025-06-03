import { getRandomAvatar } from './util'

// 模拟推荐用户数据
export const mockRecommendUsers = [
  {
    id: 'test1',
    nickName: '小红',
    avatarUrl: 'https://pic2.zhimg.com/80/v2-70438eebfd91ed041d6786a6745099af_720w.webp',
    gender: 2,
    age: 24,
    tags: ['阅读', '旅行', '摄影'],
    occupation: '设计师',
    school: '北京服装学院',
    location: '北京',
    signature: '喜欢一切美好的事物',
    photos: [
      'https://pic2.zhimg.com/80/v2-70438eebfd91ed041d6786a6745099af_720w.webp',
      'https://pic2.zhimg.com/80/v2-70438eebfd91ed041d6786a6745099af_720w.webp',
      'https://pic2.zhimg.com/80/v2-70438eebfd91ed041d6786a6745099af_720w.webp'
    ],
    distance: 3.5,
    isOnline: true
  },
  {
    id: 'test',
    nickName: '阳阳',
    avatarUrl: 'https://picx.zhimg.com/80/v2-876e3f02c7aefd95228340c42015ecf7_720w.webp',
    gender: 1,
    age: 27,
    tags: ['健身', '电影', '音乐'],
    occupation: '软件工程师',
    school: '清华大学',
    location: '北京',
    signature: '努力成为更好的自己',
    photos: [
      'https://picx.zhimg.com/80/v2-876e3f02c7aefd95228340c42015ecf7_720w.webp',
      'https://picx.zhimg.com/80/v2-876e3f02c7aefd95228340c42015ecf7_720w.webp'
    ],
    distance: 5.2,
    isOnline: false
  },
  {
    id: 'user3',
    nickName: '小雨',
    avatarUrl: 'https://picx.zhimg.com/80/v2-c04fc05b41f3ab024098878398b1b095_720w.webp',
    gender: 2,
    age: 23,
    tags: ['烹饪', '看剧', '旅行'],
    occupation: '教师',
    school: '北京师范大学',
    location: '北京',
    signature: '慢慢来，比较快',
    photos: [
      'https://picx.zhimg.com/80/v2-c04fc05b41f3ab024098878398b1b095_720w.webp',
      'https://picx.zhimg.com/80/v2-c04fc05b41f3ab024098878398b1b095_720w.webp',
      'https://picx.zhimg.com/80/v2-c04fc05b41f3ab024098878398b1b095_720w.webp'
    ],
    distance: 1.8,
    isOnline: true
  }
]

// 模拟消息列表数据
export const mockMessageList = [
  {
    conversationID: 'c1',
    userID: 'user1',
    nickName: '小红',
    avatarUrl: '/assets/images/avatar1.jpg',
    lastMessage: '你好，很高兴认识你！',
    unreadCount: 1,
    lastTime: Date.now() - 5 * 60 * 1000, // 5分钟前
    isPinned: true
  },
  {
    conversationID: 'c2',
    userID: 'user2',
    nickName: '阳阳',
    avatarUrl: '/assets/images/avatar2.jpg',
    lastMessage: '周末有空一起去看电影吗？',
    unreadCount: 0,
    lastTime: Date.now() - 3 * 60 * 60 * 1000, // 3小时前
    isPinned: false
  },
  {
    conversationID: 'c3',
    userID: 'user3',
    nickName: '小雨',
    avatarUrl: '/assets/images/avatar3.jpg',
    lastMessage: '刚做了一道新菜，很好吃！',
    unreadCount: 3,
    lastTime: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1天前
    isPinned: false
  },
  {
    conversationID: 'c4',
    userID: 'user4',
    nickName: '大壮',
    avatarUrl: '/assets/images/avatar4.jpg',
    lastMessage: '昨天的比赛太精彩了！',
    unreadCount: 0,
    lastTime: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2天前
    isPinned: false
  },
  {
    conversationID: 'c5',
    userID: 'user5',
    nickName: '小诺',
    avatarUrl: '/assets/images/avatar5.jpg',
    lastMessage: '这个周末有舞蹈表演，欢迎来看！',
    unreadCount: 0,
    lastTime: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5天前
    isPinned: false
  }
]

// 模拟聊天消息数据
export const mockChatMessages = (conversationID) => {
  const messages = []
  const now = Date.now()
  const hour = 60 * 60 * 1000
  
  // 根据会话ID生成不同的聊天记录
  if (conversationID === 'c1') {
    messages.push(
      {
        type: 'text',
        content: '你好，很高兴认识你！',
        time: now - 5 * 60 * 1000,
        sender: 'user1'
      },
      {
        type: 'text',
        content: '你好，我也很高兴认识你！',
        time: now - 4 * 60 * 1000,
        sender: 'self'
      },
      {
        type: 'text',
        content: '我看了你的照片，你好像很喜欢旅行？',
        time: now - 3 * 60 * 1000,
        sender: 'user1'
      },
      {
        type: 'text',
        content: '是的，我很喜欢旅行，特别是自由行',
        time: now - 2 * 60 * 1000,
        sender: 'self'
      },
      {
        type: 'text',
        content: '太巧了，我也喜欢自由行！我们可以交流一下旅行经验',
        time: now - 1 * 60 * 1000,
        sender: 'user1'
      }
    )
  } else if (conversationID === 'c2') {
    messages.push(
      {
        type: 'text',
        content: '嗨，最近怎么样？',
        time: now - 4 * hour,
        sender: 'self'
      },
      {
        type: 'text',
        content: '挺好的，你呢？',
        time: now - 3.9 * hour,
        sender: 'user2'
      },
      {
        type: 'text',
        content: '我也不错',
        time: now - 3.8 * hour,
        sender: 'self'
      },
      {
        type: 'text',
        content: '周末有空一起去看电影吗？',
        time: now - 3 * hour,
        sender: 'user2'
      }
    )
  } else {
    // 默认消息
    messages.push(
      {
        type: 'text',
        content: '你好！',
        time: now - 2 * hour,
        sender: 'self'
      },
      {
        type: 'text',
        content: '你好，很高兴认识你！',
        time: now - 1.9 * hour,
        sender: conversationID.replace('c', 'user')
      }
    )
  }
  
  return messages
} 