import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/auth'
import useUserStore from '@/store/modules/user'

const agentService = axios.create({
  baseURL: import.meta.env.VITE_APP_AGENT_API || 'http://localhost:8090',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
})

function resolveAccessToken() {
  const storageToken = getToken()
  if (storageToken) return storageToken

  try {
    return useUserStore().token || ''
  } catch {
    return ''
  }
}

agentService.interceptors.request.use(config => {
  const isToken = (config.headers || {}).isToken === false
  const accessToken = resolveAccessToken()
  if (accessToken && !isToken) {
    config.headers.Authorization = 'Bearer ' + accessToken
  }
  return config
}, error => Promise.reject(error))

agentService.interceptors.response.use(res => {
  const data = res.data || {}
  if (typeof data.code === 'number' && data.code !== 200) {
    const message = data.error || data.msg || '智能体接口请求失败'
    ElMessage.error(message)
    return Promise.reject(new Error(message))
  }
  return data
}, error => {
  let message = error?.response?.data?.error || error?.response?.data?.msg || error?.message || '智能体接口请求失败'
  if (message === 'Network Error') {
    message = '智能体服务连接异常，请确认 8090 端口已启动'
  } else if (message.includes('timeout')) {
    message = '智能体接口请求超时'
  }
  ElMessage.error(message)
  return Promise.reject(error)
})

export default agentService
