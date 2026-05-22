import request from '@/utils/request'

// 查询试卷收藏列表
export function listFavorite(query) {
    const userId = query.userId
    return request({
        url: '/datum/desktop/favorite/list/' + userId,
        method: 'get',
        params: {
            pageNum: query.pageNum,
            pageSize: query.pageSize
        }
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
export function delFavorite(userId, fileId) {
    return request({
        url: '/datum/desktop/favorite/' + userId + '/' + fileId,
        method: 'delete'
    })
}
