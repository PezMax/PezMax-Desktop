// src/renderer/router/index.js
import { createWebHashHistory, createRouter } from 'vue-router'
import { PTMJ_AUTH_ROUTES } from '@/constants/ptmjAuth'


/**
 * Note: 路由配置项
 *
 * hidden: true                     // 当设置 true 的时候该路由不会再侧边栏出现
 * alwaysShow: true                 // 一直显示根路由
 * redirect: noRedirect             // 当设置 noRedirect 的时候该路由在面包屑导航中不可被点击
 * name:'router-name'               // 设定路由的名字
 * roles: ['admin', 'common']       // 访问路由的角色权限
 * permissions: ['a:a:a', 'b:b:b']  // 访问路由的菜单权限
 * meta : {
    noCache: true                   // 不会被 <keep-alive> 缓存
    title: 'title'                  // 路由在侧边栏和面包屑中展示的名字
    icon: 'svg-name'                // 路由的图标
    breadcrumb: false               // 不在面包屑中显示
    activeMenu: '/system/user'      // 高亮相对应的侧边栏
  }
 */

// 公共路由
export const constantRoutes = [
  {
  // LYZ二次修改：客户端登录路由
    path: PTMJ_AUTH_ROUTES.login,
    component: () => import('@/views/login.vue'),
    hidden: true
  },
  {
    // LYZ二次修改：客户端注册路由
    path: PTMJ_AUTH_ROUTES.register,
    component: () => import('@/views/register.vue'),
    hidden: true
  },
  {
    // LYZ二次修改：客户端找回密码路由
    path: PTMJ_AUTH_ROUTES.forgotPassword,
    component: () => import('@/views/forgetPassword.vue'),
    hidden: true,
    meta: { title: '找回密码' }
  },
  {
    // 兼容旧链接 `/forgetPassword`，统一重定向到规范路径 `/forgotPassword`
    path: '/forgetPassword',
    redirect: PTMJ_AUTH_ROUTES.forgotPassword,
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error/401'),
    hidden: true
  },
  {
    path: '',
    redirect: '/index'
  },
  {
    path: '/index',
    component: () => import('@/views/home/index'),
    name: 'Index',
    meta: { title: '首页', icon: 'dashboard', affix: true }
  },
  {
    path: '/datum/ptmj-user',
    component: () => import('@/views/datum/ptmjUser/index.vue'),
    name: 'PtmjUserCenter',
    meta: { title: '用户详情' }
  },
  {
    path: '/datum/favorite',
    component: () => import('@/views/datum/favorite/index.vue'),
    name: 'Favorite',
    meta: { title: '我的收藏' }
  },
  {
    path: '/datum/download',
    component: () => import('@/views/datum/download/index.vue'),
    name: 'Download',
    meta: { title: '我的下载' }
  },
  {
    path: '/rank',
    redirect: () => ({ path: '/index', query: { view: 'rank' } })
  },
  {
    path: "/:pathMatch(.*)*",
    component: () => import('@/views/error/404'),
    hidden: true
  }
]

// 动态路由，基于用户权限动态去加载 (目前由于后台系统页面已清理，可暂时置空)
export const dynamicRoutes = []

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

export default router
