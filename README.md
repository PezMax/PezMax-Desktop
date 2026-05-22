# PezMax - 拼图满绩 (Desktop)

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/itJinYu-toolkit/PezMax)
[![Electron](https://img.shields.io/badge/electron-39.2.6-brightgreen.svg)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/vue-3.5.26-4fc08d.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/vite-7.2.6-646cff.svg)](https://vitejs.dev/)

**PezMax (拼图满绩)** 是一款基于 Electron + Vue 3 开发的高颜值、跨平台校园资料共享桌面客户端。它致力于为学生提供极致的资料查阅、分享与整理体验。

---

## ✨ 核心特性

- 📂 **全能资源管理器**：支持树状结构展示试题、课件等各类校园资料，操作逻辑贴合 IDE，丝滑顺畅。
- 🚀 **极速上传**：支持单文件、多文件以及**文件夹递归上传**，自动提取元数据，一键分享。
- 🔖 **智能书签系统**：不仅是文件，还可以收藏网课、文章或任意链接。支持自动抓取封面、自定义归档与预览。
- 👁️ **全格式预览**：内置 PDF、Markdown、图片以及文本预览器。支持 MD 目录导航、代码高亮。
- 🎨 **极致个性化**：
  - 支持**毛玻璃透明效果**（透明度、模糊度可调）。
  - 自定义主色调、背景图片。
  - 适配深色/浅色模式，跟随系统自动切换。
- 🏆 **贡献排行榜**：实时同步上传排行，记录每一位资料贡献者的足迹。
- ⌨️ **效率工具**：支持全局唤醒快捷键、文件搜索、一键下载、收藏管理。
- 🔄 **自动更新**：集成版本检测与增量更新功能，时刻保持最新版本。

---

## 🛠️ 技术栈

- **框架**：[Electron](https://www.electronjs.org/) & [Vue 3](https://vuejs.org/) (Composition API)
- **构建工具**：[Electron-Vite](https://electron-vite.org/)
- **UI 组件库**：[Element Plus](https://element-plus.org/)
- **状态管理**：[Pinia](https://pinia.vuejs.org/)
- **样式**：[Sass](https://sass-lang.com/) & [PostCSS](https://postcss.org/)
- **路由**：[Vue Router](https://router.vuejs.org/)
- **核心依赖**：Axios, Marked, ECharts, Electron-Updater

---

## 🚀 项目起步

### 1. 克隆项目
```bash
git clone https://github.com/itJinYu-toolkit/PezMax.git
cd PezMax
```

### 2. 安装依赖
```bash
npm install
```

### 3. 开发环境运行
```bash
npm run dev
```

### 4. 生产环境打包
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

---

## 📦 目录结构简述

- `src/main`: Electron 主进程代码（窗口管理、文件上传 IPC、更新逻辑等）。
- `src/renderer`: Vue 渲染进程代码（前端界面、业务组件、状态管理）。
- `src/preload`: 预加载脚本（IPC 通信桥梁）。
- `resources`: 静态资源（图标、安装包背景等）。
- `.env.*`: 环境配置文件。

---

## 🤝 参与贡献与支持

如果你在使用过程中遇到问题，或者有更好的建议，欢迎加入我们的社区：

- **QQ 交流群**：`1077605719`
- **提交 Issue**：在 GitHub 仓库提交你的 Bug 反馈或 Feature Request。

如果这个项目对你有帮助，欢迎点击仓库右上角的 ⭐ **Star** 支持我们！

---

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 协议开源。
