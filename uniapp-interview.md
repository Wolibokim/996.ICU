## uni-app 前端面试题题库（深度 + 常见问题 + 答案）

### 使用说明

- **定位**: 面向中高级前端候选人的 uni-app 实战与原理面试题库。
- **结构**: 深度题（含参考答案/要点）→ 常见问题与解决 → 场景题（要点）→ 关键代码片段 → 快速提问清单 → 评分建议。
- **建议用法**: 由浅入深，穿插追问实践细节与权衡取舍；结合候选人经历挑选重点模块（小程序/App/H5/uniCloud）。

---

## 一、深度面试题（含参考答案/要点）

- **1｜uni-app 编译架构与运行时差异**
  - 参考答案：uni-app 通过编译期将 Vue SFC 编译到不同目标：H5 走 Web runtime（Vue2/Vue3），小程序走各家 DSL（wxml/axml/swan 等），App 端分 WebView 渲染（Vue）与原生渲染（nvue/UVue）。运行时通过 `uni.*` 统一跨端 API，平台差异由条件编译与适配层处理。

- **2｜`nvue/UVue` 与普通 `vue` 页面差异与取舍**
  - 参考答案：nvue/UVue 原生渲染，长列表/动画更流畅，但 CSS/DOM 能力受限（不支持复杂选择器、部分样式与 `$refs` DOM 操作）。性能敏感选 nvue/UVue；表单/内容页选 vue（生态丰富）。

- **3｜`pages.json` 与 `manifest.json` 职责划分**
  - 参考答案：`pages.json` 管理路由、页面/全局窗口样式、`tabBar`、分包/预加载；`manifest.json` 管理应用元信息与平台能力（App 权限、签名、Push、URL scheme、iOS/Android 权限文案、Splash 等）。

- **4｜条件编译边界与最佳实践**
  - 参考答案：`#ifdef`/`#ifndef` 可用于模板/脚本/样式；缩小作用域、避免嵌套；以适配器层输出统一 API，调用方少用条件编译；约定平台差异文件命名与导出接口。

- **5｜跨端样式单位选择：`rpx`/`upx`/`vw`**
  - 参考答案：小程序端首选 `rpx`；App/H5 推荐 `upx` 或 `vw` 响应式布局；统一设计稿与换算规则，校准字体缩放，避免跨端错位。

- **6｜请求层拦截器与错误模型统一**
  - 参考答案：封装 `uni.request`，实现 header 注入、超时、重试、401 刷新 Token、错误码 → 业务异常映射；小程序需域名白名单，H5 需 CORS，App 需网络权限与证书链校验。

- **7｜路由与页面栈管理、`eventChannel` 正确使用**
  - 参考答案：`navigateTo`（入栈）、`redirectTo`（替换当前）、`reLaunch`（清栈）、`switchTab`（切换 tab）；跨页通信优先 query + `eventChannel`；谨慎全局 EventBus，注意解绑。

- **8｜组件通信选择：Props/事件/Provide-Inject/全局状态（Pinia/Vuex）**
  - 参考答案：父子优先 Props/事件；跨层级用 Provide/Inject 或中等粒度 Pinia；全局会话/用户信息用 Pinia；避免全局事件总线订阅泄漏。

- **9｜长列表性能优化（H5 vs App）**
  - 参考答案：App 端优先 nvue 原生列表/UVue；H5 端使用虚拟滚动；懒加载、图片占位、分片渲染，避免在滚动回调内高频 setData；分包和按需加载组件。

- **10｜图片/文件：缓存、预加载与内存优化**
  - 参考答案：本地缓存与占位图；避免大图 Base64；大文件分片/断点续传；CDN 动态裁剪、WebP/AVIF，限制分辨率与并发数。

- **11｜原生能力接入：uni-module 与自定义原生插件**
  - 参考答案：优先官方/三方插件；复杂能力用 uni-module 封装原生 SDK；统一暴露 `uni.` 层；完善 iOS/Android 权限、审核合规与版本兼容。

