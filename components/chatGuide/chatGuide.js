Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    }
  },

  data: {
    step: 'loading', // loading, preference, topic, reaction, response
    loading: true,
    preferences: [
      { id: 'close', text: '拉近关系' },
      { id: 'date', text: '约出去玩' }
    ],
    selectedPreference: '',
    topicContent: '',
    reactions: [
      { id: 'follow', text: '接话' },
      { id: 'hesitate', text: '猜豫' }
    ],
    selectedReaction: '',
    responseContent: '',
    currentReactionIndex: 0,
    // 话题内容库
    topicLibrary: {
      'close': [
        '看了你的朋友圈，感觉你是一个很有趣的人～ 那张在咖啡厅的照片特别有意思，那是你经常去的地方吗？',
        '你的头像很有个性！看起来你应该是个很有想法的人，平时都喜欢做些什么呢？',
        '感觉我们有很多共同爱好呢～ 你也喜欢看电影吗？最近有什么推荐的吗？'
      ],
      'date': [
        '网上看到你想要深深地动心，三生三世何惧艰难呢(๑) 我上个月跟朋友去踢毽子，它整个下午都很开心... (发这三张校园的朋友圈) 要不要一起认识很浪漫呢？',
        '这个周末天气不错，想去公园走走吗？听说那里的樱花开得正好～',
        '最近发现了一家很棒的餐厅，环境很不错，有时间一起去试试吗？'
      ]
    },
    // 回应内容库
    responseLibrary: {
      'follow': [
        '真的很开心你们上次文艺演出很精彩，正巧我有朋友送了两张《音乐剧》的票... (点击这里是音乐你喜欢吗) 雪花，观察后全城生机盎然，很建议一起去看～',
        '哈哈，看来我们很聊得来呢！要不要加个微信，这样聊天更方便～',
        '太好了！那我们约个时间吧，我对那个地方也很好奇呢～'
      ],
      'hesitate': [
        '没关系的，我也不是什么坏人啦～ 如果你担心的话，我们可以先在人多的地方见面，比如商场或者咖啡厅？',
        '理解你的顾虑～ 要不我们先视频聊聊？这样你会更放心一些吧',
        '不用有压力哦～ 我们可以先做朋友，慢慢了解。你觉得呢？'
      ]
    }
  },

  lifetimes: {
    attached() {
      if (this.data.visible) {
        this.initAIModel();
      }
    }
  },

  observers: {
    'visible': function(visible) {
      if (visible && this.data.step === 'loading') {
        this.initAIModel();
      }
    }
  },

  methods: {
    // 初始化AI模型
    async initAIModel() {
      try {
        this.setData({ loading: true, step: 'loading' });
        
        const model = wx.cloud.extend.AI.createModel("deepseek");

        const chatRecord = {
          messages: [
            { role: 'user', content: '你好，我是小明，很高兴认识你。' },
            { role: 'assistant', content: '你好，我是小红，很高兴认识你。' }
          ]
        };

        const otherInfo = {
          personality: '这位猫系女孩需要"星空下的向日葵"式爱情——既有温暖稳定的根基，又不失浪漫想象。相处时要像鉴赏艺术品般细致（留意她照片构图偏好的对称美学），用共同兴趣搭建情感脚手架，重要决策遵循"30秒法则"（给她留足反应时间）。需规避目的性过强的追求，转而通过持续性价值展示（端游战绩/旅游攻略专业度）赢得青睐。记住她雨夜凝望摩天轮的背影密码：真正打动她的不是999朵玫瑰，而是能看懂玻璃上那滴水珠折射出的彩虹的人。',
          myPersonality: '该男士是典型优质务实派，兼具设计师的浪漫情怀与管理者的理性思维。相处需平衡生活情趣与未来规划，保持独立人格的同时展现温柔体贴。重点把握：支持其事业追求但不过度打扰，共同经营精致生活仪式感，以平和沟通建立信任，逐步渗透家庭价值观念。避免物质化标签和情绪化表达，用持续自我成长匹配他「当下有动力，未来有奔头」的情感期待，在稳定发展中培育深度联结。',
          chatRecord: chatRecord,
          nowTime: '2025-06-05 10:00:00'
        };

        const systemPrompt =
        `
          现在要求你：参考【对方性格】和【我的性格】、【聊天记录】、参考现在的时间点。为“我”设计一个对话，100字以内。要求：
          1、以【目的】为目的，为“我”设计一个对话“RD 加描述”。
          2、预测我发送消息之后，对方如果接受或者拒绝的原因。
          3、如果对方接受，则再为我设计一段话，100字以内，令对方对我更有兴趣。
          4、如果对方不接受，则再为我设计一段话，100字以内，体面地结束话题。
          以上 4 段话，分别用数字序号 1234 来表示。
        `;

        const userInput = `
          【目的】：约对方出去玩;
          【对方性格】：${otherInfo.personality};
          【我的性格】：${otherInfo.myPersonality};
          【聊天记录】：${JSON.stringify(otherInfo.chatRecord)};
          【现在时间】：${otherInfo.nowTime};
        `;

        const res = await model.streamText({
            data: {
                model: "deepseek-v3", // 指定具体的模型
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userInput },
                ],
            }
        });

        let result = '';

        for await (let str of res.textStream) {
          result += str;
        }

        console.log(result);
        
        // AI处理完成，进入下一步
        this.setData({ 
          loading: false, 
          step: 'preference' 
        });
        
      } catch (error) {
        console.error('AI模型初始化失败:', error);
        wx.showToast({
          title: '初始化失败',
          icon: 'error'
        });
      }
    },

    // 选择偏好
    selectPreference(e) {
      const preferenceId = e.currentTarget.dataset.id;
      const preference = this.data.preferences.find(p => p.id === preferenceId);
      
      this.setData({
        selectedPreference: preferenceId
      });

      // 延迟进入下一步
      setTimeout(() => {
        this.generateTopicContent(preferenceId);
      }, 300);
    },

    // 生成话题内容
    async generateTopicContent(preferenceId) {
      this.setData({ step: 'topic', loading: true });

      try {
        // 从话题库中随机选择内容
        const topics = this.data.topicLibrary[preferenceId] || [];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];

        await new Promise(resolve => setTimeout(resolve, 1500));

        this.setData({
          topicContent: randomTopic || '话题内容生成中...',
          loading: false
        });
      } catch (error) {
        console.error('生成话题内容失败:', error);
        this.setData({ loading: false });
      }
    },

    // 切换话题
    switchTopic() {
      this.generateTopicContent(this.data.selectedPreference);
    },

    // 进入反应选择
    goToReaction() {
      this.setData({
        step: 'reaction'
      });
    },

    // 选择反应
    selectReaction(e) {
      const reactionId = e.currentTarget.dataset.id;
      
      this.setData({
        selectedReaction: reactionId
      });

      setTimeout(() => {
        this.generateResponse(reactionId);
      }, 300);
    },

    // 生成回应内容
    async generateResponse(reactionId) {
      this.setData({ step: 'response', loading: true });

      try {
        // 从回应库中随机选择内容
        const responses = this.data.responseLibrary[reactionId] || [];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        await new Promise(resolve => setTimeout(resolve, 1500));

        this.setData({
          responseContent: randomResponse || '回应内容生成中...',
          loading: false
        });
      } catch (error) {
        console.error('生成回应内容失败:', error);
        this.setData({ loading: false });
      }
    },

    // 切换反应选项
    switchReaction() {
      // 重新生成当前选择的反应的回应内容
      if (this.data.selectedReaction) {
        this.generateResponse(this.data.selectedReaction);
      }
    },

    // 返回上一步
    goBack() {
      const stepFlow = ['loading', 'preference', 'topic', 'reaction', 'response'];
      const currentIndex = stepFlow.indexOf(this.data.step);
      
      if (currentIndex > 1) {
        this.setData({
          step: stepFlow[currentIndex - 1]
        });
      }
    },

    // 关闭组件
    close() {
      this.setData({
        step: 'loading',
        loading: true,
        selectedPreference: '',
        selectedReaction: '',
        topicContent: '',
        responseContent: ''
      });
      
      this.triggerEvent('close');
    }
  }
});
