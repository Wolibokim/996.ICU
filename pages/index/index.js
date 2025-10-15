// pages/index/index.js
const audioManager = require('../../utils/audioManager');

Page({
  data: {
    audioList: [],
    playingCount: 0,
    showModal: false,
    newAudio: {
      title: '',
      src: ''
    }
  },

  onLoad() {
    // 初始化示例音频
    this.initSampleAudios();
    // 开始定时更新音频状态
    this.startStatusUpdate();
  },

  onUnload() {
    // 页面卸载时清理资源
    audioManager.destroyAll();
    if (this.statusTimer) {
      clearInterval(this.statusTimer);
    }
  },

  /**
   * 初始化示例音频
   */
  initSampleAudios() {
    const sampleAudios = [
      {
        id: 'audio1',
        title: '轻音乐 - 钢琴曲',
        src: 'https://music.163.com/song/media/outer/url?id=25906124.mp3'
      },
      {
        id: 'audio2', 
        title: '自然音效 - 雨声',
        src: 'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-one/nature_rain_light_rain_on_leaves_loop_01.mp3'
      },
      {
        id: 'audio3',
        title: '背景音乐 - 咖啡厅',
        src: 'https://www.bensound.com/bensound-music/bensound-jazzyfrenchy.mp3'
      }
    ];

    // 注意：由于跨域和版权问题，实际使用时请替换为您自己的音频文件
    // 建议使用以下类型的音频源：
    // 1. 您自己服务器上的音频文件
    // 2. 支持跨域访问的音频CDN
    // 3. 微信小程序云存储中的音频文件

    sampleAudios.forEach(audio => {
      this.createAudioItem(audio.id, audio.title, audio.src);
    });
  },

  /**
   * 创建音频项
   */
  createAudioItem(id, title, src) {
    // 创建音频实例
    audioManager.createAudio(id, src, {
      volume: 1.0,
      loop: false
    });

    // 添加到音频列表
    const audioList = this.data.audioList;
    audioList.push({
      id: id,
      title: title,
      src: src,
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      duration: 0,
      currentTimeText: '00:00',
      durationText: '00:00',
      progressPercent: 0,
      volume: 1.0,
      volumeText: '100%',
      loop: false
    });

    this.setData({
      audioList: audioList
    });
  },

  /**
   * 开始状态更新定时器
   */
  startStatusUpdate() {
    this.statusTimer = setInterval(() => {
      this.updateAudioStates();
    }, 500);
  },

  /**
   * 更新音频状态
   */
  updateAudioStates() {
    const audioList = this.data.audioList.map(audio => {
      const state = audioManager.getAudioState(audio.id);
      if (state) {
        return {
          ...audio,
          isPlaying: state.isPlaying,
          isPaused: state.isPaused,
          currentTime: state.currentTime,
          duration: state.duration,
          currentTimeText: this.formatTime(state.currentTime),
          durationText: this.formatTime(state.duration),
          progressPercent: state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0,
          volume: state.volume,
          volumeText: Math.round(state.volume * 100) + '%',
          loop: state.loop
        };
      }
      return audio;
    });

    const playingCount = audioManager.getPlayingCount();

    this.setData({
      audioList: audioList,
      playingCount: playingCount
    });
  },

  /**
   * 格式化时间显示
   */
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * 切换播放/暂停
   */
  togglePlay(e) {
    const audioId = e.currentTarget.dataset.id;
    const audio = this.data.audioList.find(item => item.id === audioId);
    
    if (audio) {
      if (audio.isPlaying) {
        audioManager.pause(audioId);
      } else {
        audioManager.play(audioId);
      }
    }
  },

  /**
   * 停止音频
   */
  stopAudio(e) {
    const audioId = e.currentTarget.dataset.id;
    audioManager.stop(audioId);
  },

  /**
   * 播放全部音频
   */
  playAll() {
    audioManager.playAll();
    wx.showToast({
      title: '开始播放全部音频',
      icon: 'success'
    });
  },

  /**
   * 暂停全部音频
   */
  pauseAll() {
    audioManager.pauseAll();
    wx.showToast({
      title: '暂停全部音频',
      icon: 'success'
    });
  },

  /**
   * 停止全部音频
   */
  stopAll() {
    audioManager.stopAll();
    wx.showToast({
      title: '停止全部音频',
      icon: 'success'
    });
  },

  /**
   * 音量改变事件
   */
  onVolumeChange(e) {
    const audioId = e.currentTarget.dataset.id;
    const volume = e.detail.value / 100;
    audioManager.setVolume(audioId, volume);
  },

  /**
   * 循环播放开关
   */
  onLoopChange(e) {
    const audioId = e.currentTarget.dataset.id;
    const loop = e.detail.value;
    audioManager.setLoop(audioId, loop);
  },

  /**
   * 显示添加音频模态框
   */
  showAddAudioModal() {
    this.setData({
      showModal: true,
      newAudio: {
        title: '',
        src: ''
      }
    });
  },

  /**
   * 隐藏添加音频模态框
   */
  hideAddAudioModal() {
    this.setData({
      showModal: false
    });
  },

  /**
   * 标题输入
   */
  onTitleInput(e) {
    this.setData({
      'newAudio.title': e.detail.value
    });
  },

  /**
   * 音频地址输入
   */
  onSrcInput(e) {
    this.setData({
      'newAudio.src': e.detail.value
    });
  },

  /**
   * 添加音频
   */
  addAudio() {
    const { title, src } = this.data.newAudio;
    
    if (!title.trim()) {
      wx.showToast({
        title: '请输入音频标题',
        icon: 'none'
      });
      return;
    }

    if (!src.trim()) {
      wx.showToast({
        title: '请输入音频地址',
        icon: 'none'
      });
      return;
    }

    // 生成唯一ID
    const audioId = 'audio_' + Date.now();
    
    // 创建音频项
    this.createAudioItem(audioId, title.trim(), src.trim());
    
    // 隐藏模态框
    this.hideAddAudioModal();
    
    wx.showToast({
      title: '音频添加成功',
      icon: 'success'
    });
  },

  /**
   * 阻止模态框滚动穿透
   */
  preventTouchMove() {
    return false;
  }
});