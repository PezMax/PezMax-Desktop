// 撰写人：LYX
// 说明：这里集中放客户端认证模块的固定配置，目的是和原来的管理端登录配置彻底分开。

export const PTMJ_BRAND_NAME = '拼图满绩'

export const PTMJ_AUTH_MODE = 'ptmj-client'

export const PTMJ_CLIENT_ROLE = 'ptmj_user'

export const PTMJ_CLIENT_PERMISSION = 'ptmj:client:access'

export const PTMJ_AUTH_ROUTES = Object.freeze({
  login: '/login',
  register: '/register',
  forgotPassword: '/forgotPassword',
  portal: '/index'
})

export const PTMJ_AUTH_ROUTE_LIST = Object.freeze([
  PTMJ_AUTH_ROUTES.login,
  PTMJ_AUTH_ROUTES.register,
  PTMJ_AUTH_ROUTES.forgotPassword
])

export function isPtmjAuthRoute(path) {
  return PTMJ_AUTH_ROUTE_LIST.includes(path)
}

