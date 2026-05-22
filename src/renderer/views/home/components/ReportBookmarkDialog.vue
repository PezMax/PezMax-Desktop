<template>
  <el-dialog
    v-model="visible"
    title="举报书签"
    width="460px"
    class="report-dialog"
    :close-on-click-modal="!reportSubmitting"
    :close-on-press-escape="!reportSubmitting"
    :show-close="!reportSubmitting"
    append-to-body
  >
    <div class="report-header-card" v-if="bookmarkInfo">
      <div class="file-icon-box">
        <el-icon><Link /></el-icon>
      </div>
      <div class="file-meta">
        <div class="file-name" :title="bookmarkInfo.title || '未知书签'">
          {{ bookmarkInfo.title || '未知书签' }}
        </div>
        <div class="file-id">ID: {{ bookmarkInfo.bookmarkId || bookmarkInfo.rawId || bookmarkInfo.id || reportForm.bookmarkId }}</div>
      </div>
    </div>

    <el-form ref="reportFormRef" :model="reportForm" :rules="reportRules" label-position="top" class="custom-form">
      <el-form-item label="举报原因" prop="reason">
        <el-input
          v-model="reportForm.reason"
          type="textarea"
          :rows="4"
          maxlength="500"
          show-word-limit
          placeholder="请详细说明违规行为（如侵权、违法、广告等），以便快速处理"
          :disabled="reportSubmitting"
        />
      </el-form-item>

      <el-form-item label="补充备注（可选）" prop="remark">
        <el-input
          v-model="reportForm.remark"
          type="textarea"
          :rows="2"
          maxlength="200"
          show-word-limit
          placeholder="可填写证据线索、发生时间等"
          :disabled="reportSubmitting"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="report-dialog-actions">
        <el-button class="action-btn cancel-btn" @click="visible = false" :disabled="reportSubmitting">取消</el-button>
        <el-button class="action-btn submit-btn" type="danger" @click="handleReportSubmit" :loading="reportSubmitting">
          提交举报
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Link } from '@element-plus/icons-vue'
import { addBookmarkReport } from '@/api/datum/bookmarkReport'
import useUserStore from '@/store/modules/user'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  bookmarkInfo: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'report-success'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const reportFormRef = ref()
const reportSubmitting = ref(false)
const userStore = useUserStore()
const reportForm = reactive({
  bookmarkId: '',
  userId: '',
  reason: '',
  remark: ''
})

const reportRules = {
  reason: [{ required: true, message: '请填写举报原因', trigger: 'blur' }]
}

const coercePositiveInt = (value, label) => {
  const trimmed = String(value || '').trim()
  if (!trimmed) {
    throw new Error(`${label}不能为空`)
  }
  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label}必须是正整数`)
  }
  return parsed
}

const resetForm = () => {
  reportForm.bookmarkId = ''
  reportForm.userId = ''
  reportForm.reason = ''
  reportForm.remark = ''
  reportFormRef.value?.clearValidate()
}

const handleReportSubmit = async () => {
  if (!reportFormRef.value || reportSubmitting.value) return

  const isValid = await reportFormRef.value.validate().then(() => true).catch(() => false)
  if (!isValid) return

  if (!reportForm.userId) {
    ElMessage.error('未能获取当前用户信息，请重新登录后重试')
    return
  }

  try {
    reportSubmitting.value = true
    const payload = {
      bookmarkId: coercePositiveInt(reportForm.bookmarkId, '书签 ID'),
      userId: coercePositiveInt(reportForm.userId, '用户 ID'),
      reason: reportForm.reason.trim(),
      remark: reportForm.remark?.trim() || undefined
    }

    await addBookmarkReport(payload)

    emit('report-success')

    visible.value = false
    resetForm()
  } catch (error) {
    ElMessage.error(error?.message || '提交失败，请稍后重试')
  } finally {
    reportSubmitting.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      if (props.bookmarkInfo) {
        reportForm.bookmarkId = props.bookmarkInfo.bookmarkId || props.bookmarkInfo.rawId || props.bookmarkInfo.id || ''
      }
      reportForm.userId = userStore.id ? String(userStore.id) : ''
    } else {
      resetForm()
    }
  }
)
</script>

<style scoped lang="scss">
:deep(.report-dialog .el-dialog) {
  border-radius: 16px;
  background: var(--ide-bg) !important;
  border: 1px solid var(--ide-border);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

html.dark :deep(.report-dialog .el-dialog) {
  background: var(--ide-bg) !important;
  border: 1px solid var(--ide-border);
}

:deep(.report-dialog .el-dialog__header) {
  padding: 20px 24px 16px;
  margin: 0;
  border-bottom: 1px solid var(--ide-border);
}

:deep(.report-dialog .el-dialog__title) {
  color: var(--ide-text-active);
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.5px;
}

:deep(.report-dialog .el-dialog__body) {
  padding: 20px 24px;
}

:deep(.report-dialog .el-dialog__footer) {
  padding: 16px 24px 20px;
  border-top: 1px solid var(--ide-border);
}

.report-header-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  margin-bottom: 24px;
  background: var(--ide-panel-bg);
  border: 1px solid var(--ide-border);
  border-radius: 12px;
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.3);

  html.dark & {
    box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.05);
  }

  .file-icon-box {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4eaf1 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: var(--ide-accent);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

    html.dark & {
      background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
    }
  }

  .file-meta {
    flex: 1;
    min-width: 0;

    .file-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--ide-text-active);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }

    .file-id {
      font-size: 12px;
      color: var(--ide-text-light);
      font-family: monospace;
    }
  }
}

.custom-form {
  :deep(.el-form-item__label) {
    color: var(--ide-text-active);
    font-weight: 500;
    padding-bottom: 8px;
    font-size: 13px;
  }

  :deep(.el-textarea__inner) {
    background: var(--ide-panel-bg);
    color: var(--ide-text-active);
    border: none;
    box-shadow: 0 0 0 1px var(--ide-border) inset;
    border-radius: 8px;
    padding: 12px;
    font-family: inherit;
    font-size: 13px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 0 0 1px var(--ide-border-hover) inset;
    }

    &:focus {
      box-shadow: 0 0 0 1.5px #f56c6c inset;
      background: var(--ide-bg);
    }
  }

  :deep(.el-input__count) {
    background: transparent;
    color: var(--ide-text-light);
    font-size: 11px;
    bottom: 8px;
    right: 12px;
  }
}

.report-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.action-btn {
  height: 36px;
  padding: 0 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: none;

  &.cancel-btn {
    background: transparent;
    color: var(--ide-text-light);
    box-shadow: 0 0 0 1px var(--ide-border) inset;

    &:hover {
      color: var(--ide-text-active);
      background: rgba(var(--ide-bg-rgb), 0.8);
      box-shadow: 0 0 0 1px var(--ide-border-hover) inset;
    }
  }

  &.submit-btn {
    background: #f56c6c;
    color: white;
    box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);

    &:hover {
      background: #f89898;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(245, 108, 108, 0.4);
    }

    &:active {
      transform: scale(0.96);
    }
  }
}
</style>
