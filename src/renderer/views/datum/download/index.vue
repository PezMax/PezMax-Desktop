<template>
  <div class="download-page" :class="{ embedded }">
    <div v-if="!props.embedded" class="page-hero">
      <div>
        <h3>我的下载</h3>
        <p>当前账号的下载记录，按科目筛选。</p>
      </div>
    </div>

    <div class="top-bar">
      <el-input v-model.trim="query.subject" placeholder="按科目筛选" clearable @keyup.enter="loadList">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button class="reset-btn" @click="resetQuery">重置</el-button>
      <el-button class="reset-btn" @click="openDownloadFolder">打开下载目录</el-button>
    </div>

    <el-table v-loading="loading" :data="pagedList" class="panel-table" empty-text="暂无下载记录">
      <el-table-column label="科目" prop="subject" min-width="120" />
      <el-table-column label="文件名称" min-width="180">
        <template #default="{ row }">
          <el-tooltip :content="row.fileName" placement="top" :show-after="400">
            <span>{{ truncateFileName(row.fileName) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="文件类型" prop="fileFormat" min-width="120" />
      <el-table-column label="文件大小" min-width="120">
        <template #default="{ row }">
          <span>{{ formatFileSize(row.fileSize) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center" class-name="action-column" header-class-name="action-column">
        <template #default="{ row }">
          <el-button class="row-action open-action" :loading="row._opening" @click="openFile(row)">
            <el-icon :size="15"><FolderOpened /></el-icon>
            <span>打开</span>
          </el-button>
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
import { Search, Delete, Download as DownloadIcon, FolderOpened } from '@element-plus/icons-vue'
import axios from 'axios'
import useUserStore from '@/store/modules/user'
import { getToken } from '@/utils/auth'

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
  subject: ''
})

const baseURL = import.meta.env.VITE_APP_BASE_API

function formatFileSize(val) {
  if (val === null || val === undefined || val === '') return '-'
  const n = Number(val)
  if (!Number.isFinite(n) || n < 0) return '-'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function truncateFileName(name) {
  if (!name) return '-'
  return name.length > 10 ? name.slice(0, 10) + '...' : name
}

const resolveCurrentUser = () => {
  const id = userStore.id ? Number(userStore.id) : 0
  currentUserId.value = id || ''
  console.log('[download-page] 当前用户ID:', currentUserId.value)
  return currentUserId.value
}

const normalizeRecord = (row) => {
  return {
    ...row,
    fileName: row.file_name || row.fileName || `文件-${row.file_id || row.fileId}`,
    fileId: row.file_id || row.fileId,
    fileFormat: row.file_format || row.fileFormat || '-',
    fileSize: row.file_size != null ? Number(row.file_size) : Number(row.fileSize) || 0,
    subject: row.file_subject || row.fileSubject || row.subject || '-',
    fileUrl: row.file_url || row.fileUrl || '',
    localPath: row.local_path || row.localPath || '',
    downloadTime: row.download_time || row.downloadTime || ''
  }
}

const syncPagedList = () => {
  const start = (query.pageNum - 1) * query.pageSize
  pagedList.value = list.value.slice(start, start + query.pageSize)
}

const loadList = async () => {
  loading.value = true
  try {
    const uid = resolveCurrentUser()
    console.log('[download-page] 加载下载记录, userId=', uid)
    const res = await window.electronAPI.downloadRecords.list(uid || null)
    console.log('[download-page] IPC 返回:', res)
    if (!res || !res.success) {
      console.warn('[download-page] 查询下载记录失败:', res?.message)
      list.value = []
      total.value = 0
      pagedList.value = []
      return
    }
    const rows = res.rows || []
    const normalized = rows.map(normalizeRecord)
    console.log('[download-page] 规范化后记录数:', normalized.length)
    const keyword = query.subject.toLowerCase()
    list.value = keyword
      ? normalized.filter((item) => (item.subject || '').toLowerCase().includes(keyword))
      : normalized
    total.value = list.value.length
    query.pageNum = 1
    syncPagedList()
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  query.subject = ''
  query.pageNum = 1
  loadList()
}

const openDownloadFolder = async () => {
  const settings = await window.electronAPI.getSettings()
  const downloadDir = settings?.downloadPath || ''
  if (!downloadDir) {
    ElMessage.warning('未设置下载目录')
    return
  }
  const openError = await window.electronAPI.openPath(downloadDir)
  if (openError) {
    ElMessage.error(`打开下载目录失败：${openError}`)
  }
}

const openFile = async (row) => {
  if (row._opening) return
  row._opening = true
  try {
    const fileName = row.fileName
    // 1. 先从本地路径尝试直接打开（如果记录中有 localPath）
    const localPath = row.localPath || ''
    if (localPath) {
      const openError = await window.electronAPI.openPath(localPath)
      if (!openError) return
    }
    // 2. 再从下载目录尝试
    const settings = await window.electronAPI.getSettings()
    const downloadDir = settings?.downloadPath || ''
    if (downloadDir) {
      const dirPath = `${downloadDir.replace(/[/\\]$/, '')}/${fileName}`
      const openError = await window.electronAPI.openPath(dirPath)
      if (!openError) return
    }
    // 3. 本地文件不存在，提示后重新下载
    ElMessage.warning('本地文件已删除或移动，正在重新下载...')
    const url = `${baseURL}/datum/download/file?fileId=${row.fileId}`
    const res = await axios.get(url, {
      responseType: 'blob',
      headers: { Authorization: 'Bearer ' + getToken() }
    })
    const blob = new Blob([res.data])
    const downloadFileName = decodeURIComponent(res.headers['download-filename'] || fileName)
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    const saveResult = await window.electronAPI.saveFile({
      content: buffer,
      fileName: downloadFileName,
      skipDialog: true
    })
    if (saveResult && saveResult.success && saveResult.filePath) {
      // 更新本地记录中的 localPath
      const uid = resolveCurrentUser()
      console.log('[download-page] 重新下载完成，记录到SQLite: fileId=', row.fileId, 'localPath=', saveResult.filePath)
      await window.electronAPI.downloadRecords.add({
        fileId: row.fileId,
        fileName: row.fileName,
        fileUrl: row.fileUrl || '',
        fileSize: row.fileSize || 0,
        fileFormat: row.fileFormat || '',
        fileSubject: row.subject || '',
        localPath: saveResult.filePath,
        userId: uid ? Number(uid) : null
      })
      await window.electronAPI.downloadRecords.flush()
      const openResult = await window.electronAPI.openPath(saveResult.filePath)
      if (openResult) {
        ElMessage.error(`打开文件失败：${openResult}`)
      }
    } else if (saveResult && saveResult.reason !== 'canceled') {
      ElMessage.error('保存文件失败')
    }
  } catch (e) {
    console.error('打开文件失败:', e)
    ElMessage.error('打开文件失败，请重试')
  } finally {
    row._opening = false
  }
}

const removeItem = async (row) => {
  await ElMessageBox.confirm(`确认删除下载记录「${row.fileName}」吗？`, '提示', { type: 'warning' })
  const uid = resolveCurrentUser()
  console.log('[download-page] 删除记录: userId=', uid, 'fileId=', row.fileId)
  const res = await window.electronAPI.downloadRecords.delete(uid || '', row.fileId)
  console.log('[download-page] 删除结果:', res)
  if (!res || !res.success) {
    ElMessage.error('删除失败: ' + (res?.message || '未知错误'))
    return
  }
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
