<template>
  <div class="update-card modern-bento-card">
    <div class="update-card__header">
      <div class="header-icon-box">
        <svg-icon icon-class="build" class="header-icon" />
      </div>
      <div class="header-main">
        <div class="title-row">
          <span class="update-card__title">系统更新</span>
          <el-tag :type="updateTagType" effect="plain" class="status-tag" round size="small">
            <span class="status-dot" :class="updateTagType"></span>
            {{ updateTagText }}
          </el-tag>
        </div>
        <div class="update-card__subtitle">{{ updateStatusText }}</div>
      </div>
    </div>

    <div class="update-card__grid">
      <div class="meta-item">
        <span class="meta-label">当前版本</span>
        <span class="meta-value">{{ updateState.currentVersion || '--' }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">最新版本</span>
        <span class="meta-value highlight">{{ updateState.latestVersion || '--' }}</span>
      </div>
    </div>

    <div class="update-card__info-box">
      <div class="info-row">
        <span class="info-label">更新源:</span>
        <span class="info-value">{{ providerLabel }}</span>
      </div>
      <div class="update-card__message">{{ updateState.message || fallbackMessage }}</div>
    </div>

    <div v-if="showProgress" class="progress-container">
      <div class="progress-header">
        <span class="progress-label">正在下载更新包...</span>
        <span class="progress-val">{{ updateState.progress }}%</span>
      </div>
      <el-progress
        :percentage="updateState.progress"
        :stroke-width="8"
        :show-text="false"
        class="modern-progress"
      />
    </div>

    <div class="update-card__actions">
      <el-button 
        :disabled="isBusy || !canCheck" 
        class="modern-btn secondary"
        @click="handleCheck"
      >
        <el-icon><Refresh /></el-icon>
        检查更新
      </el-button>
      
      <el-button
        v-if="canDownload"
        type="primary"
        :loading="updateState.status === 'downloading'"
        class="modern-btn primary accent-btn"
        @click="handleDownload"
      >
        <el-icon><Download /></el-icon>
        下载新版本
      </el-button>

      <el-button
        v-if="canInstall"
        type="success"
        class="modern-btn success"
        @click="handleInstall"
      >
        <el-icon><MagicStick /></el-icon>
        立即安装
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Download, MagicStick } from '@element-plus/icons-vue'

const defaultState = () => ({
  currentVersion: '--',
  configured: false,
  provider: '',
  feedTarget: '',
  status: 'idle',
  latestVersion: '',
  progress: 0,
  message: ''
})

const updateState = reactive(defaultState())
let stopListening = null

const mergeState = (payload = {}) => {
  Object.assign(updateState, defaultState(), payload)
}

const updateTagText = computed(() => {
  const statusTextMap = {
    unconfigured: '未配置',
    idle: '待检查',
    checking: '检查中',
    available: '可更新',
    downloading: '下载中',
    downloaded: '待安装',
    'not-available': '最新版',
    error: '异常'
  }

  return statusTextMap[updateState.status] || '待检查'
})

const updateTagType = computed(() => {
  const typeMap = {
    unconfigured: 'info',
    idle: 'info',
    checking: 'warning',
    available: 'warning',
    downloading: 'warning',
    downloaded: 'success',
    'not-available': 'success',
    error: 'danger'
  }
  return typeMap[updateState.status] || 'info'
})

const providerLabel = computed(() => {
  const labelMap = {
    generic: 'Generic',
    github: 'GitHub'
  }
  return labelMap[updateState.provider] || (updateState.provider || '未配置')
})

const fallbackMessage = computed(() => {
  if (!updateState.configured) {
    return '当前未检测到有效更新源，补全发布配置后即可启用应用内更新。'
  }
  return '更新源已连接，可以检查桌面端更新。'
})

const updateStatusText = computed(() => {
  const textMap = {
    unconfigured: '请先配置更新源',
    idle: '可手动检查新版本',
    checking: '正在检查版本信息',
    available: '发现新版本，可手动下载',
    downloading: '正在下载更新包',
    downloaded: '更新包已准备完成',
    'not-available': '当前已是最新版本',
    error: '更新流程出现异常'
  }

  return textMap[updateState.status] || '可手动检查新版本'
})

const showProgress = computed(() => ['downloading', 'downloaded'].includes(updateState.status))
const isBusy = computed(() => ['checking', 'downloading'].includes(updateState.status))
const canCheck = computed(() => updateState.configured)
const canDownload = computed(() => updateState.status === 'available')
const canInstall = computed(() => updateState.status === 'downloaded')

const handleCheck = async () => {
  if (!window.electronAPI?.checkForUpdates) return
  const result = await window.electronAPI.checkForUpdates()
  if (result?.reason === 'development') {
    ElMessage.warning('开发环境不支持检查更新，请打包后测试。')
  }
}

