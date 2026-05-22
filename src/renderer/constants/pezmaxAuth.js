// 撰写人：LYX
// 说明：这里集中放客户端认证模块的固定配置，目的是和原来的管理端登录配置彻底分开。

export const PEZMAX_BRAND_NAME = 'PezMax'

export const PEZMAX_AUTH_MODE = 'pezmax-client'

export const PEZMAX_CLIENT_ROLE = 'pezmax_user'

export const PEZMAX_CLIENT_PERMISSION = 'pezmax:client:access'

export const PEZMAX_AUTH_ROUTES = Object.freeze({
  login: '/login',
  register: '/register',
  forgotPassword: '/forgotPassword',
  portal: '/index'
})

export const PEZMAX_AUTH_ROUTE_LIST = Object.freeze([
  PEZMAX_AUTH_ROUTES.login,
  PEZMAX_AUTH_ROUTES.register,
  PEZMAX_AUTH_ROUTES.forgotPassword
])

export function isPezMaxAuthRoute(path) {
  return PEZMAX_AUTH_ROUTE_LIST.includes(path)
}

