Component({
  properties: {
    // 这里可以定义传入的属性
  },

  data: {
    // 组件内部数据
  },

  methods: {
    onSpeakBtnPress() {
      wx.showToast({
        title: '开始录音...',
        icon: 'none'
      });
      // 触发父组件事件，以便父组件也可以处理逻辑
      this.triggerEvent('startrecord');
    },
    
    onSpeakBtnRelease() {
      wx.showToast({
        title: '录音结束',
        icon: 'success'
      });
      // 触发父组件事件
      this.triggerEvent('stoprecord');
    }
  }
})
