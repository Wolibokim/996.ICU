# 微信小程序 wxml-to-canvas 聊天界面 Demo

这是一个使用官方 wxml-to-canvas 插件绘制复杂聊天界面样式的微信小程序演示项目。

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
├── node_modules/                  # npm依赖包
│   └── wxml-to-canvas/            # 官方wxml-to-canvas插件
├── pages/chat-demo/
│   └── chat-template.js           # 聊天界面WXML模板和样式定义
└── README.md
```

## 核心功能

### 1. wxml-to-canvas 官方插件

使用官方 `wxml-to-canvas` npm 包，提供以下主要功能：

- `renderToCanvas()` - 将WXML模板渲染到Canvas
- `canvasToTempFilePath()` - 导出Canvas为图片
- 支持复杂的CSS样式
- 支持Flexbox布局
- 支持文本自动换行

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
2. 在微信开发者工具中点击"工具" -> "构建 npm"
3. 运行项目，进入"聊天Demo"页面
4. 点击"渲染聊天界面"按钮生成Canvas图像
5. 可以通过输入框或预设按钮添加新消息
6. 点击"保存图片"将Canvas导出到相册

## 安装依赖

```bash
npm install
```

然后在微信开发者工具中构建 npm。

## 技术要点

### WXML模板系统

- 使用字符串模板生成动态WXML结构
- 支持JavaScript表达式和循环
- 分离模板逻辑和样式定义
- 易于维护和扩展

### CSS-in-JS样式系统

- 使用JavaScript对象定义样式
- 支持Flexbox布局模型
- 响应式尺寸计算
- 条件样式应用

### 性能优化

- 按需重新渲染Canvas
- 模板缓存和复用
- 异步渲染处理

## 自定义扩展

可以通过修改以下部分来自定义样式：

1. **颜色主题**: 修改 `chat-template.js` 中的 `chatStyle` 颜色值
2. **字体样式**: 调整样式对象中的 `fontSize` 和 `color` 属性
3. **布局间距**: 修改样式中的 `padding` 和 `margin` 值
4. **消息结构**: 编辑 `chatWxml()` 函数中的WXML模板结构

## 注意事项

- 确保在微信开发者工具中构建npm
- 确保在真机上测试Canvas功能
- 保存图片需要用户授权访问相册
- 避免在wxml-to-canvas组件外层使用wx:if或hidden
- WXML模板中的样式需要使用JavaScript对象格式

## 兼容性

- 微信小程序基础库 2.0.0+
- 支持iOS和Android平台
- Canvas 2D API 兼容性良好