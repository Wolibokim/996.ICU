### 高级 uni-app 面试题（含参考答案）

- **说明**：题目覆盖架构原理、跨端差异（H5/微信小程序/iOS/Android）、性能优化、构建与发布、原生扩展、常见问题排查等。每题给出要点式参考答案，方便快速评估候选人深度与实战经验。

---

### 一、架构与跨端原理

1) 说说 uni-app 的渲染与运行时架构（H5、微信小程序、App）以及 `vue`、`nvue` 的区别  
- **参考答案**：  
  - H5：基于浏览器 WebView，Vue 渲染 DOM。  
  - 小程序：编译为对应平台的 WXML/模板 + JS 运行在小程序环境（非浏览器），通过平台桥接驱动视图层。  
  - App（App-Plus）：  
    - `vue` 页面：H5 WebView 渲染。  
    - `nvue` 页面：原生渲染（Weex/原生引擎），列表滚动、手势性能更好。  
  - 数据更新：均为 JS 层与视图层双线程（或多进程）通信模型，避免频繁/大体量数据传输。  
  - 取舍：`nvue` 适合大列表、地图叠加等高性能场景；`vue` 生态丰富、开发效率高。

2) 解释 `pages.json`、`manifest.json`、`uni.scss` 的作用  
- **参考答案**：  
  - `pages.json`：路由与窗口配置（页面路径、导航栏、tabBar、分包、页面权限等），跨端统一。  
  - `manifest.json`：应用级配置（应用名、App 包名、图标、iOS/Android 权限、UniPush、splash、SDK 配置）。  
  - `uni.scss`：全局样式变量（主题、颜色、间距、字号），被所有平台共享。

3) 讲讲条件编译与平台特定代码组织方式  
- **参考答案**：  
  - 条件编译指令：`#ifdef MP-WEIXIN`、`#ifdef H5`、`#ifdef APP-PLUS` 等；`#ifndef` 为否定。  
  - 用于：分平台组件替换、不同平台 API 适配、样式或行为差异化。  
  - 最佳实践：将平台差异封装在 `utils/adapters/*`，页面只引用统一接口。

---

### 二、生命周期与路由

4) uni-app 生命周期在不同平台有哪些差异？如何正确使用？  
- **参考答案**：  
  - 全局：`App.vue` 中 `onLaunch`、`onShow`、`onHide`。  
  - 页面：`onLoad`（拿 query）、`onShow`（返回刷新）、`onReady`（首次渲染完成）、`onUnload`。  
  - 小程序特性：分享钩子 `onShareAppMessage`、`onShareTimeline`；前台、后台由宿主控制。  
  - H5：路由切换不卸载 Web 环境；需要监听可见性 `visibilitychange` 时机。  
  - App：物理返回键、应用回到前台事件、原生页面栈和 Webview 栈交互。

5) `uni.navigateTo`、`redirectTo`、`reLaunch`、`switchTab` 的区别与使用场景  
- **参考答案**：  
  - `navigateTo`：压栈跳转（保留当前页）。  
  - `redirectTo`：替换当前页（不保留）。  
  - `reLaunch`：关闭所有页面，然后打开新页面（通常用于登录完成或重大流程重置）。  
  - `switchTab`：切换到 `tabBar` 配置中的页面，且不能带普通 query 参数（可用全局状态或 storage 传递）。

6) 小程序 `eventChannel` 在 uni-app 中如何使用？  
- **参考答案**：  
  - A 页：`uni.navigateTo({ url, success(res){ res.eventChannel.emit('data', payload) } })`  
  - B 页：`onLoad(){ const ec = this.getOpenerEventChannel(); ec.on('data', cb) }`  
  - 场景：大对象传递、复杂结构避免 query 编解码。

---

### 三、样式与适配

7) 说说 `rpx`、`px`、`upx` 的差异与跨端适配策略  
- **参考答案**：  
  - 小程序/H5 推荐 `rpx`：等比缩放，H5 下会转换为 `vw`。  
  - App-nvue 常用 `px`（原生渲染），但 uni 项目里统一 `rpx` 有助跨端一致。  
  - 全局尺寸变量放 `uni.scss`，不同端必要时用条件编译覆盖。  
  - 宽高比适配、状态栏/安全区适配要在 iOS/Android 单独处理。

8) iOS 刘海屏/安全区、Android 状态栏适配方案  
- **参考答案**：  
  - 使用 `safe-area-inset-xxx` 环境变量或内置 `var(--safe-area-inset-top)`（H5）  
  - App-Plus 可通过 `plus.navigator.setStatusBarStyle`、`titleNView`、`statusbar` 配置；布局上预留 `padding-top`。  
  - 小程序：使用导航自定义 + 系统胶囊按钮位置信息获取。

---

### 四、性能优化

