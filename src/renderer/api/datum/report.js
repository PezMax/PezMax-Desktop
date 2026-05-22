import request from '@/utils/request'

// 查询举报列表
export function listReport(query) {
    return request({
        url: '/datum/report/list',
        method: 'get',
        params: query
    })
}

// 查询举报详细
export function getReport(reportId) {
    return request({
        url: '/datum/report/' + reportId,
        method: 'get'
    })
}

// 新增举报
export function addReport(data) {
    return request({
        url: '/datum/report',
        method: 'post',
        data: data
    })
}

// 新增举报（别名，为了兼容现有代码）
export function addReportToPtmjReport(data) {
    return addReport(data)
}

// 修改举报
export function updateReport(data) {
    return request({
        url: '/datum/report',
        method: 'put',
        data: data
    })
}

// 删除举报
export function delReport(reportId) {
    return request({
        url: '/datum/report/' + reportId,
        method: 'delete'
    })

}
// 查询举报时间戳进度
export function getReportTimeline(reportId) {
  return request({
    url: '/datum/report/timeline/' + reportId,
    method: 'get'
  })
}
