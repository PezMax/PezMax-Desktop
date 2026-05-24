<div align="center">

# 🧩 PezMax - 拼图满绩 

**一款专为学习者打造的下一代跨平台桌面资源管理神器。**

采用顶尖的 Glassmorphism (毛玻璃) 视觉美学与 Bento Box (便当盒) 布局设计，将试题资料、课件、网课书签收纳得井井有条。

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)
![Vue.js](https://img.shields.io/badge/vue3-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Spring Boot](https://img.shields.io/badge/SpringBoot-6DB33F?style=for-the-badge&logo=Spring&logoColor=white)

</div>

---

## ✨ 核心特性 (Features)

### 🎨 极致的 UI / UX 美学
- **沉浸式全屏毛玻璃 (Glassmorphism)**：底层渲染管线深度优化。UI 元素自动调节模糊半径与透明度，支持自定义桌面壁纸并保持绝佳的文本对比度。
- **Bento Box (便当盒) 布局**：采用 Apple / Notion 风格的大圆角卡片设计，操作界面如丝般顺滑。
- **自适应深浅模式**：完美跟随系统主题，自动计算光晕强度与阴影深度。

### 📁 智能资源管理器
- **全能资源管理**：支持树状结构展示试题、课件等各类校园资料，支持单文件、多文件以及**文件夹递归上传**。
- **极速预览与下载**：内置 PDF、Markdown、图片以及文本预览器。支持 MD 目录导航与代码高亮。
- **上传计数统计**：实时记录并展示用户的资料贡献总数，激发分享热情。

### 🔖 云端书签便当盒
- **智能封面抓取**：添加外部资源时，支持从本地挑选封面图，自动直传至后端 MinIO 对象存储。
- **三级分类体系**：通过 `资源分类 -> 所属专栏 -> 书签项` 进行树状陈列，支持多维度过滤检索。
- **URL 自动修复**：内置智能纠错逻辑，自动将后端返回的内部 IP (如 minio, localhost) 转换为可访问的客户端地址。

### 🔐 安全与性能
- **独立双轨权限**：彻底剥离传统 Admin 逻辑，独立接管客户端角色验证。
- **极致启动速度**：基于环境变量的按需加载，优化了生产环境下的首屏渲染与网络连通性。

---

## 🛠️ 技术栈 (Tech Stack)

### 前端 (Frontend)
- **核心框架**: Vue 3 (Composition API) + Vite + Electron
- **UI 组件库**: Element Plus (定制化毛玻璃视觉风格)
- **状态管理**: Pinia
- **路由模式**: WebHashHistory (针对 Electron 环境优化)

### 后端与基础设施 (Backend)
- **核心框架**: Java Spring Boot (基于 RuoYi 架构)
- **存储**: MySQL 8.x + Redis + MinIO

---

## 🚀 快速开始 (Getting Started)

### 1. 环境准备
- Node.js >= 16.x
- [PezMax Server](https://github.com/itJinYu-toolkit/PezMax-Server) 后端服务已启动

### 2. 安装与运行
```bash
# 安装依赖
$ npm install

# 启动本地开发服务器
$ npm run dev
```

### 3. 打包构建
```bash
# 清理缓存并构建 Windows 安装包
$ npm run clean
$ npm run build:win
```

---

## 📁 核心目录结构 (Structure)

```text
pez-max/
├── src/
│   ├── main/                 # Electron 主进程 (窗口管理、IPC 通信、自动更新)
│   ├── preload/              # 预加载脚本 (安全桥接层)
│   └── renderer/             # Vue 3 渲染进程 (UI 核心)
│       ├── api/              # 业务接口 (datum 模块网关)
│       ├── assets/           # 品牌 Logo、SVG 图标与全局样式
│       ├── store/            # Pinia 状态 (user, upload, settings)
│       └── views/            # 页面组件 (home, login, register, forget)
├── resources/                # 打包资源 (App 图标、安装包背景)
└── .env.production           # 生产环境公网配置
```

---

## 🤝 贡献与反馈 (Contributing)

如果您在使用过程中发现了 Bug，或有更好的改进建议，欢迎加入我们的社区：

- **QQ 交流群**: `1077605719`
- **提交 Issue**: 在 GitHub 仓库提交反馈。

---

<div align="center">
  <sub>Made with ❤️ by the PezMax Team. 探索桌面应用体验的无限可能。</sub>
</div>
