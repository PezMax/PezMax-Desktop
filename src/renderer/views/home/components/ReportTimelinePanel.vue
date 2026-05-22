<template>
  <div class="report-timeline-panel">
    <div class="timeline-container" v-if="!selectedReport">
      <div class="timeline-header">
        <h3>我的举报记录</h3>
        <el-button type="primary" size="small" @click="fetchMyReports" :loading="loading">
          <el-icon><RefreshRight /></el-icon>
          刷新
        </el-button>
      </div>

      <div v-if="loading" class="timeline-loading">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="myReports.length === 0" class="timeline-empty">
        <el-empty description="暂无举报记录" />
      </div>

      <div v-else class="reports-list">
        <div
          v-for="report in myReports"
          :key="report.reportId"
          class="report-item"
          @click="selectReport(report)"
        >
          <div class="report-item-header">
            <span class="report-file-id">{{ getReportFileName(report) }}</span>
            <el-tag :type="getStatusType(report.result)" size="small">
              {{ getStatusLabel(report.result) }}
            </el-tag>
          </div>
          <div class="report-item-reason">{{ report.reason || '-' }}</div>
          <div class="report-item-time">{{ formatTime(report.createTime) }}</div>
        </div>
      </div>
    </div>

    <div class="timeline-detail" v-else>
      <div class="detail-header">
        <el-button link type="primary" @click="goBackToList">
          <el-icon><Back /></el-icon>
          返回列表
        </el-button>
        <h3>{{ getReportFileName(selectedReport) }}</h3>
      </div>

      <div v-if="timelineLoading" class="timeline-loading">
        <el-skeleton :rows="4" animated />
      </div>

      <div v-else-if="timeline" class="timeline-steps">
        <el-timeline>
          <el-timeline-item
            color="#67c23a"
            :timestamp="formatTime(timeline.createTime || selectedReport.createTime)"
            placement="top"
          >
            <div class="node-content">
              <h4>提交举报</h4>
              <p class="node-desc">文件：{{ getReportFileName(selectedReport) }}</p>
              <p v-if="timeline.reason || selectedReport.reason" class="node-reason">
                <strong>举报原因：</strong>{{ timeline.reason || selectedReport.reason }}
              </p>
            </div>
          </el-timeline-item>

          <el-timeline-item
            :color="normalizeStatus(selectedReport.result) !== 0 ? '#67c23a' : '#e6a23c'"
            :timestamp="formatTime(timeline.createTime || selectedReport.createTime)"
            placement="top"
          >
            <div class="node-content">
              <h4>审核中</h4>
              <p class="node-desc">管理员正在审核该举报，请耐心等待</p>
            </div>
          </el-timeline-item>

          <el-timeline-item
            :color="normalizeStatus(selectedReport.result) === 0 ? '#909399' : (normalizeStatus(selectedReport.result) === 1 ? '#67c23a' : '#f56c6c')"
            :timestamp="normalizeStatus(selectedReport.result) === 0 ? '等待处理' : formatTime(timeline.updateTime || selectedReport.updateTime)"
            placement="top"
          >
            <div class="node-content">
              <h4>
                {{ normalizeStatus(selectedReport.result) === 0 ? '审核结果' : (normalizeStatus(selectedReport.result) === 1 ? '审核通过' : '审核未通过') }}
              </h4>
              <p class="node-desc">
                <template v-if="normalizeStatus(selectedReport.result) === 0">等待管理员处理</template>
                <template v-else-if="normalizeStatus(selectedReport.result) === 1">举报已审核通过，违规内容已处理</template>
                <template v-else>举报审核未通过，内容不违规</template>
              </p>
              <p class="node-remark" v-if="normalizeStatus(selectedReport.result) !== 0 && (timeline.remark || selectedReport.remark)">
                <strong>审核备注：</strong>{{ timeline.remark || selectedReport.remark }}
              </p>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <div v-else class="timeline-empty">
        <el-empty description="暂无进度详情" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listReport, getReportTimeline } from '@/api/datum/report'
import { ElMessage } from 'element-plus'
import { RefreshRight, Back } from '@element-plus/icons-vue'
import useUserStore from '@/store/modules/user'

const myReports = ref([])
const selectedReport = ref(null)
const timeline = ref(null)
const loading = ref(false)
const timelineLoading = ref(false)
const userStore = useUserStore()