9) uni-app 大列表性能优化策略（H5/小程序/App）  
- **参考答案**：  
  - 数据分片渲染、虚拟列表（H5 可用虚拟滚动库；小程序用内置 `recycle` 思路或按需渲染）。  
  - App 使用 `nvue` 的原生列表更优。  
  - 避免频繁 setData/响应式大对象变更；拆分组件、使用 `v-show` 替代 `v-if` 于频繁切换场景。  
  - 图片懒加载、使用低清晰度占位图；开启分包与预下载。

10) 小程序与 H5 的资源体积控制  
- **参考答案**：  
  - 分包与独立分包，按业务域拆分。  
  - 精简三方库（使用 ES 模块 + 按需打包），移除未使用 polyfill。  
  - 图片体积优化（webp/avif，雪碧图合理化），CDN 与缓存。  
  - H5 预渲染/SSR（必要时用服务端中间层渲染关键首屏），路由懒加载。

11) `nvue` 与 `vue` 混合项目的性能取舍  
- **参考答案**：  
  - `nvue` 页面：高频复杂滚动、动画、地图/视频/摄像头叠加。  
  - `vue` 页面：表单、信息展示、富交互但对性能要求一般的场景。  
  - 统一路由与状态层，封装端能力差异，降低心智负担。

---

### 五、网络、鉴权与数据持久化

12) 统一封装 `uni.request` 拦截器与重试机制  
- **参考答案**：  
  - 使用 `uni.addInterceptor('request', { invoke, success, fail, complete })` 做 token 注入、请求签名、统一错误码处理。  
  - 对幂等接口加指数退避重试；对用户态错误（401）做跳转登录。  
  - H5 处理 Cookie/跨域（CORS）、SameSite；小程序走域名白名单；App 可直连后端或内置证书校验。

13) 微信小程序登录态与 `code2Session` 流程（结合 uni-app）  
- **参考答案**：  
  - 调用 `uni.login({provider: 'weixin'})` 获取 `code`。  
  - 后端调用微信 `code2Session` 换取 `openid`/`session_key`，建立自己的会话 token，返回前端。  
  - 前端持久化 token 到 `uni.setStorageSync`，请求时附带；定期刷新/校验。  
  - 注意 session 失效、用户切换账号、手机号授权变更。

14) 本地存储容量与差异  
- **参考答案**：  
  - 小程序：总量约 10MB 左右（平台不同略有差异），适合存储轻量 KV。  
  - H5：`localStorage` ~ 5MB、`IndexedDB` 更大更灵活。  
  - App：持久化可用 SQLite/文件系统（通过原生插件/UTS），容量更大。  
  - 统一封装存储接口 + 限流淘汰策略（LRU）。

---

### 六、构建与工程化

15) 说说基于 Vite 的 uni-app CLI 工程结构与命令  
- **参考答案**：  
  - 依赖：`@dcloudio/vite-plugin-uni`、`@dcloudio/uni-app`（Vue3 场景）。  
  - 常用命令：`npm run dev:h5`、`dev:mp-weixin`、`dev:app`；`build:xxx` 对应产物输出。  
  - HBuilderX 与 CLI 方式互通（注意版本与配置差异同步）。

16) 如何在 CI 中做多端构建与产物发布？  
- **参考答案**：  
  - 以矩阵构建不同平台产物；缓存 `node_modules`、`vite` 缓存。  
  - H5：构建后上传 CDN/静态服务器。  
  - 小程序：上传为体验版（命令行/CI 插件）。  
  - App：生成 wgt 或离线打包（iOS 需证书与审核流程，Android 可自动上传到商店）。

17) 分包策略设计与预下载  
- **参考答案**：  
  - 按域拆分：业务模块、重资源模块、低频模块。  
  - 配置 `pages.json` 的 `subPackages` 与 `preloadRule`。  
  - 目标：首包体积可控、首屏更快，次级页面命中预下载。

---

### 七、组件与能力

18) 跨端组件差异与替换策略（如 `video`、`map`、`canvas`）  
- **参考答案**：  
  - 能力/属性在不同平台不完全一致（如事件、层级、叠加样式）。  
  - 抽象出业务组件层，通过条件编译切换底层实现；统一对外 props/事件。  
  - 对高阶能力（滤镜、离屏渲染）在 App 端可用原生/UTS 补齐。

19) 富文本渲染与 XSS 风险  
- **参考答案**：  
  - 小程序 `rich-text` 标签白名单受限；H5 需做 XSS 过滤（DOMPurify）。  
  - 图片/链接跳转拦截，协议白名单。  
  - 长文懒加载、分页渲染避免卡顿。

20) WebView 与原生页面互跳（App）  
- **参考答案**：  
  - `plus.webview` 管理多 WebView；原生页面通过 JSBridge 与 WebView 通信。  
  - 路由策略：WebView 栈与原生栈一致性、返回键行为拦截（`onBackPress`）。  
  - 注意生命周期桥接、内存释放与定时器清理。

