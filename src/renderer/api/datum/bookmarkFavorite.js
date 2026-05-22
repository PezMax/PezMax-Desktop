import request from '@/utils/request'

// 查询当前用户书签收藏关系
export function listBookmarkFavorite(query) {
    return request({
        url: '/datum/bookmark/favorite/list',
        method: 'get',
        params: query
    })
}

// 查询桌面端用户收藏书签列表
export function listFavoriteBookmark(query) {
    const userId = query.userId
    return request({
        url: '/datum/desktop/bookmark/favorite/list/' + userId,
        method: 'get',
        params: {
            pageNum: query.pageNum,
            pageSize: query.pageSize
        }
    })
}

// 新增书签收藏
export function addBookmarkFavorite(data) {
    return request({
        url: '/datum/bookmark/favorite',
        method: 'post',
        data: data
    })
}

// 取消书签收藏
export function delBookmarkFavorite(userId, bookmarkId) {
    return request({
        url: '/datum/desktop/bookmark/favorite/' + userId + '/' + bookmarkId,
        method: 'delete'
    })
}
