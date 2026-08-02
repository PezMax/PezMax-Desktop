<template>
  <div ref="rootRef" class="rank-root" :class="{ 'is-resizing': isResizing }">
    <div class="rank-side" :style="{ width: `${listWidth}px` }">
      <div class="rank-panel rank-panel-list">
        <div class="panel-header">
          <div class="panel-title">
            <svg-icon icon-class="peoples" class="panel-title-icon" />
            <span>上传贡献榜</span>
          </div>
          <el-button link type="primary" :icon="Refresh" size="small" :loading="rankLoading" @click="fetchRank">
            刷新
          </el-button>
        </div>

        <div class="panel-body">
          <el-skeleton :loading="rankLoading" animated>
            <template #template>
              <div class="rank-list">
                <div v-for="n in 10" :key="n" class="rank-item">
                  <el-skeleton-item variant="text" class="rank-skeleton-badge" />
                  <el-skeleton-item variant="circle" class="rank-skeleton-avatar" />
                  <div class="rank-info">
                    <el-skeleton-item variant="text" class="rank-skeleton-name" />
                    <el-skeleton-item variant="text" class="rank-skeleton-meta" />
                  </div>
                  <el-skeleton-item variant="text" class="rank-skeleton-score" />
                </div>
              </div>
            </template>

            <template #default>
              <div v-if="rankList.length === 0" class="empty-state">
                <svg-icon icon-class="peoples" class="empty-icon" />
                <p>暂无排行榜数据</p>
              </div>

              <div v-else class="rank-list">
                <div
                  v-for="(item, index) in rankList"
                  :key="item.userId ?? index"
                  :class="['rank-item', `rank-top-${index + 1}`, { active: item.userId === activeUserId }]"
                  @click="openUserDetail(item, index)"
                >
                  <div class="rank-badge">{{ index + 1 }}</div>
                  <el-avatar :size="32" :src="item.avatar || fallbackAvatar" class="rank-avatar" />
                  <div class="rank-info">
                    <div class="rank-name" :title="item.userName || (item.userId ? String(item.userId) : '未知用户')">
                      {{ item.userName || (item.userId ? `用户 ${item.userId}` : '未知用户') }}
                    </div>
                    <div class="rank-meta">上传 {{ item.count }} 份</div>
                  </div>
                  <div class="rank-score">{{ item.count }}</div>
                </div>
              </div>
            </template>
          </el-skeleton>
        </div>
      </div>
    </div>

    <div class="rank-resizer" @mousedown="startResize" />

    <div class="rank-main">
      <div class="rank-panel rank-panel-detail">
        <div class="panel-header">
          <div class="panel-title">
            <svg-icon :icon-class="activeDetailTab === 'ops' ? 'chart' : 'user'" class="panel-title-icon" />
            <span class="panel-title-dynamic">{{ activeDetailTab === 'ops' ? '运营洞察' : '用户详情' }}</span>
            <span>用户详情</span>
          </div>
          <div class="panel-actions">
            <el-segmented v-model="activeDetailTab" :options="detailTabOptions" size="small" />
            <el-button link type="primary" :icon="MagicStick" size="small" :loading="opsLoading" @click="fetchOpsInsights">
              AI 刷新
            </el-button>
          </div>
        </div>

        <div class="panel-body">
          <Transition name="fade-slide" mode="out-in">
            <div v-if="activeDetailTab === 'user'" key="user-tab" class="detail-tab-pane">
              <div v-if="detailLoading" class="detail-loading">
                <el-skeleton animated :rows="8" />
              </div>

              <div v-else-if="userDetail" class="detail-content">
              <div :class="['profile-card', `profile-top-${activeRankIndex + 1}`]">
                <el-avatar :size="96" :src="userDetail.avatar || fallbackAvatar" class="profile-avatar" />
                <div class="profile-name">{{ userDetail.userName || (userDetail.userId ? `用户 ${userDetail.userId}` : '未知用户') }}</div>
                <div class="profile-remark">{{ userRemarkLabel }}</div>

                <div class="profile-stats">
                  <div class="stat-item">
                    <div class="stat-value">{{ userDetail.count ?? 0 }}</div>
                    <div class="stat-label">上传数量</div>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-item">
                    <div class="stat-value">{{ yearsUsedLabel }}</div>
                    <div class="stat-label">使用年限</div>
                  </div>
                </div>
              </div>
            </div>

              <div v-else class="empty-state detail-empty">
              <svg-icon icon-class="user" class="empty-icon" />
              <p>点击左侧排行榜用户查看详情</p>
              </div>
            </div>

            <div v-else key="ops-tab" class="ops-insight-pane">
              <el-skeleton v-if="opsLoading" animated :rows="10" />

              <div v-else-if="!opsInsights" class="empty-state ops-empty">
                <svg-icon icon-class="chart" class="empty-icon" />
                <p>点击 AI 刷新生成平台运营洞察</p>
                <el-button type="primary" :icon="MagicStick" size="small" @click="fetchOpsInsights">生成洞察</el-button>
              </div>

              <div v-else class="ops-content">
                <div class="ops-summary">{{ opsInsights.summary || '暂无摘要' }}</div>

                <div class="ops-metrics">
                  <div class="ops-metric">
                    <span class="metric-value">{{ opsOverview.fileCount }}</span>
                    <span class="metric-label">资料</span>
                  </div>
                  <div class="ops-metric">
                    <span class="metric-value">{{ opsOverview.downloadCount }}</span>
                    <span class="metric-label">下载</span>
                  </div>
                  <div class="ops-metric">
                    <span class="metric-value">{{ opsOverview.reportCount }}</span>
                    <span class="metric-label">举报</span>
                  </div>
                  <div class="ops-metric is-risk">
                    <span class="metric-value">{{ opsOverview.highRiskCount }}</span>
                    <span class="metric-label">高风险</span>
                  </div>
                </div>

                <div class="ops-section">
                  <div class="ops-section-title">热门资料</div>
                  <div v-if="topHotFiles.length === 0" class="ops-muted">暂无热门资料信号</div>
                  <div v-for="item in topHotFiles" :key="`hot-${item.file?.fileId}`" class="ops-row">
                    <div class="ops-row-main">
                      <div class="ops-row-title">{{ item.file?.fileName || '未命名资料' }}</div>
                      <div class="ops-row-meta">{{ item.file?.fileSchool || '未知学校' }} · {{ item.file?.fileSubject || '未知科目' }}</div>
                    </div>
                    <el-tag size="small" type="success">热度 {{ item.hotScore }}</el-tag>
                  </div>
                </div>

                <div class="ops-section">
                  <div class="ops-section-title">质量风险</div>
                  <div v-if="topQualityIssues.length === 0" class="ops-muted">暂无明显低质量内容</div>
                  <div v-for="item in topQualityIssues" :key="`quality-${item.file?.fileId}`" class="ops-row">
                    <div class="ops-row-main">
                      <div class="ops-row-title">{{ item.file?.fileName || '未命名资料' }}</div>
                      <div class="ops-row-meta">{{ firstReason(item.reasons) }}</div>
                    </div>
                    <el-tag size="small" :type="riskTagType(item.riskLevel)">{{ riskLabel(item.riskLevel) }}</el-tag>
                  </div>
                </div>

                <div class="ops-section">
                  <div class="ops-section-title">举报压力</div>
                  <div v-if="topReportPressure.length === 0" class="ops-muted">暂无集中举报</div>
                  <div v-for="item in topReportPressure" :key="`report-${item.fileId}`" class="ops-row">
                    <div class="ops-row-main">
                      <div class="ops-row-title">{{ item.file?.fileName || `资料 ${item.fileId}` }}</div>
                      <div class="ops-row-meta">{{ firstReason(item.reasons) }}</div>
                    </div>
                    <el-tag size="small" :type="riskTagType(item.riskLevel)">{{ item.reportCount }} 条</el-tag>
                  </div>
                </div>

                <div class="ops-section">
                  <div class="ops-section-title">运营建议</div>
                  <div v-if="opsSuggestions.length === 0" class="ops-muted">暂无建议</div>
                  <div v-for="item in opsSuggestions" :key="item" class="ops-suggestion">{{ item }}</div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { MagicStick, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getUploadRank, getUser } from '@/api/datum/user'
