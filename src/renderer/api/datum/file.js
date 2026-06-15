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

// 获取学校联想列表
export function getSchools(query) {
    return request({
        url: '/datum/file/schools',
        method: 'get',
        params: query
    })
}

// 检查学校名称是否已存在
export function checkSchoolExists(schoolName) {
    return request({
        url: '/datum/file/schools/check',
        method: 'get',
        params: { schoolName }
    })
}

// lxq 关键字搜索，不分页：同时匹配文件名和学科名称，学科命中优先排列
export function searchFileList(keyword) {
  return request({
    url: '/datum/file/search',
    method: 'get',
    params: {
      keyword
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