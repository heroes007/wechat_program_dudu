# ChatGuide 聊天话题组件

## 功能说明

聊天话题组件是一个帮助用户生成聊天话题和回应的智能组件，集成了微信小程序的extend.AI能力。组件包含以下流程：

1. **Loading状态** - 初始化AI模型，显示加载动画
2. **偏好选择** - 用户选择聊天倾向（拉近关系/约出去玩）
3. **话题推荐** - 根据用户偏好生成个性化话题内容
4. **反应选择** - 用户选择对方可能的反应（接话/猜豫）
5. **回应推荐** - 根据对方反应提供相应的回应建议

## 使用方法

### 1. 在页面JSON中引入组件

```json
{
  "usingComponents": {
    "chat-guide": "../../components/chatGuide/chatGuide"
  }
}
```

### 2. 在页面WXML中使用组件

```xml
<chat-guide visible="{{chatGuideVisible}}" bind:close="hideChatGuide"></chat-guide>
```

### 3. 在页面JS中添加控制逻辑

```javascript
Page({
  data: {
    chatGuideVisible: false
  },
  
  // 显示聊天话题组件
  showChatGuide() {
    this.setData({
      chatGuideVisible: true
    })
  },
  
  // 隐藏聊天话题组件
  hideChatGuide() {
    this.setData({
      chatGuideVisible: false
    })
  }
})
```

## 组件属性

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| visible | Boolean | false | 控制组件显示/隐藏 |

## 组件事件

| 事件名 | 描述 | 回调参数 |
|--------|------|----------|
| close | 组件关闭时触发 | 无 |

## AI能力集成

组件使用微信小程序的extend.AI能力，需要在小程序中启用相关功能：

```javascript
// 在组件初始化时创建AI模型
const model = wx.cloud.extend.AI.createModel("deepseek");
```

## 流程说明

1. **初始化**: 组件显示时自动调用`initAIModel()`方法
2. **偏好选择**: 用户选择后自动生成对应话题内容
3. **话题生成**: 从预设话题库中随机选择，支持"换一个"功能
4. **反应判断**: 用户选择对方反应类型
5. **回应生成**: 根据反应类型生成相应的回应建议

## 样式定制

组件提供了完整的样式系统，支持以下定制：

- 主题色彩：`#6c63ff`
- 圆角设计：`32rpx`
- 动画效果：加载旋转、按钮点击反馈
- 响应式布局：适配不同屏幕尺寸

## 注意事项

1. 需要确保小程序已开通云开发功能
2. 需要在云开发控制台中启用AI能力
3. 组件使用了模态层设计，会覆盖整个屏幕
4. 支持点击遮罩层关闭组件 