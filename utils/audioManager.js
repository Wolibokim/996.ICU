/**
 * 多音频管理器
 * 支持同时播放多个音频文件
 */
class AudioManager {
  constructor() {
    this.audioContexts = new Map(); // 存储音频上下文
    this.audioStates = new Map(); // 存储音频状态
  }

  /**
   * 创建音频实例
   * @param {string} audioId 音频唯一标识
   * @param {string} src 音频源地址
   * @param {Object} options 配置选项
   */
  createAudio(audioId, src, options = {}) {
    if (this.audioContexts.has(audioId)) {
      console.warn(`音频 ${audioId} 已存在`);
      return this.audioContexts.get(audioId);
    }

    const audioContext = wx.createInnerAudioContext();
    audioContext.src = src;
    audioContext.loop = options.loop || false;
    audioContext.volume = options.volume || 1.0;

    // 设置事件监听
    this.setupAudioEvents(audioId, audioContext);

    // 存储音频上下文和状态
    this.audioContexts.set(audioId, audioContext);
    this.audioStates.set(audioId, {
      isPlaying: false,
      isPaused: false,
      duration: 0,
      currentTime: 0,
      volume: options.volume || 1.0,
      loop: options.loop || false,
      src: src
    });

    return audioContext;
  }

  /**
   * 设置音频事件监听
   * @param {string} audioId 音频ID
   * @param {Object} audioContext 音频上下文
   */
  setupAudioEvents(audioId, audioContext) {
    audioContext.onPlay(() => {
      console.log(`音频 ${audioId} 开始播放`);
      this.updateAudioState(audioId, { isPlaying: true, isPaused: false });
    });

    audioContext.onPause(() => {
      console.log(`音频 ${audioId} 暂停播放`);
      this.updateAudioState(audioId, { isPlaying: false, isPaused: true });
    });

    audioContext.onStop(() => {
      console.log(`音频 ${audioId} 停止播放`);
      this.updateAudioState(audioId, { isPlaying: false, isPaused: false });
    });

    audioContext.onEnded(() => {
      console.log(`音频 ${audioId} 播放结束`);
      this.updateAudioState(audioId, { isPlaying: false, isPaused: false });
    });

    audioContext.onTimeUpdate(() => {
      this.updateAudioState(audioId, { 
        currentTime: audioContext.currentTime,
        duration: audioContext.duration 
      });
    });

    audioContext.onError((res) => {
      console.error(`音频 ${audioId} 播放错误:`, res);
      this.updateAudioState(audioId, { isPlaying: false, isPaused: false });
    });

    audioContext.onCanplay(() => {
      console.log(`音频 ${audioId} 可以播放`);
    });
  }

  /**
   * 更新音频状态
   * @param {string} audioId 音频ID
   * @param {Object} newState 新状态
   */
  updateAudioState(audioId, newState) {
    if (this.audioStates.has(audioId)) {
      const currentState = this.audioStates.get(audioId);
      this.audioStates.set(audioId, { ...currentState, ...newState });
    }
  }

  /**
   * 播放音频
   * @param {string} audioId 音频ID
   */
  play(audioId) {
    const audioContext = this.audioContexts.get(audioId);
    if (audioContext) {
      audioContext.play();
    } else {
      console.error(`音频 ${audioId} 不存在`);
    }
  }

  /**
   * 暂停音频
   * @param {string} audioId 音频ID
   */
  pause(audioId) {
    const audioContext = this.audioContexts.get(audioId);
    if (audioContext) {
      audioContext.pause();
    } else {
      console.error(`音频 ${audioId} 不存在`);
    }
  }

  /**
   * 停止音频
   * @param {string} audioId 音频ID
   */
  stop(audioId) {
    const audioContext = this.audioContexts.get(audioId);
    if (audioContext) {
      audioContext.stop();
    } else {
      console.error(`音频 ${audioId} 不存在`);
    }
  }

  /**
   * 设置音频音量
   * @param {string} audioId 音频ID
   * @param {number} volume 音量 (0-1)
   */
  setVolume(audioId, volume) {
    const audioContext = this.audioContexts.get(audioId);
    if (audioContext) {
      audioContext.volume = Math.max(0, Math.min(1, volume));
      this.updateAudioState(audioId, { volume });
    } else {
      console.error(`音频 ${audioId} 不存在`);
    }
  }

  /**
   * 设置音频播放位置
   * @param {string} audioId 音频ID
   * @param {number} position 播放位置（秒）
   */
  seek(audioId, position) {
    const audioContext = this.audioContexts.get(audioId);
    if (audioContext) {
      audioContext.seek(position);
    } else {
      console.error(`音频 ${audioId} 不存在`);
    }
  }

  /**
   * 设置音频循环播放
   * @param {string} audioId 音频ID
   * @param {boolean} loop 是否循环
   */
  setLoop(audioId, loop) {
    const audioContext = this.audioContexts.get(audioId);
    if (audioContext) {
      audioContext.loop = loop;
      this.updateAudioState(audioId, { loop });
    } else {
      console.error(`音频 ${audioId} 不存在`);
    }
  }

  /**
   * 获取音频状态
   * @param {string} audioId 音频ID
   * @returns {Object} 音频状态
   */
  getAudioState(audioId) {
    return this.audioStates.get(audioId) || null;
  }

  /**
   * 获取所有音频状态
   * @returns {Map} 所有音频状态
   */
  getAllAudioStates() {
    return this.audioStates;
  }

  /**
   * 播放所有音频
   */
  playAll() {
    this.audioContexts.forEach((audioContext, audioId) => {
      this.play(audioId);
    });
  }

  /**
   * 暂停所有音频
   */
  pauseAll() {
    this.audioContexts.forEach((audioContext, audioId) => {
      this.pause(audioId);
    });
  }

  /**
   * 停止所有音频
   */
  stopAll() {
    this.audioContexts.forEach((audioContext, audioId) => {
      this.stop(audioId);
    });
  }

  /**
   * 销毁音频实例
   * @param {string} audioId 音频ID
   */
  destroyAudio(audioId) {
    const audioContext = this.audioContexts.get(audioId);
    if (audioContext) {
      audioContext.destroy();
      this.audioContexts.delete(audioId);
      this.audioStates.delete(audioId);
    }
  }

  /**
   * 销毁所有音频实例
   */
  destroyAll() {
    this.audioContexts.forEach((audioContext, audioId) => {
      audioContext.destroy();
    });
    this.audioContexts.clear();
    this.audioStates.clear();
  }

  /**
   * 获取正在播放的音频数量
   * @returns {number} 正在播放的音频数量
   */
  getPlayingCount() {
    let count = 0;
    this.audioStates.forEach((state) => {
      if (state.isPlaying) {
        count++;
      }
    });
    return count;
  }
}

// 创建全局音频管理器实例
const audioManager = new AudioManager();

module.exports = audioManager;