- **12｜权限与隐私合规清单**
  - 参考答案：小程序域名白名单；iOS `Info.plist` 权限文案（相机/相册/定位等）；Android 12+/13+ 动态权限；埋点脱敏、采样上报、错误匿名化。

- **13｜App WebView 与原生互调（JSBridge）**
  - 参考答案：H5 通过 `plus.webview` 与原生互调；维护桥协议与版本；处理返回键、生命周期差异；确保线程与回调时序安全。

- **14｜`easycom` 自动引入与组件库按需优化**
  - 参考答案：命名规范自动注册组件；大型库建议手动按需或构建剔除未用组件；避免同名冲突；结合分包降低首屏体积。

- **15｜生命周期跨端一致性与差异**
  - 参考答案：`onLaunch`/`onShow`/`onHide` 各端均有但触发时机不同；避免在 `onShow` 重做初始化；幂等化与状态机保证重复进入稳定。

- **16｜分包策略与首屏优化**
  - 参考答案：低频功能分包，核心路径常驻主包；`preloadRule` 预加载；骨架屏、并行请求、资源缓存；H5 路由懒加载 + CDN/HTTP 缓存。

- **17｜错误监控与性能埋点设计**
  - 参考答案：`App.onError`、`uni.onUnhandledRejection`、请求失败拦截；埋点区分平台与版本；采集 FMP/TTI/长任务、白屏率与 JS 异常。

- **18｜离线与弱网：本地缓存与任务队列**
  - 参考答案：写操作入队重试、幂等与去重；读操作本地兜底；网络恢复重放；合理退避与最大重试次数。

- **19｜多租户/多主题工程化**
  - 参考答案：租户配置运行时注入；静态资源按租户命名；样式用 CSS 变量/SCSS map；避免用条件编译承载业务分支。

- **20｜uniCloud 选型与边界**
  - 参考答案：前后端一体、JQL 简化 CRUD；依赖阿里云/腾讯云环境；重计算使用异步云函数/定时器；细化 DB/文件权限规则。

### 进阶加餐（21-40）

- **21｜跨端事件与手势差异处理**
  - 参考答案：统一封装点击/长按/滑动为抽象层；H5 使用 passive 监听与 `touch-action` 优化；小程序/APP 端利用原生滚动与 `catch` 事件避免穿透；在 nvue 使用原生手势系统。

- **22｜多语言与本地化（L10N/I18N）工程化**
  - 参考答案：选择轻量 i18n（如 vue-i18n）结合编译期资源抽取；动态语言包分包加载；日期/货币本地化；小程序端语言获取与权限提示文案管理。

- **23｜主题/暗色模式架构**
  - 参考答案：CSS 变量存主题 token，运行时切换；`prefers-color-scheme` 检测；小程序端配合自定义导航栏/组件变量；持久化用户偏好并与系统跟随模式合并。

- **24｜表单复杂校验与跨端输入法差异**
  - 参考答案：抽象表单引擎与 Schema；输入法回车/确认事件差异；数字键盘与千分位显示；iOS 自动填充与 H5 autocomplete 管控；防抖校验与提交幂等。

- **25｜PWA 与离线包在 H5 的可行性**
  - 参考答案：H5 端可启用 Service Worker 缓存静态资源与接口降级缓存；与小程序/APP 的离线能力对齐有限；注意 SW 更新策略与缓存清理。

- **26｜App 原生渲染与 WebView 混合栈通信**
  - 参考答案：定义统一消息协议（版本、类型、payload）；页面栈变更同步；原生返回键/侧滑返回分发；避免循环导航与死锁。

- **27｜构建与发布流水线（CI/CD）**
  - 参考答案：区分目标平台构建 matrix；缓存 node_modules 与依赖；打包产物签名与版本号管理；自动化上传小程序/应用商店/静态服务器；产物校验（sourcemap、license）。

- **28｜Sourcemap 与错误定位跨端方案**
  - 参考答案：H5/sourcemap 上传错误监控平台；小程序 sourcemap 支持与脱敏；App 端保留符号表；结合 release 版本回溯。

