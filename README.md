# TiddlyWiki App 🌟

![img](./banner.png)

一个基于 Electron 的 TiddlyWiki 桌面应用封装，提供更加丝滑的桌面端使用体验。

## ✨ 功能特点

- 🔧 系统托盘支持，最小化到托盘
- 🚀 支持多种启动方式：
  - 💻 本地服务器模式
  - 🌐 浏览器打开
- 📝 Wiki 管理功能：
  - 📂 打开/切换 Wiki
  - 🔨 构建静态 Wiki
  - 📁 在系统文件管理器中打开
- 🌍 国际化支持
  - 🇨🇳 简体中文
  - 🇺🇸 English

## 📖 使用说明

### 🔰 安装

下载并安装最新版本的应用。

* Manjaro 系列：`pacman -S appimagelauncher and use appimage install, or use pacman package`
* Windows: 下载 exe 即可
* Macos: 下载 dmg 安装包（未测试）

### ⚡ 基本操作

1. 首次启动时，选择或创建一个 Wiki 文件夹
2. 使用菜单栏或系统托盘进行操作：
   - 📋 文件菜单：
     - 📂 打开 Wiki：选择其他 Wiki 文件夹
     - 🔨 构建 Wiki：生成静态 HTML 文件
     - 🌐 在浏览器中打开：使用默认浏览器打开当前 Wiki
     - 📁 打开当前 Wiki 文件夹：在文件管理器中查看
   - 🔽 系统托盘：
     - 🖱️ 左键点击：切换窗口显示/隐藏
     - 📌 右键菜单：快速访问常用功能

### ⌨️ 快捷操作

- 🔽 最小化：窗口会自动隐藏到系统托盘
- ❌ 关闭按钮：默认最小化到托盘，可通过托盘菜单完全退出

## 👨‍💻 开发

### 🛠️ 环境要求

- 📦 Node.js
- 📦 npm 或 yarn
- 📦 git

### 🚀 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务
npm run dev
```
