import request from '../../main-utils/request'

// 查询试卷下载列表
export function listDownload(query) {
    return request({
        url: '/datum/download/list',
        method: 'get',
        params: query
    })
}

// 查询试卷下载详细
export function getDownload(downloadId) {
    return request({
        url: '/datum/download/' + downloadId,
        method: 'get'
    })
}

// 新增试卷下载
export function addDownload(data) {
    return request({
        url: '/datum/download',
        method: 'post',
        data: data
    })
}

// 修改试卷下载
export function updateDownload(data) {
    return request({
        url: '/datum/download',
        method: 'put',
        data: data
    })
}

// 删除试卷下载
export function delDownload(downloadId) {
    return request({
        url: '/datum/download/' + downloadId,
        method: 'delete'
    })
}
