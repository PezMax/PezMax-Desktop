<template>
  <div class="report-user-panel">
    <el-form ref="reportFormRef" :model="reportForm" :rules="rules" label-position="top" class="report-form">
      <el-form-item label="举报用户 ID" prop="userId">
        <el-input v-model="reportForm.userId" placeholder="例如: 9527" clearable />
      </el-form-item>

      <el-form-item label="举报原因" prop="reason">
        <el-input
          v-model="reportForm.reason"
          type="textarea"
          :rows="4"
          maxlength="500"
          show-word-limit
          placeholder="请详细说明违规行为，便于快速处理"
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
        />
      </el-form-item>

      <div class="report-actions">
        <el-button :loading="submitting" type="primary" @click="handleSubmit">提交举报</el-button>
        <el-button :disabled="submitting" @click="handleReset">重置</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { addReport } from '@/api/datum/report'

const reportFormRef = ref()
const submitting = ref(false)

const reportForm = reactive({
  userId: '',
  reason: '',
  remark: ''
})

const rules = {
  userId: [{ required: true, message: '请输入举报用户 ID', trigger: 'blur' }],
  reason: [{ required: true, message: '请填写举报原因', trigger: 'blur' }]
}

const coerceId = (value, fieldLabel) => {
  const trimmed = String(value || '').trim()
  if (!trimmed) {
    throw new Error(`${fieldLabel}不能为空`)
  }
  const asNumber = Number(trimmed)
  if (!Number.isInteger(asNumber) || asNumber <= 0) {
    throw new Error(`${fieldLabel}必须是正整数`)
  }
  return asNumber
}

const handleSubmit = async () => {
  if (!reportFormRef.value || submitting.value) return

  await reportFormRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      submitting.value = true
      const payload = {
        userId: coerceId(reportForm.userId, '举报用户 ID'),
        reason: reportForm.reason.trim(),
        remark: reportForm.remark?.trim() || undefined
      }

      await addReport(payload)
      ElMessage.success('举报已提交，感谢你的反馈')
      ElNotification.success({
        title: '举报成功',
        message: '你的举报已提交，我们会尽快审核处理。',
        duration: 2500
      })
      reportForm.reason = ''
      reportForm.remark = ''
      reportFormRef.value.clearValidate()
    } catch (error) {
      ElMessage.error(error?.message || '提交失败，请稍后重试')
    } finally {
      submitting.value = false
    }
  })
}

const handleReset = () => {
  reportForm.userId = ''
  reportForm.reason = ''
  reportForm.remark = ''
  reportFormRef.value?.clearValidate()
}
</script>

<style scoped lang="scss">
.report-user-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.report-form {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  padding: 0 8px 8px;

  :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  :deep(.el-form-item__label) {
    color: var(--ide-text-active);
    font-weight: 500;
    padding-bottom: 6px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    background: var(--ide-bg);
    border-color: var(--ide-border);
    color: var(--ide-text);
  }

  :deep(.el-textarea__inner) {
    box-shadow: 0 0 0 1px var(--ide-border) inset;
  }

  :deep(.el-input__wrapper.is-focus),
  :deep(.el-textarea__inner:focus) {
    box-shadow: 0 0 0 1px var(--ide-accent) inset;
  }
}

.report-actions {
  display: flex;
  gap: 10px;
  margin-top: 6px;

  .el-button {
    flex: 1;
    border-radius: 8px;
  }
}
</style>

