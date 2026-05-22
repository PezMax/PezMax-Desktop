// src/main/main-utils/apiRegistry.js

// import { getToken, setToken, removeToken } from '@/utils/auth'


// const authApi = { getToken, setToken, removeToken }

export const apiRegistry = {
  // authApi
}

// 按名称查找 API 函数，支持从所有模块中查找
export function findApi(name) {
  for (const module of Object.values(apiRegistry)) {
    if (typeof module[name] === 'function') return module[name]
  }
  return null
}

export default apiRegistry
