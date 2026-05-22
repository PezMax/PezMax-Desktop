import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 可以在这里注册全局的 Vue 组件，以便在 markdown 中直接使用
  }
}
