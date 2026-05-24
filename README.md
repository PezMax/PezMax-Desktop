<div align="center">

# 🧩 拼图满绩 (PezMax)

**一款专为学习者与知识工作者打造的下一代跨平台桌面资源管理神器。**

采用顶尖的 Glassmorphism (毛玻璃) 视觉美学与 Bento Box (便当盒) 布局设计，将海量网课、论文、文档与网络书签收纳得井井有条。

![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge\&logo=Electron\&logoColor=white)
![Vue.js](https://img.shields.io/badge/vue3-%2335495e.svg?style=for-the-badge\&logo=vuedotjs\&logoColor=%234FC08D)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge\&logo=vite\&logoColor=white)
![Spring Boot](https://img.shields.io/badge/SpringBoot-6DB33F?style=for-the-badge\&logo=Spring\&logoColor=white)

</div>

***

## ✨ 核心特性 (Features)

### 🎨 极致的 UI / UX 美学

- **沉浸式全屏毛玻璃 (Glassmorphism)**：底层渲染管线深度优化。无论您设置多么复杂的自定义桌面壁纸，UI 元素都会自动调节模糊半径与透明度，保障绝佳的文本对比度。
- **Bento Box (便当盒) 布局**：告别传统的枯燥表单，采用 Apple / Notion 风格的大圆角（22px\~34px）卡片式设计，操作界面如丝般顺滑。
- **霓虹与光影微动效**：右下角的悬浮操作药丸（Pill Button）、全局弹性的 Toast 提示框，均附带动态流光、内发光与阻尼回弹特效。
- **自适应深浅模式**：无论是刺眼的白昼还是专注的深夜，UI 会完美跟随系统主题，自动计算暗黑模式下的光晕强度。

### 📁 智能资源管理器

- **无缝树形视图**：极速加载本地嵌套的试题、课件与复习资料。支持一键展开/折叠所有层级。
- **动态后缀控制**：支持一键隐藏/显示文件后缀名，保证界面的清爽。
- **丝滑元数据抽屉**：点击文件，右侧即平滑推入详情面板，查看大小、上传者、分类以及年份（例如神秘的 `114514` 纪元），一键复制文件名或科目信息。

### 🔖 云端书签便当盒

- **本地直传 MinIO**：添加网课、文章等外部资源时，支持从本地直接挑选封面图。图片将被自动转为 Base64 实现即时预览，并在最终保存时自动直传至后端 MinIO 对象存储，杜绝“资源丢失”问题。
- **三级分类体系**：通过 `资源分类 -> 所属专栏 -> 书签项` 进行树状陈列，支持多维度过滤检索。
- **两步安全存储逻辑**：采用先进的事务逻辑，先存 MySQL 换取主键 ID，再上传封面更新 URL，保证数据绝对的一致性。

### 🔐 独立双轨权限系统

- **客户端专属通道**：彻底剥离传统 Admin 端登录逻辑，前端独立接管 `ptmj-client` 角色验证。
- **安全鉴权**：包含记住密码、图形验证码与无感 Token 续期功能，最大程度减少登录打断。

***

## 🛠️ 技术栈 (Tech Stack)

### 前端 (Frontend)

- **核心框架**: Vue 3 (Composition API) + Vite + Electron
- **UI 组件库**: Element-Plus (深度重写了样式、弹窗、下拉框等所有基础组件的 Z-index 和渲染逻辑)
- **样式预处理**: SCSS
- **状态管理**: Pinia
- **路由控制**: Vue Router

### 后端与基础设施 (Backend - RuoYi Base)

- **核心框架**: Java Spring Boot
- **数据库**: MySQL 8.x
- **缓存**: Redis
- **对象存储**: MinIO (负责存储所有封面图与原件资源)

***

## 🚀 快速开始 (Getting Started)

### 1. 环境准备

- Node.js >= 16.x
- 本地或远程可用的 RuoYi 后端服务 (带 MinIO)

### 2. 克隆与安装

```bash
# 安装依赖 (推荐使用 npm)
$ npm install
```

### 3. 本地开发调试

```bash
# 启动 Electron 本地开发服务器 (带热更新)
$ npm run dev
```

### 4. 打包构建 (Build)

```bash
# 构建 Windows 安装包 (.exe)
$ npm run build:win

# 构建 macOS 安装包 (.dmg / .app)
$ npm run build:mac

# 构建 Linux 安装包 (.AppImage / .deb)
$ npm run build:linux
```

***

## 📁 核心目录结构 (Structure)

```text
ptmj-desktop/
├── src/
│   ├── main/                 # Electron 主进程 (Node.js 逻辑，负责读取本地文件/IPC通信)
│   ├── preload/              # Electron 预加载脚本 (安全桥接层)
│   └── renderer/             # Vue 3 渲染进程 (前端 UI 核心)
│       ├── api/              # 对接后端 RuoYi 系统的接口
│       ├── assets/           # 静态资源、图片与全局样式
│       ├── constants/        # 全局常量 (如 Ptmj 客户端认证配置)
│       ├── router/           # 前端路由 (独立处理客户端白名单与守卫)
│       ├── store/            # Pinia 状态管理
│       └── views/            
│           ├── home/         # 主页面核心组件 (SidePanel, MainEditor, FileInfoDrawer等)
│           ├── ptmj-auth/    # 客户端专属登录/注册/找回密码页面
│           └── ...
├── out/                      # 编译后的输出目录
└── package.json
```

***

## 🤝 贡献与反馈 (Contributing)

如果您在使用过程中发现了 Bug，或对应用的毛玻璃美学设计有更好的改进建议，欢迎提交 Issue。

- UI 定制：如果下拉框层级、弹窗毛玻璃等出现穿透，请优先检查 `.ide-body` 与 `el-overlay` 的相关全局覆盖样式。

***

<div align="center">
  <sub>Made with ❤️ by the Ptmj Team. 探索桌面应用体验的无限可能。</sub>
</div>
