# 用药提醒小程序 - 日历功能

这是一个微信小程序的用药提醒日历功能实现，包含完整的日历组件和用药管理页面。

## 功能特性

### 📅 日历组件
- ✅ 月份切换（左右箭头）
- ✅ 日期显示（包含上月和下月的日期）
- ✅ 当前日期高亮（蓝色圆圈）
- ✅ 用药标记（黄色小点）
- ✅ 已完成标记（绿色小点）
- ✅ 日期选择功能
- ✅ 响应式设计

### 💊 用药管理
- ✅ 今日用药列表展示
- ✅ 用药完成状态切换
- ✅ 不同日期的用药数据管理
- ✅ 空状态提示
- ✅ 添加/修改用药按钮

## 项目结构

```
miniprogram/
├── app.json                    # 小程序配置文件
├── app.js                      # 小程序入口文件
├── app.wxss                    # 全局样式
├── sitemap.json               # 站点地图配置
├── components/                # 组件目录
│   └── calendar/              # 日历组件
│       ├── calendar.wxml      # 日历模板
│       ├── calendar.wxss      # 日历样式
│       ├── calendar.js        # 日历逻辑
│       └── calendar.json      # 日历配置
└── pages/                     # 页面目录
    └── medication/            # 用药提醒页面
        ├── medication.wxml    # 页面模板
        ├── medication.wxss    # 页面样式
        ├── medication.js      # 页面逻辑
        └── medication.json    # 页面配置
```

## 使用方法

### 1. 导入项目

将 `miniprogram` 文件夹导入到微信开发者工具中。

### 2. 配置小程序

确保已经在微信公众平台注册小程序并获取 AppID。

### 3. 运行项目

在微信开发者工具中打开项目，点击"编译"即可预览。

## 组件使用

### Calendar 日历组件

```xml
<calendar 
  medicationDates="{{medicationDates}}" 
  bind:datechange="onDateChange">
</calendar>
```

#### 属性说明

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|-----|------|--------|------|------|
| medicationDates | Object | {} | 否 | 用药日期数据 |

#### 事件说明

| 事件名 | 说明 | 参数 |
|--------|------|------|
| datechange | 日期选择变化 | event.detail = { date: '2023-09-17' } |

#### medicationDates 数据格式

```javascript
{
  '2023-09-15': { 
    hasMedication: false,  // 是否有待用药
    isCompleted: true      // 是否已完成
  },
  '2023-09-17': { 
    hasMedication: true, 
    isCompleted: false 
  }
}
```

## 数据结构

### 用药数据

```javascript
allMedications: {
  '2023-09-17': [
    { 
      id: 1, 
      name: '阿司匹林 1片', 
      time: '早上8:00', 
      completed: false 
    },
    { 
      id: 2, 
      name: '维生素C 1片', 
      time: '中午12:30', 
      completed: false 
    }
  ]
}
```

## 自定义配置

### 修改主题色

在 `components/calendar/calendar.wxss` 中修改：

```css
/* 主题蓝色 */
.date-item.today {
  background: #1677ff; /* 修改此处改变今日高亮颜色 */
}

/* 用药标记颜色 */
.marker.medication {
  background: #faad14; /* 黄色 */
}

/* 已完成标记颜色 */
.marker.completed {
  background: #52c41a; /* 绿色 */
}
```

### 添加图标

将药丸图标放置在 `miniprogram/images/pill-icon.png`，或修改 `medication.wxml` 中的图标路径。

## 功能扩展建议

1. **数据持久化**：使用微信小程序的 `wx.setStorageSync` 保存用药数据
2. **提醒功能**：集成小程序订阅消息，实现用药提醒
3. **统计报表**：添加用药统计页面，展示服药情况
4. **云端同步**：使用微信云开发实现多端数据同步
5. **用药详情**：添加用药详情页面，包含用量、注意事项等

## 技术栈

- 微信小程序原生框架
- WXML + WXSS + JavaScript
- 组件化开发

## 注意事项

1. 日历组件会自动计算每月的天数和起始星期
2. 日期格式统一使用 `YYYY-MM-DD` 格式
3. 组件内部已处理闰年和月份跨年的情况
4. 建议将用药数据存储到本地或云端，当前为演示数据

## 开发计划

- [ ] 添加用药详情页
- [ ] 实现用药提醒推送
- [ ] 添加用药历史统计
- [ ] 支持多人用药管理
- [ ] 导出用药记录

## 许可证

MIT License

---

**开发者提示**：这是一个完整的日历功能实现，可以直接集成到你的小程序项目中使用。
