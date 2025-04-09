# TiddlyWiki App 🌟

[简体中文](./README.zh-CN.md) | English

![img](./banner04.png)
![img](./banner03.png)

A TiddlyWiki desktop application that provides a smoother desktop experience.

## ✨ Features

- 🔧 System tray support, minimize to tray
- 📂 Template import and single file import support
- 📂 Markdown batch import support
- 🔒 Encrypted HTML build support
- 🚀 Multiple startup modes:
  - 💻 Local server mode
  - 🌐 Browser opening
- 📄 Sub-Wiki support
- 📝 Wiki management features:
  - 📂 Open/switch Wiki
  - 🔨 Build static Wiki
  - 📁 Open in system file manager
  - 🚀 One-click deploy to GitHub Pages
- 🌍 Internationalization support
  - 🇨🇳 Simplified Chinese
  - 🇺🇸 English
- 🔄 Auto-update functionality

## 📖 Usage Guide

### 🔰 Installation

[Download tiddlywiki-app](https://github.com/oeyoews/tiddlywiki-app/releases)

> For arch(or manjaro) user, you can install `pacman -U tiddlywiki-app-*.pacman`, or use PKGBUILD directly

<!-- * Manjaro Series: `pacman -S appimagelauncher and use appimage install, or use pacman package`
* Windows: Download the exe file
* macOS: Download the dmg installer (untested) -->

### ⚡ Basic Operations

1. Use the menu bar or system tray:
   - 📋 File menu:
     - 📂 Open Wiki: Select other Wiki folders
     - 🔨 Build Wiki: Generate static HTML files
     - 🌐 Open in browser: Open current Wiki in default browser
     - 📁 Open current Wiki folder: View in file manager
   - 🔽 System tray:
     - 🖱️ Left click: Toggle window show/hide
     - 📌 Right-click menu: Quick access to common features

### ⌨️ Shortcuts

- 🔽 Minimize: Window automatically hides to system tray
- ❌ Close button: Defaults to minimize to tray, can fully exit via tray menu

## 👨‍💻 Development

### 🛠️ Requirements

- 📦 Node.js
- 📦 npm or yarn
- 📦 git

### 🚀 Local Development

```mermaid
flowchart TD
    subgraph 主进程[主进程 Main Process]
        A[应用程序入口] --> B[应用初始化]
        B --> C[创建主窗口]

        subgraph 窗口管理[Window Management]
            C --> D[窗口状态管理]
            C --> E[窗口事件监听]
            D --> D1[全屏控制]
            D --> D2[窗口位置记忆]
            E --> E1[窗口关闭事件]
            E --> E2[窗口最小化事件]
        end

        subgraph 系统服务[System Services]
            F[系统托盘] --> F1[托盘菜单]
            F --> F2[托盘事件]
            G[自动更新] --> G1[检查更新]
            G --> G2[下载更新]
            H[系统API] --> H1[文件系统]
            H --> H2[Shell操作]
        end

        subgraph IPC主进程[IPC Main]
            I[IPC通信管理] --> I1[接收渲染进程消息]
            I --> I2[发送消息到渲染进程]
        end
    end

    subgraph 渲染进程[Renderer Process]
        J[前端页面] --> K[用户界面]

        subgraph 渲染进程通信[IPC Renderer]
            L[IPC通信] --> L1[发送消息到主进程]
            L --> L2[接收主进程消息]
        end

        subgraph 预加载脚本[Preload Scripts]
            M[上下文隔离] --> M1[API暴露]
            M --> M2[安全控制]
        end

        K --> N[页面路由]
        K --> O[状态管理]
        K --> P[UI组件]
    end

    subgraph 外部服务[External Services]
        Q[文件管理]
        R[外部链接处理]
        S[系统托盘服务]
    end

    I1 <--> L1
    I2 <--> L2
    F --> S
    H1 --> Q
    H2 --> R
```

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🤔 Why create Tiddlywiki APP?

The primary goal is to solve TiddlyWiki's long-standing save issues. While the community has provided many solutions, what could be simpler than downloading and installing an exe file?

Secondly, what sets Tiddlywiki APP apart is that it doesn't interfere with users' Wikis or make any modifications - truly plug-and-play. I want it to be as simple as possible, allowing first-time TiddlyWiki users to start without learning additional concepts.

Regarding the blank version, I want users to experience 100% pure TiddlyWiki when first encountering it, rather than being overwhelmed by plugins. This might be why Jermolene chose to provide a blank version for users' initial TiddlyWiki experience.

As for concerns about "blank versions scaring away new users," I won't discuss that much here. While I hope more people learn about TiddlyWiki, I won't actively promote it, as currently, TiddlyWiki's ease of use doesn't offer significant promotional advantages.

<!-- "tiddlywiki": "npm:@oeyoews/tiddlywiki-lite@5.3.6-lite-20250402" -->

<!-- patch -->
<!-- pnpm patch tw5-typed -->

## 📚 Related Projects

* [UseWiki2](https://github.com/oeyoews/usewiki2)
