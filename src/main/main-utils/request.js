import axios from 'axios'
import { getToken } from './auth'
import { tansParams } from './ruoyi'

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'

const service = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000
})

// request 拦截器
service.interceptors.request.use(config => {
  if (getToken()) {
    config.headers['Authorization'] = 'Bearer ' + getToken()
  }
  if (config.method === 'get' && config.params) {
    let url = config.url + '?' + tansParams(config.params)
    url = url.slice(0, -1)
    config.params = {}
    config.url = url
  }
  return config
}, error => {
  console.log(error)
  return Promise.reject(error)
})

// 响应拦截器
service.interceptors.response.use(res => {
  const code = res.data.code || 200
  const msg = res.data.msg || '未知错误'
  if (res.request.responseType === 'blob' || res.request.responseType === 'arraybuffer') {
    return res.data
  }
  if (code === 401) {
    return Promise.reject(new Error('登录状态已过期，请重新登录'))
  } else if (code !== 200) {
    return Promise.reject(new Error(msg))
  } else {
    return Promise.resolve(res.data)
  }
}, error => {
  let message = error.message || '未知错误'
  if (message === 'Network Error') {
    message = '后端接口连接异常'
  } else if (message.includes('timeout')) {
    message = '系统接口请求超时'
  } else if (message.includes('Request failed with status code')) {
    message = '系统接口' + message.slice(-3) + '异常'
  }
  return Promise.reject(new Error(message))
})

export default service
