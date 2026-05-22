import request from '@/utils/request'

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

// lxq 获取试卷文件树：用于初始化资源管理器的树形展示数据
export function getFileTree(query) {
    return request({
        url: '/datum/file/tree',
        method: 'get',
        params: query
    })
}

// 获取科目联想列表
export function getSubjects(query) {
    return request({
        url: '/datum/file/subjects',
        method: 'get',
        params: query
    })
}
// lxq 文件名搜索，不分页：按关键字查询匹配的文件列表供前端展示
export function searchFileList(fileName) {
  return request({
    url: '/datum/file/search',
    method: 'get',
    params: {
      fileName
    }
  })
}

// 下载试卷接口
export function getPaperFile(fileId) {
  return request({
    url: '/datum/download/file',
    method: 'get',
    params: { fileId },
    responseType: 'blob' // 必须设置，否则获取到的流会损坏
  })
}