const handleDownload = async () => {
  if (!window.electronAPI?.downloadUpdate) return
  const result = await window.electronAPI.downloadUpdate()
  if (result?.reason === 'development') {
    ElMessage.warning('开发环境不支持下载更新，请打包后测试。')
  }
}

const handleInstall = async () => {
  if (!window.electronAPI?.quitAndInstallUpdate) return

  try {
    await ElMessageBox.confirm(
      '应用将自动重启并更新，是否继续？',
      '安装更新',
      {
        confirmButtonText: '立即重启',
        cancelButtonText: '稍后再说',
        type: 'warning',
        center: true
      }
    )

    // 用户确认后，先保存桌面快捷方式状态再触发安装
    if (window.electronAPI?.saveShortcutStateBeforeUpdate) {
      await window.electronAPI.saveShortcutStateBeforeUpdate()
    }

    const result = await window.electronAPI.quitAndInstallUpdate()
    if (!result?.success) {
      ElMessage.info('更新包尚未准备完成。')
    }
  } catch (error) {
    // 用户取消弹窗 (error === 'cancel') 或 IPC 断开 (正常，主进程已退出)
    if (error !== 'cancel' && error?.message !== 'cancel') {
      console.error('安装更新失败:', error)
    }
  }
}

const syncUpdateInfo = async () => {
  if (!window.electronAPI?.getUpdateInfo) return
  const info = await window.electronAPI.getUpdateInfo()
  mergeState(info)
}

onMounted(async () => {
  await syncUpdateInfo()
  if (window.electronAPI?.onUpdateStatus) {
    stopListening = window.electronAPI.onUpdateStatus((payload) => {
      mergeState(payload)
    })
  }
})

onUnmounted(() => {
  if (typeof stopListening === 'function') {
    stopListening()
  }
})
</script>

<style scoped lang="scss">
.update-card {
  width: 100%;
  margin-bottom: 24px;
  padding: 24px;
  border-radius: 20px;
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.04);
  border: 1px solid rgba(var(--ide-accent-rgb, 64, 158, 255), 0.12);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  html.dark & {
    background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.06);
  }

  &:hover {
    background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.06);
    border-color: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
  }
}

.update-card__header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.header-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--ide-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.3);
  
  .header-icon {
    font-size: 24px;
    color: white;
  }
}

.header-main {
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.update-card__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--ide-text-active);
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  font-weight: 600;
  border-radius: 8px;
  background: white !important;
  border-color: var(--ide-border) !important;
  
  html.dark & {
    background: rgba(15, 23, 42, 0.3) !important;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    
    &.info { background-color: #909399; }
    &.warning { background-color: #e6a23c; animation: pulse 2s infinite; }
    &.success { background-color: #67c23a; }
    &.danger { background-color: #f56c6c; }
  }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.6; }
  100% { transform: scale(1); opacity: 1; }
}

.update-card__subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: var(--ide-text-light);
}

.update-card__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--ide-border);

  html.dark & {
    background: rgba(15, 23, 42, 0.2);
  }

  .meta-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--ide-text-light);
  }

  .meta-value {
    font-size: 14px;
    font-weight: 700;
    color: var(--ide-text-active);
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    
    &.highlight {
      color: var(--ide-accent);
    }
  }
}

.update-card__info-box {
  background: rgba(255, 255, 255, 0.4);
  padding: 16px;
  border-radius: 12px;
  border: 1px dashed var(--ide-border);
  margin-bottom: 20px;

  html.dark & {
    background: rgba(15, 23, 42, 0.15);
  }

  .info-row {
    margin-bottom: 8px;
    font-size: 13px;
    
    .info-label {
      color: var(--ide-text-light);
      margin-right: 8px;
    }
    
    .info-value {
      color: var(--ide-text-active);
      font-weight: 600;
    }
  }

  .update-card__message {
    font-size: 13px;
    color: var(--ide-text);
    line-height: 1.6;
    margin: 0;
  }
}

.progress-container {
  margin-bottom: 20px;
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    
    .progress-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--ide-accent);
    }
    
    .progress-val {
      font-size: 12px;
      font-weight: 700;
      color: var(--ide-accent);
    }
  }
}

.modern-progress :deep(.el-progress-bar__outer) {
  background-color: var(--ide-border) !important;
}

.update-card__actions {
  display: flex;
  gap: 12px;
  
  .modern-btn {
    flex: 1;
    height: 40px;
    border-radius: 10px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
    
    &:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    
    &:not(:disabled):active {
      transform: translateY(0);
    }

    &.accent-btn {
      background-color: var(--ide-accent) !important;
      border-color: var(--ide-accent) !important;
      box-shadow: 0 4px 12px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.3);
      
      &:hover {
        box-shadow: 0 6px 16px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.4);
      }
    }
    
    &.secondary {
      background: white;
      border: 1px solid var(--ide-border);
      color: var(--ide-text);
      
      html.dark & {
        background: rgba(15, 23, 42, 0.4);
      }
    }
  }
}
</style>