---

### 八、原生扩展与 UTS

21) 介绍 UTS（uni-app TypeScript for Native）的作用与适用场景  
- **参考答案**：  
  - 使用 TS 书写原生扩展，一套源码编译到 iOS/Android 原生库供 JS 调用。  
  - 适合深度原生能力（蓝牙、NFC、传感器、加密、离线包管理、重度媒体处理）。  
  - 好处：跨端一致 API、类型安全、版本管理更统一。

22) 什么时候必须落地原生插件（而不是纯 H5/JS）？  
- **参考答案**：  
  - 性能敏感（音视频、图像处理、大文件 IO、重度加解密）。  
  - 系统级权限/后台运行/厂商通道（Push、定位、蓝牙 Mesh）。  
  - WebView 无法覆盖的硬件能力或平台策略限制。

---

### 九、常见问题与排查

23) H5 下 `position: fixed`、`overflow: scroll`、iOS 滚动弹性带来的 UI 问题如何解决？  
- **参考答案**：  
  - 移动端滚动容器添加 `-webkit-overflow-scrolling: touch`。  
  - 避免多层滚动；弹窗用 `body` 锁滚策略（切换 `overflow: hidden` 与补齐滚动条宽度）。  
  - iOS 软键盘顶起：监听页面高度变更，或使用安全区和 `input` 聚焦滚动修正。

24) 小程序组件层级（z-index）失效、覆盖问题  
- **参考答案**：  
  - 原生组件（`video`、`map`、`canvas`）层级最高，无法被常规元素覆盖。  
  - 解决：使用同层渲染版本组件、避开叠加、或改造交互（把弹层做在原生组件之上）。  
  - 检查宿主版本与基础库版本、确保启用同层渲染能力。

25) 网络请求在小程序失败但 H5 正常的排查思路  
- **参考答案**：  
  - 检查小程序后台域名白名单、HTTPS、证书配置。  
  - `OPTIONS` 预检在 H5；小程序无 CORS 概念但有安全域名限制。  
  - 代理与网关的 header 透传、`content-type`、`cookie` 策略差异。

26) iOS 上音视频自动播放受限的处理  
- **参考答案**：  
  - 小程序：使用用户手势触发播放、使用后台音频能力；  
  - H5：必须用户交互启动，或利用静音自动播放策略（`muted` + 恢复音量）。  
  - App：原生层可放宽限制，但需遵守平台审核规范。

27) Android 机型适配与 WebView 内存/崩溃问题  
- **参考答案**：  
  - 控制页面层级与路由深度，及时销毁未使用的 WebView。  
  - 大图/视频使用分辨率自适应与缓存；减少 base64。  
  - 监控内存与 FPS，灰度发布观察机型分布，启用 `nvue` 替换重场景页面。

28) TabBar 页面传参丢失与刷新策略  
- **参考答案**：  
  - `switchTab` 不支持常规 query；用全局存储（pinia/storage）或 `eventBus`。  
  - TabBar 页面使用 `onShow` 拉取数据，配合“待刷新”标志。

29) H5 SEO 与社交分享  
- **参考答案**：  
  - 单页应用 SEO 弱，使用预渲染/SSR 或静态化关键页面。  
  - OpenGraph/微信 JSSDK 配置，后端签名与域名校验。  
  - 落地页与小程序码打通，形成闭环。

30) Input 光标错位、中文输入法合成（composition）问题  
- **参考答案**：  
  - 监听 `compositionstart`/`compositionend`，避免中间态触发校验/格式化。  
  - iOS 键盘高度适配，滚动容器定位到输入框可见位置。

---

### 十、状态管理与模块化

31) 在 uni-app 中使用 Pinia/Vuex 的注意点  
- **参考答案**：  
  - 同一套状态跨端可复用；持久化用 storage 适配器封装。  
  - 小程序分包时，公共 store 须在主包或独立分包可达。  
  - 避免在 `onLoad` 过早访问异步初始化的 store 数据，使用就绪信号或 `await` 初始化。

32) 路由参数、跨页面通信与解耦  
- **参考答案**：  
  - 小参数用 query，复杂对象用 `eventChannel` 或 store。  
  - 长链路事件用全局事件总线（谨慎）、或基于 store 的订阅模式。  
  - 防漏：在 `onUnload` 清理 listener。

---

### 十一、实战场景题

33) 设计一个“登录 -> 授权 -> 首次引导 -> 主页”的跨端流程  
- **参考答案要点**：  
  - 路由：`reLaunch` 进入主页；登录页用 `redirectTo` 避免返回。  
  - 小程序：`login` 换 token；授权获取用户信息/手机号，后端合并账户。  
  - H5：跳 OAuth 或短信登录；App：可走一键登录 SDK。  
  - 首次引导标志落库+storage；埋点首开链路时延。

