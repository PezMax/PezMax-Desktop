import request from '@/utils/request'

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
/**
 * lxq
 *获取用户端需要以弹窗形式展示的通知列表
 */
export function getUserPopupNotifications(userId) {
  return request({
    url: '/system/notification/user/popup',
    method: 'get',
    params: {userId}
  })
}
/**
 * lxq
 *获取用户端需要以滚动形式展示的通知列表
 */
export function getUserScrollNotifications(){
  return request({
    url:'/system/notification/user/scroll',
    method:'get'
  })
}
