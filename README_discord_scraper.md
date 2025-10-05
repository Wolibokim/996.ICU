# Discord成员列表爬虫使用说明

## 功能说明

这个Python爬虫脚本可以自动登录Discord并获取服务器频道的成员列表数据。

## 安装步骤

### 1. 安装Python依赖

```bash
pip install -r requirements.txt
```

### 2. 安装Chrome浏览器

确保你的系统已安装Chrome浏览器。`undetected-chromedriver`会自动下载对应的ChromeDriver。

## 使用方法

### 方法1: 自动导航（推荐）

如果你知道目标频道的完整URL，可以在脚本中设置：

1. 打开 `discord_scraper.py`
2. 找到这一行：`CHANNEL_URL = None`
3. 修改为你的频道URL，例如：
   ```python
   CHANNEL_URL = "https://discord.com/channels/1421845610327179296/1421845610889482322"
   ```
4. 运行脚本：
   ```bash
   python discord_scraper.py
   ```

### 方法2: 手动导航

如果不设置频道URL，脚本会：

1. 自动登录Discord
2. 等待你手动点击左侧的服务器和频道（对应截图的"第一步"）
3. 按回车键继续
4. 自动点击右上角的成员列表按钮（对应截图的"第二步"）
5. 自动抓取成员数据

运行脚本：
```bash
python discord_scraper.py
```

## 账号信息

脚本中已配置的账号信息：
- 邮箱：`CorneliaGarden3A@z87qwc.xyz`
- 密码：`CorneliaGarden3A@z87qwc.xyz`

如需修改，编辑 `discord_scraper.py` 中的 `EMAIL` 和 `PASSWORD` 变量。

## 输出文件

脚本会生成以下文件：

1. **discord_members.json** - JSON格式的成员数据
2. **discord_members.csv** - CSV格式的成员数据（可用Excel打开）
3. **discord_page.png** - 调试用的页面截图（如果需要）

## 数据格式

每个成员的数据包含：
- `username`: 用户名
- `status`: 在线状态（online/offline/idle/dnd）
- `avatar_url`: 头像URL
- `raw_text`: 原始文本内容

## 注意事项

1. **反爬虫检测**：使用了`undetected-chromedriver`来绕过Discord的反爬虫机制
2. **验证码**：如果遇到验证码，需要手动完成验证
3. **速率限制**：不要频繁运行，避免账号被封禁
4. **浏览器窗口**：默认会显示浏览器窗口，可以看到整个过程
5. **网络延迟**：脚本中有适当的等待时间，如果网络慢可能需要调整

## 常见问题

### Q: 登录失败怎么办？
A: 检查账号密码是否正确，或者可能需要完成人工验证（如验证码）

### Q: 找不到成员列表怎么办？
A: 确保你已经：
1. 成功登录
2. 导航到正确的频道
3. 点击了右上角的成员列表按钮

### Q: 抓取的数据不完整？
A: Discord使用懒加载，脚本会自动滚动加载更多成员，但超大服务器可能需要调整滚动次数。

## 调试模式

如果遇到问题，脚本会：
- 自动保存页面截图到 `discord_page.png`
- 在控制台输出详细的执行日志
- 保持浏览器窗口打开以便检查

## 进阶配置

### 无头模式（后台运行）

在 `discord_scraper.py` 中取消注释这一行：
```python
# options.add_argument('--headless')
```

### 调整等待时间

如果网络较慢，可以增加脚本中的 `time.sleep()` 时间。

## 免责声明

本脚本仅供学习和研究使用。使用时请遵守Discord的服务条款，不要用于非法用途。频繁爬取可能导致账号被封禁。
