# 🤝 帮助与支持

如果您在使用 Ptmj Desktop 的过程中遇到任何问题，或者有新的功能建议，可以通过以下方式获取帮助。

---

## ❓ 常见问题 (FAQ)

::: details 1. 如何配置 MinIO 图片上传服务？
应用内置了直传 MinIO 的逻辑。您需要在后端的 RuoYi 系统中正确配置 MinIO 的 Endpoint、Access Key 与 Secret Key。前端上传封面或文件时会自动调用接口获取凭证并上传。
:::

::: details 2. 为什么自定义壁纸后文字看不清？
我们在最新的版本中已经引入了**全局高级毛玻璃层 (Glassmorphism)**，它会自动根据您的系统主题（深色/浅色）动态调整文字底板的对比度，并在内容区下方垫入了不透明的毛玻璃卡片。如果您仍觉得不清晰，请尝试在“设置 -> 外观”中调低壁纸的透明度，或增强模糊半径。
:::

::: details 3. 支持哪些平台？
目前 Ptmj Desktop 提供 **Windows (x64)** 和 **macOS (Apple Silicon / Intel)** 的原生安装包。Linux 版本正在社区测试中。
:::

::: details 4. 为什么下拉框或者右下角的按钮无法点击？
这些都是早期版本因 Z-index 或 Vue Teleport 机制导致的已知问题。请确保您升级到了最新版本，这些悬浮组件与弹窗的问题均已修复。
:::

---

## 🐛 提交 Issue 与 Bug 反馈

如果您发现了 Bug，或对应用的 UI/交互有绝佳的优化 Idea，欢迎在 GitHub 上提交 Issue 告诉我们：

- [👉 前往 GitHub 提交 Issue](https://github.com/your-repo/ptmj-desktop/issues)

**在提交时，请尽量提供：**
1. 您的操作系统版本（如 Windows 11 23H2 或 macOS Sonoma）。
2. 问题的详细复现步骤。
3. 相关的错误截图或控制台日志。

---

## 💬 加入社区交流

我们正在筹备官方的交流群组，与大家一起探讨极简桌面应用的美学设计：
- **微信交流群**：即将开放
- **Discord 频道**：即将开放

::: tip 持续更新
本文档与支持页面会随着 Ptmj Desktop 的迭代持续更新，感谢您的支持与陪伴！
:::