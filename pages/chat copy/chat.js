import TencentCloudChat from '@tencentcloud/chat';
import TIMUploadPlugin from 'tim-upload-plugin';
import TIMProfanityFilterPlugin from 'tim-profanity-filter-plugin';
import { genTestUserSig }  from '../../TUIKit/debug/GenerateTestUserSig';

const innerAudioContext = wx.createInnerAudioContext();
const recorderManager = wx.getRecorderManager();

Page({
    data: {
        config: {
            userID: 'test', //User ID
            SDKAPPID: 1600083035, // Your SDKAppID
            EXPIRETIME: 604800,
        },
        // 聊天相关数据
        conversationID: '', // 当前会话ID
        conversationName: '聊天', // 会话名称
        messageList: [], // 消息列表
        inputMessage: '', // 输入框内容
        scrollToMessage: '', // 滚动到指定消息
        defaultAvatar: '/static/images/default_avatar.png', // 默认头像
        
        // UI控制相关
        isLoading: false, // 是否正在加载更多消息
        isVoiceMode: false, // 是否为语音输入模式
        inputFocus: false, // 输入框是否聚焦
        showEmojiPanel: false, // 是否显示表情面板
        showMorePanel: false, // 是否显示更多功能面板
        
        // 分页相关
        nextReqMessageID: '', // 下一条消息ID，用于分页拉取
        isCompleted: false, // 是否已加载完所有消息
        
        // 语音消息相关
        currentPlayingMessageID: '', // 当前正在播放的语音消息ID
    },

    onLoad(options) {
        // 获取传入的会话ID
        if (options.conversationID) {
            this.setData({
                conversationID: options.conversationID
            });
        }
        
        const userSig = genTestUserSig(this.data.config).userSig 
        wx.$TUIKit = TencentCloudChat.create({
            SDKAppID: this.data.config.SDKAPPID
        })
        wx.$chat_SDKAppID = this.data.config.SDKAPPID;
        wx.$chat_userID = this.data.config.userID;
        wx.$chat_userSig = userSig;
        wx.TencentCloudChat = TencentCloudChat;
        wx.$TUIKit.registerPlugin({ 'tim-upload-plugin': TIMUploadPlugin });
        wx.$TUIKit.registerPlugin({ 'tim-profanity-filter-plugin': TIMProfanityFilterPlugin });
        
        // 登录IM
        wx.$TUIKit.login({
            userID: this.data.config.userID,
            userSig
        });
        
        wx.setStorage({
            key: 'currentUserID',
            data: [],
        });
        
        // 监听SDK就绪事件
        wx.$TUIKit.on(wx.TencentCloudChat.EVENT.SDK_READY, this.onSDKReady, this);
        // 监听消息接收
        wx.$TUIKit.on(wx.TencentCloudChat.EVENT.MESSAGE_RECEIVED, this.onMessageReceived, this);
        
        // 配置语音录制参数
        recorderManager.onStop(this.onRecorderStop);
    },
    
    onUnload() {
        // 移除事件监听
        wx.$TUIKit.off(wx.TencentCloudChat.EVENT.SDK_READY, this.onSDKReady, this);
        wx.$TUIKit.off(wx.TencentCloudChat.EVENT.MESSAGE_RECEIVED, this.onMessageReceived, this);
        
        // 停止语音播放
        innerAudioContext.stop();
    },
    
    onSDKReady() {
        const TUIKit = this.selectComponent('#TUIKit');
        TUIKit.init();
        
        // 加载会话详情
        this.getConversationProfile();
        // 加载历史消息
        this.getMessageList();
    },
    
    // 获取会话详情
    async getConversationProfile() {
        if (!this.data.conversationID) return;
        
        try {
            const { data: { conversation } } = await wx.$TUIKit.getConversationProfile(this.data.conversationID);
            this.setData({
                conversationName: conversation.type === 'C2C' ? conversation.remark || conversation.userProfile.nick || conversation.userProfile.userID : conversation.name || '群聊'
            });
            
            // 设置页面标题
            wx.setNavigationBarTitle({
                title: this.data.conversationName
            });
        } catch (error) {
            console.error('获取会话详情失败', error);
        }
    },
    
    // 获取消息列表
    async getMessageList(isLoadMore = false) {
        if (!this.data.conversationID || (isLoadMore && this.data.isCompleted)) return;
        
        this.setData({ isLoading: true });
        
        try {
            // 获取消息列表
            const { data: { messageList, nextReqMessageID, isCompleted } } = await wx.$TUIKit.getMessageList({
                conversationID: this.data.conversationID,
                nextReqMessageID: isLoadMore ? this.data.nextReqMessageID : '',
                count: 15
            });
            
            // 格式化消息，添加时间显示
            const formattedMessages = this.formatMessageList(messageList);
            
            // 更新数据
            this.setData({
                messageList: isLoadMore ? [...formattedMessages, ...this.data.messageList] : formattedMessages,
                nextReqMessageID,
                isCompleted,
                isLoading: false
            });
            
            // 滚动到最新消息
            if (!isLoadMore && formattedMessages.length > 0) {
                this.setData({
                    scrollToMessage: `msg-${formattedMessages[formattedMessages.length - 1].ID}`
                });
            }
        } catch (error) {
            console.error('获取消息列表失败', error);
            this.setData({ isLoading: false });
        }
    },
    
    // 格式化消息列表，添加时间显示等辅助信息
    formatMessageList(messageList) {
        return messageList.map(message => {
            // 格式化时间
            const date = new Date(message.time * 1000);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            
            return {
                ...message,
                formattedTime: `${hours}:${minutes}`
            };
        });
    },
    
    // 处理消息接收事件
    onMessageReceived(event) {
        const { data: messageList } = event;
        
        // 过滤出当前会话的消息
        const currentConversationMessages = messageList.filter(
            message => message.conversationID === this.data.conversationID
        );
        
        if (currentConversationMessages.length === 0) return;
        
        // 格式化新消息
        const formattedMessages = this.formatMessageList(currentConversationMessages);
        
        // 添加到消息列表
        this.setData({
            messageList: [...this.data.messageList, ...formattedMessages],
            scrollToMessage: `msg-${formattedMessages[formattedMessages.length - 1].ID}`
        });
    },
    
    // 加载更多消息
    loadMoreMessages() {
        if (!this.data.isLoading && !this.data.isCompleted) {
            this.getMessageList(true);
        }
    },
    
    // 处理输入框内容变化
    onInputChange(e) {
        this.setData({
            inputMessage: e.detail.value
        });
    },
    
    // 发送文本消息
    async sendTextMessage() {
        const { inputMessage, conversationID } = this.data;
        if (!inputMessage.trim() || !conversationID) return;
        
        try {
            // 创建文本消息
            const message = wx.$TUIKit.createTextMessage({
                to: conversationID.replace('C2C', ''),
                conversationType: conversationID.startsWith('C2C') ? wx.TencentCloudChat.TYPES.CONV_C2C : wx.TencentCloudChat.TYPES.CONV_GROUP,
                payload: {
                    text: inputMessage
                }
            });
            
            // 发送消息
            const result = await wx.$TUIKit.sendMessage(message);
            
            // 更新UI
            const formattedMessage = this.formatMessageList([result.data.message])[0];
            this.setData({
                messageList: [...this.data.messageList, formattedMessage],
                inputMessage: '',
                scrollToMessage: `msg-${formattedMessage.ID}`,
                showEmojiPanel: false,
                showMorePanel: false
            });
        } catch (error) {
            console.error('发送消息失败', error);
            wx.showToast({
                title: '发送失败',
                icon: 'none'
            });
        }
    },
    
    // 选择图片并发送
    chooseImage() {
        wx.chooseImage({
            count: 1,
            sourceType: ['album', 'camera'],
            success: async (res) => {
                const tempFilePath = res.tempFilePaths[0];
                
                // 发送图片消息
                await this.sendImageMessage(tempFilePath);
                
                // 关闭更多面板
                this.setData({
                    showMorePanel: false
                });
            }
        });
    },
    
    // 拍照并发送
    takePhoto() {
        wx.chooseImage({
            count: 1,
            sourceType: ['camera'],
            success: async (res) => {
                const tempFilePath = res.tempFilePaths[0];
                
                // 发送图片消息
                await this.sendImageMessage(tempFilePath);
                
                // 关闭更多面板
                this.setData({
                    showMorePanel: false
                });
            }
        });
    },
    
    // 发送图片消息
    async sendImageMessage(tempFilePath) {
        const { conversationID } = this.data;
        if (!conversationID) return;
        
        try {
            // 创建图片消息
            const message = wx.$TUIKit.createImageMessage({
                to: conversationID.replace('C2C', ''),
                conversationType: conversationID.startsWith('C2C') ? wx.TencentCloudChat.TYPES.CONV_C2C : wx.TencentCloudChat.TYPES.CONV_GROUP,
                payload: {
                    file: {
                        path: tempFilePath,
                    }
                }
            });
            
            // 发送消息
            const result = await wx.$TUIKit.sendMessage(message);
            
            // 更新UI
            const formattedMessage = this.formatMessageList([result.data.message])[0];
            this.setData({
                messageList: [...this.data.messageList, formattedMessage],
                scrollToMessage: `msg-${formattedMessage.ID}`
            });
        } catch (error) {
            console.error('发送图片消息失败', error);
            wx.showToast({
                title: '发送失败',
                icon: 'none'
            });
        }
    },
    
    // 预览图片
    previewImage(e) {
        const { url } = e.currentTarget.dataset;
        if (!url) return;
        
        wx.previewImage({
            urls: [url],
            current: url
        });
    },
    
    // 切换语音输入模式
    toggleVoiceInput() {
        this.setData({
            isVoiceMode: !this.data.isVoiceMode,
            showEmojiPanel: false,
            showMorePanel: false
        });
    },
    
    // 开始录音
    startRecording() {
        // 开始录音前停止播放
        innerAudioContext.stop();
        
        // 显示录音中提示
        wx.showToast({
            title: '正在录音...',
            icon: 'none',
            duration: 60000
        });
        
        // 开始录音
        recorderManager.start({
            duration: 60000, // 最长60秒
            sampleRate: 44100,
            numberOfChannels: 1,
            encodeBitRate: 192000,
            format: 'aac'
        });
    },
    
    // 结束录音
    endRecording() {
        wx.hideToast();
        recorderManager.stop();
    },
    
    // 录音结束回调
    onRecorderStop: async function(res) {
        const { tempFilePath, duration } = res;
        if (duration < 1000) {
            wx.showToast({
                title: '录音时间太短',
                icon: 'none'
            });
            return;
        }
        
        // 发送语音消息
        await this.sendAudioMessage(tempFilePath, Math.floor(duration / 1000));
    },
    
    // 发送语音消息
    async sendAudioMessage(tempFilePath, duration) {
        const { conversationID } = this.data;
        if (!conversationID) return;
        
        try {
            // 创建语音消息
            const message = wx.$TUIKit.createAudioMessage({
                to: conversationID.replace('C2C', ''),
                conversationType: conversationID.startsWith('C2C') ? wx.TencentCloudChat.TYPES.CONV_C2C : wx.TencentCloudChat.TYPES.CONV_GROUP,
                payload: {
                    file: {
                        path: tempFilePath,
                    },
                    second: duration
                }
            });
            
            // 发送消息
            const result = await wx.$TUIKit.sendMessage(message);
            
            // 更新UI
            const formattedMessage = this.formatMessageList([result.data.message])[0];
            this.setData({
                messageList: [...this.data.messageList, formattedMessage],
                scrollToMessage: `msg-${formattedMessage.ID}`
            });
        } catch (error) {
            console.error('发送语音消息失败', error);
            wx.showToast({
                title: '发送失败',
                icon: 'none'
            });
        }
    },
    
    // 播放语音消息
    playAudio(e) {
        const { url, id } = e.currentTarget.dataset;
        if (!url) return;
        
        // 如果是当前正在播放的消息，停止播放
        if (this.data.currentPlayingMessageID === id) {
            innerAudioContext.stop();
            this.setData({
                currentPlayingMessageID: ''
            });
            return;
        }
        
        // 停止之前的播放
        innerAudioContext.stop();
        
        // 设置音频源
        innerAudioContext.src = url;
        
        // 播放
        innerAudioContext.play();
        
        // 标记当前播放的消息
        this.setData({
            currentPlayingMessageID: id
        });
        
        // 播放完成后的处理
        innerAudioContext.onEnded(() => {
            this.setData({
                currentPlayingMessageID: ''
            });
        });
        
        innerAudioContext.onError(() => {
            this.setData({
                currentPlayingMessageID: ''
            });
            wx.showToast({
                title: '播放失败',
                icon: 'none'
            });
        });
    },
    
    // 切换表情面板
    toggleEmojiPanel() {
        this.setData({
            showEmojiPanel: !this.data.showEmojiPanel,
            showMorePanel: false,
            isVoiceMode: false,
            inputFocus: !this.data.showEmojiPanel
        });
    },
    
    // 切换更多功能面板
    toggleMorePanel() {
        this.setData({
            showMorePanel: !this.data.showMorePanel,
            showEmojiPanel: false,
            isVoiceMode: false,
            inputFocus: false
        });
    },
    
    // 选择文件
    chooseFile() {
        wx.showToast({
            title: '小程序暂不支持此功能',
            icon: 'none'
        });
    },
    
    // 返回上一页
    goBack() {
        wx.navigateBack();
    },
    
    // 显示更多操作
    showMoreAction() {
        wx.showActionSheet({
            itemList: ['清空聊天记录', '删除会话'],
            success: (res) => {
                if (res.tapIndex === 0) {
                    this.clearMessages();
                } else if (res.tapIndex === 1) {
                    this.deleteConversation();
                }
            }
        });
    },
    
    // 清空聊天记录
    async clearMessages() {
        const { conversationID } = this.data;
        if (!conversationID) return;
        
        try {
            await wx.$TUIKit.clearMessageList(conversationID);
            
            this.setData({
                messageList: [],
                nextReqMessageID: '',
                isCompleted: false
            });
            
            wx.showToast({
                title: '已清空聊天记录',
                icon: 'none'
            });
        } catch (error) {
            console.error('清空聊天记录失败', error);
            wx.showToast({
                title: '操作失败',
                icon: 'none'
            });
        }
    },
    
    // 删除会话
    async deleteConversation() {
        const { conversationID } = this.data;
        if (!conversationID) return;
        
        try {
            await wx.$TUIKit.deleteConversation(conversationID);
            
            wx.showToast({
                title: '已删除会话',
                icon: 'none'
            });
            
            // 返回上一页
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        } catch (error) {
            console.error('删除会话失败', error);
            wx.showToast({
                title: '操作失败',
                icon: 'none'
            });
        }
    }
});