import { getOpsInsightsByAgent } from '@/api/agent'
import { isEmpty, isHttp } from '@/utils/validate'
import { normalizeAvatar } from '@/utils/avatar'

const fallbackAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const rankLoading = ref(false)
const rankList = ref([])

const activeUserId = ref(null)
const activeRankIndex = ref(-1) // 新增：记录当前选中的排名索引
const detailLoading = ref(false)
const userDetail = ref(null)
const activeDetailTab = ref('user')
const detailTabOptions = [
  { label: '用户详情', value: 'user' },
  { label: '运营洞察', value: 'ops' }
]
const opsLoading = ref(false)
const opsInsights = ref(null)

const listWidth = ref(260)
const isResizing = ref(false)
const rootRef = ref(null)

function resolveUserId(data) {
  // Try to find any property that might be an ID
  if (!data) return null;

  // Direct matches
  if (data.userId) return data.userId;
  if (data.id) return data.id;
  if (data.ptmjUserId) return data.ptmjUserId;
  if (data.uid) return data.uid;
  if (data.user_id) return data.user_id;

  // Try to guess from object structure if we have a single key ending in 'Id' or 'id'
  const keys = Object.keys(data);
  const idKey = keys.find(k => k.toLowerCase().endsWith('id'));
  if (idKey && data[idKey]) return data[idKey];

  return null;
}

