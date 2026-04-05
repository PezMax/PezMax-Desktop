import request from '../../main-utils/request'

// 查询试卷文件列表
export function listFile(query) {
    return request({
        url: '/datum/file/list',
        method: 'get',
        params: query
    })
}

// 查询试卷文件详细
export function getFile(fileId) {
    return request({
        url: '/datum/file/' + fileId,
        method: 'get'
    })
}

// 新增试卷文件
export function addFile(data) {
    return request({
        url: '/datum/file',
        method: 'post',
        data: data
    })
}

// 修改试卷文件
export function updateFile(data) {
    return request({
        url: '/datum/file',
        method: 'put',
        data: data
    })
}

// 删除试卷文件
export function delFile(fileId) {
    return request({
        url: '/datum/file/' + fileId,
        method: 'delete'
    })
}
