// audio-player.js
Component({
  properties: {
    // 音频源
    src: {
      type: String,
      observer: 'onSrcChange'
    },
    // 音频标题
    title: String,
    // 歌手
    artist: String,
    // 封面图
    coverImage: String,
    // 是否显示上一首/下一首按钮
    showPrevNext: {
      type: Boolean,
      value: false
    },
    // 是否显示额外控制
    showExtra: {
      type: Boolean,
      value: true
    },
    // 是否自动播放（iOS上无效）
    autoplay: {
      type: Boolean,
      value: false
    }
  },

  data: {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    progress: 0,
    currentTimeText: '00:00',
    durationText: '00:00',
    loop: false,
    playbackRate: 1.0,
    isSliderChanging: false,
    hasUserInteracted: false
  },

  lifetimes: {
    attached() {
      this.initAudioContext();
    },
    detached() {
      this.destroyAudioContext();
    }
  },

  methods: {
    // 初始化音频上下文
    initAudioContext() {
      if (this.audioContext) {
        this.audioContext.destroy();
      }

      this.audioContext = wx.createInnerAudioContext();
      this.setupAudioEvents();

      if (this.data.src) {
        this.audioContext.src = this.data.src;
        // iOS不支持自动播放，需要用户交互
        if (this.data.autoplay && this.data.hasUserInteracted) {
          this.play();
        }
      }
    },

    // 设置音频事件监听
    setupAudioEvents() {
      const audio = this.audioContext;

      // 播放事件
      audio.onPlay(() => {
        this.setData({ isPlaying: true });
        this.triggerEvent('play');
      });

      // 暂停事件
      audio.onPause(() => {
        this.setData({ isPlaying: false });
        this.triggerEvent('pause');
      });

      // 停止事件
      audio.onStop(() => {
        this.setData({ isPlaying: false });
        this.triggerEvent('stop');
      });

      // 播放结束
      audio.onEnded(() => {
        this.setData({ isPlaying: false });
        if (this.data.loop) {
          this.play();
        } else {
          this.triggerEvent('ended');
        }
      });

      // 错误处理
      audio.onError((res) => {
        console.error('音频播放错误:', res);
        this.setData({ isPlaying: false });
        this.handlePlayError(res);
        this.triggerEvent('error', res);
      });

      // 音频加载完成
      audio.onCanplay(() => {
        this.setData({
          duration: audio.duration,
          durationText: this.formatTime(audio.duration)
        });
        this.triggerEvent('canplay');
      });

      // 播放进度更新
      audio.onTimeUpdate(() => {
        if (!this.data.isSliderChanging) {
          const currentTime = audio.currentTime;
          const duration = audio.duration || 1;
          const progress = (currentTime / duration) * 100;

          this.setData({
            currentTime,
            currentTimeText: this.formatTime(currentTime),
            progress
          });
        }
      });

      // 音频加载中
      audio.onWaiting(() => {
        this.triggerEvent('waiting');
      });

      // 音频跳转完成
      audio.onSeeked(() => {
        this.triggerEvent('seeked');
      });
    },

    // 播放/暂停
    onPlayPause() {
      // 记录用户已交互
      this.setData({ hasUserInteracted: true });

      if (this.data.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },

    // 播放
    play() {
      if (!this.audioContext.src) {
        wx.showToast({
          title: '请设置音频源',
          icon: 'none'
        });
        return;
      }

      // iOS需要在用户交互中调用
      this.audioContext.play().catch(err => {
        console.error('播放失败:', err);
        this.handlePlayError(err);
      });
    },

    // 暂停
    pause() {
      this.audioContext.pause();
    },

    // 停止
    stop() {
      this.audioContext.stop();
    },

    // 上一首
    onPrevious() {
      this.triggerEvent('previous');
    },

    // 下一首
    onNext() {
      this.triggerEvent('next');
    },

    // 循环切换
    onLoop() {
      const loop = !this.data.loop;
      this.setData({ loop });
      this.audioContext.loop = loop;
      wx.showToast({
        title: loop ? '循环播放' : '单次播放',
        icon: 'none'
      });
    },

    // 倍速切换
    onSpeed() {
      const rates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
      const currentIndex = rates.indexOf(this.data.playbackRate);
      const nextIndex = (currentIndex + 1) % rates.length;
      const playbackRate = rates[nextIndex];

      this.setData({ playbackRate });
      this.audioContext.playbackRate = playbackRate;
    },

    // 音量控制
    onVolume() {
      wx.showActionSheet({
        itemList: ['100%', '75%', '50%', '25%', '静音'],
        success: (res) => {
          const volumes = [1.0, 0.75, 0.5, 0.25, 0];
          this.audioContext.volume = volumes[res.tapIndex];
        }
      });
    },

    // 进度条拖动
    onSliderChange(e) {
      const progress = e.detail.value;
      const currentTime = (progress / 100) * this.data.duration;
      this.audioContext.seek(currentTime);
      this.setData({ isSliderChanging: false });
    },

    // 进度条拖动中
    onSliderChanging(e) {
      const progress = e.detail.value;
      const currentTime = (progress / 100) * this.data.duration;
      this.setData({
        isSliderChanging: true,
        progress,
        currentTimeText: this.formatTime(currentTime)
      });
    },

    // 音频源改变
    onSrcChange(newSrc) {
      if (newSrc && this.audioContext) {
        this.audioContext.src = newSrc;
        // 如果正在播放，切换后继续播放
        if (this.data.isPlaying && this.data.hasUserInteracted) {
          this.play();
        }
      }
    },

    // 处理播放错误
    handlePlayError(error) {
      let message = '播放失败';
      
      if (error.errCode === 10001) {
        message = '系统错误';
      } else if (error.errCode === 10002) {
        message = '网络错误';
      } else if (error.errCode === 10003) {
        message = '文件错误';
      } else if (error.errCode === 10004) {
        message = '格式错误';
      } else if (!this.data.hasUserInteracted) {
        message = 'iOS需要点击播放按钮';
      }

      wx.showModal({
        title: '播放提示',
        content: message,
        showCancel: false
      });
    },

    // 格式化时间
    formatTime(seconds) {
      if (!seconds || isNaN(seconds)) return '00:00';
      
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${this.pad(mins)}:${this.pad(secs)}`;
    },

    // 补零
    pad(num) {
      return num < 10 ? '0' + num : num;
    },

    // 销毁音频上下文
    destroyAudioContext() {
      if (this.audioContext) {
        this.audioContext.destroy();
        this.audioContext = null;
      }
    },

    // 对外暴露的方法
    // 获取音频上下文
    getAudioContext() {
      return this.audioContext;
    },

    // 跳转到指定时间
    seek(time) {
      if (this.audioContext) {
        this.audioContext.seek(time);
      }
    }
  }
});