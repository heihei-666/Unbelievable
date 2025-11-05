# 项目部署与使用指南

## 一、将项目上传到GitHub

### 前置条件
1. 在您的电脑上安装Git：[下载Git](https://git-scm.com/downloads)
2. 在GitHub上创建一个新的仓库

### 上传步骤

1. **安装Git并配置**
   ```bash
   # 安装完成后，设置用户名和邮箱
   git config --global user.name "您的GitHub用户名"
   git config --global user.email "您的GitHub邮箱"
   ```

2. **进入项目目录**
   ```bash
   cd d:\ByteDance\Trae\Trae_File
   ```

3. **初始化Git仓库**
   ```bash
   git init
   ```

4. **添加文件到暂存区**
   ```bash
   git add .
   ```

5. **提交更改**
   ```bash
   git commit -m "初始化34金币时间管理系统"
   ```

6. **关联远程仓库**（将下面的URL替换为您在GitHub创建的仓库地址）
   ```bash
   git remote add origin https://github.com/您的用户名/您的仓库名.git
   ```

7. **推送到GitHub**
   ```bash
   git push -u origin master
   ```
   或者
   ```bash
   git push -u origin main
   ```

8. **公开仓库**
   在GitHub仓库页面，点击"Settings" → 向下滚动找到"Danger Zone" → 点击"Change repository visibility" → 选择"Public" → 确认更改

## 二、在移动端使用（PWA应用）

本项目已实现PWA（渐进式Web应用）功能，可以像原生应用一样安装到移动设备上使用。

### 部署要求
1. 将项目部署到支持HTTPS的服务器上（PWA要求HTTPS）
2. 常用的免费部署选项：
   - GitHub Pages
   - Netlify
   - Vercel
   - 阿里云/腾讯云等国内云服务

### 部署到GitHub Pages

1. **构建项目**
   ```bash
   npm run build
   ```

2. **安装gh-pages工具**
   ```bash
   npm install -g gh-pages
   ```

3. **部署到GitHub Pages**
   ```bash
   gh-pages -d dist
   ```

4. **在GitHub上设置**
   - 进入仓库的Settings页面
   - 找到"Pages"选项
   - 确保Source选择了"gh-pages branch"
   - 等待几分钟后，您的应用将可以通过GitHub Pages域名访问

### 在移动设备上安装

#### iOS设备（Safari浏览器）：
1. 打开部署好的网站
2. 点击底部工具栏中的"分享"按钮
3. 选择"添加到主屏幕"
4. 点击"添加"完成安装

#### Android设备（Chrome浏览器）：
1. 打开部署好的网站
2. 点击右上角的菜单按钮（三个点）
3. 选择"添加到主屏幕"或"安装应用"
4. 按照提示完成安装

### 离线使用
安装后，应用支持离线使用，所有数据将保存在设备的本地存储中。即使没有网络连接，也可以正常记录和查看时间金币。

## 三、将Web应用打包为原生APP（可选）

如果需要真正的APK文件，可以使用以下工具将PWA转换为原生应用：

### 使用Capacitor

1. **安装Capacitor**
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init
   ```

2. **配置Capacitor**
   在capacitor.config.json中设置正确的webDir为"dist"

3. **添加Android平台**
   ```bash
   npx cap add android
   ```

4. **构建项目并同步到Capacitor**
   ```bash
   npm run build
   npx cap sync android
   ```

5. **打开Android Studio并构建APK**
   ```bash
   npx cap open android
   ```
   在Android Studio中，按照常规流程构建签名的APK或AAB文件

### 使用PWA Builder

也可以使用[PWA Builder](https://www.pwabuilder.com/)网站，上传您的manifest.json文件，然后生成各种平台的应用包。