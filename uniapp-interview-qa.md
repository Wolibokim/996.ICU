### 深度 uni-app 前端面试题（含答案与跨端实践）

> 适用于 H5 / 微信小程序 / iOS / Android 的跨端岗位面试。题目覆盖原理、工程化、性能优化、原生能力、兼容与常见问题。每题附参考答案要点，便于快速对比候选人深度。

---

#### 1. uni-app 的运行时与编译时分别做了什么？和纯小程序/H5/Vue 项目相比最大的差异是什么？

参考答案：
- **编译时**：将同一份基于 Vue 的源代码，按目标平台（H5、各类小程序、App-Plus）产出不同制品：
  - H5：Vite/Webpack 打包为浏览器可执行的 HTML/CSS/JS；
  - 小程序：生成平台规范的 `app.json/pages.json/wxml/wxss/js` 等；
  - App：生成 App-Plus（基于 WebView 与原生容器）的资源包，`nvue` 走原生渲染引擎（原 weex）；
  - 条件编译（`#ifdef H5 | MP-WEIXIN | APP-PLUS`）在编译阶段裁剪分支；
  - 运行时 API 做平台能力映射（如 `uni.request` 到 `wx.request`/`fetch`/原生网络模块）。
- **运行时**：提供跨端统一 API、组件语义与生命周期封装；在 App-Plus 中通过原生容器桥接原生能力；H5 走浏览器环境；小程序走宿主 JSCore/沙箱。
- **差异**：
  - 技术栈统一与多端产物输出；
  - 生命周期、DOM 能力、样式单位、渲染引擎在各端不同（如小程序无真实 DOM、`nvue` 原生渲染限制 CSS）；
  - 生态差异：插件、原生能力获取路径不同（小程序能力依赖宿主、App 依赖 App-Plus/原生插件）。

---

#### 2. 何时选择 `nvue`？它与普通 `vue` 页面在性能与样式能力上的取舍是什么？

参考答案：
- **使用场景**：复杂长列表、动画交互频繁、需要接近原生的滑动与帧率体验、低端机性能要求；
- **优势**：
  - 原生渲染，减少 WebView 开销，滑动、手势、列表性能更好；
  - 与原生能力耦合更紧，某些手势/滚动事件可达 60fps；
- **限制**：
  - CSS 能力受限（不支持所有 CSS 特性，选择器、伪类受限）；
  - DOM API 不可用；
  - 第三方 H5 组件库复用度低；
- **工程策略**：核心页面用 `nvue`（如首页 feed、IM 会话列表），其余用 `vue`，用路由与条件编译隔离差异。

---

#### 3. `pages.json` 与 `manifest.json` 的职责分别是什么？请举例说明常见配置项及跨端差异。

参考答案：
- `pages.json`：页面路由、导航栏、分包、tabBar、窗口与页面级样式等；跨端多数生效。
  - 示例：分包、tabBar、导航栏样式、`easycom` 自动引入组件规则、`styleIsolation` 等。
- `manifest.json`：应用级元信息与目标平台配置；对 App-Plus、各小程序/H5 打包能力影响大。
  - 示例：应用名称、图标与启动图、推送、地理位置、权限声明、iOS/Android SDK 配置、小程序 appid、域名白名单。
- 差异：
  - 小程序强制配置合法域名与权限，`manifest` 对其产物影响较小；
  - App 强依赖 `manifest` 的原生权限与 SDK；
  - H5 更多影响 SEO、PWA、路由模式、公共路径。

---

#### 4. 请对比 H5 / 微信小程序 / App 的页面生命周期差异，并说明如何编写可复用的生命周期逻辑。

参考答案：
- 共有：`onLoad / onShow / onHide / onUnload / onPullDownRefresh / onReachBottom` 等在 uni-app 层提供同名/等效钩子；
- 差异：
  - H5 受浏览器历史与可见性影响（`visibilitychange`、前进后退缓存）；
  - 小程序存在页面栈与宿主重建机制（后台回收、冷启动、热启动）；
  - App-Plus 页面驻留策略不同，Android 返回键行为要单独处理；
- 复用策略：
  - 将通用逻辑抽到组合式函数/自定义 hooks（例如 `usePageShow`）；
  - 跨端差异用条件编译或运行时判断（如 `process.env.UNI_PLATFORM`）做分支；
  - 避免在 `onShow` 频繁触发昂贵网络/计算，使用节流与缓存。

---

#### 5. 条件编译如何落地？常见的条件分支有哪些？请给出代码示例与最佳实践。

