// pages/index/index.js
Page({
  data: {
    // 顶部状态栏高度适配（假设值，实际开发中需获取系统信息）
    statusBarHeight: 44, 
    navBarHeight: 44,
    
    menuItems: [
      { id: 1, title: '健康日历', icon: '📅', color: '#e3f2fd', iconColor: '#2196f3' },
      { id: 2, title: '健康咨询', icon: '💓', color: '#e3f2fd', iconColor: '#2196f3' },
      { id: 3, title: '望诊', icon: '👅', color: '#e3f2fd', iconColor: '#2196f3' },
      { id: 4, title: '认知训练', icon: '🧠', color: '#e3f2fd', iconColor: '#2196f3' },
      { id: 5, title: '拍照识成分', icon: '📷', color: '#e3f2fd', iconColor: '#2196f3' },
      { id: 6, title: '拍照识营养', icon: '🥗', color: '#e3f2fd', iconColor: '#2196f3' },
      { id: 7, title: '健康档案', icon: '📂', color: '#e3f2fd', iconColor: '#2196f3' }
    ],
    
    hotTopic: '甲流过后新冠又开始了吗？',
    tip: '今天教你如何正确晒背'
  },

  onLoad() {
    // 获取系统信息以适配刘海屏等
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
  },

  onMenuItemTap(e) {
    const item = e.currentTarget.dataset.item;
    wx.showToast({
      title: `点击了${item.title}`,
      icon: 'none'
    });
  },

})
