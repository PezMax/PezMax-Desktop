---
layout: home

hero:
  name: "Ptmj Desktop"
  text: "优雅、强大的本地资料库"
  tagline: "摒弃繁杂，回归纯粹。在 macOS 与 Windows 上享受如丝般顺滑的试题与书签管理体验。"
  
  # 预留给未来您放软件实际运行截图的地方
  # image:
  #   src: /app-preview.png 
  #   alt: Ptmj Desktop Interface

  actions:
    - theme: brand
      text:  下载 macOS 版 (Apple Silicon)
      link: /download/mac-arm64
    - theme: brand
      text: ⊞ 下载 Windows 版 (x64)
      link: /download/windows-x64
    - theme: alt
      text: 查看更新日志
      link: /changelog

features:
  - title: 🚀 极速原生体验
    details: 基于 Electron 与 Vue 3 构建，毫秒级启动，告别 Web 端的卡顿与等待。
    icon: ⚡
  - title: 💎 沉浸式毛玻璃 UI
    details: 深度定制的 Glassmorphism 界面，自动跟随系统深色模式，让每一次点击都是视觉享受。
    icon: 💅
  - title: 📦 本地与云端无缝同步
    details: 客户端一键直传 MinIO，完美对接 RuoYi 后端，构建安全的企业级数据流。
    icon: ☁️
  - title: 🔖 智能书签便当盒
    details: 创新的 Bento Box 布局，将杂乱的网课、论文、博客链接整理得井井有条。
    icon: 🍱
---

<style>
/* 针对官网下载按钮进行 Apple 风格的特殊强调 */
.VPButton.brand {
  background: linear-gradient(135deg, #0071e3 0%, #409EFF 100%) !important;
  border: none !important;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  padding: 0 28px;
  box-shadow: 0 8px 24px rgba(0, 113, 227, 0.3) !important;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
}

.VPButton.brand:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 113, 227, 0.4) !important;
}

.VPButton.alt {
  border-radius: 14px !important;
  font-weight: 600;
}

/* 首页专属小幅增强 */
.container {
  max-width: 1200px !important;
}
</style>

## 探索 Ptmj 的无限可能

::: tip 💡 提示
这是 Ptmj Desktop 的官方下载站点雏形。未来您可以在这里放置应用的演示视频、功能动图以及详细的用户指南。
:::
