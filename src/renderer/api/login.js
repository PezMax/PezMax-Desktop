import request from '@/utils/request'
import { buildDatumUserApiUrl } from '@/api/datum/userApi'

// 登录方法
export function login(username, password, code, uuid) {
  const data = {
    username,
    password,
    code,
    uuid
  }
  return request({
    url: buildDatumUserApiUrl('login'),
    headers: {
      isToken: false,
      repeatSubmit: false
    },
    method: 'post',
    data: data
  })
}

// 注册方法
export function register(data) {
  return request({
    url: buildDatumUserApiUrl('register'),
    headers: {
      isToken: false
    },
    method: 'post',
    data: data,
    timeout: 5000
  })
}

// 获取用户详细信息
export function getInfo() {
  return request({
    url: buildDatumUserApiUrl('getInfo'),
    method: 'get'
  })
}

// 解锁屏幕
export function unlockScreen(password) {
  return request({
    url: '/unlockscreen',
    method: 'post',
    data: { password }
  })
}

// 退出方法
export function logout() {
  return request({
    url: '/logout',
    method: 'post'
  })
}

// 获取验证码
export function getCodeImg() {
  return request({
    url: buildDatumUserApiUrl('captchaImage'),
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  })
}
// 修改人：LYZ，找回密码页专用验证码（桌面端）
export function getForgetCodeImg() {
  return request({
    url: buildDatumUserApiUrl('captchaImage'),
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  })
}

// 找回密码第一步：校验账号与验证码并返回密保问题
export function getSecurityQuestions(params) {
  return request({
    url: buildDatumUserApiUrl('securityQuestions'),
    headers: {
      isToken: false
    },
    method: 'get',
    params
  })
}

// 修改人：LYZ，通过密保找回密码
export function resetPasswordBySecurity(data) {
  return request({
    url: buildDatumUserApiUrl('resetPasswordBySecurity'),
    headers: {
      isToken: false
    },
    method: 'post',
    data
  })
}
