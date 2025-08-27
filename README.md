# 微信小程序 wxml-to-canvas 聊天界面 Demo

这是一个使用 wxml-to-canvas 技术绘制复杂聊天界面样式的微信小程序演示项目。

## 功能特点

- ✅ 完整的聊天界面样式绘制
- ✅ 支持左右不同样式的消息气泡
- ✅ 头像圆形裁剪显示
- ✅ 多行文本自动换行
- ✅ 时间戳显示
- ✅ 昵称显示
- ✅ Canvas 导出为图片
- ✅ 交互式消息添加

## 项目结构

```
├── app.js                          # 小程序入口文件
├── app.json                        # 小程序配置文件
├── app.wxss                        # 全局样式文件
├── pages/
│   ├── index/                      # 首页
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   └── chat-demo/                  # 聊天Demo页面
│       ├── chat-demo.js
│       ├── chat-demo.json
│       ├── chat-demo.wxml
│       └── chat-demo.wxss
├── components/
│   └── wxml-to-canvas/            # wxml-to-canvas组件
│       ├── index.js
│       ├── index.json
│       ├── index.wxml
│       └── index.wxss
└── README.md
```

## 核心功能

### 1. wxml-to-canvas 组件

位于 `components/wxml-to-canvas/` 目录，提供以下主要方法：

- `drawChatMessage()` - 绘制单条聊天消息
- `drawChatBubble()` - 绘制消息气泡
- `drawAvatar()` - 绘制圆形头像
- `drawText()` - 绘制文本（支持换行）
- `renderChatInterface()` - 渲染完整聊天界面
- `canvasToTempFilePath()` - 导出Canvas为图片

### 2. 聊天界面样式

- **消息气泡**: 支持左右两种样式，自带小箭头指向
- **头像显示**: 圆形裁剪，支持占位符
- **文本换行**: 自动计算文本宽度并换行
- **时间显示**: 格式化时间戳
- **昵称显示**: 仅在接收消息时显示

### 3. 交互功能

- 手动输入消息
- 预设消息快速发送
- 随机消息生成
- Canvas实时渲染
- 图片保存到相册

## 使用方法

1. 在微信开发者工具中导入项目
2. 运行项目，进入"聊天Demo"页面
3. 点击"渲染聊天界面"按钮生成Canvas图像
4. 可以通过输入框或预设按钮添加新消息
5. 点击"保存图片"将Canvas导出到相册

## 技术要点

### Canvas绘制优化

- 使用 `wx.createCanvasContext()` 创建绘图上下文
- 支持文本测量和自动换行
- 圆角矩形和复杂路径绘制
- 图层管理和绘制顺序控制

### 样式计算

- 动态计算消息气泡尺寸
- 文本行数和宽度自适应
- 布局元素位置精确计算

### 性能优化

- 按需重新绘制Canvas
- 避免频繁的DOM操作
- 合理的组件生命周期管理

## 自定义扩展

可以通过修改以下部分来自定义样式：

1. **颜色主题**: 修改 `drawChatBubble()` 中的 `fillStyle` 参数
2. **字体样式**: 调整 `drawText()` 中的字体大小和颜色
3. **布局间距**: 修改 `drawChatMessage()` 中的 padding 值
4. **气泡样式**: 调整 `drawChatBubble()` 中的圆角和箭头参数

## 注意事项

- 确保在真机上测试Canvas功能
- 保存图片需要用户授权访问相册
- Canvas尺寸建议根据实际需求调整
- 文本换行计算可能在不同设备上有差异

## 兼容性

- 微信小程序基础库 2.0.0+
- 支持iOS和Android平台
- Canvas 2D API 兼容性良好