function resolveUserName(data) {
  if (!data) return '';

  if (data.userName) return data.userName;
  if (data.username) return data.username;
  if (data.nickName) return data.nickName;
  if (data.nickname) return data.nickname;
  if (data.name) return data.name;
  if (data.user_name) return data.user_name;

  return '';
}

function resolveUserCount(data) {
  return toInt(data?.count ?? data?.uploadCount ?? data?.uploads ?? data?.fileCount ?? data?.total)
}

function normalizeRankUser(data) {
  const avatar = data?.avatar || data?.userAvatar || data?.user_avatar || ''
  return {
    raw: data,
    userId: resolveUserId(data),
    userName: resolveUserName(data),
    avatar: normalizeAvatar(avatar),
    count: resolveUserCount(data)
  }
}

function normalizeDetailUser(data, fallbackItem = null) {
  const base = fallbackItem || {}
  const avatar = data?.avatar || data?.userAvatar || data?.user_avatar || base.avatar || ''
  return {
    ...base,
    ...data,
    userId: resolveUserId(data) ?? base.userId ?? null,
    userName: resolveUserName(data) || base.userName || '',
    avatar: normalizeAvatar(avatar),
    count: resolveUserCount(data) || base.count || 0,
    remark: data?.remark ?? base.remark ?? '',
    createTime: data?.createTime ?? base.createTime,
    updateTime: data?.updateTime ?? base.updateTime
  }
}

function toInt(val) {
  if (typeof val === 'number' && Number.isFinite(val)) return val
  const n = Number(val)
  return Number.isFinite(n) ? n : 0
}

