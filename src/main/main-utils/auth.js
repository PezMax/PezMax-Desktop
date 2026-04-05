const TokenKey = 'User-Token'

// 主进程环境用内存存储 token（js-cookie 依赖浏览器 document.cookie，主进程不可用）
let _token = null

export function getToken() {
  return _token
}

export function setToken(token) {
  _token = token
}

export function removeToken() {
  _token = null
}
