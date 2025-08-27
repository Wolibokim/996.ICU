Component({
  properties: {
    width: {
      type: Number,
      value: 375
    },
    height: {
      type: Number,
      value: 667
    },
    canvasId: {
      type: String,
      value: 'wxml-to-canvas'
    }
  },

  data: {
    
  },

  attached() {
    this.ctx = wx.createCanvasContext(this.data.canvasId, this)
  },

  methods: {
    // 绘制文本
    drawText(config) {
      const { text, x, y, fontSize = 14, color = '#000', textAlign = 'left', maxWidth, lineHeight } = config
      
      this.ctx.setFontSize(fontSize)
      this.ctx.setFillStyle(color)
      this.ctx.setTextAlign(textAlign)
      
      if (maxWidth && text.length * fontSize > maxWidth) {
        // 文本换行处理
        this.drawMultiLineText({
          text,
          x,
          y,
          fontSize,
          color,
          maxWidth,
          lineHeight: lineHeight || fontSize * 1.2
        })
      } else {
        this.ctx.fillText(text, x, y)
      }
    },

    // 绘制多行文本
    drawMultiLineText(config) {
      const { text, x, y, fontSize, color, maxWidth, lineHeight } = config
      
      let currentY = y
      let currentText = ''
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i]
        const testText = currentText + char
        const metrics = this.ctx.measureText(testText)
        
        if (metrics.width > maxWidth && currentText !== '') {
          this.ctx.fillText(currentText, x, currentY)
          currentText = char
          currentY += lineHeight
        } else {
          currentText = testText
        }
      }
      
      if (currentText) {
        this.ctx.fillText(currentText, x, currentY)
      }
    },

    // 绘制圆角矩形
    drawRoundRect(config) {
      const { x, y, width, height, radius, fillStyle, strokeStyle } = config
      
      this.ctx.beginPath()
      this.ctx.moveTo(x + radius, y)
      this.ctx.lineTo(x + width - radius, y)
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
      this.ctx.lineTo(x + width, y + height - radius)
      this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
      this.ctx.lineTo(x + radius, y + height)
      this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
      this.ctx.lineTo(x, y + radius)
      this.ctx.quadraticCurveTo(x, y, x + radius, y)
      this.ctx.closePath()
      
      if (fillStyle) {
        this.ctx.setFillStyle(fillStyle)
        this.ctx.fill()
      }
      
      if (strokeStyle) {
        this.ctx.setStrokeStyle(strokeStyle)
        this.ctx.stroke()
      }
    },

    // 绘制头像
    drawAvatar(config) {
      const { x, y, size, src } = config
      
      // 绘制圆形裁剪路径
      this.ctx.save()
      this.ctx.beginPath()
      this.ctx.arc(x + size/2, y + size/2, size/2, 0, 2 * Math.PI)
      this.ctx.clip()
      
      // 这里可以绘制头像图片，简化处理绘制一个圆形背景
      this.ctx.setFillStyle('#ccc')
      this.ctx.fillRect(x, y, size, size)
      
      this.ctx.restore()
    },

    // 绘制聊天气泡
    drawChatBubble(config) {
      const { 
        x, 
        y, 
        width, 
        height, 
        isOwn = false, 
        fillStyle = isOwn ? '#95EC69' : '#fff',
        strokeStyle = '#e5e5e5'
      } = config
      
      const radius = 8
      const arrowSize = 6
      
      this.ctx.beginPath()
      
      if (isOwn) {
        // 自己发送的消息，气泡在右边，箭头在右侧
        this.ctx.moveTo(x + radius, y)
        this.ctx.lineTo(x + width - radius - arrowSize, y)
        this.ctx.quadraticCurveTo(x + width - arrowSize, y, x + width - arrowSize, y + radius)
        this.ctx.lineTo(x + width - arrowSize, y + height/2 - arrowSize)
        this.ctx.lineTo(x + width, y + height/2)
        this.ctx.lineTo(x + width - arrowSize, y + height/2 + arrowSize)
        this.ctx.lineTo(x + width - arrowSize, y + height - radius)
        this.ctx.quadraticCurveTo(x + width - arrowSize, y + height, x + width - radius - arrowSize, y + height)
        this.ctx.lineTo(x + radius, y + height)
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
        this.ctx.lineTo(x, y + radius)
        this.ctx.quadraticCurveTo(x, y, x + radius, y)
      } else {
        // 对方发送的消息，气泡在左边，箭头在左侧
        this.ctx.moveTo(x + arrowSize, y + height/2 - arrowSize)
        this.ctx.lineTo(x, y + height/2)
        this.ctx.lineTo(x + arrowSize, y + height/2 + arrowSize)
        this.ctx.lineTo(x + arrowSize, y + height - radius)
        this.ctx.quadraticCurveTo(x + arrowSize, y + height, x + radius + arrowSize, y + height)
        this.ctx.lineTo(x + width - radius, y + height)
        this.ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius)
        this.ctx.lineTo(x + width, y + radius)
        this.ctx.quadraticCurveTo(x + width, y, x + width - radius, y)
        this.ctx.lineTo(x + radius + arrowSize, y)
        this.ctx.quadraticCurveTo(x + arrowSize, y, x + arrowSize, y + radius)
        this.ctx.lineTo(x + arrowSize, y + height/2 - arrowSize)
      }
      
      this.ctx.closePath()
      
      if (fillStyle) {
        this.ctx.setFillStyle(fillStyle)
        this.ctx.fill()
      }
      
      if (strokeStyle) {
        this.ctx.setStrokeStyle(strokeStyle)
        this.ctx.setLineWidth(1)
        this.ctx.stroke()
      }
    },

    // 绘制聊天消息
    drawChatMessage(config) {
      const {
        avatar,
        nickname,
        message,
        time,
        isOwn = false,
        y: startY
      } = config
      
      const padding = 15
      const avatarSize = 40
      const bubblePadding = 12
      const maxBubbleWidth = 200
      
      let currentY = startY + padding
      
      if (isOwn) {
        // 自己的消息，头像在右边
        const avatarX = this.data.width - padding - avatarSize
        this.drawAvatar({
          x: avatarX,
          y: currentY,
          size: avatarSize
        })
        
        // 计算消息气泡尺寸
        const messageLines = this.calculateTextLines(message, maxBubbleWidth - bubblePadding * 2, 16)
        const bubbleHeight = messageLines.length * 20 + bubblePadding * 2
        const bubbleWidth = Math.min(maxBubbleWidth, Math.max(...messageLines.map(line => 
          this.ctx.measureText(line).width
        )) + bubblePadding * 2)
        
        const bubbleX = avatarX - bubbleWidth - 8
        
        // 绘制消息气泡
        this.drawChatBubble({
          x: bubbleX,
          y: currentY,
          width: bubbleWidth,
          height: bubbleHeight,
          isOwn: true
        })
        
        // 绘制消息文本
        this.ctx.setFontSize(16)
        this.ctx.setFillStyle('#000')
        messageLines.forEach((line, index) => {
          this.ctx.fillText(line, bubbleX + bubblePadding, currentY + bubblePadding + (index + 1) * 20)
        })
        
        // 绘制时间
        if (time) {
          this.ctx.setFontSize(12)
          this.ctx.setFillStyle('#999')
          this.ctx.setTextAlign('right')
          this.ctx.fillText(time, bubbleX - 8, currentY + bubbleHeight + 15)
        }
        
      } else {
        // 对方的消息，头像在左边
        this.drawAvatar({
          x: padding,
          y: currentY,
          size: avatarSize
        })
        
        // 绘制昵称
        if (nickname) {
          this.ctx.setFontSize(14)
          this.ctx.setFillStyle('#666')
          this.ctx.setTextAlign('left')
          this.ctx.fillText(nickname, padding + avatarSize + 8, currentY + 15)
          currentY += 20
        }
        
        // 计算消息气泡尺寸
        const messageLines = this.calculateTextLines(message, maxBubbleWidth - bubblePadding * 2, 16)
        const bubbleHeight = messageLines.length * 20 + bubblePadding * 2
        const bubbleWidth = Math.min(maxBubbleWidth, Math.max(...messageLines.map(line => 
          this.ctx.measureText(line).width
        )) + bubblePadding * 2)
        
        const bubbleX = padding + avatarSize + 8
        
        // 绘制消息气泡
        this.drawChatBubble({
          x: bubbleX,
          y: currentY,
          width: bubbleWidth,
          height: bubbleHeight,
          isOwn: false
        })
        
        // 绘制消息文本
        this.ctx.setFontSize(16)
        this.ctx.setFillStyle('#000')
        messageLines.forEach((line, index) => {
          this.ctx.fillText(line, bubbleX + bubblePadding + 6, currentY + bubblePadding + (index + 1) * 20)
        })
        
        // 绘制时间
        if (time) {
          this.ctx.setFontSize(12)
          this.ctx.setFillStyle('#999')
          this.ctx.setTextAlign('left')
          this.ctx.fillText(time, bubbleX, currentY + bubbleHeight + 15)
        }
      }
      
      return currentY + Math.max(avatarSize, bubbleHeight) + padding
    },

    // 计算文本行数
    calculateTextLines(text, maxWidth, fontSize) {
      this.ctx.setFontSize(fontSize)
      const lines = []
      let currentLine = ''
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i]
        const testLine = currentLine + char
        const metrics = this.ctx.measureText(testLine)
        
        if (metrics.width > maxWidth && currentLine !== '') {
          lines.push(currentLine)
          currentLine = char
        } else {
          currentLine = testLine
        }
      }
      
      if (currentLine) {
        lines.push(currentLine)
      }
      
      return lines
    },

    // 渲染聊天界面
    renderChatInterface(messages = []) {
      // 清空画布
      this.ctx.setFillStyle('#f5f5f5')
      this.ctx.fillRect(0, 0, this.data.width, this.data.height)
      
      let currentY = 0
      
      // 绘制标题栏
      this.ctx.setFillStyle('#fff')
      this.ctx.fillRect(0, 0, this.data.width, 60)
      
      this.ctx.setFontSize(18)
      this.ctx.setFillStyle('#000')
      this.ctx.setTextAlign('center')
      this.ctx.fillText('聊天界面Demo', this.data.width / 2, 35)
      
      // 绘制分割线
      this.ctx.setStrokeStyle('#e5e5e5')
      this.ctx.setLineWidth(1)
      this.ctx.beginPath()
      this.ctx.moveTo(0, 60)
      this.ctx.lineTo(this.data.width, 60)
      this.ctx.stroke()
      
      currentY = 60
      
      // 绘制消息列表
      messages.forEach(message => {
        currentY = this.drawChatMessage({
          ...message,
          y: currentY
        })
      })
      
      this.ctx.draw()
    },

    // 导出图片
    canvasToTempFilePath() {
      return new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
          canvasId: this.data.canvasId,
          success: resolve,
          fail: reject
        }, this)
      })
    }
  }
})