- **29｜性能指标与监控闭环**
  - 参考答案：定义核心指标（首屏、交互就绪、白屏率、接口失败率、页面卡顿率）；采集-上报-看板-告警-回溯五步闭环；跨端差异埋点 SDK。

- **30｜可访问性（A11y）在 uni-app 的落地**
  - 参考答案：语义化组件替代纯样式；H5 使用 aria 属性；小程序 `aria-role` 支持有限，给予可触达尺寸/对比度；键盘可达性与动效可关闭。

- **31｜大图与视频的首屏策略**
  - 参考答案：骨架屏与 LQIP（低清占位）；首屏外延迟加载；视频首帧 + 静音自动播与点击激活声音；CDN Range 请求与分辨率自适应。

- **32｜复杂可视化图表跨端渲染**
  - 参考答案：H5 用 Canvas/WebGL；小程序端选择原生 canvas；App 端注意 GPU/内存；降级为服务端渲染图片或轻量图表库。

- **33｜富文本/Markdown 渲染与安全**
  - 参考答案：小程序 `rich-text` 标签白名单；H5 端 XSS 过滤（DOMPurify）；图片懒加载与链接跳转策略；渲染性能优化（分片、虚拟滚动）。

- **34｜支付/登录等高风险流程的一致性**
  - 参考答案：抽象流程状态机；平台特有 API（微信支付、支付宝支付、Apple/Google Pay）封装为适配器；中断恢复与超时重试；风控埋点。

- **35｜WebSocket/长连接与断线重连**
  - 参考答案：封装心跳与重连指数退避；前后台切换挂起/恢复；小程序背景运行限制；消息去重与顺序保证。

- **36｜文件系统与缓存策略**
  - 参考答案：小程序临时/持久化路径、配额限制；App 端目录与权限；缓存淘汰策略（LRU/大小/时效）；版本升级迁移清理。

- **37｜地图与定位跨端差异**
  - 参考答案：选择同源地图 SDK；定位授权与精度差异；室内外切换、后台定位限制；轨迹抽稀与电量优化。

- **38｜富交互场景的 60fps 优化**
  - 参考答案：CSS 合成层动画、避免 layout thrash；`requestAnimationFrame` 节奏；图片解码与预渲染；nvue 原生动画。

- **39｜权限弹窗节制与引导设计**
  - 参考答案：就近授权、渐进暴露；预期前置说明页；拒绝后的再引导与设置页跳转；记录曝光与转化。

- **40｜安全：鉴权、CSRF、XSS、供应链风险**
  - 参考答案：Token 策略（短 token + 刷新 token）；CSRF H5 端同源/Token 双重防护；XSS 输入过滤与 CSP；依赖安全审计与锁定版本。

---

## 二、常见问题与解决（含故障原因）

- **`scroll-view` 不触发 `scrolltolower`**
  - 解决：确保固定高度、设置 `lower-threshold`；避免外层 `overflow: hidden`；在 App 端 nvue 使用原生 list 组件。

- **H5 图片失真/模糊**
  - 解决：`image` 组件 `mode="widthFix|heightFix"`；使用 `srcset` 或 CDN 多规格；避免 CSS 强制拉伸。

- **小程序请求 403/无法请求**
  - 解决：后台配置域名白名单（含 https 与端口）；不支持 IP/自签；后端配置 CORS/Referer 白名单。

- **App 端请求失败**
  - 解决：开启 `android.permission.INTERNET` 和网络权限；检查 HTTPS 证书链；兼容 HTTP/2。

- **`navigateTo` 到 `tabBar` 页面失败**
  - 解决：必须使用 `switchTab`；URL 不可携带 query，用全局状态或缓存传递。

- **页面栈溢出**
  - 解决：频繁 `navigateTo` 改为 `redirectTo`/`reLaunch`；离开页面清理定时器与监听，避免内存泄漏。

- **`this.$refs` 在 nvue 无效**
  - 解决：nvue 无 DOM；使用组件 id + `uni.createSelectorQuery().in(this)` 或组件事件回调拿实例。

