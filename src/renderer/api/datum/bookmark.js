import request from '@/utils/request'

// 查询书签列表
export function listBookmark(query) {
    return request({
        url: '/datum/bookmark/list',
        method: 'get',
        params: query
    })
}

// 新增书签
export function addBookmark(data) {
    return request({
        url: '/datum/bookmark',
        method: 'post',
        data: data
    })
}

// 修改书签
export function updateBookmark(data) {
    return request({
        url: '/datum/bookmark',
        method: 'put',
        data: data
    })
}

// 删除书签
export function delBookmark(id) {
    return request({
        url: '/datum/bookmark/' + id,
        method: 'delete'
    })
}
