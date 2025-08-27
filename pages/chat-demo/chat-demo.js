// chat-demo.js
Page({
  data: {
    canvasWidth: 375,
    canvasHeight: 600,
    inputMessage: '',
    messages: [
      {
        id: 1,
        nickname: '小明',
        message: '你好！这是一个wxml-to-canvas的聊天界面demo',
        time: '09:30',
        isOwn: false
      },
      {
        id: 2,
        nickname: '我',
        message: '看起来很不错呢！',
        time: '09:32',
        isOwn: true
      },
      {
        id: 3,
        nickname: '小红',
        message: '这个canvas绘制的聊天界面支持复杂的样式，包括头像、气泡、多行文本等功能',
        time: '09:35',
        isOwn: false
      },
      {
        id: 4,
        nickname: '我',
        message: '太棒了！可以用来生成聊天记录的图片分享',
        time: '09:36',
        isOwn: true
      }
    ],
    presetMessages: [
      '你好！',
      '这是一个demo',
      '支持多行文本换行显示哦',
      '可以生成图片保存',
      '👍 很棒的功能'
    ]
  },

  onLoad() {
    // 页面加载时自动渲染一次
    setTimeout(() => {
      this.renderChat()
    }, 500)
  },

  onMessageInput(e) {
    this.setData({
      inputMessage: e.detail.value
    })
  },

  sendMessage() {
    const message = this.data.inputMessage.trim()
    if (!message) {
      wx.showToast({
        title: '请输入消息',
        icon: 'none'
      })
      return
    }

    const newMessage = {
      id: Date.now(),
      nickname: '我',
      message: message,
      time: this.formatTime(new Date()),
      isOwn: true
    }

    this.setData({
      messages: [...this.data.messages, newMessage],
      inputMessage: ''
    })

    // 重新渲染canvas
    setTimeout(() => {
      this.renderChat()
    }, 100)
  },

  sendPresetMessage(e) {
    const message = e.currentTarget.dataset.message
    const newMessage = {
      id: Date.now(),
      nickname: '小助手',
      message: message,
      time: this.formatTime(new Date()),
      isOwn: false
    }

    this.setData({
      messages: [...this.data.messages, newMessage]
    })

    // 重新渲染canvas
    setTimeout(() => {
      this.renderChat()
    }, 100)
  },

  addMessage() {
    const randomMessages = [
      '这是一条随机消息',
      '支持表情符号 😊',
      '可以显示很长很长的消息内容，会自动换行处理',
      '时间戳会自动更新',
      '支持不同用户的消息'
    ]
    
    const randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)]
    const isOwn = Math.random() > 0.5
    
    const newMessage = {
      id: Date.now(),
      nickname: isOwn ? '我' : ['小明', '小红', '小刚'][Math.floor(Math.random() * 3)],
      message: randomMessage,
      time: this.formatTime(new Date()),
      isOwn: isOwn
    }

    this.setData({
      messages: [...this.data.messages, newMessage]
    })

    // 重新渲染canvas
    setTimeout(() => {
      this.renderChat()
    }, 100)
  },

  renderChat() {
    const canvasComponent = this.selectComponent('#chat-canvas')
    if (!canvasComponent) {
      console.error('Canvas组件未找到')
      return
    }

    // 渲染聊天界面
    canvasComponent.renderChatInterface(this.data.messages)
    
    wx.showToast({
      title: '渲染完成',
      icon: 'success',
      duration: 1000
    })
  },

  async saveImage() {
    try {
      const canvasComponent = this.selectComponent('#chat-canvas')
      if (!canvasComponent) {
        throw new Error('Canvas组件未找到')
      }

      wx.showLoading({
        title: '保存中...'
      })

      const result = await canvasComponent.canvasToTempFilePath()
      
      await wx.saveImageToPhotosAlbum({
        filePath: result.tempFilePath
      })

      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

    } catch (error) {
      wx.hideLoading()
      console.error('保存图片失败:', error)
      
      if (error.errMsg && error.errMsg.includes('auth')) {
        wx.showModal({
          title: '提示',
          content: '需要授权访问相册才能保存图片',
          showCancel: false
        })
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'error'
        })
      }
    }
  },

  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }
})