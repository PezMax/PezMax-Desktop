import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 占位指令，避免 v-hasPermi 报错
app.directive('hasPermi', () => {})

app.use(router).use(ElementPlus).mount('#app')