- **软键盘顶起布局错位（App/H5）**
  - 解决：使用安全区与 `windowBottom` 适配；输入框外包裹滚动容器；iOS 关闭弹性滚动。

- **状态栏/刘海适配**
  - 解决：使用 `var(--status-bar-height)` 或 `uni.getSystemInfoSync()`；`safe-area-inset-top/bottom` 填充。

- **长列表卡顿**
  - 解决：App 用 nvue 原生 list；H5 用虚拟滚动；图片 `lazy-load`；避免滚动中频繁 setData。

- **Base64 大图导致内存暴涨**
  - 解决：避免 Base64，使用临时文件/本地路径；CDN 压缩与限宽；限制并发与分辨率。

- **WebView 返回键行为异常（App）**
  - 解决：`plus.key.addEventListener('backbutton', ...)` 自定义；页面栈为空时退出 App。

- **视频自动播放失效（H5/小程序）**
  - 解决：策略限制，需静音自动播或用户交互触发；小程序设置组件 `autoplay` 并避免首屏内渲染。

- **`easycom` 未生效**
  - 解决：遵循命名规范或在 `pages.json` 配置 `easycom.custom`；排查构建产物同名冲突。

- **打包后资源 404（H5）**
  - 解决：检查 `publicPath` 与部署根目录；静态资源基路径正确；Nginx 配置 SPA 回退到 `index.html`。

- **小程序二维码识别失败**
  - 解决：使用官方扫码组件；确保清晰度与对比度；弱光环境提示补光。

- **iOS 拍照/定位权限弹窗文案缺失**
  - 解决：在 `manifest.json` 的 iOS 区配置 `NSCameraUsageDescription` 等键值。

- **蓝牙/定位 API 在 H5 不可用**
  - 解决：使用条件编译保护并给出降级提示；必要时引导使用 App/小程序能力。

- **事件总线内存泄漏**
  - 解决：`onUnload` 注销订阅；封装自动解绑；避免匿名函数难以移除。

- **`uni.chooseImage` 临时路径重启后失效**
  - 解决：拷贝到持久化目录；或上传到服务器，存永久 URL。

---

## 三、迷你场景题（含实现要点）

- **A｜设计通用请求层，支持 Token 续期与失败重试**
  - 要点：401 触发刷新、单例锁避免多次刷新；失败请求入队，刷新后重放；指数退避；错误标准化。

- **B｜跨端图片懒加载与错误占位**
  - 要点：`image` 组件 `lazy-load`；`@error` 切占位；H5 兜底用 `IntersectionObserver`；CDN 按需裁剪。

- **C｜封装跨端存储（容量/生命周期差异）**
  - 要点：优先 `uni.setStorage`；大对象压缩；敏感字段加密；过期策略与版本迁移。

- **D｜列表上拉加载与防抖**
  - 要点：底部触发 + 节流/防抖；游标分页；控制并发；空数据与结束态管理。

- **E｜首屏加速落地**
  - 要点：分包与预加载；骨架屏；并行请求与缓存命中；图片延迟加载；路由懒加载。

---

## 四、关键代码片段参考

```js
// 请求拦截器 + 失败重试（简版）
let isRefreshing = false;
let waitQueue = [];

function doRequest(config) {
  return new Promise((resolve, reject) => {
    uni.request({
      ...config,
      timeout: 10000,
      header: { Authorization: getToken(), ...(config.header || {}) },
      success: async (res) => {
        if (res.statusCode === 401) {
          if (!isRefreshing) {
            isRefreshing = true;
            try {
              await refreshToken();
              waitQueue.forEach((fn) => fn());
              waitQueue = [];
            } finally {
              isRefreshing = false;
            }
          }
          return waitQueue.push(() => resolve(doRequest(config)));
        }
        if (res.statusCode === 200 && res.data && res.data.code === 0) {
          return resolve(res.data.data);
        }
        reject(normalizeError(res));
      },
      fail: (err) => reject(normalizeError(err)),
    });
  });
}
```