function formatDateTime(val) {
  if (!val) return '--'
  if (typeof val === 'string') return val
  const date = new Date(val)
  if (Number.isNaN(date.getTime())) return String(val)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function parseDateMaybe(val) {
  if (!val) return null
  if (val instanceof Date) return Number.isNaN(val.getTime()) ? null : val
  if (typeof val === 'number') {
    const d = new Date(val)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof val === 'string') {
    const d = new Date(val.replace(/-/g, '/'))
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

const yearsUsedLabel = computed(() => {
  const d = parseDateMaybe(userDetail.value?.createTime)
  if (!d) return '--'
  const diff = Date.now() - d.getTime()
  if (!Number.isFinite(diff) || diff <= 0) return '0年'
  const years = diff / (365.25 * 24 * 60 * 60 * 1000)
  const rounded = Math.max(0, Math.round(years * 10) / 10)
  return `${rounded}年`
})

const userRemarkLabel = computed(() => {
  const remark = userDetail.value?.remark
  if (typeof remark === 'string' && remark.trim().length > 0) return remark.trim()
  return '无备注'
})

const opsOverview = computed(() => opsInsights.value?.overview || {
  fileCount: 0,
  downloadCount: 0,
  reportCount: 0,
  highRiskCount: 0
})

const topHotFiles = computed(() => Array.isArray(opsInsights.value?.hotFiles) ? opsInsights.value.hotFiles.slice(0, 5) : [])
const topQualityIssues = computed(() => Array.isArray(opsInsights.value?.lowQualityFiles) ? opsInsights.value.lowQualityFiles.slice(0, 5) : [])
const topReportPressure = computed(() => Array.isArray(opsInsights.value?.reportPressure) ? opsInsights.value.reportPressure.slice(0, 5) : [])
const opsSuggestions = computed(() => Array.isArray(opsInsights.value?.suggestions) ? opsInsights.value.suggestions.slice(0, 5) : [])

function firstReason(reasons) {
  return Array.isArray(reasons) && reasons.length > 0 ? reasons[0] : '暂无原因'
}

function riskLabel(level) {
  const value = String(level || '').toLowerCase()
  if (value === 'high') return '高风险'
  if (value === 'medium') return '中风险'
  if (value === 'low') return '低风险'
  return '正常'
}

function riskTagType(level) {
  const value = String(level || '').toLowerCase()
  if (value === 'high') return 'danger'
  if (value === 'medium') return 'warning'
  if (value === 'low') return 'info'
  return 'success'
}

async function fetchOpsInsights() {
  if (opsLoading.value) return
  activeDetailTab.value = 'ops'
  opsLoading.value = true
  try {
    const res = await getOpsInsightsByAgent({
      pageNum: 1,
      pageSize: 200,
      includeNotifications: true
    })
    opsInsights.value = res?.data || res || null
    if (!opsInsights.value) {
      ElMessage.warning('智能体没有返回运营洞察数据')
    }
  } catch (err) {
    console.warn('获取运营洞察失败:', err)
  } finally {
    opsLoading.value = false
  }
}

async function fetchRank() {
  if (rankLoading.value) return
  rankLoading.value = true
  try {
    const res = await getUploadRank()
    if (res?.code !== 200) return

    const data = Array.isArray(res?.data) ? res.data : []
    rankList.value = data.map(normalizeRankUser)
    const firstItem = rankList.value[0]
    if (firstItem) {
      openUserDetail(firstItem, 0)
    } else {
      activeUserId.value = null
      activeRankIndex.value = -1
      userDetail.value = null
    }
  } catch {
    rankList.value = []
    activeUserId.value = null
    activeRankIndex.value = -1
    userDetail.value = null
  } finally {
    rankLoading.value = false
  }
}

async function openUserDetail(item, index) {
  if (!item) return
  const rawData = item.raw || item
  const normalizedItem = normalizeRankUser(rawData)

  const userId = normalizedItem.userId
  activeUserId.value = userId
  activeRankIndex.value = index

  // 1. 先使用列表中的数据快速展示
  userDetail.value = normalizeDetailUser(rawData, normalizedItem)

  // 2. 异步获取最新用户信息以展示真实头像和备注
  if (userId) {
    try {
      const res = await getUser(userId)
      if (res?.code === 200 && res.data) {
        // 如果后端直接返回 SysUser 对象
        const realUser = res.data.user || res.data
        userDetail.value = normalizeDetailUser(realUser, normalizedItem)
      }
    } catch (err) {
      console.warn('获取用户详情失败:', err)
    }
  }
}

function startResize(e) {
  isResizing.value = true
  document.body.style.cursor = 'ew-resize'
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
}

function handleMouseMove(e) {
  if (!isResizing.value) return
  const minWidth = 240
  const maxWidth = 520
  const rect = rootRef.value?.getBoundingClientRect()
  const baseLeft = rect?.left ?? 0
  const next = e.clientX - baseLeft
  if (next >= minWidth && next <= maxWidth) {
    listWidth.value = next
  }
}

function stopResize() {
  isResizing.value = false
  document.body.style.cursor = ''
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
}

onMounted(() => {
  fetchRank()
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped lang="scss">
.rank-root {
  flex: 1;
  display: flex;
  gap: 4px;
  min-height: 0;
  overflow: hidden;
}

.rank-side {
  flex-shrink: 0;
  min-height: 0;
  overflow: hidden;
  transition: width 220ms cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
}

.is-resizing .rank-side {
  transition: none;
}

.rank-resizer {
  width: 2px;
  border-radius: 999px;
  background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.12), transparent);
  cursor: ew-resize;
  position: relative;
  flex-shrink: 0;
  opacity: 0.9;
}

.rank-resizer::after {
  content: '';
  position: absolute;
  top: 0;
  left: -3px;
  right: -3px;
  bottom: 0;
}

.rank-resizer:hover {
  background: linear-gradient(to bottom, transparent, rgba(var(--ide-accent-rgb), 0.5), transparent);
}

:global(html.dark) .rank-resizer {
  background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.18), transparent);
}

.rank-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
}

