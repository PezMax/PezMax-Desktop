import request from '../../main-utils/request'

// 查询试卷收藏列表
export function listFavorite(query) {
    return request({
        url: '/datum/favorite/list',
        method: 'get',
        params: query
    })
}

// 查询试卷收藏详细
export function getFavorite(fileId) {
    return request({
        url: '/datum/favorite/' + fileId,
        method: 'get'
    })
}

// 新增试卷收藏
export function addFavorite(data) {
    return request({
        url: '/datum/favorite',
        method: 'post',
        data: data
    })
}

// 修改试卷收藏
export function updateFavorite(data) {
    return request({
        url: '/datum/favorite',
        method: 'put',
        data: data
    })
}

// 删除试卷收藏
export function delFavorite(fileId) {
    return request({
        url: '/datum/favorite/' + fileId,
        method: 'delete'
    })
}
