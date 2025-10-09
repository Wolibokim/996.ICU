Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 用药日期数据 { '2023-09-15': { hasMedication: true, isCompleted: false } }
    medicationDates: {
      type: Object,
      value: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    currentYear: 2023,
    currentMonth: 9,
    selectedDate: '',
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    calendar: []
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 初始化为当前日期
      const now = new Date()
      this.setData({
        currentYear: now.getFullYear(),
        currentMonth: now.getMonth() + 1,
        selectedDate: this.formatDate(now)
      })
      this.generateCalendar()
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 生成日历数据
     */
    generateCalendar() {
      const { currentYear, currentMonth } = this.data
      const firstDay = new Date(currentYear, currentMonth - 1, 1)
      const lastDay = new Date(currentYear, currentMonth, 0)
      const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0)
      
      const firstDayWeek = firstDay.getDay() // 本月第一天是星期几
      const totalDays = lastDay.getDate() // 本月总天数
      const prevMonthDays = prevMonthLastDay.getDate() // 上月总天数
      
      const calendar = []
      let week = []
      
      // 填充上个月的日期
      for (let i = firstDayWeek - 1; i >= 0; i--) {
        const day = prevMonthDays - i
        const date = this.getDateString(currentYear, currentMonth - 1, day)
        week.push({
          day,
          date,
          isCurrentMonth: false,
          isToday: false,
          isSelected: false,
          hasMedication: false,
          isCompleted: false
        })
      }
      
      // 填充本月的日期
      for (let day = 1; day <= totalDays; day++) {
        const date = this.getDateString(currentYear, currentMonth, day)
        const today = this.formatDate(new Date())
        const medicationInfo = this.data.medicationDates[date] || {}
        
        week.push({
          day,
          date,
          isCurrentMonth: true,
          isToday: date === today,
          isSelected: date === this.data.selectedDate,
          hasMedication: medicationInfo.hasMedication || false,
          isCompleted: medicationInfo.isCompleted || false
        })
        
        if (week.length === 7) {
          calendar.push(week)
          week = []
        }
      }
      
      // 填充下个月的日期
      if (week.length > 0) {
        let nextMonthDay = 1
        while (week.length < 7) {
          const date = this.getDateString(currentYear, currentMonth + 1, nextMonthDay)
          week.push({
            day: nextMonthDay,
            date,
            isCurrentMonth: false,
            isToday: false,
            isSelected: false,
            hasMedication: false,
            isCompleted: false
          })
          nextMonthDay++
        }
        calendar.push(week)
      }
      
      this.setData({ calendar })
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
     * 获取指定年月日的日期字符串
     */
    getDateString(year, month, day) {
      let actualYear = year
      let actualMonth = month
      
      if (month < 1) {
        actualYear--
        actualMonth = 12
      } else if (month > 12) {
        actualYear++
        actualMonth = 1
      }
      
      return `${actualYear}-${String(actualMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    },

    /**
     * 上一个月
     */
    prevMonth() {
      let { currentYear, currentMonth } = this.data
      currentMonth--
      if (currentMonth < 1) {
        currentMonth = 12
        currentYear--
      }
      this.setData({ currentYear, currentMonth })
      this.generateCalendar()
    },

    /**
     * 下一个月
     */
    nextMonth() {
      let { currentYear, currentMonth } = this.data
      currentMonth++
      if (currentMonth > 12) {
        currentMonth = 1
        currentYear++
      }
      this.setData({ currentYear, currentMonth })
      this.generateCalendar()
    },

    /**
     * 选择日期
     */
    selectDate(e) {
      const { date, isCurrent } = e.currentTarget.dataset
      if (!isCurrent) return // 只能选择当前月份的日期
      
      this.setData({ selectedDate: date })
      this.generateCalendar()
      
      // 触发日期选择事件
      this.triggerEvent('datechange', { date })
    }
  }
})