const normalizeStatus = (value) => {
  const n = Number(value)
  return Number.isNaN(n) ? -1 : n
}

const fetchMyReports = async () => {
  loading.value = true
  try {
    const userId = userStore.id
    if (!userId) {
      ElMessage.error('获取用户信息失败')
      myReports.value = []
      loading.value = false
      return
    }
    
    const res = await listReport({
      pageNum: 1,
      pageSize: 100,
      userId: userId
    })
    if (res.code === 200) {
      myReports.value = Array.isArray(res.rows) ? res.rows : Array.isArray(res.data) ? res.data : []
    } else if (Array.isArray(res.rows)) {
      myReports.value = res.rows
    } else {
      ElMessage.error(res.msg || '获取举报列表失败')
      myReports.value = []
    }
  } catch (error) {
    console.error('获取举报列表异常:', error)
    ElMessage.error('加载举报列表失败')
    myReports.value = []
  } finally {
    loading.value = false
  }
}

const selectReport = async (report) => {
  selectedReport.value = report
  timeline.value = null
  timelineLoading.value = true
  try {
    const reportId = report.reportId || report.id
    const res = await getReportTimeline(reportId)
    if (res.code === 200) {
      timeline.value = res.data || res
    } else if (res.data) {
      timeline.value = res.data
    } else {
      timeline.value = res
    }
  } catch (error) {
    console.error('获取举报进度异常:', error)
    ElMessage.error('加载举报进度失败')
    timeline.value = null
  } finally {
    timelineLoading.value = false
  }
}

const goBackToList = () => {
  selectedReport.value = null
  timeline.value = null
}

const getReportFileName = (report) => {
  if (!report) return '-'
  return (
    report.fileName ||
    report.filename ||
    report.name ||
    report.file?.name ||
    report.file?.fileName ||
    report.file?.filename ||
    report.fileId ||
    '-'
  )
}

const getStatusType = (status) => {
  switch (normalizeStatus(status)) {
    case 0:
      return 'warning'
    case 1:
      return 'success'
    case 2:
      return 'danger'
    default:
      return 'info'
  }
}

const getStatusLabel = (status) => {
  switch (normalizeStatus(status)) {
    case 0:
      return '未审核'
    case 1:
      return '已通过'
    case 2:
      return '已驳回'
    default:
      return '未知'
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  fetchMyReports()
})
</script>

<style scoped lang="scss">
.report-timeline-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow: hidden;
}

.timeline-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--ide-border);

  h3 {
    margin: 0;
    font-size: 14px;
    color: var(--ide-text-active);
    font-weight: 600;
  }
}

.timeline-loading {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.timeline-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reports-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-item {
  padding: 10px;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: var(--ide-bg);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--ide-accent);
    background: rgba(var(--ide-accent-rgb), 0.04);
  }
}

.report-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.report-file-id {
  font-size: 13px;
  font-weight: 600;
  color: var(--ide-text-active);
}

.report-item-reason {
  font-size: 12px;
  color: var(--ide-text);
  margin-bottom: 6px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.report-item-time {
  font-size: 11px;
  color: var(--ide-text-light);
}

.timeline-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ide-border);

  h3 {
    margin: 0;
    font-size: 14px;
    color: var(--ide-text-active);
    font-weight: 600;
  }
}

.timeline-steps {
  flex: 1;
  overflow-y: auto;
  position: relative;
  padding: 16px 16px 16px 2px;

  :deep(.el-timeline) {
    padding-left: 6px;
  }

  /* Ensure timeline timestamps are visible */
  :deep(.el-timeline-item__timestamp) {
    color: var(--ide-text-light, #909399);
    font-size: 13px;
    margin-bottom: 8px;
  }
}

.node-content {
  h4 {
    margin: 0 0 4px;
    font-size: 14px;
    color: var(--ide-text-active);
    font-weight: 600;
  }

  .node-desc {
    margin: 0 0 6px;
    font-size: 12px;
    color: var(--ide-text-light);
    line-height: 1.4;
  }

  .node-reason,
  .node-remark {
    margin: 8px 0 0;
    padding: 8px;
    background: var(--ide-bg);
    border-left: 2px solid var(--ide-accent);
    font-size: 12px;
    color: var(--ide-text);
    border-radius: 4px;

    strong {
      color: var(--ide-text-active);
    }
  }
}
</style>

