import request from '@/utils/request'
import { buildDatumUserApiUrl } from '@/api/datum/userApi'

// 查询平台用户列表
export function listUser(query) {
    return request({
        url: buildDatumUserApiUrl('list'),
        method: 'get',
        params: query
    })
}

// 查询平台用户详细
export function getUser(userId) {
    return request({
        url: buildDatumUserApiUrl(userId),
        method: 'get'
    })
}

// 新增平台用户
export function addUser(data) {
    return request({
        url: buildDatumUserApiUrl(),
        method: 'post',
        data: data
    })
}

// 修改平台用户
export function updateUser(data) {
    return request({
        url: buildDatumUserApiUrl(),
        method: 'put',
        data: data
    })
}

// 删除平台用户
export function delUser(userId) {
    return request({
        url: buildDatumUserApiUrl(userId),
        method: 'delete'
    })
}

export function getUploadRank() {
  return request({
    url: buildDatumUserApiUrl('rank'),
    method: 'get',
    headers: { noMessage: true }
  })
}
