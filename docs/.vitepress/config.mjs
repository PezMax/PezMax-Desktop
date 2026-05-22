import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Ptmj Desktop",
  description: "优雅、强大的本地资料库 - 官方下载",
  
  // 优化文档的路由，使其更干净 (移除 .html)
  cleanUrls: true,

  themeConfig: {
    // 顶部导航栏，完全重构成产品展示风格
    nav: [
      { text: '首页', link: '/' },
      { text: '功能概览', link: '/features' },
      { text: '更新日志', link: '/changelog' },
      { text: '帮助与支持', link: '/support' }
    ],

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-repo/ptmj-desktop' }
    ],

    // 页脚信息
    footer: {
      message: '为追求纯粹体验的教育者与学习者打造。',
      copyright: 'Copyright © 2024 Ptmj Team'
    }
  }
})
