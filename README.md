# 微信小程序多音频播放器

这是一个微信小程序项目，实现了同时播放多段线上音频的功能。

## 功能特性

- ✅ **多音频同时播放**：支持同时播放多个音频文件
- ✅ **独立控制**：每个音频都有独立的播放、暂停、停止控制
- ✅ **音量调节**：支持单独调节每个音频的音量
- ✅ **循环播放**：支持设置音频循环播放
- ✅ **进度显示**：实时显示播放进度和时间
- ✅ **全局控制**：支持一键播放/暂停/停止所有音频
- ✅ **动态添加**：支持动态添加新的音频文件
- ✅ **美观界面**：现代化的用户界面设计

## 项目结构

```
├── app.js                    # 小程序入口文件
├── app.json                  # 小程序配置文件
├── app.wxss                  # 全局样式文件
├── sitemap.json              # 站点地图配置
├── project.config.json       # 项目配置文件
├── pages/
│   └── index/               # 主页面
│       ├── index.js         # 页面逻辑
│       ├── index.wxml       # 页面结构
│       ├── index.wxss       # 页面样式
│       └── index.json       # 页面配置
└── utils/
    └── audioManager.js      # 音频管理器
```

## 核心组件

### AudioManager 音频管理器

位于 `utils/audioManager.js`，是实现多音频同时播放的核心组件。

**主要功能：**
- 创建和管理多个音频实例
- 提供统一的音频控制接口
- 实时状态监控和更新
- 资源管理和清理

**主要方法：**
```javascript
// 创建音频实例
audioManager.createAudio(audioId, src, options)

// 播放控制
audioManager.play(audioId)
audioManager.pause(audioId)
audioManager.stop(audioId)

// 音量和循环控制
audioManager.setVolume(audioId, volume)
audioManager.setLoop(audioId, loop)

// 全局控制
audioManager.playAll()
audioManager.pauseAll()
audioManager.stopAll()

// 获取状态
audioManager.getAudioState(audioId)
audioManager.getPlayingCount()
```

## 使用方法

### 1. 导入项目

将项目文件复制到您的微信小程序开发工具中。

### 2. 配置音频源

在 `pages/index/index.js` 的 `initSampleAudios()` 方法中配置您的音频文件：

```javascript
const sampleAudios = [
  {
    id: 'audio1',
    title: '您的音频标题',
    src: 'https://your-domain.com/audio1.mp3'
  },
  // 添加更多音频...
];
```

### 3. 音频源要求

- **格式支持**：MP3、AAC、M4A等微信小程序支持的音频格式
- **网络要求**：音频文件必须支持HTTPS访问
- **跨域要求**：确保音频服务器允许跨域访问
- **建议来源**：
  - 自己的服务器
  - 支持跨域的音频CDN
  - 微信小程序云存储

### 4. 运行项目

1. 在微信开发者工具中打开项目
2. 确保已配置正确的AppID
3. 点击预览或真机调试

## 界面说明

### 主界面功能

1. **全局控制区域**
   - 播放全部：同时播放所有音频
   - 暂停全部：暂停所有正在播放的音频
   - 停止全部：停止所有音频播放

2. **状态显示区域**
   - 显示当前正在播放的音频数量

3. **音频列表区域**
   - 每个音频项包含：
     - 音频标题和URL
     - 播放进度条和时间显示
     - 播放/暂停/停止按钮
     - 音量滑块控制
     - 循环播放开关

4. **添加音频按钮**
   - 点击可动态添加新的音频文件

## 技术实现

### 多音频同时播放原理

1. **音频上下文管理**：使用Map结构管理多个`wx.createInnerAudioContext()`实例
2. **状态同步**：通过定时器定期同步所有音频的播放状态
3. **事件处理**：为每个音频实例绑定完整的事件监听
4. **资源管理**：及时清理不使用的音频资源

### 关键技术点

- **InnerAudioContext**：微信小程序的音频播放API
- **状态管理**：实时跟踪每个音频的播放状态
- **事件驱动**：基于音频事件更新UI状态
- **内存管理**：合理管理音频资源，避免内存泄漏

## 注意事项

1. **音频格式**：确保使用微信小程序支持的音频格式
2. **网络环境**：音频文件必须通过HTTPS访问
3. **跨域问题**：确保音频服务器配置了正确的CORS策略
4. **性能考虑**：同时播放过多音频可能影响性能
5. **用户体验**：建议提供音频加载状态提示

## 扩展功能

可以考虑添加的功能：
- 音频文件本地缓存
- 播放列表管理
- 音频可视化效果
- 定时播放功能
- 音频混音效果

## 许可证

本项目遵循 MIT 许可证。