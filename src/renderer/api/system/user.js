import request from '@/utils/request'
import { buildDatumUserApiUrl } from '@/api/datum/userApi'
import { parseStrEmpty } from "@/utils/ruoyi";

// 查询用户列表
export function listUser(query) {
  return request({
    url: '/system/user/list',
    method: 'get',
    params: query
  })
}

// 查询用户详细
export function getUser(userId) {
  return request({
    url: '/system/user/' + parseStrEmpty(userId),
    method: 'get'
  })
}

// 新增用户
export function addUser(data) {
  return request({
    url: '/system/user',
    method: 'post',
    data: data
  })
}

// 修改用户
export function updateUser(data) {
  return request({
    url: '/system/user',
    method: 'put',
    data: data
  })
}

// 删除用户
export function delUser(userId) {
  return request({
    url: '/system/user/' + userId,
    method: 'delete'
  })
}

// 用户密码重置
export function resetUserPwd(userId, password) {
  const data = {
    userId,
    password
  }
  return request({
    url: '/system/user/resetPwd',
    method: 'put',
    data: data
  })
}

// 用户状态修改
export function changeUserStatus(userId, status) {
  const data = {
    userId,
    status
  }
  return request({
    url: '/system/user/changeStatus',
    method: 'put',
    data: data
  })
}

// 查询用户个人信息
export function getUserProfile() {
  return request({
    url: '/system/user/profile',
    method: 'get'
  })
}

// 修改用户个人信息
export function updateUserProfile(data) {
  return request({
    url: '/system/user/profile',
    method: 'put',
    data: data
  })
}

// 用户密码重置
export function updateUserPwd(oldPassword, newPassword) {
  const data = {
    oldPassword,
    newPassword
  }
  return request({
    url: '/system/user/profile/updatePwd',
    method: 'put',
    data: data
  })
}

// 用户头像上传
export function uploadAvatar(data) {
  return request({
    url: '/system/user/profile/avatar',
    method: 'post',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: data
  })
}

// 查询授权角色
export function getAuthRole(userId) {
  return request({
    url: '/system/user/authRole/' + userId,
    method: 'get'
  })
}

// 保存授权角色
export function updateAuthRole(data) {
  return request({
    url: '/system/user/authRole',
    method: 'put',
    params: data
  })
}

// 查询部门下拉树结构
export function deptTreeSelect() {
  return request({
    url: '/system/user/deptTree',
    method: 'get'
  })
}

// 桌面端：校验用户名是否存在（找回密码第一步使用）
export function verifyUsername(data) {
  return request({
    url: buildDatumUserApiUrl('securityQuestions'),
    method: 'get',
    params: {
      userName: data.username
    }
  })
}

// 桌面端：获取用户密保问题
export function getSecurityQuestions(userName) {
  return request({
    url: buildDatumUserApiUrl('securityQuestions'),
    method: 'get',
    params: {
      userName
    }
  })
}

// 桌面端：通过三条密保答案重置密码
export function resetPasswordByQuestions(data) {
  return request({
    url: buildDatumUserApiUrl('resetPasswordBySecurity'),
    method: 'post',
    data: {
      username: data.username,
      securityAnswerOne: data.answers?.[0],
      securityAnswerTwo: data.answers?.[1],
      securityAnswerThree: data.answers?.[2],
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
      code: data.code,
      uuid: data.uuid
    }
  })
}
