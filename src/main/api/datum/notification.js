import request from '../../main-utils/request'

// 查询通知列表
export function listNotification(query) {
    return request({
        url: '/datum/notification/list',
        method: 'get',
        params: query
    })
}

// 查询通知详细
export function getNotification(notifyId) {
    return request({
        url: '/datum/notification/' + notifyId,
        method: 'get'
    })
}

// 新增通知
export function addNotification(data) {
    return request({
        url: '/datum/notification',
        method: 'post',
        data: data
    })
}

// 修改通知
export function updateNotification(data) {
    return request({
        url: '/datum/notification',
        method: 'put',
        data: data
    })
}

// 删除通知
export function delNotification(notifyId) {
    return request({
        url: '/datum/notification/' + notifyId,
        method: 'delete'
    })
}