.rank-panel {
  background-color: var(--ide-editor-bg);
  border: 1px solid var(--ide-border);
  border-radius: 10px;
  box-shadow: var(--ide-shadow-1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.rank-panel-list {
  background-color: var(--ide-panel-bg);
}

.rank-panel-detail {
  height: 100%;
}

.panel-header {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid var(--ide-border);
  background-color: var(--ide-bg);
  flex-shrink: 0;
  position: relative;

  .el-button {
    position: relative;
    z-index: 1;
    margin-left: auto;
    padding-left: 12px;
  }
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--ide-text-active);
  letter-spacing: 0.4px;
}

.panel-title-icon {
  font-size: 16px;
  color: var(--ide-accent);
}

.panel-title-dynamic + span {
  display: none;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.panel-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 10px;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 10px;
  border: 1px solid transparent;
  background-color: var(--ide-editor-bg);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
}

.rank-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
  pointer-events: none;
}

.rank-item > * {
  position: relative;
  z-index: 1;
}

.rank-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.rank-item.active {
  background-color: var(--ide-bg);
  border-color: var(--ide-border-hover);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* 前三名专属华丽背景 */
.rank-top-1 {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(255, 165, 0, 0.03));
  border-color: rgba(255, 215, 0, 0.2);
}
.rank-top-1::before {
  background: radial-gradient(circle at top right, rgba(255, 215, 0, 0.15), transparent 60%);
  opacity: 1;
}
.rank-top-1:hover {
  box-shadow: 0 6px 16px rgba(255, 215, 0, 0.15);
  border-color: rgba(255, 215, 0, 0.4);
}
.rank-top-1.active {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.05));
  border-color: rgba(255, 215, 0, 0.5);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
}

.rank-top-2 {
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.08), rgba(169, 169, 169, 0.03));
  border-color: rgba(192, 192, 192, 0.2);
}
.rank-top-2::before {
  background: radial-gradient(circle at top right, rgba(192, 192, 192, 0.15), transparent 60%);
  opacity: 1;
}
.rank-top-2:hover {
  box-shadow: 0 6px 16px rgba(192, 192, 192, 0.15);
  border-color: rgba(192, 192, 192, 0.4);
}
.rank-top-2.active {
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.15), rgba(169, 169, 169, 0.05));
  border-color: rgba(192, 192, 192, 0.5);
  box-shadow: 0 4px 12px rgba(192, 192, 192, 0.2);
}

.rank-top-3 {
  background: linear-gradient(135deg, rgba(205, 127, 50, 0.08), rgba(184, 115, 51, 0.03));
  border-color: rgba(205, 127, 50, 0.2);
}
.rank-top-3::before {
  background: radial-gradient(circle at top right, rgba(205, 127, 50, 0.15), transparent 60%);
  opacity: 1;
}
.rank-top-3:hover {
  box-shadow: 0 6px 16px rgba(205, 127, 50, 0.15);
  border-color: rgba(205, 127, 50, 0.4);
}
.rank-top-3.active {
  background: linear-gradient(135deg, rgba(205, 127, 50, 0.15), rgba(184, 115, 51, 0.05));
  border-color: rgba(205, 127, 50, 0.5);
  box-shadow: 0 4px 12px rgba(205, 127, 50, 0.2);
}

:global(html.dark) .rank-item {
  background-color: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.04);
}

:global(html.dark) .rank-item:hover {
  background-color: rgba(255, 255, 255, 0.06);
}

:global(html.dark) .rank-item.active {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* 深色模式下的前三名华丽背景 */
:global(html.dark) .rank-top-1 {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(255, 165, 0, 0.05));
  border-color: rgba(255, 215, 0, 0.3);
}
:global(html.dark) .rank-top-1::before {
  background: radial-gradient(circle at top right, rgba(255, 215, 0, 0.2), transparent 60%);
}
:global(html.dark) .rank-top-1:hover {
  box-shadow: 0 6px 16px rgba(255, 215, 0, 0.2);
  border-color: rgba(255, 215, 0, 0.5);
}