参考答案：
- 指令：`#ifdef` / `#ifndef` / `#endif`；常见平台标识：`H5`、`MP-WEIXIN`、`APP-PLUS`、`MP-ALIPAY`、`MP-BAIDU` 等；
- 示例：

```js
// H5 使用浏览器 API，小程序使用 wx 能力，App 使用 plus 原生
// #ifdef H5
localStorage.setItem('k', 'v')
// #endif

// #ifdef MP-WEIXIN
wx.setStorageSync('k', 'v')
// #endif

// #ifdef APP-PLUS
plus.storage.setItem('k', 'v')
// #endif
```

- 最佳实践：
  - 将条件分支封装为适配层函数，导出统一接口，尽量避免在业务处散落条件编译；
  - 控制分支粒度，减少维护成本；
  - 对于仅运行时差异，优先运行时分发；涉及打包资产与权限时用条件编译。

---

#### 6. rpx/upx/px 的区别？如何保证多端与多机型的视觉一致性？

参考答案：
- 小程序端常用 `rpx`，App/H5 常用 `upx`/`px`；`rpx/upx` 会按屏宽做等比缩放；
- 策略：
  - 统一设计基准（如 750 设计稿），采用 `rpx/upx` + 自适应布局；
  - 字体与间距设最小值，避免在超小屏过小；
  - 高密度屏与刘海屏（安全区）做适配；
  - 图片资源按倍率与 `srcset`/多分辨率准备；
  - H5 中注意浏览器缩放与 DPR 差异。

---

#### 7. 列表与长页面性能如何优化？在 H5/小程序/App 分别有哪些手段？

参考答案：
- 通用：虚拟列表/分片渲染、懒加载、骨架屏、避免频繁 setData/state 更新、图片压缩与懒加载；
- 小程序：
  - 使用 `recycle-view`/`virtual-list`（或组件库实现）；
  - 控制 setData 频率与数据量（diff 粒度）；
- H5：
  - `IntersectionObserver` 懒加载、`requestIdleCallback`/微任务切片；
  - 开启 GPU 加速的动画（transform/opacity），避免强制重排；
- App-Plus：
  - `nvue` 原生渲染替代 WebView；
  - 使用原生 list 组件与缓存复用；
  - 降级策略给老旧设备。

---

#### 8. 上传/下载、大文件与断点续传在各端如何做？Cookie/Session 在各端的差异是什么？

参考答案：
- 统一使用 `uni.uploadFile` / `uni.downloadFile`；App 可通过原生插件支持更复杂的断点续传；
- 小程序端：不共享浏览器 Cookie，`wx.request` 与登录态通常通过 `header` token 或 `wx.login` + 后端会话绑定；
- H5：走浏览器 Cookie/Storage，同源策略受限，需 CORS；
- App：可持久化到原生存储、更自由地管理请求与文件系统；
- 断点续传：记录分片与偏移，后端提供分块合并接口；失败重试与秒传（hash）优化。

---

#### 9. 登录与权限体系如何统一？以微信登录为例，说明三端落地方案与回退路径。

参考答案：
- 小程序：`wx.login` -> code 交换 session/openid/unionid -> 绑定账户；
- H5：微信内置浏览器用 OAuth2 网页授权；普通浏览器走手机验证码/账号密码；
- App：微信 SDK（通过 App-Plus 原生插件）拉起授权；
- 统一：抽象认证接口为 `login()`，内部按平台分发；失败回退到短信验证码登录；token 存储统一放在适配层；
- 风险：多端 unionid 绑定、三方 SDK 版本兼容、iOS 审核合规。

---

#### 10. 分包、独立分包与预下载如何配置？在小程序与 App/H5 各自的价值是什么？

参考答案：
- 目的：降低首包体积、提升首屏、实现业务按需加载；
- 小程序：主包<=2MB（平台限制可能调整），业务分模块分包，静态资源放分包；独立分包适合活动/落地页；
- App/H5：代码分割 + 路由级懒加载，首屏只加载核心；
- 实施：`pages.json` 中配置 subPackages；路由懒加载 + 按需注册组件；
- 监控：按路由维度统计加载时长与失败率，优化分包边界。

---

#### 11. 如何在 uni-app 中使用 Pinia/Vuex 管理全局状态，并处理跨页面通信与页面重建？

