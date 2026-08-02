<template>
  <div class="favorite-page" :class="{ embedded }">
    <div v-if="!props.embedded" class="page-hero">
      <div>
        <h3>我的收藏</h3>
        <p>当前账号收藏的文件和书签。</p>
      </div>
    </div>

    <div class="top-bar">
      <div class="mode-tabs" role="tablist">
        <button :class="{ active: activeType === 'file' }" @click="activeType = 'file'">
          <span>文件</span>
        </button>
        <button :class="{ active: activeType === 'bookmark' }" @click="activeType = 'bookmark'">
          <span>书签</span>
        </button>
      </div>
      <el-input v-model.trim="query.keyword" :placeholder="activeType === 'file' ? '按科目筛选' : '按书签标题、链接或专栏筛选'" clearable @keyup.enter="loadList">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button
        v-if="activeType === 'file'"
        class="agent-btn"
        :loading="organizing"
        @click="handleOrganizeFavorites"
      >
        <el-icon><MagicStick /></el-icon>
        <span>AI 整理</span>
      </el-button>
      <el-button class="reset-btn" @click="resetQuery">重置</el-button>
    </div>

    <el-table v-if="activeType === 'file'" v-loading="loading" :data="pagedList" class="panel-table" empty-text="暂无收藏文件">
      <el-table-column label="科目" prop="subject" min-width="120" />
      <el-table-column label="文件名称" prop="fileName" min-width="220" />
      <el-table-column label="文件类型" prop="fileFormat" min-width="120" />
      <el-table-column label="文件大小" prop="fileSize" min-width="140" />
      <el-table-column label="学校" prop="school" min-width="120" />
      <el-table-column label="操作" width="260" align="center" class-name="action-column" header-class-name="action-column">
        <template #default="{ row }">
          <el-button class="row-action download-action" :loading="downloadingIds.has(row.fileId)" @click="downloadFile(row)">
            <el-icon><Download /></el-icon>
            <span>下载</span>
          </el-button>
          <el-button class="row-action jump-action" @click="jumpToFile(row)">
            <span>跳转</span>
          </el-button>
          <el-button class="row-action favorite-action" :loading="removingIds.has(row.fileId)" @click="removeItem(row)">
            <svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21.35 10.55 20.03C5.4 15.36 2 12.27 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6 6 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.77-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>取消</span>
          </el-button>
        </template>
      </el-table-column>
      <template #empty>
        <div class="empty-state">
          <el-icon class="empty-icon"><Star /></el-icon>
          <div class="empty-title">暂无收藏</div>
          <div class="empty-desc">收藏的试卷和资料会显示在这里</div>
        </div>
      </template>
    </el-table>

    <el-table v-else v-loading="loading" :data="pagedList" class="panel-table" empty-text="暂无收藏书签">
      <el-table-column label="标题" prop="title" min-width="180" show-overflow-tooltip />
      <el-table-column label="链接" prop="url" min-width="220" show-overflow-tooltip />
      <el-table-column label="专栏" prop="collection" min-width="130" show-overflow-tooltip />
      <el-table-column label="类型" prop="resourceTypeLabel" width="120" />
      <el-table-column label="操作" width="132" align="center" class-name="action-column" header-class-name="action-column">
        <template #default="{ row }">
          <el-button class="row-action favorite-action" :loading="removingIds.has(`bookmark-${row.id}`)" @click="removeItem(row)">
            <svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21.35 10.55 20.03C5.4 15.36 2 12.27 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6 6 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.77-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>取消</span>
          </el-button>
        </template>
      </el-table-column>
      <template #empty>
        <div class="empty-state">
          <el-icon class="empty-icon"><Star /></el-icon>
          <div class="empty-title">暂无收藏书签</div>
          <div class="empty-desc">收藏的公共书签会显示在这里</div>
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

    <el-drawer v-model="organizeDrawerVisible" title="AI 收藏整理" size="420px" append-to-body>
      <div class="organize-panel">
        <div class="organize-summary" v-if="organizeResult.summary">
          {{ organizeResult.summary }}
        </div>
        <div class="organize-actions">
          <el-radio-group v-model="organizeGroupBy" size="small" @change="handleOrganizeFavorites">
            <el-radio-button label="subject">科目</el-radio-button>
            <el-radio-button label="school">学校</el-radio-button>
            <el-radio-button label="year">年份</el-radio-button>
            <el-radio-button label="type">类型</el-radio-button>
          </el-radio-group>
        </div>
        <div class="organize-groups" v-if="organizeResult.groups?.length">
          <section v-for="group in organizeResult.groups" :key="group.key" class="organize-group">
            <div class="group-head">
              <div>
                <h4>{{ group.label || group.key }}</h4>
                <span>{{ group.count }} 个文件</span>
              </div>
              <el-tag size="small" :type="priorityTagType(group.priority)">
                {{ priorityText(group.priority) }}
              </el-tag>
            </div>
            <button
              v-for="item in group.items"
              :key="item.fileId"
              class="group-file"
              type="button"
              @click="jumpToFile(item)"
            >
              <span>{{ item.fileName || `文件-${item.fileId}` }}</span>
              <small>{{ item.fileSchool || '-' }} / {{ item.fileYear || '未知年份' }}</small>
            </button>
          </section>
        </div>
        <el-empty v-else description="暂无整理结果" />
        <div class="organize-suggestions" v-if="organizeResult.suggestions?.length">
          <h4>整理建议</h4>
          <p v-for="tip in organizeResult.suggestions" :key="tip">{{ tip }}</p>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Star, Download, MagicStick } from '@element-plus/icons-vue'
