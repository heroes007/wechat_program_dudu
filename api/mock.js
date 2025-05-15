// API模拟数据服务
import { UserApi, ContentApi, MessageApi, ConfigApi } from './apis';

// 模拟数据开关
const ENABLE_MOCK = true;

// 延迟响应（模拟网络延迟）
const delay = (time = 500) => {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
};

// 模拟成功响应
const mockSuccess = async (data, time = 500) => {
  await delay(time);
  return {
    code: 0,
    data,
    message: '成功'
  };
};

// 模拟失败响应
const mockError = async (message, code = 500, time = 500) => {
  await delay(time);
  return {
    code,
    data: null,
    message
  };
};

// 用户模块模拟数据
const mockUserApi = () => {
  // 模拟用户数据
  const mockUserData = {
    id: '10001',
    nickname: '嘟嘟用户',
    avatar: '/assets/images/default-avatar.png',
    gender: 1,
    age: 25,
    phone: '138****8888',
    tags: ['旅行', '美食', '电影'],
    occupation: '工程师',
    school: '某某大学',
    location: '北京市',
    signature: '这是一个示例签名'
  };

  // 覆盖原始方法
  UserApi.login = async (data) => {
    await delay(800);
    if (data.phone === '13800000000' && data.password === '123456') {
      return mockSuccess({
        token: 'mock_token_12345',
        userInfo: mockUserData
      });
    } else {
      return mockError('手机号或密码错误', 401);
    }
  };

  UserApi.getUserInfo = async () => {
    return mockSuccess(mockUserData);
  };
};

// 内容模块模拟数据
const mockContentApi = () => {
  // 模拟内容列表数据
  const generateMockContentList = (count = 10) => {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        id: `content_${i + 1}`,
        userId: `user_${i % 5 + 1}`,
        nickname: `嘟嘟用户${i % 5 + 1}`,
        avatar: `/assets/images/avatar${i % 5 + 1}.jpg`,
        content: `这是第${i + 1}条模拟内容，用于测试展示效果。`,
        images: i % 3 === 0 ? ['/assets/images/demo1.jpg', '/assets/images/demo2.jpg'] : [],
        location: i % 2 === 0 ? '北京市海淀区' : '上海市浦东新区',
        createTime: Date.now() - i * 3600000,
        likeCount: Math.floor(Math.random() * 100),
        commentCount: Math.floor(Math.random() * 50),
        isLiked: i % 3 === 0
      });
    }
    return list;
  };

  // 覆盖原始方法
  ContentApi.getList = async (params) => {
    const { page = 1, pageSize = 10 } = params || {};
    const mockList = generateMockContentList(pageSize);
    return mockSuccess({
      list: mockList,
      total: 100,
      hasMore: page < 10
    });
  };

  ContentApi.getDetail = async (id) => {
    const mockDetail = {
      id,
      userId: 'user_1',
      nickname: '嘟嘟用户1',
      avatar: '/assets/images/avatar1.jpg',
      content: `这是ID为${id}的内容详情，用于测试展示效果。`,
      images: ['/assets/images/demo1.jpg', '/assets/images/demo2.jpg'],
      location: '北京市海淀区',
      createTime: Date.now() - 3600000,
      likeCount: 88,
      commentCount: 36,
      isLiked: true
    };
    return mockSuccess(mockDetail);
  };
};

// 消息模块模拟数据
const mockMessageApi = () => {
  // 模拟消息列表数据
  const generateMockMessageList = (count = 10) => {
    const types = ['like', 'comment', 'follow', 'system'];
    const list = [];
    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      list.push({
        id: `msg_${i + 1}`,
        type,
        title: type === 'system' ? '系统通知' : `用户${i % 5 + 1}`,
        content: type === 'like' ? '赞了你的内容' : 
                 type === 'comment' ? '评论了你的内容' : 
                 type === 'follow' ? '关注了你' : '系统消息，请查看',
        targetId: type !== 'system' ? `content_${i + 1}` : '',
        avatar: type !== 'system' ? `/assets/images/avatar${i % 5 + 1}.jpg` : '/assets/images/system-avatar.png',
        createTime: Date.now() - i * 3600000,
        isRead: i % 3 !== 0
      });
    }
    return list;
  };

  // 覆盖原始方法
  MessageApi.getList = async (params) => {
    const { page = 1, pageSize = 10 } = params || {};
    const mockList = generateMockMessageList(pageSize);
    return mockSuccess({
      list: mockList,
      total: 30,
      hasMore: page < 3
    });
  };

  MessageApi.getUnreadCount = async () => {
    return mockSuccess({ count: 5 });
  };
};

// 初始化模拟数据
export const initMock = () => {
  if (!ENABLE_MOCK) return;
  
  console.log('启用API模拟数据服务');
  mockUserApi();
  mockContentApi();
  mockMessageApi();
};

export default {
  initMock,
  mockSuccess,
  mockError
}; 