参考答案：
- 使用 Pinia/Vuex 持有全局数据，结合 `onShow`/`onLoad` 做数据刷新；
- 跨页面通信：事件总线（`uni.$emit/$on`）、本地存储、URL 参数、全局 store；
- 页面重建：小程序后台回收后需在 `onLoad` 恢复状态或从缓存恢复；
- 谨慎：避免在 `onShow` 里无条件拉取；加版本戳/脏标记；
- SSR 不适用，H5 可选 CSR 方案。

---

#### 12. 文件系统、缓存与离线能力在三端的可行性如何？

参考答案：
- 小程序：临时/本地文件系统 API 受配额限制；离线缓存有限（`wx.setStorage` 上限）；
- H5：`localStorage/indexedDB/CacheStorage` + Service Worker 可做离线 PWA；
- App：原生文件系统读写，容量大、权限需声明；
- 策略：统一缓存接口 + 能力探测，资源采用版本化与增量更新；
- 风险：iOS 后台清理策略、安卓分区存储。

---

#### 13. WebView 与原生渲染（nvue）的交互桥如何设计？如何避免阻塞与内存泄漏？

参考答案：
- 交互：消息通道（postMessage）、JSBridge、事件分发；
- 设计：统一协议层（action、params、callbackId），异步返回，防止长任务阻塞；
- 资源：弱引用/取消订阅，页面卸载时释放监听与定时器；
- 调试：在开发版开启日志与监控桥延迟；
- 安全：仅白名单 action 可调用，参数校验与权限控制。

---

#### 14. 地图、视频、Canvas、蓝牙等复杂原生能力在各端的坑有哪些？

参考答案：
- 地图：小程序不同宿主提供商不同（腾讯/高德/百度），接口与坐标系有差异；App 需申请 SDK key；
- 视频：小程序原生组件层级最高，注意覆盖层级；H5 需考虑自动播放策略；
- Canvas：小程序 2D/`canvasContext` 性能有限，复杂绘制建议原生；
- 蓝牙：小程序后台保活差、平台限制多；App 原生更稳定但需权限；
- 统一：抽象能力适配 + 降级方案（展示静态图、预渲染）。

---

#### 15. 打包与持续集成如何设计多端流水线？如何做质量保障（lint、单测、端到端）？

参考答案：
- 流水线：按分支触发多端构建（H5、MP、APP），生成制品与产物清单；
- 质量：ESLint/Stylelint、单元测试（组合式函数、工具库）、端到端（H5 用 Playwright；小程序用小程序自动化框架；App 用 Appium/UniAutomator）；
- 配置：敏感配置通过环境变量与密钥管理；
- 发布：H5 静态资源上传 + CDN，MP 提交审核，APP 打包签名与商店上传。

---

#### 16. 你如何定位三端的线上问题？请给出日志、监控与回滚策略。

参考答案：
- 日志：统一埋点 SDK（区分平台），错误上报（Sentry/自研）；
- 监控：首屏、路由切换、接口耗时、白屏率、崩溃率；
- 回滚：
  - H5：灰度/回滚静态资源；
  - 小程序：基础库版本兼容、紧急回退至上一版；
  - App：热更新能力（条件合规）或发布小版本，关键问题通过远程开关降级；
- 预案：特性开关、远端配置、动态降级路径。

---

#### 17. 解释 `easycom` 自动引入机制。可能带来的隐患是什么？如何优化首屏？

参考答案：
- 机制：匹配组件命名与目录规则，自动注册；
- 隐患：组件收集范围过大导致打包体积与首屏解析成本上升；
- 优化：限制匹配范围、仅在需要的分包开启、关键路由手动按需引入。

---

#### 18. Vue2 与 Vue3（`<script setup>`）在 uni-app 中的差异与迁移注意点？

参考答案：
- 差异：响应式底层（Proxy vs defineProperty）、组合式 API、类型支持更强；
- 组件：`setup` 生命周期与 `onMounted/onShow` 协同；
- 迁移：
  - 避免 `this` 依赖，改用组合式函数与显式导出；
  - 第三方库的兼容性检查；
  - 模板语法与指令变更；
- 工程：升级构建工具与类型声明，完善 TS 审核。

---

#### 19. 跨端样式与 z-index 管理的通用策略是什么？

参考答案：
- 建立设计系统与变量（色板、字号、间距、阴影）；
- 统一层级规范：modal/toast/popup 的 z-index 常量；
- 小程序原生组件（如 video、map）层级最高，需避让；
- App WebView 与原生视图混排，覆盖关系需测试验证；
- H5 不同浏览器渲染差异用重置样式与规范组件。

---

