import { createWebHistory, createRouter } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('../views/home/index.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：未登录跳转到登录页
// router.beforeEach(async (to) => {
//   if (to.meta.public) return true
//   const token = await window.electronAPI.callApi('getToken')
//   if (!token) return { name: 'login' }
//   return true
// })

export default router
