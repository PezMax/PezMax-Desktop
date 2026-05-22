<template>
  <div class="session-expired-overlay" :class="{ 'is-visible': visible }">
    <div class="modal-backdrop" @click="handleCancel"></div>
    <transition name="spring" @after-leave="handleAfterLeave">
      <div v-if="visible" class="session-expired-modal">

        <div class="modal-content">
          <div class="icon-ring">
            <div class="pulse-circle"></div>
            <el-icon class="warning-icon"><WarningFilled /></el-icon>
          </div>
          <div class="text-content">
            <h2 class="modal-title">登录状态已过期</h2>
            <p class="modal-desc">
              为保护您的数据安全，系统已自动暂停会话。<br/>
              您可以选择继续留在该页面，或重新验证身份。
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-cancel" @click="handleCancel">留在此页</button>
          <button class="btn btn-confirm" @click="handleConfirm">重新登录</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'

const props = defineProps({
  onConfirm: Function,
  onCancel: Function,
  remove: Function
})

const visible = ref(false)
let action = null

onMounted(() => {
  // 稍微延迟以触发动画
  requestAnimationFrame(() => {
    visible.value = true
  })
})

const handleConfirm = () => {
  action = 'confirm'
  visible.value = false
}

const handleCancel = () => {
  action = 'cancel'
  visible.value = false
}

const handleAfterLeave = () => {
  if (action === 'confirm') {
    props.onConfirm?.()
  } else {
    props.onCancel?.()
  }
  props.remove?.()
}
</script>

<style scoped lang="scss">
.session-expired-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* Let clicks pass through when invisible */
  
  &.is-visible {
    pointer-events: auto;
  }
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  opacity: 0;
  transition: opacity 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.session-expired-overlay.is-visible .modal-backdrop {
  opacity: 1;
}

.session-expired-modal {
  position: relative;
  width: 420px;
  background: var(--ide-panel-bg, #ffffff);
  border-radius: 20px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 1;
  /* 支持深色模式 */
  color: var(--ide-text, #303133);
}

.modal-content {
  padding: 48px 32px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.icon-ring {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(250, 173, 20, 0.2), rgba(250, 173, 20, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: inset 0 0 0 1px rgba(250, 173, 20, 0.3);

  .warning-icon {
    font-size: 36px;
    color: #e6a23c;
    z-index: 2;
  }
}

.pulse-circle {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(250, 173, 20, 0.2);
  z-index: 1;
  animation: pulse 2s infinite cubic-bezier(0.25, 0.8, 0.25, 1);
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.6); opacity: 0; }
}

.text-content {
  .modal-title {
    font-size: 22px;
    font-weight: 600;
    margin: 0 0 12px;
    color: var(--ide-text-active, #1f2937);
    letter-spacing: 0.5px;
  }
  
  .modal-desc {
    font-size: 14px;
    line-height: 1.6;
    color: var(--ide-text-light, #64748b);
    margin: 0;
  }
}

.modal-footer {
  display: flex;
  padding: 20px 32px 32px;
  gap: 16px;
}

.btn {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: none;
  outline: none;
}

.btn-cancel {
  background: transparent;
  color: var(--ide-text, #475569);
  border: 1px solid var(--ide-border, #cbd5e1);
  
  &:hover {
    background: rgba(100, 116, 139, 0.05);
    color: var(--ide-text-active, #1e293b);
  }
}

.btn-confirm {
  background: var(--ide-accent, #409eff);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.4);
  
  &:hover {
    background: var(--ide-accent-hover, #66b1ff);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.6);
  }
  
  &:active {
    transform: translateY(1px);
  }
}

/* 深色模式适配 */
html.dark {
  .session-expired-modal {
    background: var(--ide-panel-bg, #162032);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  }
  .modal-backdrop {
    background: rgba(15, 23, 42, 0.6);
  }
  .btn-cancel {
    border-color: var(--ide-border, #334155);
    color: var(--ide-text-light, #cbd5e1);
    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #ffffff;
    }
  }
}

/* ====== 丝滑弹簧动画 ======== */
.spring-enter-active,
.spring-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.spring-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.spring-enter-to {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.spring-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.spring-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-10px);
}
</style>