#### 20. 常见问题速查（故障与坑位）

参考答案：
- 图片与字体资源 404：检查 `publicPath`/cdn 前缀、分包路径；
- 小程序 setData 过大导致卡顿：切分数据与局部更新；
- iOS 视频自动播放失败：需静音、用户手势触发或 `playsinline`；
- Android 物理返回键退出：拦截返回键并处理二次确认；
- nvue 样式不生效：确认受限属性、使用支持的 flex 布局；
- H5 路由白屏：`history` 路由需服务端回退到 `index.html`；
- 微信登录回调失败：域名白名单与回调路径未配置正确；
- 上架审核被拒：敏感权限未声明、隐私弹窗不合规。

---

#### 21. 场景题：基于 `pages.json` 做多端分包与路由懒加载，如何配置？

参考答案（示例片段）：

```json
{
  "pages": [
    { "path": "pages/home/index", "style": { "navigationBarTitleText": "首页" } }
  ],
  "subPackages": [
    {
      "root": "pkg-user",
      "pages": [
        { "path": "pages/profile/index" },
        { "path": "pages/setting/index" }
      ]
    }
  ],
  "tabBar": {
    "list": [
      { "pagePath": "pages/home/index", "text": "首页" },
      { "pagePath": "pkg-user/pages/profile/index", "text": "我的" }
    ]
  }
}
```

---

#### 22. 场景题：设计一个跨端存储适配器，屏蔽 H5/小程序/App 差异。

参考答案（示例片段）：

```ts
// storage.ts
export function setItem(key: string, value: string) {
  // #ifdef H5
  localStorage.setItem(key, value)
  // #endif
  // #ifdef MP-WEIXIN
  wx.setStorageSync(key, value)
  // #endif
  // #ifdef APP-PLUS
  plus.storage.setItem(key, value)
  // #endif
}

export function getItem(key: string) {
  // #ifdef H5
  return localStorage.getItem(key)
  // #endif
  // #ifdef MP-WEIXIN
  return wx.getStorageSync(key)
  // #endif
  // #ifdef APP-PLUS
  return plus.storage.getItem(key)
  // #endif
}
```

---

#### 23. 场景题：如何在三端实现文件选择与上传，并保证权限安全与大文件体验？

参考答案：
- 抽象 `pickAndUpload()`：
  - H5：`<input type="file">` + `FormData`；
  - 小程序：`wx.chooseImage/chooseMessageFile` + `wx.uploadFile`；
  - App：系统文件选择器/拍照（原生插件） + 分片上传；
- 安全：MIME 白名单、大小/数量限制、后端鉴黄/病毒扫描；
- 体验：分片并发、断点记录、进度回传、失败重试、弱网优化。

---

#### 24. 场景题：在 iOS/Android 上处理状态栏、底部安全区与沉浸式导航的差异。

参考答案：
- 使用 `safe-area-inset-*` 与平台变量控制内边距；
- Android 全面屏手势后退与沉浸式需要额外 padding；
- 统一组件封装：提供 `SafeAreaView` 包裹页面内容。

---

#### 25. 生态与工程：如何挑选跨端 UI 库（uView、Varlet、NutUI）并控制体积？

参考答案：
- 评估：跨端覆盖、按需加载能力、类型声明、SSR/H5 适配、nvue 支持；
- 体积：babel 插件/自动导入、移除未使用样式、图标合并；
- 定制：设计 Token 与主题能力，避免二次封装导致的重复样式；
- 验证：关键交互在三端的像素级对齐回归用例。

---

#### 面试官加分题（开放题）

1) 若要在 uni-app 中实现“可插拔的多端能力适配层”，你的目录结构、依赖倒置与测试策略如何设计？
2) 如何在不降低体验的前提下，将一套代码的三端 Lighthouse/性能指标拉齐到相近水平？
3) 结合你过往项目，谈一次复杂原生能力落地（地图/IM/音视频）在三端的不同实现与风险控制。

---

#### 面试清单（快速核对）

- **跨端原理**：编译产物、运行时适配、nvue 取舍、条件编译；
- **工程能力**：分包/懒加载、CI/CD、环境与敏感配置；
- **性能优化**：首屏、列表、资源、监控与压测；
- **原生能力**：权限、SDK、桥接、安全；
- **兼容与合规**：各宿主限制、iOS 审核、域名白名单；
- **问题处理**：线上监控、回滚、降级与 A/B 开关。

---

生成 PDF 后可将该文档发给候选人或用于面试现场讨论。

