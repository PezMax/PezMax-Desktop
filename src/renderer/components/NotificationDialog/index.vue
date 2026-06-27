<!--弹窗通知页面   lxq-->
<template>
  <el-dialog
    v-model="visible"
    width="480px"
    top="50%"
    :close-on-click-modal="canClose"
    :close-on-press-escape="canClose"
    :show-close="canClose"
    append-to-body
    :z-index="20000"
    modal-class="notification-dialog-overlay"
    class="notification-dialog"
  >
    <div class="notification-content">
      <div class="notification-header">
        <div class="notification-header-icon">
          <div class="notification-icon">
            <img v-if="notifyType === '1'" src="@/assets/images/notification/rocket.svg" alt="版本更新" />
            <img v-else-if="notifyType === '2' || notifyType === '3'" src="@/assets/images/notification/wrench.svg" alt="系统维护" />
            <img v-else-if="notifyType === '4'" src="@/assets/images/notification/exclamation mark.png" alt="资料下架" />
            <img v-else src="@/assets/images/notification/bell.svg" alt="通知" />
          </div>
        </div>
        <div class="notification-title">{{ title }}</div>
      </div>
      <div class="notification-body" v-html="formattedContent"></div>
      <!-- 操作按钮（仅在非通知中心打开时显示） -->
      <div v-if="!fromNotificationCenter" class="notification-buttons">
        <!-- 版本更新通知 -->
        <template v-if="notifyType === '1'">
          <el-button type="primary" size="large" class="custom-accent-button" @click="handleUpdate">立即更新</el-button>
        </template>
        <!-- 系统故障/正式维护通知 -->
        <template v-else-if="notifyType === '2' || (notifyType === '3' && isInMaintenancePeriod)">
          <el-button type="primary" size="large" class="custom-accent-button" @click="handleExit">确认并退出</el-button>
        </template>
        <!-- 提前维护提醒/资料下架通知 -->
        <template v-else>
          <el-button type="primary" size="large" class="custom-accent-button" @click="handleAcknowledge">
            {{ notifyType === '4' ? '我知道了' : '确定' }}
          </el-button>
        </template>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { sanitizeRichText } from '@/utils/sanitizeHtml'

const props = defineProps({
  modelValue: Boolean,
  notification: Object,
  fromNotificationCenter: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'update', 'later', 'exit', 'acknowledge'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const notifyType = computed(() => props.notification?.notifyType || '')
const title = computed(() => props.notification?.title || '')
const content = computed(() => props.notification?.content || '')
const forceUpdate = computed(() => props.notification?.forceUpdate || '0')
const updateDownloadUrl = computed(() => props.notification?.updateDownloadUrl || '')
const maintenanceStartTime = computed(() => props.notification?.maintenanceStartTime)

const isInMaintenancePeriod = computed(() => {
  if (!maintenanceStartTime.value) return false
  return new Date() >= new Date(maintenanceStartTime.value)
})

const formattedContent = computed(() => sanitizeRichText(content.value, { preserveLineBreaks: true }))

const canClose = computed(() => {
  if (notifyType.value === '1' && forceUpdate.value === '1') return false
  if (notifyType.value === '2') return false
  if (notifyType.value === '3' && isInMaintenancePeriod.value) return false
  return true
})

const handleUpdate = async () => {
  const downloadUrl = getSafeExternalUrl(updateDownloadUrl.value)
  if (downloadUrl) window.open(downloadUrl, '_blank')

  // 记录已处理的强制更新通知
  if (notifyType.value === '1') {
    const processedNotifications = JSON.parse(localStorage.getItem('processedNotifications') || '[]')
    processedNotifications.push(props.notification.notifyId)
    localStorage.setItem('processedNotifications', JSON.stringify(processedNotifications))
  }
  visible.value = false
  emit('update', props.notification)

}

const handleLater = () => {
  emit('later', props.notification)
  visible.value = false
}

const handleExit = () => {
  emit('exit', props.notification)
  window.electronAPI?.closeWindow?.() || window.close()
}

const handleAcknowledge = async () => {
  // 记录已处理的下架通知
  if (notifyType.value === '4') {
    const processedNotifications = JSON.parse(localStorage.getItem('processedNotifications') || '[]')
    processedNotifications.push(props.notification.notifyId)
    localStorage.setItem('processedNotifications', JSON.stringify(processedNotifications))
  }
  visible.value = false
  emit('acknowledge', props.notification)

}

function getSafeExternalUrl(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}
</script>

<style scoped>
.notification-content {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
}
.notification-header {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 16px 20px;
  margin-bottom: 20px;
  background: var(--ide-header-bg);
  border-radius: 10px;
}
.notification-header-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--ide-accent);
  box-shadow: 0 10px 24px rgba(var(--ide-accent-rgb), 0.22);
  flex: 0 0 auto;
}
.notification-icon {
  width: 28px;
  height: 28px;
  margin-bottom: 0;
}
.notification-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: brightness(0) invert(1);
}
.notification-title {
  flex: 1;
  font-size: 20px;
  font-weight: 600;
  color: var(--ide-text-active);
  margin-bottom: 0;
}
.notification-body {
  width: 100%;
  box-sizing: border-box;
  padding: 0 8px;
  font-size: 14px;
  color: var(--ide-text);
  line-height: 1.8;
  text-align: left;
  max-width: 400px;
  margin: 0 auto 24px;
  white-space: pre-wrap;
  min-height: 100px;
}
.notification-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.notification-buttons .el-button {
  min-width: 120px;
}
.custom-accent-button {
  background-color: var(--ide-accent) !important;
  border-color: var(--ide-accent) !important;
  color: white !important;
}
.custom-accent-button:hover {
  background-color: var(--ide-accent-hover) !important;
  border-color: var(--ide-accent-hover) !important;
}

</style>

<style>
.notification-dialog .el-dialog__header { display: none; }
.notification-dialog .el-dialog__body { padding: 0; }
.notification-dialog-overlay {
  z-index: 20000 !important;
  transition: opacity 0.3s ease !important;
}
.notification-dialog-overlay.el-overlay-enter-from,
.notification-dialog-overlay.el-overlay-leave-to {
  opacity: 0 !important;
}
.notification-dialog {
  z-index: 20001 !important;
}
/* 弹窗居中显示 - 保留过渡动画 */
.el-dialog.notification-dialog {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  margin: 0 !important;
  width: 480px !important;
  z-index: 20001 !important;
  transition: opacity 0.3s ease, transform 0.3s ease !important;
}
</style>
