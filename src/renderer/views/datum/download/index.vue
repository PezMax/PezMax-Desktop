<template>
  <div class="download-page" :class="{ embedded }">
    <div v-if="!props.embedded" class="page-hero">
      <div>
        <h3>我的下载</h3>
        <p>当前账号的下载记录，按文件名称筛选。</p>
      </div>
    </div>

    <div class="top-bar">
      <el-input v-model.trim="query.fileName" placeholder="按文件名称筛选" clearable @keyup.enter="loadList">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button class="reset-btn" @click="resetQuery">重置</el-button>
    </div>

    <el-table v-loading="loading" :data="pagedList" class="panel-table" empty-text="暂无下载记录">
      <el-table-column label="文件名称" prop="fileName" min-width="220" />
      <el-table-column label="文件类型" prop="fileFormat" min-width="120" />
      <el-table-column label="文件大小" prop="fileSize" min-width="140" />
      <el-table-column label="科目" prop="subject" min-width="120" />
      <el-table-column label="操作" width="132" align="center" class-name="action-column" header-class-name="action-column">
        <template #default="{ row }">
          <el-button class="row-action delete-action" @click="removeItem(row)">
            <el-icon :size="15"><Delete /></el-icon>
            <span>删除</span>
          </el-button>
        </template>
      </el-table-column>
      <template #empty>
        <div class="empty-state">
          <el-icon class="empty-icon"><DownloadIcon /></el-icon>
          <div class="empty-title">暂无下载记录</div>
          <div class="empty-desc">下载过的文件会显示在这里</div>
        </div>
      </template>
    </el-table>

    <div v-if="total > 0" class="pager-wrap">
      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        layout="total, prev, pager, next"
        :total="total"
        @current-change="syncPagedList"
      />
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete, Download as DownloadIcon } from '@element-plus/icons-vue'
import useUserStore from '@/store/modules/user'
import { getInfo } from '@/api/login'
import { listDownload, delDesktopDownload } from '@/api/datum/download'

defineOptions({ name: 'DownloadPage' })
const props = defineProps({
  embedded: { type: Boolean, default: false }
})
const userStore = useUserStore()

const loading = ref(false)
const list = ref([])
const pagedList = ref([])
const total = ref(0)
const currentUserId = ref('')

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  fileName: ''
})

function formatFileSizeBytes(val) {
  if (val === null || val === undefined || val === '') return '-'
  const n = Number(val)
  if (!Number.isFinite(n)) return `${val} 字节`
  return `${Math.trunc(n)} 字节`
}

const resolveCurrentUser = async () => {
  if (userStore.id) {
    currentUserId.value = `${userStore.id}`
    return
  }
  const info = await getInfo()
  currentUserId.value = `${info?.user?.userId || ''}`
}

const buildFileMeta = async (row) => {
  return {
    ...row,
    fileName: row.fileName || `文件-${row.fileId}`,
    fileFormat: row.fileFormat || '-',
    fileSize: formatFileSizeBytes(row.fileSize),
    subject: row.fileSubject || row.subject || '-'
  }
}

const syncPagedList = () => {
  const start = (query.pageNum - 1) * query.pageSize
  pagedList.value = list.value.slice(start, start + query.pageSize)
}