import useUserStore from '@/store/modules/user'
import { getInfo } from '@/api/login'
import { listFavorite, delFavorite } from '@/api/datum/favorite'
import { listFavoriteBookmark, delBookmarkFavorite } from '@/api/datum/bookmarkFavorite'
import { getToken } from '@/utils/auth'
import { normalizeFileUrl } from '@/utils/url'
import { blobValidate } from '@/utils/ruoyi'
import { organizeFavoritesByAgent } from '@/api/agent'

defineOptions({ name: 'FavoritePage' })
const props = defineProps({
  embedded: { type: Boolean, default: false }
})
const userStore = useUserStore()
const router = useRouter()

const loading = ref(false)
const list = ref([])
const pagedList = ref([])
const total = ref(0)
const currentUserId = ref('')
const removingIds = reactive(new Set())
const downloadingIds = reactive(new Set())
const activeType = ref('file')
const organizing = ref(false)
const organizeDrawerVisible = ref(false)
const organizeGroupBy = ref('subject')
const organizeResult = ref({})

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  keyword: ''
})

const resourceTypeOptions = [
  { label: '网课/视频', value: 'course' },
  { label: '博客/文章', value: 'blog' },
  { label: '学术/论文', value: 'paper' },
  { label: '工具/开源', value: 'tool' },
  { label: '娱乐/资源', value: 'entertainment' },
  { label: '其他', value: 'other' }
]