34) 10 万级列表数据的检索与分页（小程序与 App 差异）  
- **参考答案要点**：  
  - 服务器分页 + 后端搜索（避免前端全量）。  
  - 滚动加载与“数据光标”；小程序注意 `setData` 量与频次。  
  - App 使用 `nvue` 列表，分片渲染；图片懒加载；索引分组（字母索引）。  
  - 本地缓存最近页与查询条件，回流快捷恢复。

35) 多套主题与暗色模式跨端一致性  
- **参考答案要点**：  
  - `uni.scss` 定义主题变量，运行时注入 CSS 变量。  
  - 跟随系统：监听 `prefers-color-scheme`（H5）与平台 API（小程序/App）。  
  - 资源（图标、插画）与图表配色适配，快照持久化，冷启动应用。

---

### 十二、代码示例（简短）

- **封装请求拦截与错误处理（示意）**：
```ts
// api/request.ts
type RequestOptions = UniNamespace.RequestOptions & { needAuth?: boolean };

uni.addInterceptor('request', {
  invoke(opts: RequestOptions) {
    const token = uni.getStorageSync('token');
    if (opts.needAuth && token) {
      opts.header = { ...(opts.header || {}), Authorization: `Bearer ${token}` };
    }
  },
  success(res) {
    // 统一业务码判断
    if (res.data && res.data.code !== 0) {
      uni.showToast({ title: res.data.msg || '业务异常', icon: 'none' });
    }
  },
  fail(err) {
    uni.showToast({ title: '网络异常', icon: 'none' });
  },
});

export function http<T = any>(options: RequestOptions) {
  return new Promise<T>((resolve, reject) => {
    uni.request({
      timeout: 15000,
      ...options,
      success: (res) => {
        if (res.statusCode === 200) resolve(res.data as T);
        else reject(res);
      },
      fail: reject,
    });
  });
}
```

- **条件编译适配**：
```ts
export function getPlatform(): 'wechat' | 'h5' | 'app' {
  // #ifdef MP-WEIXIN
  return 'wechat';
  // #endif
  // #ifdef H5
  return 'h5';
  // #endif
  // #ifdef APP-PLUS
  return 'app';
  // #endif
}
```

- **事件通道传参**：
```ts
// A 页面
uni.navigateTo({
  url: '/pages/detail/index',
  success(res) {
    res.eventChannel.emit('payload', { id: 123, from: 'list' });
  },
});

// B 页面
onLoad(() => {
  const ec = getCurrentPages().slice(-1)[0].getOpenerEventChannel();
  ec.on('payload', (data) => {
    // 使用 data
  });
});
```

---

### 十三、加分题（开放性）

36) 如何设计“跨端统一埋点”并适配小程序、H5、App 的差异？  
- **参考答案要点**：  
  - 统一事件模型 + 平台 Adapter（会话/用户标识、网络层、离线队列）。  
  - 小程序弱网/离线上报、H5 可 `sendBeacon`、App 原生通道。  
  - 采样率、隐私脱敏与合规（GDPR/国密），A/B 实验开关。

37) 讨论在 App 端引入“离线包/增量热更”的可行性与风险  
- **参考答案要点**：  
  - 方案：主包 + 业务离线包，增量差分下载与校验；回滚机制。  
  - 风险：审核合规（iOS 严格）、安全（校验与签名）、版本兼容与缓存清理。  
  - 监控：灰度比例、失败回退、埋点覆盖。

38) 如何定位生产环境偶发白屏？  
- **参考答案要点**：  
  - SourceMap 上报、关键路径埋点（脚本加载、首屏渲染点）。  
  - 兜底：错误页 + 重载按钮；CDN 与缓存刷新策略。  
  - 针对小程序：基础库版本、机型统计；App：WebView 崩溃 dump、原生日志。

---

### 十四、易错点 Checklist

- **跨端适配**：原生组件层级、手势冲突、软键盘顶起、暗色模式差异  
- **资源与体积**：分包策略、按需加载、图片/字体压缩  
- **性能**：大列表虚拟化、避免巨型响应式对象、图片懒加载  
- **网络与鉴权**：域名白名单、CORS/Cookie、小程序登录态、重试与熔断  
- **构建与交付**：多端流水线、灰度、监控与回滚  
- **安全**：XSS/CSRF、HTTPS、证书校验、第三方 SDK 合规  
- **原生扩展**：UTS 能力覆盖、权限声明、审核合规

---

- 我已整理出一套覆盖深度与广度的 uni-app 面试题及答案，兼顾 H5/微信小程序/iOS/Android 的跨端经验与常见问题处理。若你有特定方向（如：音视频、地图、支付、IM、推送），我可以进一步扩展定制题目与答案示例。