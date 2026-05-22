import request from '@/utils/request'

// 查询用户密保列表
export function listSecurity(query) {
    return request({
        url: '/datum/security/list',
        method: 'get',
        params: query
    })
}

// 查询用户密保详细
export function getSecurity(id) {
    return request({
        url: '/datum/security/' + id,
        method: 'get'
    })
}

// 新增用户密保
export function addSecurity(data) {
    return request({
        url: '/datum/security',
        method: 'post',
        data: data
    })
}

// 修改用户密保
export function updateSecurity(data) {
    return request({
        url: '/datum/security',
        method: 'put',
        data: data
    })
}

// 删除用户密保
export function delSecurity(id) {
    return request({
        url: '/datum/security/' + id,
        method: 'delete'
    })
}
