import request from '@/utils/agentRequest'

export function agentChat(data) {
  return request({
    url: '/api/v1/agent/chat',
    method: 'post',
    data
  })
}

export function searchFilesByAgent(data) {
  return request({
    url: '/api/v1/agent/files/search',
    method: 'post',
    data
  })
}

export function recommendFilesByAgent(data) {
  return request({
    url: '/api/v1/agent/files/recommend',
    method: 'post',
    data
  })
}

export function generateStudyPlanByAgent(data) {
  return request({
    url: '/api/v1/agent/study/plan',
    method: 'post',
    data
  })
}

export function generateMockExamByAgent(data) {
  return request({
    url: '/api/v1/agent/study/mock-exam',
    method: 'post',
    data
  })
}

export function suggestFileMetadata(data) {
  return request({
    url: '/api/v1/agent/files/metadata/suggest',
    method: 'post',
    data
  })
}

export function suggestFileAudit(data) {
  return request({
    url: '/api/v1/agent/files/audit/suggest',
    method: 'post',
    data
  })
}

export function organizeFavoritesByAgent(data) {
  return request({
    url: '/api/v1/agent/favorites/organize',
    method: 'post',
    data
  })
}

export function summarizeReportsByAgent(data) {
  return request({
    url: '/api/v1/agent/reports/summarize',
    method: 'post',
    data
  })
}

export function getOpsInsightsByAgent(data) {
  return request({
    url: '/api/v1/agent/ops/insights',
    method: 'post',
    data
  })
}