:global(html.dark) .rank-top-2 {
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.12), rgba(169, 169, 169, 0.05));
  border-color: rgba(192, 192, 192, 0.3);
}
:global(html.dark) .rank-top-2::before {
  background: radial-gradient(circle at top right, rgba(192, 192, 192, 0.2), transparent 60%);
}
:global(html.dark) .rank-top-2:hover {
  box-shadow: 0 6px 16px rgba(192, 192, 192, 0.2);
  border-color: rgba(192, 192, 192, 0.5);
}

:global(html.dark) .rank-top-3 {
  background: linear-gradient(135deg, rgba(205, 127, 50, 0.12), rgba(184, 115, 51, 0.05));
  border-color: rgba(205, 127, 50, 0.3);
}
:global(html.dark) .rank-top-3::before {
  background: radial-gradient(circle at top right, rgba(205, 127, 50, 0.2), transparent 60%);
}
:global(html.dark) .rank-top-3:hover {
  box-shadow: 0 6px 16px rgba(205, 127, 50, 0.2);
  border-color: rgba(205, 127, 50, 0.5);
}

.rank-badge {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--ide-bg);
  border: 1px solid var(--ide-border);
  color: var(--ide-text-active);
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.rank-top-1 .rank-badge,
.rank-top-2 .rank-badge,
.rank-top-3 .rank-badge {
  border-color: transparent;
  color: #111827;
}

.rank-top-1 .rank-badge {
  background: linear-gradient(135deg, #f8d777, #f3b93e);
}

.rank-top-2 .rank-badge {
  background: linear-gradient(135deg, #e5e7eb, #cbd5e1);
}

.rank-top-3 .rank-badge {
  background: linear-gradient(135deg, #f1c19a, #d4895b);
}

:global(html.dark) .rank-top-1 .rank-badge,
:global(html.dark) .rank-top-2 .rank-badge,
:global(html.dark) .rank-top-3 .rank-badge {
  color: #0b1020;
}

.rank-top-1 .rank-score {
  color: #f3b93e;
}

.rank-top-2 .rank-score {
  color: #cbd5e1;
}

.rank-top-3 .rank-score {
  color: #d4895b;
}

.rank-info {
  flex: 1;
  min-width: 0;
}

.rank-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ide-text-active);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-meta {
  margin-top: 2px;
  font-size: 12px;
  color: var(--ide-text-light);
}

.rank-score {
  font-size: 12px;
  font-weight: 700;
  color: var(--ide-accent);
  min-width: 34px;
  text-align: right;
}

.rank-skeleton-badge {
  width: 26px;
  height: 18px;
}

.rank-skeleton-avatar {
  width: 32px;
  height: 32px;
}

.rank-skeleton-name {
  width: 120px;
  height: 12px;
}

.rank-skeleton-meta {
  width: 160px;
  height: 10px;
  margin-top: 6px;
}

.rank-skeleton-score {
  width: 36px;
  height: 12px;
}

.detail-loading {
  padding: 10px;
}

.detail-tab-pane,
.ops-insight-pane {
  min-height: 100%;
}

.detail-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  padding: 20px;
}

.profile-card {
  width: 100%;
  max-width: 340px;
  background-color: var(--ide-panel-bg);
  border: 1px solid var(--ide-border);
  border-radius: 24px;
  padding: 40px 24px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: var(--ide-shadow-1);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
}

.profile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: transparent;
  transition: all 0.4s ease;
  z-index: 0;
}

.profile-card > * {
  position: relative;
  z-index: 1;
}

/* 前三名专属资料卡片背景 */
.profile-top-1 {
  border-color: rgba(255, 215, 0, 0.4);
  box-shadow: 0 8px 24px rgba(255, 215, 0, 0.12);
}
.profile-top-1::before {
  background: linear-gradient(180deg, rgba(255, 215, 0, 0.15), transparent);
}
.profile-top-1 .profile-avatar {
  border-color: rgba(255, 215, 0, 0.2);
  box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.1);
}
.profile-top-1 .stat-value {
  color: #d4af37;
  text-shadow: 0 2px 4px rgba(212, 175, 55, 0.2);
}