```json
// pages.json 片段：分包与预加载
{
  "pages": [{ "path": "pages/index/index" }],
  "subPackages": [
    { "root": "pkg-user", "pages": [{ "path": "pages/profile/index" }] }
  ],
  "preloadRule": {
    "pages/index/index": { "packages": ["pkg-user"] }
  }
}
```

```js
// Pinia 全局状态（Vue3 项目）
import { defineStore } from 'pinia';
export const useAuthStore = defineStore('auth', {
  state: () => ({ token: '', user: null }),
  actions: {
    setToken(t) { this.token = t; },
    async fetchUser() { this.user = await doRequest({ url: '/me' }); },
  },
});
```

```vue
<!-- 懒加载图片组件（简版） -->
<template>
  <image :src="loaded ? src : placeholder" lazy-load @error="onErr" @load="onLoad" />
</template>
<script>
export default {
  props: {
    src: String,
    placeholder: { type: String, default: '/static/placeholder.png' },
  },
  data: () => ({ loaded: false }),
  methods: {
    onLoad() { this.loaded = true; },
    onErr() { this.loaded = true; },
  },
};
<\/script>
```

```js
// 路由与 eventChannel 使用示例
// A 页面
uni.navigateTo({
  url: '/pages/detail/index?id=123',
  success(res) { res.eventChannel.emit('open', { from: 'A' }); },
});
// B 页面
onLoad(() => {
  const ec = this.getOpenerEventChannel();
  ec.on('open', (data) => { /* ... */ });
});
```

---

## 五、可直接提问的面试题清单（便于逐问）

1. 讲讲 uni-app 的编译与运行时架构，以及跨端对齐的核心机制？
2. 何时选用 nvue/UVue？具体限制与收益是什么？
3. `pages.json` 与 `manifest.json` 各自配置哪些内容？举例说明关键差异。
4. 大型项目如何系统化管理条件编译以降低维护成本？
5. 跨端样式单位如何选择与统一？踩过哪些坑？
6. 设计一个请求层：拦截器、统一错误处理、Token 刷新与重试。
7. 如何做路由与页面栈管理？`eventChannel` 在哪些场景更合适？
8. 组件通信方案的取舍：Props/事件/Provide-Inject/Pinia 何时用？
9. 长列表性能优化在 H5 与 App 分别如何做？
10. 图片与文件上传/缓存有哪些优化策略？如何避免内存炸裂？
11. 如何封装平台差异（微信/支付宝/抖音/APP/H5）的能力？
12. App 原生能力接入与权限合规 checklist？
13. WebView 与原生互调如何设计与做版本兼容？
14. `easycom` 工作原理？如何做到组件库按需？
15. 生命周期在小程序/H5/APP 的差异点？如何避免重复初始化？
16. 分包与首屏优化如何落地？度量指标是什么？
17. 错误监控、崩溃上报与性能埋点如何设计？
18. 弱网/离线场景下如何做读写兜底与恢复？
19. 多租户/多主题在 uni-app 中如何工程化实现？
20. uniCloud 何时选用？如何设计数据库权限与文件安全？

---

## 六、评分建议（供面试官参考）

- **架构理解（25%）**：能否清晰说明编译与运行时、nvue/UVue 取舍、条件编译模式。
- **工程实践（30%）**：请求层、状态管理、分包与首屏优化、组件库按需、CI 构建与发布。
- **性能与体验（20%）**：长列表、图片/文件、交互细节（返回键/软键盘/安全区）与指标度量。
- **跨端差异（15%）**：平台能力封装、权限与合规、JSBridge、降级方案。
- **问题处理（10%）**：常见坑的定位与解决方法是否系统、可迁移。

- **评分档位**：
  - 90-100：能主导大型跨端项目，具备架构与平台能力封装经验。
  - 75-89：能独立负责核心模块，熟悉跨端差异与性能优化。
  - 60-74：能完成常规业务，理解主流程但深度与广度有所欠缺。
  - <60：基础不牢或缺少跨端实践。

---

如需导出 PDF/Word 或根据特定岗位重点（如偏小程序/偏 App/Vue3 + Pinia）定制精简版，请告知偏好与字数限制。

