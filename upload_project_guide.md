# 上传本地项目指南

## 方法1: 使用Git上传到GitHub

### 步骤1: 初始化Git仓库（如果还没有）
```bash
cd /path/to/your/project
git init
git add .
git commit -m "Initial commit"
```

### 步骤2: 在GitHub上创建新仓库
1. 登录GitHub
2. 点击右上角的"+"号，选择"New repository"
3. 填写仓库名称和描述
4. 选择公开或私有
5. 不要初始化README、.gitignore或license（因为本地已有）
6. 点击"Create repository"

### 步骤3: 连接本地仓库到远程仓库
```bash
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

### 步骤4: 后续更新
```bash
git add .
git commit -m "更新说明"
git push
```

## 方法2: 使用SSH密钥（推荐）

### 生成SSH密钥
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### 添加SSH密钥到GitHub
1. 复制公钥内容：`cat ~/.ssh/id_ed25519.pub`
2. 在GitHub设置中添加SSH密钥
3. 使用SSH URL克隆：
```bash
git remote add origin git@github.com:用户名/仓库名.git
```

## 方法3: 使用GitHub CLI

### 安装GitHub CLI
```bash
# Ubuntu/Debian
sudo apt install gh

# macOS
brew install gh

# Windows
winget install GitHub.cli
```

### 认证并创建仓库
```bash
gh auth login
cd /path/to/your/project
gh repo create 仓库名 --public --source=. --remote=origin --push
```

## 方法4: 直接拖拽上传（小项目）

对于小型项目，可以直接在GitHub网页上：
1. 创建新仓库
2. 点击"uploading an existing file"
3. 拖拽文件或文件夹到页面

## 方法5: 使用Git图形界面工具

- **GitHub Desktop**: 图形化Git工具
- **SourceTree**: Atlassian的免费Git客户端
- **GitKraken**: 功能强大的Git GUI

## 常见问题解决

### 如果遇到认证问题
```bash
# 使用Personal Access Token
git remote set-url origin https://用户名:token@github.com/用户名/仓库名.git
```

### 如果文件太大
```bash
# 安装Git LFS
git lfs install
git lfs track "*.大文件扩展名"
git add .gitattributes
```

### 忽略不需要的文件
创建 `.gitignore` 文件：
```
node_modules/
.env
*.log
dist/
build/
.DS_Store
```

## 其他代码托管平台

- **GitLab**: 类似GitHub的流程
- **Bitbucket**: Atlassian的代码托管
- **Gitee**: 国内的代码托管平台
- **Coding**: 腾讯云的代码托管

## 备份和同步

### 定期备份
```bash
# 创建备份脚本
#!/bin/bash
git add .
git commit -m "Auto backup $(date)"
git push
```

### 多平台同步
```bash
# 添加多个远程仓库
git remote add github https://github.com/用户名/仓库名.git
git remote add gitlab https://gitlab.com/用户名/仓库名.git

# 推送到多个平台
git push github main
git push gitlab main
```