.profile-top-2 {
  border-color: rgba(192, 192, 192, 0.4);
  box-shadow: 0 8px 24px rgba(192, 192, 192, 0.12);
}
.profile-top-2::before {
  background: linear-gradient(180deg, rgba(192, 192, 192, 0.15), transparent);
}
.profile-top-2 .profile-avatar {
  border-color: rgba(192, 192, 192, 0.2);
  box-shadow: 0 0 0 4px rgba(192, 192, 192, 0.1);
}
.profile-top-2 .stat-value {
  color: #a0a0a0;
}

.profile-top-3 {
  border-color: rgba(205, 127, 50, 0.4);
  box-shadow: 0 8px 24px rgba(205, 127, 50, 0.12);
}
.profile-top-3::before {
  background: linear-gradient(180deg, rgba(205, 127, 50, 0.15), transparent);
}
.profile-top-3 .profile-avatar {
  border-color: rgba(205, 127, 50, 0.2);
  box-shadow: 0 0 0 4px rgba(205, 127, 50, 0.1);
}
.profile-top-3 .stat-value {
  color: #b87333;
}

:global(html.dark) .profile-top-1 {
  box-shadow: 0 8px 24px rgba(255, 215, 0, 0.15);
}
:global(html.dark) .profile-top-2 {
  box-shadow: 0 8px 24px rgba(192, 192, 192, 0.15);
}
:global(html.dark) .profile-top-3 {
  box-shadow: 0 8px 24px rgba(205, 127, 50, 0.15);
}

.profile-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

:global(html.dark) .profile-card:hover {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.profile-avatar {
  border: 4px solid var(--ide-bg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.profile-name {
  font-size: 22px;
  font-weight: 800;
  color: var(--ide-text-active);
  margin-bottom: 10px;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-remark {
  font-size: 13px;
  color: var(--ide-text-light);
  background-color: var(--ide-bg);
  padding: 6px 16px;
  border-radius: 20px;
  margin-bottom: 32px;
  text-align: center;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-stats {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  background-color: var(--ide-bg);
  border-radius: 16px;
  padding: 20px 0;
  border: 1px solid var(--ide-border);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 900;
  color: var(--ide-accent);
  margin-bottom: 6px;
  line-height: 1;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.stat-label {
  font-size: 13px;
  color: var(--ide-text-light);
  font-weight: 500;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background-color: var(--ide-border);
}

.ops-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ops-summary {
  padding: 12px 14px;
  border: 1px solid var(--ide-border);
  border-radius: 10px;
  background-color: var(--ide-panel-bg);
  color: var(--ide-text-active);
  font-size: 13px;
  line-height: 1.7;
}

.ops-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.ops-metric {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--ide-border);
  border-radius: 10px;
  background-color: var(--ide-panel-bg);
}

.ops-metric.is-risk .metric-value {
  color: #f56c6c;
}

.metric-value {
  display: block;
  color: var(--ide-accent);
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
}

.metric-label {
  display: block;
  margin-top: 6px;
  color: var(--ide-text-light);
  font-size: 12px;
}

.ops-section {
  border: 1px solid var(--ide-border);
  border-radius: 10px;
  background-color: var(--ide-panel-bg);
  overflow: hidden;
}

.ops-section-title {
  padding: 10px 12px;
  border-bottom: 1px solid var(--ide-border);
  color: var(--ide-text-active);
  font-size: 13px;
  font-weight: 700;
}

.ops-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.ops-row:first-of-type {
  border-top: none;
}

.ops-row-main {
  flex: 1;
  min-width: 0;
}

.ops-row-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ide-text-active);
  font-size: 13px;
  font-weight: 600;
}

.ops-row-meta,
.ops-muted {
  margin-top: 4px;
  color: var(--ide-text-light);
  font-size: 12px;
  line-height: 1.5;
}

.ops-muted {
  padding: 12px;
  margin-top: 0;
}

.ops-suggestion {
  padding: 10px 12px;
  color: var(--ide-text-active);
  font-size: 13px;
  line-height: 1.6;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.ops-suggestion:first-of-type {
  border-top: none;
}

.empty-state {
  padding: 22px 12px;
  text-align: center;
  color: var(--ide-text-light);
}

.empty-icon {
  font-size: 42px;
  color: var(--ide-border-hover);
  display: block;
  margin: 0 auto 10px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 160ms ease, transform 220ms cubic-bezier(0.25, 0.8, 0.25, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