const loadList = async () => {
  loading.value = true
  try {
    if (!currentUserId.value) {
      await resolveCurrentUser()
    }
    const res = await listDownload({ pageNum: 1, pageSize: 1000, userId: currentUserId.value })
    const onlyVisible = res.rows || []
    const withFileMeta = await Promise.all(onlyVisible.map(buildFileMeta))
    const keyword = query.fileName.toLowerCase()
    list.value = keyword
      ? withFileMeta.filter((item) => (item.fileName || '').toLowerCase().includes(keyword))
      : withFileMeta
    total.value = list.value.length
    query.pageNum = 1
    syncPagedList()
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  query.fileName = ''
  query.pageNum = 1
  loadList()
}

const removeItem = async (row) => {
  await ElMessageBox.confirm(`确认删除下载记录「${row.fileName}」吗？`, '提示', { type: 'warning' })
  await delDesktopDownload(currentUserId.value, row.fileId)
  ElMessage.success('记录已删除')
  loadList()
}

onMounted(loadList)
defineExpose({ refresh: loadList, total })
</script>

<style scoped lang="scss">
.download-page {
  background: var(--ide-editor-bg, #fff);
  border: 1px solid var(--ide-border, #ebeef5);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
  transition: box-shadow 0.24s ease, border-color 0.24s ease;
}
.download-page:hover {
  border-color: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.35);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
}
.download-page.embedded {
  border: none;
  box-shadow: none;
  padding: 0;
}
.page-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 14px;
  background: linear-gradient(
      135deg,
      rgba(var(--ide-accent-rgb, 64, 158, 255), 0.14),
      rgba(var(--ide-accent-rgb, 64, 158, 255), 0.03)
  );
  margin-bottom: 16px;
  border: 1px solid rgba(var(--ide-accent-rgb, 64, 158, 255), 0.18);
}
.page-hero h3 {
  margin: 0;
  font-size: 22px;
  letter-spacing: 0.3px;
  color: var(--ide-text-active, #303133);
}
.page-hero p {
  margin: 4px 0 0;
  color: var(--ide-text-light, #909399);
  font-size: 13px;
}
.top-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
  padding: 14px;
  border: 1px solid var(--ide-border, #ebeef5);
  border-radius: 16px;
  background: color-mix(in srgb, var(--ide-panel-bg, #fff) 94%, transparent);
}
.top-bar .el-input {
  max-width: 560px;
}
.top-bar :deep(.el-input__wrapper) {
  min-height: 42px;
  border-radius: 12px;
  box-shadow: 0 0 0 1px var(--ide-border, #dcdfe6) inset;
}
.reset-btn {
  min-height: 42px;
  border-radius: 12px;
  padding: 0 22px;
  font-weight: 700;
}
.panel-table {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--ide-border, #ebeef5);
  background: color-mix(in srgb, var(--ide-editor-bg, #fff) 92%, transparent);
}
:deep(.panel-table .el-table__header th.el-table__cell) {
  height: 56px;
  padding: 0;
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.06);
  color: var(--ide-text-active, #303133);
  font-weight: 700;
}
:deep(.panel-table .el-table__header .cell) {
  line-height: 56px;
  padding-left: 20px;
  padding-right: 20px;
}
:deep(.panel-table .el-table__cell) {
  padding: 18px 0;
}
:deep(.panel-table .el-table__body .cell) {
  padding-left: 20px;
  padding-right: 20px;
}
:deep(.panel-table .action-column .cell) {
  display: flex;
  justify-content: center;
  overflow: visible;
  padding-left: 12px;
  padding-right: 12px;
  text-overflow: clip;
  white-space: nowrap;
}
:deep(.panel-table .el-table__row td.el-table__cell) {
  border-bottom-color: rgba(148, 163, 184, 0.18);
}
:deep(.panel-table .el-table__row) {
  transition: background-color 0.22s ease;
}
:deep(.panel-table .el-table__row:hover td.el-table__cell) {
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.08) !important;
}
:deep(.panel-table .el-table__empty-block) {
  min-height: 176px;
}
:deep(.panel-table .el-table__empty-text) {
  width: 100%;
  line-height: normal;
}
.pager-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.empty-state {
  min-height: 176px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--ide-text-light, #909399);
}
.empty-icon {
  margin-bottom: 12px;
  color: var(--ide-accent, #409eff);
  font-size: 32px;
  opacity: 0.55;
}
.empty-title {
  color: var(--ide-text, #606266);
  font-size: 15px;
  font-weight: 650;
  line-height: 1.4;
}
.empty-desc {
  margin-top: 4px;
  color: var(--ide-text-light, #909399);
  font-size: 13px;
  line-height: 1.5;
}
.row-action {
  min-width: auto;
  height: 32px;
  padding: 0 4px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--ide-accent, #409eff);
  font-weight: 650;
  transition: color 0.18s ease, opacity 0.18s ease;
}
.row-action:hover {
  background: transparent;
  color: var(--ide-accent, #409eff);
  opacity: 0.72;
}
.row-action .el-icon {
  color: currentColor;
  margin-right: 5px;
}
@media (max-width: 768px) {
  .top-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