function formatFileSizeBytes(val) {
  if (val === null || val === undefined || val === '') return '-'
  const n = Number(val)
  if (!Number.isFinite(n)) return `${val} 字节`
  if (n < 1024) return `${Math.trunc(n)} B`
  const kb = n / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(2)} GB`
}

function truncateFileName(name) {
  if (!name) return '-'
  if (name.length <= 10) return name
  return name.slice(0, 10) + '....'
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
    fileName: truncateFileName(row.fileName) || `文件-${row.fileId}`,
    fileFormat: row.fileFormat || '-',
    fileSize: formatFileSizeBytes(row.fileSize),
    school: row.fileSchool || row.school || '-',
    subject: row.fileSubject || row.subject || '-'
  }
}

const buildBookmarkMeta = (row) => {
  return {
    ...row,
    title: row.title || `书签-${row.id}`,
    collection: row.collection || '-',
    resourceTypeLabel: resourceTypeOptions.find((item) => item.value === row.resourceType)?.label || row.resourceType || '-'
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
    const res = activeType.value === 'file'
      ? await listFavorite({ pageNum: 1, pageSize: 1000, userId: currentUserId.value })
      : await listFavoriteBookmark({ pageNum: 1, pageSize: 1000, userId: currentUserId.value })
    const source = res.rows || []
    const rows = activeType.value === 'file'
      ? await Promise.all(source.map(buildFileMeta))
      : source.map(buildBookmarkMeta)
    const keyword = query.keyword.toLowerCase()
    list.value = keyword
      ? rows.filter((item) => {
        const fields = activeType.value === 'file'
          ? [item.subject]
          : [item.title, item.url, item.collection, item.subject, item.description]
        return fields.some((value) => `${value || ''}`.toLowerCase().includes(keyword))
      })
      : rows
    total.value = list.value.length
    query.pageNum = 1
    syncPagedList()
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  query.keyword = ''
  query.pageNum = 1
  loadList()
}

const handleOrganizeFavorites = async () => {
  if (activeType.value !== 'file') return
  if (!currentUserId.value) {
    await resolveCurrentUser()
  }
  if (!currentUserId.value) {
    ElMessage.warning('未能获取当前用户信息')
    return
  }

  organizing.value = true
  try {
    const res = await organizeFavoritesByAgent({
      userId: Number(currentUserId.value),
      groupBy: organizeGroupBy.value,
      pageNum: 1,
      pageSize: 1000
    })
    organizeResult.value = res.data || res
    organizeDrawerVisible.value = true
  } catch (error) {
    console.error('AI 整理收藏失败:', error)
  } finally {
    organizing.value = false
  }
}

const priorityTagType = (priority) => {
  if (priority === 'high') return 'danger'
  if (priority === 'medium') return 'warning'
  return 'info'
}

const priorityText = (priority) => {
  if (priority === 'high') return '重点'
  if (priority === 'medium') return '常用'
  return '普通'
}

const removeItem = async (row) => {
  const isBookmark = activeType.value === 'bookmark'
  const id = isBookmark ? `bookmark-${row.id}` : row.fileId
  const title = isBookmark ? row.title : row.fileName
  await ElMessageBox.confirm(`确认取消收藏「${title}」吗？`, '提示', { type: 'warning' })
  removingIds.add(id)
  try {
    if (isBookmark) {
      await delBookmarkFavorite(currentUserId.value, row.id)
    } else {
      await delFavorite(currentUserId.value, row.fileId)
    }
    ElMessage.success('已取消收藏')
    window.dispatchEvent(new CustomEvent('favorite-updated', {
      detail: isBookmark ? { bookmarkId: row.id, favorited: false, type: 'bookmark' } : { fileId: row.fileId, favorited: false, type: 'file' }
    }))
    await loadList()
  } finally {
    removingIds.delete(id)
  }
}

const downloadFile = async (row) => {
  const fileId = row.fileId
  const fileName = row.fileName || `文件-${fileId}`
  const fileUrl = row.fileUrl

  if (!fileUrl) {
    ElMessage.error('该文件缺少下载地址')
    return
  }

  downloadingIds.add(fileId)
  try {
    const finalUrl = normalizeFileUrl(fileUrl)
    const response = await fetch(finalUrl, {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const blob = await response.blob()
    if (!blobValidate(blob)) {
      const text = await blob.text()
      try {
        const rsp = JSON.parse(text)
        ElMessage.error(rsp.msg || '下载失败')
      } catch {
        ElMessage.error('下载失败，返回格式错误')
      }
      return
    }

    const buf = await blob.arrayBuffer()
    const result = await window.electronAPI.saveFile({
      content: new Uint8Array(buf),
      fileName
    })

    if (result.success) {
      ElMessage.success(`下载完成: ${fileName}`)
      try {
        const record = {
          fileId: Number(fileId) || 0,
          fileName,
          fileUrl,
          fileSize: Number(row.fileSize) || 0,
          fileFormat: row.fileFormat || '',
          fileSchool: row.fileSchool || '',
          fileSubject: row.fileSubject || '',
          fileYear: row.fileYear != null ? Number(row.fileYear) : null,
          fileType: row.fileType != null ? Number(row.fileType) : null,
          localPath: result.filePath || '',
          userId: userStore.id ? Number(userStore.id) : null
        }
        await window.electronAPI.downloadRecords.add(record)
        await window.electronAPI.downloadRecords.flush()
      } catch (e) {
        console.warn('记录下载失败:', e)
      }
    } else if (result.reason !== 'canceled') {
      ElMessage.error(`保存失败: ${result.message || '未知错误'}`)
    }
  } catch (e) {
    console.error('下载出错:', e)
    ElMessage.error('下载失败，请检查网络')
  } finally {
    downloadingIds.delete(fileId)
  }
}

const jumpToFile = (row) => {
  const fileData = {
    id: row.fileId,
    label: row.fileName,
    url: row.fileUrl,
    type: 'file',
    fileInfo: { ...row }
  }
  sessionStorage.setItem('pendingOpenFile', JSON.stringify(fileData))
  router.push('/index')
}

watch(activeType, () => {
  query.pageNum = 1
  loadList()
})
onMounted(loadList)

defineExpose({ refresh: loadList, total })
</script>

<style scoped lang="scss">
.favorite-page {
  background: var(--ide-editor-bg, #fff);
  border: 1px solid var(--ide-border, #ebeef5);
  border-radius: 16px;
  padding: 20px;
  min-width: 680px;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
  transition: box-shadow 0.24s ease, border-color 0.24s ease;
}
.favorite-page:hover {
  border-color: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.35);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
}
.favorite-page.embedded {
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
      rgba(var(--ide-accent-rgb, 64, 158, 255), 0.16),
      rgba(var(--ide-accent-rgb, 64, 158, 255), 0.04)
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
  min-width: 640px;
  border: 1px solid var(--ide-border, #ebeef5);
  border-radius: 16px;
  background: color-mix(in srgb, var(--ide-panel-bg, #fff) 94%, transparent);
}
.top-bar .el-input {
  min-width: 200px;
  max-width: 560px;
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
  min-width: 72px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
.top-bar :deep(.el-input__wrapper) {
  min-height: 42px;
  border-radius: 12px;
  box-shadow: 0 0 0 1px var(--ide-border, #dcdfe6) inset;
}
.reset-btn {
  min-height: 42px;
  flex-shrink: 0;
  border-radius: 12px;
  padding: 0 22px;
  font-weight: 700;
}
.agent-btn {
  min-height: 42px;
  flex-shrink: 0;
  border-radius: 12px;
  padding: 0 18px;
  font-weight: 700;
  color: var(--ide-accent, #409eff);
  border-color: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.28);
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.08);
}
.agent-btn:hover {
  color: #fff;
  border-color: var(--ide-accent, #409eff);
  background: var(--ide-accent, #409eff);
}
.organize-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.organize-summary {
  padding: 12px 14px;
  border: 1px solid var(--ide-border, #ebeef5);
  border-radius: 10px;
  color: var(--ide-text, #606266);
  line-height: 1.6;
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.06);
}
.organize-actions {
  display: flex;
  justify-content: flex-start;
}
.organize-groups {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.organize-group {
  border: 1px solid var(--ide-border, #ebeef5);
  border-radius: 12px;
  padding: 12px;
  background: var(--ide-editor-bg, #fff);
}
.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.group-head h4 {
  margin: 0;
  color: var(--ide-text-active, #303133);
}
.group-head span {
  color: var(--ide-text-light, #909399);
  font-size: 12px;
}
.group-file {
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  cursor: pointer;
  background: transparent;
  color: var(--ide-text, #606266);
  text-align: left;
}
.group-file:hover {
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.08);
  color: var(--ide-accent, #409eff);
}
.group-file span {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 650;
}
.group-file small {
  color: var(--ide-text-light, #909399);
}
.organize-suggestions h4 {
  margin: 0 0 8px;
  color: var(--ide-text-active, #303133);
}
.organize-suggestions p {
  margin: 6px 0;
  color: var(--ide-text, #606266);
  line-height: 1.6;
}
.panel-table {
  border-radius: 16px;
  overflow: hidden;
  min-width: 640px;
  border: 1px solid var(--ide-border, #ebeef5);
  background: color-mix(in srgb, var(--ide-editor-bg, #fff) 92%, transparent);
}
.favorite-page :deep(.el-table__body-wrapper) {
  overflow-x: auto;
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
.heart-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
  margin-right: 5px;
}
@media (max-width: 720px) {
  .top-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
