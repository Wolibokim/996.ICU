// index.js
Page({
  data: {
    playStatus: '未播放',
    debugInfo: '',
    audioContext: null,
    backgroundAudioManager: null,
    // 音频文件URL（请替换为您的音频文件地址）
    audioUrl: 'https://www.w3school.com.cn/i/horse.mp3'
  },

  onLoad() {
    // 页面加载时的初始化
    this.setData({
      debugInfo: '页面已加载，iOS音频自动播放需要用户交互触发'
    });

    // 预创建音频上下文
    this.initAudioContext();
  },

  onShow() {
    // 页面显示时尝试恢复播放（如果之前在播放）
    if (this.data.audioContext && this.data.audioContext.paused === false) {
      this.data.audioContext.play();
    }
  },

  // 初始化音频上下文
  initAudioContext() {
    const audioContext = wx.createInnerAudioContext();
    audioContext.src = this.data.audioUrl;
    
    // 设置音频属性
    audioContext.autoplay = false; // iOS不支持自动播放
    audioContext.loop = false;
    audioContext.volume = 1.0;

    // 监听音频事件
    audioContext.onPlay(() => {
      this.setData({
        playStatus: '正在播放',
        debugInfo: this.data.debugInfo + '\n音频开始播放'
      });
    });

    audioContext.onError((res) => {
      this.setData({
        playStatus: '播放错误',
        debugInfo: this.data.debugInfo + '\n播放错误：' + JSON.stringify(res)
      });
    });

    audioContext.onEnded(() => {
      this.setData({
        playStatus: '播放结束',
        debugInfo: this.data.debugInfo + '\n音频播放结束'
      });
    });

    this.setData({ audioContext });
  },

  // 方案1：使用 InnerAudioContext（推荐）
  playAudioMethod1() {
    this.setData({
      debugInfo: '尝试使用方案1播放音频...'
    });

    if (!this.data.audioContext) {
      this.initAudioContext();
    }

    // iOS需要在用户交互事件中调用play
    this.data.audioContext.play().then(() => {
      this.setData({
        debugInfo: this.data.debugInfo + '\n方案1播放成功'
      });
    }).catch(err => {
      this.setData({
        debugInfo: this.data.debugInfo + '\n方案1播放失败：' + err.message
      });
      
      // 失败后的补救措施
      this.handlePlayError();
    });
  },

  // 方案2：使用 BackgroundAudioManager
  playAudioMethod2() {
    this.setData({
      debugInfo: '尝试使用方案2播放音频...'
    });

    const backgroundAudioManager = wx.getBackgroundAudioManager();
    
    // 设置音频信息（后台播放必需）
    backgroundAudioManager.title = '测试音频';
    backgroundAudioManager.epname = '测试专辑';
    backgroundAudioManager.singer = '测试歌手';
    backgroundAudioManager.coverImgUrl = ''; // 封面图URL
    backgroundAudioManager.src = this.data.audioUrl;

    backgroundAudioManager.onPlay(() => {
      this.setData({
        playStatus: '后台播放中',
        debugInfo: this.data.debugInfo + '\n方案2播放成功'
      });
    });

    backgroundAudioManager.onError((res) => {
      this.setData({
        debugInfo: this.data.debugInfo + '\n方案2播放失败：' + JSON.stringify(res)
      });
    });
  },

  // 方案3：通过WebView播放
  playAudioMethod3() {
    this.setData({
      debugInfo: '方案3需要创建WebView页面...'
    });

    // 跳转到WebView页面
    wx.navigateTo({
      url: '/pages/webview/webview',
      fail: () => {
        this.setData({
          debugInfo: this.data.debugInfo + '\nWebView页面不存在，请创建webview页面'
        });
      }
    });
  },

  // 方案4：静音技巧
  playAudioMethod4() {
    this.setData({
      debugInfo: '尝试使用方案4播放音频...'
    });

    // 创建静音音频上下文
    const silentAudio = wx.createInnerAudioContext();
    // 使用一个极短的静音音频文件
    silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAA=';
    silentAudio.volume = 0;

    // 先播放静音音频
    silentAudio.play().then(() => {
      // 静音播放成功后，立即播放真实音频
      setTimeout(() => {
        if (this.data.audioContext) {
          this.data.audioContext.play().then(() => {
            this.setData({
              debugInfo: this.data.debugInfo + '\n方案4播放成功'
            });
          }).catch(err => {
            this.setData({
              debugInfo: this.data.debugInfo + '\n方案4真实音频播放失败'
            });
          });
        }
      }, 100);
    }).catch(err => {
      this.setData({
        debugInfo: this.data.debugInfo + '\n方案4静音播放失败'
      });
    });

    // 清理静音音频
    setTimeout(() => {
      silentAudio.destroy();
    }, 1000);
  },

  // 处理播放错误
  handlePlayError() {
    wx.showModal({
      title: '播放提示',
      content: 'iOS系统限制，音频需要用户交互才能播放。请点击播放按钮。',
      showCancel: false,
      success: (res) => {
        if (res.confirm) {
          // 用户确认后再次尝试播放
          this.data.audioContext.play();
        }
      }
    });
  },

  onUnload() {
    // 页面卸载时清理音频资源
    if (this.data.audioContext) {
      this.data.audioContext.destroy();
    }
  }
});