Page({
  /**
   * 页面的初始数据
   */
  data: {
    selectedDate: '',
    selectedDateText: '',
    medicationDates: {
      // 示例数据：用药日期标记
      '2023-09-15': { hasMedication: false, isCompleted: true },
      '2023-09-17': { hasMedication: true, isCompleted: false },
      '2023-09-27': { hasMedication: true, isCompleted: false },
      '2023-09-30': { hasMedication: true, isCompleted: false }
    },
    medicationList: [],
    // 所有用药数据
    allMedications: {
      '2023-09-17': [
        { id: 1, name: '阿司匹林 1片', time: '早上8:00', completed: false },
        { id: 2, name: '维生素C 1片', time: '中午12:30', completed: false },
        { id: 3, name: '胰岛素 1针', time: '晚上19:00', completed: false }
      ],
      '2023-09-15': [
        { id: 4, name: '感冒灵 1片', time: '早上8:00', completed: true }
      ],
      '2023-09-27': [
        { id: 5, name: '维生素D 1片', time: '早上9:00', completed: false }
      ],
      '2023-09-30': [
        { id: 6, name: '钙片 2片', time: '晚上20:00', completed: false }
      ]
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 初始化为今天
    const today = new Date()
    const dateStr = this.formatDate(today)
    this.setData({
      selectedDate: dateStr,
      selectedDateText: this.formatDateText(today)
    })
    this.loadMedicationList(dateStr)
  },

  /**
   * 格式化日期为 YYYY-MM-DD
   */
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  /**
   * 格式化日期为显示文本
   */
  formatDateText(date) {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const weekDay = weekDays[date.getDay()]
    return `${month}月${day}日 ${weekDay}`
  },

  /**
   * 日期变更事件
   */
  onDateChange(e) {
    const { date } = e.detail
    const dateObj = new Date(date)
    
    this.setData({
      selectedDate: date,
      selectedDateText: this.formatDateText(dateObj)
    })
    this.loadMedicationList(date)
  },

  /**
   * 加载指定日期的用药列表
   */
  loadMedicationList(date) {
    const medicationList = this.data.allMedications[date] || []
    this.setData({ medicationList })
  },

  /**
   * 切换用药完成状态
   */
  toggleMedication(e) {
    const { id } = e.currentTarget.dataset
    const { selectedDate, allMedications, medicationDates } = this.data
    const medicationList = allMedications[selectedDate] || []
    
    // 更新用药完成状态
    const updatedList = medicationList.map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed }
      }
      return item
    })
    
    // 检查是否所有用药都已完成
    const allCompleted = updatedList.every(item => item.completed)
    const hasMedication = updatedList.some(item => !item.completed)
    
    // 更新日期标记
    const updatedDates = {
      ...medicationDates,
      [selectedDate]: {
        hasMedication: hasMedication,
        isCompleted: allCompleted && updatedList.length > 0
      }
    }
    
    this.setData({
      [`allMedications.${selectedDate}`]: updatedList,
      medicationList: updatedList,
      medicationDates: updatedDates
    })
  },

  /**
   * 返回按钮
   */
  goBack() {
    wx.navigateBack()
  },

  /**
   * 修改用药
   */
  editMedication() {
    wx.showToast({
      title: '修改用药功能开发中',
      icon: 'none'
    })
  },

  /**
   * 添加用药
   */
  addMedication() {
    wx.showToast({
      title: '添加用药功能开发中',
      icon: 'none'
    })
  }
})
