import request from '@/utils/request'

export function updateDesktopUserName(userName) {
  return request({
    url: '/datum/desktop/user/profile/username',
    method: 'put',
    data: { userName }
  })
}

export function updateDesktopAvatar(avatar) {
  return request({
    url: '/datum/desktop/user/profile/avatar',
    method: 'put',
    data: { avatar }
  })
}

/** 本地上传头像（multipart），后端写入 MinIO 并更新头像地址 */
export function uploadDesktopAvatar(formData) {
  return request({
    url: '/datum/desktop/user/profile/avatar/upload',
    method: 'post',
    data: formData,
    headers: { repeatSubmit: false }
  })
}

export function verifyDesktopPassword(password) {
  return request({
    url: '/datum/desktop/user/profile/password/verify',
    method: 'post',
    data: { password }
  })
}

export function verifyDesktopSecurityAnswer(answer) {
  return request({
    url: '/datum/desktop/user/profile/security/answer/verify',
    method: 'post',
    data: { answer }
  })
}

export function updateDesktopPassword(oldPassword, newPassword) {
  return request({
    url: '/datum/desktop/user/profile/password',
    method: 'put',
    data: { oldPassword, newPassword }
  })
}

/** 已登录：通过密保答案重置密码（无需验证码） */
export function resetDesktopPasswordBySecurity(data) {
  return request({
    url: '/datum/desktop/user/profile/password/by-security',
    method: 'put',
    data
  })
}

export function getDesktopSecurity() {
  return request({
    url: '/datum/desktop/user/profile/security',
    method: 'get'
  })
}

export function updateDesktopSecurity(data) {
  return request({
    url: '/datum/desktop/user/profile/security',
    method: 'put',
    data
  })
}
