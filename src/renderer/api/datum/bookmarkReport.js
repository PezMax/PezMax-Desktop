import request from '@/utils/request'

export function listBookmarkReport(query) {
    return request({
        url: '/datum/bookmarkReport/list',
        method: 'get',
        params: query
    })
}

export function getBookmarkReport(reportId) {
    return request({
        url: '/datum/bookmarkReport/' + reportId,
        method: 'get'
    })
}

export function addBookmarkReport(data) {
    return request({
        url: '/datum/bookmarkReport',
        method: 'post',
        data: data
    })
}

export function updateBookmarkReport(data) {
    return request({
        url: '/datum/bookmarkReport',
        method: 'put',
        data: data
    })
}

export function delBookmarkReport(reportId) {
    return request({
        url: '/datum/bookmarkReport/' + reportId,
        method: 'delete'
    })
}

export function getBookmarkReportTimeline(reportId) {
    return request({
        url: '/datum/bookmarkReport/timeline/' + reportId,
        method: 'get'
    })
}
