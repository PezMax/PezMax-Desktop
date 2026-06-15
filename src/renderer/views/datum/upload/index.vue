<template>
  <div class="upload-page" :class="{ embedded }">
    <div v-if="!props.embedded" class="page-hero">
      <div>
        <h3>我的上传</h3>
        <p>管理当前账号上传的文件和书签。</p>
      </div>
    </div>

    <div class="upload-toolbar">
      <div class="mode-tabs" role="tablist">
        <button :class="{ active: activeType === 'file' }" @click="activeType = 'file'">
          <el-icon><Document /></el-icon>
          <span>文件</span>
        </button>
        <button :class="{ active: activeType === 'bookmark' }" @click="activeType = 'bookmark'">
          <el-icon><Link /></el-icon>
          <span>书签</span>
        </button>
      </div>
      <el-input
        v-model.trim="query.keyword"
        :placeholder="activeType === 'file' ? '按文件名、学校或科目筛选' : '按标题、链接或专栏筛选'"
        clearable
        class="search-input"
        @keyup.enter="loadCurrentList"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button class="reset-btn" @click="resetQuery">重置</el-button>
    </div>

    <el-table
      v-if="activeType === 'file'"
      v-loading="loadingFiles"
      :data="pagedFiles"
      class="panel-table"
      empty-text="暂无上传文件"
    >
      <el-table-column label="文件名称" prop="fileName" min-width="220" show-overflow-tooltip />
      <el-table-column label="学校" prop="fileSchool" min-width="120" show-overflow-tooltip />
      <el-table-column label="科目" prop="fileSubject" min-width="120" show-overflow-tooltip />
      <el-table-column label="年份" prop="fileYear" width="92" />
      <el-table-column label="状态" width="112">
        <template #default="{ row }">
          <span class="status-pill" :class="getStatusClass(row.fileStatus)">{{ getStatusText(row.fileStatus) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="上传时间" prop="createTime" min-width="160" show-overflow-tooltip />
      <el-table-column label="操作" width="168" align="center" class-name="action-column" header-class-name="action-column">
        <template #default="{ row }">
          <el-button class="row-action edit-action" @click="openFileEdit(row)">
            <el-icon><Edit /></el-icon>
            <span>编辑</span>
          </el-button>
          <el-button class="row-action edit-action" @click="removeFile(row)">
            <el-icon><Delete /></el-icon>
            <span>删除</span>
          </el-button>
        </template>
      </el-table-column>
      <template #empty>
        <div class="empty-state">
          <el-icon class="empty-icon"><Document /></el-icon>
          <div class="empty-title">暂无上传文件</div>
          <div class="empty-desc">你上传的文件会显示在这里</div>
        </div>
      </template>
    </el-table>

    <el-table
      v-else
      v-loading="loadingBookmarks"
      :data="pagedBookmarks"
      class="panel-table"
      empty-text="暂无上传书签"
    >
      <el-table-column label="标题" prop="title" min-width="180" show-overflow-tooltip />
      <el-table-column label="链接" prop="url" min-width="220" show-overflow-tooltip />
      <el-table-column label="专栏" prop="collection" min-width="130" show-overflow-tooltip />
      <el-table-column label="类型" prop="resourceType" width="112">
        <template #default="{ row }">{{ getResourceTypeLabel(row.resourceType) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="112">
        <template #default="{ row }">
          <span class="status-pill" :class="getStatusClass(row.status)">{{ getStatusText(row.status) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="168" align="center" class-name="action-column" header-class-name="action-column">
        <template #default="{ row }">
          <el-button class="row-action edit-action" @click="openBookmarkEdit(row)">
            <el-icon><Edit /></el-icon>
            <span>编辑</span>
          </el-button>
          <el-button class="row-action edit-action" @click="removeBookmark(row)">
            <el-icon><Delete /></el-icon>
            <span>删除</span>
          </el-button>
        </template>
      </el-table-column>
      <template #empty>
        <div class="empty-state">
          <el-icon class="empty-icon"><Link /></el-icon>
          <div class="empty-title">暂无上传书签</div>
          <div class="empty-desc">你添加的外部书签会显示在这里</div>
        </div>
      </template>
    </el-table>

    <div v-if="currentTotal > 0" class="pager-wrap">
      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        layout="total, prev, pager, next"
        :total="currentTotal"
        @current-change="syncPagedList"
      />
    </div>

    <el-dialog v-model="fileDialogVisible" title="编辑文件" width="520px" append-to-body>
      <el-form ref="fileFormRef" :model="fileForm" label-width="86px" class="edit-form">
        <el-form-item label="文件名称" prop="fileName">
          <el-input v-model.trim="fileForm.fileName" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="学校名称" prop="fileSchool">
          <el-input v-model.trim="fileForm.fileSchool" maxlength="60" show-word-limit placeholder="请输入学校名称" />
        </el-form-item>
        <el-form-item label="科目" prop="fileSubject">
          <el-input v-model.trim="fileForm.fileSubject" maxlength="60" show-word-limit />
        </el-form-item>
        <el-form-item label="年份" prop="fileYear">
          <el-input-number v-model="fileForm.fileYear" :min="1900" :max="2100" controls-position="right" />
        </el-form-item>
        <el-form-item label="类型" prop="fileType">
          <el-select v-model="fileForm.fileType" clearable placeholder="请选择文件类型" :teleported="false">
            <el-option label="期末" :value="1" />
            <el-option label="期中" :value="2" />
            <el-option label="资料" :value="3" />
            <el-option label="补考" :value="4" />
            <el-option label="其他学校" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="fileForm.remark" type="textarea" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="fileDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingFile" @click="submitFileEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="bookmarkDialogVisible" title="编辑书签" width="560px" append-to-body>
      <el-form ref="bookmarkFormRef" :model="bookmarkForm" label-width="86px" class="edit-form">
        <el-form-item label="标题" prop="title">
          <el-input v-model.trim="bookmarkForm.title" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="链接" prop="url">
          <el-input v-model.trim="bookmarkForm.url" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="分类" prop="resourceType">
          <el-select v-model="bookmarkForm.resourceType" placeholder="请选择分类" :teleported="false">
            <el-option v-for="item in resourceTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="专栏" prop="collection">
          <el-input v-model.trim="bookmarkForm.collection" maxlength="80" show-word-limit />
        </el-form-item>
        <el-form-item label="科目" prop="subject">
          <el-input v-model.trim="bookmarkForm.subject" maxlength="60" show-word-limit />
        </el-form-item>
        <el-form-item label="封面" prop="coverImage">
          <el-input v-model.trim="bookmarkForm.coverImage" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="bookmarkForm.description" type="textarea" :rows="3" maxlength="240" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bookmarkDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingBookmark" @click="submitBookmarkEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Document, Edit, Link, Search } from '@element-plus/icons-vue'
import useUserStore from '@/store/modules/user'
import { getInfo } from '@/api/login'
import { listFile, updateFile, delFile } from '@/api/datum/file'
import { listBookmark, updateBookmark, delBookmark } from '@/api/datum/bookmark'

defineOptions({ name: 'UploadPage' })

const props = defineProps({
  embedded: { type: Boolean, default: false }
})

const userStore = useUserStore()
const activeType = ref('file')
const loadingFiles = ref(false)
const loadingBookmarks = ref(false)
const savingFile = ref(false)
const savingBookmark = ref(false)
const currentUserId = ref('')
const files = ref([])
const bookmarks = ref([])
const pagedFiles = ref([])
const pagedBookmarks = ref([])
const fileDialogVisible = ref(false)
const bookmarkDialogVisible = ref(false)
const fileFormRef = ref()
const bookmarkFormRef = ref()

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  keyword: ''
})

const fileForm = reactive({})
const bookmarkForm = reactive({})

const resourceTypeOptions = [
  { label: '网课/视频', value: 'course' },
  { label: '博客/文章', value: 'blog' },
  { label: '学术/论文', value: 'paper' },
  { label: '工具/开源', value: 'tool' },
  { label: '娱乐/资源', value: 'entertainment' },
  { label: '其他', value: 'other' }
]

const filteredFiles = computed(() => {
  const keyword = query.keyword.toLowerCase()
  if (!keyword) return files.value
  return files.value.filter((item) => {
    return [item.fileName, item.fileSchool, item.fileSubject, item.remark]
      .some((value) => `${value || ''}`.toLowerCase().includes(keyword))
  })
})

const filteredBookmarks = computed(() => {
  const keyword = query.keyword.toLowerCase()
  if (!keyword) return bookmarks.value
  return bookmarks.value.filter((item) => {
    return [item.title, item.url, item.collection, item.subject, item.description]
      .some((value) => `${value || ''}`.toLowerCase().includes(keyword))
  })
})

const currentTotal = computed(() => activeType.value === 'file' ? filteredFiles.value.length : filteredBookmarks.value.length)
const total = computed(() => files.value.length + bookmarks.value.length)

const resolveCurrentUser = async () => {
  if (userStore.id) {
    currentUserId.value = `${userStore.id}`
    return
  }
  const info = await getInfo()
  currentUserId.value = `${info?.user?.userId || info?.data?.user?.userId || ''}`
}

const syncPagedList = () => {
  const start = (query.pageNum - 1) * query.pageSize
  pagedFiles.value = filteredFiles.value.slice(start, start + query.pageSize)
  pagedBookmarks.value = filteredBookmarks.value.slice(start, start + query.pageSize)
}

const loadFiles = async () => {
  loadingFiles.value = true
  try {
    if (!currentUserId.value) await resolveCurrentUser()
    const res = await listFile({ pageNum: 1, pageSize: 1000, userId: currentUserId.value })
    const rows = res?.rows || []
    files.value = rows.filter((item) => `${item.userId || ''}` === `${currentUserId.value}`)
    syncPagedList()
  } finally {
    loadingFiles.value = false
  }
}

const loadBookmarks = async () => {
  loadingBookmarks.value = true
  try {
    if (!currentUserId.value) await resolveCurrentUser()
    const res = await listBookmark({ pageNum: 1, pageSize: 1000, userId: currentUserId.value })
    bookmarks.value = res?.rows || []
    syncPagedList()
  } finally {
    loadingBookmarks.value = false
  }
}

const loadCurrentList = async () => {
  query.pageNum = 1
  if (activeType.value === 'file') {
    await loadFiles()
  } else {
    await loadBookmarks()
  }
}

const refresh = async () => {
  if (!currentUserId.value) await resolveCurrentUser()
  await Promise.all([loadFiles(), loadBookmarks()])
  syncPagedList()
}

const resetQuery = () => {
  query.keyword = ''
  query.pageNum = 1
  syncPagedList()
}

const openFileEdit = (row) => {
  Object.assign(fileForm, {
    ...row,
    fileYear: row.fileYear ? Number(row.fileYear) : null,
    fileType: row.fileType ? Number(row.fileType) : null
  })
  fileDialogVisible.value = true
}

const openBookmarkEdit = (row) => {
  Object.assign(bookmarkForm, {
    ...row,
    coverImage: row.coverImage || row.cover_image || ''
  })
  bookmarkDialogVisible.value = true
}

const submitFileEdit = async () => {
  if (!fileForm.fileId) return
  savingFile.value = true
  try {
    await updateFile({ ...fileForm, userId: currentUserId.value })
    ElMessage.success('文件已更新')
    fileDialogVisible.value = false
    await loadFiles()
  } finally {
    savingFile.value = false
  }
}

const submitBookmarkEdit = async () => {
  if (!bookmarkForm.id) return
  savingBookmark.value = true
  try {
    await updateBookmark({ ...bookmarkForm })
    ElMessage.success('书签已更新')
    bookmarkDialogVisible.value = false
    await loadBookmarks()
    window.dispatchEvent(new CustomEvent('bookmark-updated'))
  } finally {
    savingBookmark.value = false
  }
}

const removeFile = async (row) => {
  await ElMessageBox.confirm(`确认删除「${row.fileName || row.fileId}」吗？`, '提示', { type: 'warning' })
  await delFile(row.fileId)
  ElMessage.success('文件已删除')
  await loadFiles()
}

const removeBookmark = async (row) => {
  await ElMessageBox.confirm(`确认删除「${row.title || row.id}」吗？`, '提示', { type: 'warning' })
  await delBookmark(row.id)
  ElMessage.success('书签已删除')
  await loadBookmarks()
  window.dispatchEvent(new CustomEvent('bookmark-updated'))
}

const getStatusText = (status) => {
  const num = Number(status)
  if (num === 0) return '待审核'
  if (num === 1) return '已通过'
  if (num === 2) return '已下架'
  if (num === 3) return '被举报'
  return '未知'
}

const getStatusClass = (status) => {
  const num = Number(status)
  if (num === 1) return 'status-approved'
  if (num === 2 || num === 3) return 'status-rejected'
  return 'status-pending'
}

const getResourceTypeLabel = (type) => {
  return resourceTypeOptions.find((item) => item.value === type)?.label || type || '-'
}

watch(activeType, () => {
  query.pageNum = 1
  syncPagedList()
})

watch(() => query.keyword, () => {
  query.pageNum = 1
  syncPagedList()
})

onMounted(refresh)

defineExpose({ refresh, total })
</script>

<style scoped lang="scss">
.upload-page {
  background: var(--ide-editor-bg, #fff);
  border: 1px solid var(--ide-border, #ebeef5);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
}

.upload-page.embedded {
  border: none;
  box-shadow: none;
  padding: 0;
}

.page-hero {
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.08);
  margin-bottom: 16px;
  border: 1px solid rgba(var(--ide-accent-rgb, 64, 158, 255), 0.16);
}

.page-hero h3 {
  margin: 0;
  font-size: 22px;
  color: var(--ide-text-active, #303133);
}

.page-hero p {
  margin: 4px 0 0;
  color: var(--ide-text-light, #909399);
  font-size: 13px;
}

.upload-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 14px;
  border: 1px solid var(--ide-border, #ebeef5);
  border-radius: 16px;
  background: color-mix(in srgb, var(--ide-panel-bg, #fff) 94%, transparent);
}

.mode-tabs {
  display: inline-flex;
  flex: 0 0 auto;
  padding: 4px;
  border: 1px solid var(--ide-border, #dcdfe6);
  border-radius: 12px;
  background: var(--ide-editor-bg, #fff);
}

.mode-tabs button {
  height: 34px;
  min-width: 82px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--ide-text, #606266);
  cursor: pointer;
  font-weight: 700;
}

.mode-tabs button.active {
  color: var(--ide-accent, #409eff);
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.12);
}

.search-input {
  max-width: 520px;
}

.reset-btn {
  min-height: 40px;
  border-radius: 12px;
  padding: 0 20px;
  font-weight: 700;
}

.panel-table {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--ide-border, #ebeef5);
}

:deep(.panel-table .el-table__header th.el-table__cell) {
  height: 52px;
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.06);
  color: var(--ide-text-active, #303133);
  font-weight: 700;
}

:deep(.panel-table .action-column .cell) {
  display: flex;
  gap: 8px;
  justify-content: center;
  overflow: visible;
}

.row-action {
  min-height: 34px;
  border-radius: 10px;
  font-weight: 700;
  padding: 0 10px;
  background: transparent;
  box-shadow: none;
}

.edit-action {
  color: var(--ide-accent, #409eff);
  border-color: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.28);
}

:deep(.row-action.el-button:focus),
:deep(.row-action.el-button:active),
:deep(.row-action.el-button.is-active),
:deep(.row-action.el-button:hover) {
  color: var(--ide-accent, #409eff);
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.08);
  border-color: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.42);
  box-shadow: none;
  outline: none;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-approved {
  color: #2f855a;
  background: rgba(72, 187, 120, 0.12);
}

.status-pending {
  color: #b7791f;
  background: rgba(230, 162, 60, 0.14);
}

.status-rejected {
  color: #c53030;
  background: rgba(245, 108, 108, 0.12);
}

.empty-state {
  padding: 30px 0;
  color: var(--ide-text-light, #909399);
}

.empty-icon {
  font-size: 34px;
  color: var(--ide-accent, #409eff);
  opacity: 0.5;
}

.empty-title {
  margin-top: 8px;
  color: var(--ide-text-active, #303133);
  font-weight: 700;
}

.empty-desc {
  margin-top: 4px;
  font-size: 13px;
}

.pager-wrap {
  display: flex;
  justify-content: flex-end;
  padding-top: 14px;
}

.edit-form :deep(.el-input__wrapper),
.edit-form :deep(.el-textarea__inner) {
  border-radius: 10px;
}
</style>
