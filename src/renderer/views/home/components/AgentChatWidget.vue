<template>
  <div class="agent-chat">
    <transition name="agent-panel">
      <section v-if="visible" class="agent-panel">
        <header class="agent-header">
          <div class="agent-title">
            <el-icon><ChatDotRound /></el-icon>
            <span>智能助手</span>
          </div>
          <button class="icon-btn" type="button" title="关闭" @click="visible = false">
            <el-icon><Close /></el-icon>
          </button>
        </header>

        <div ref="messageListRef" class="agent-messages">
          <div v-for="message in messages" :key="message.id" :class="['message-row', message.role]">
            <div class="message-bubble">
              <div class="message-text">{{ message.content }}</div>

              <div v-if="message.files?.length" class="file-results">
                <button
                  v-for="item in message.files"
                  :key="item.fileId || item.id || item.fileName"
                  class="file-result"
                  type="button"
                  @click="$emit('open-file', item)"
                >
                  <span class="file-name">{{ item.fileName || '未命名资料' }}</span>
                  <span class="file-meta">
                    {{ item.fileSchool || '未知学校' }} / {{ item.fileSubject || '未知科目' }} / {{ item.fileYear || '未知年份' }}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div v-if="loading" class="message-row assistant">
            <div class="message-bubble loading-bubble">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>思考中...</span>
            </div>
          </div>
        </div>

        <form class="agent-input" @submit.prevent="sendMessage">
          <el-input
            v-model="input"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            resize="none"
            placeholder="找 2024 高数期末..."
            @keydown.enter.exact.prevent="sendMessage"
          />
          <button class="send-btn" type="submit" :disabled="loading || !input.trim()" title="发送">
            <el-icon><Promotion /></el-icon>
          </button>
        </form>
      </section>
    </transition>

    <button class="agent-fab" type="button" title="智能助手" @click="visible = !visible">
      <el-icon>
        <Close v-if="visible" />
        <ChatDotRound v-else />
      </el-icon>
    </button>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Close, Loading, Promotion } from '@element-plus/icons-vue'
import { agentChat } from '@/api/agent'

defineEmits(['open-file'])

const visible = ref(false)
const loading = ref(false)
const input = ref('')
const messageListRef = ref(null)
const messages = ref([
  {
    id: 'welcome',
    role: 'assistant',
    content: '你好，我可以帮你找资料、解释资料、推荐复习方向。'
  }
])

function normalizeFiles(payload) {
  const data = payload?.data || payload
  const results = data?.results || data?.items || []
  if (!Array.isArray(results)) return []
  return results
    .map(item => item?.file || item)
    .filter(Boolean)
    .slice(0, 5)
}

async function scrollToBottom() {
  await nextTick()
  const el = messageListRef.value
  if (el) el.scrollTop = el.scrollHeight
}

async function sendMessage() {
  const text = input.value.trim()
  if (!text || loading.value) return

  input.value = ''
  messages.value.push({
    id: `user-${Date.now()}`,
    role: 'user',
    content: text
  })
  await scrollToBottom()

  loading.value = true
  try {
    const res = await agentChat({ message: text })
    const payload = res?.data || res
    messages.value.push({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: payload?.answer || payload?.summary || '已完成。',
      files: normalizeFiles(payload)
    })
  } catch (error) {
    console.warn('智能助手请求失败:', error)
    ElMessage.error(error?.message || '智能助手请求失败')
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}
</script>

<style scoped lang="scss">
.agent-chat {
  position: fixed;
  right: 24px;
  bottom: 112px;
  z-index: 3200;
  pointer-events: none;
}

.agent-fab,
.agent-panel {
  pointer-events: auto;
}

.agent-fab {
  width: 48px;
  height: 48px;
  border: 1px solid rgba(var(--ide-accent-rgb, 64, 158, 255), 0.3);
  border-radius: 14px;
  background: var(--ide-accent);
  color: #fff;
  box-shadow: 0 14px 32px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 22px;
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.agent-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 36px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.38);
}

.agent-panel {
  width: min(420px, calc(100vw - 32px));
  height: min(620px, calc(100vh - 120px));
  margin-bottom: 12px;
  border: 1px solid var(--ide-border);
  border-radius: 14px;
  background: rgba(var(--ide-bg-rgb, 255, 255, 255), 0.88);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  box-shadow: var(--ide-shadow-2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

html.dark .agent-panel {
  background: rgba(30, 41, 59, 0.88);
}

.agent-header {
  height: 50px;
  padding: 0 12px 0 14px;
  border-bottom: 1px solid var(--ide-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.agent-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ide-text-active);
  font-size: 14px;
  font-weight: 700;
}

.icon-btn,
.send-btn {
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  color: var(--ide-text-light);
  font-size: 18px;
}

.icon-btn:hover {
  background: var(--ide-bg);
  color: var(--ide-text-active);
}

.agent-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-row {
  display: flex;
}

.message-row.user {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 84%;
  border: 1px solid var(--ide-border);
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--ide-panel-bg);
  color: var(--ide-text-active);
  font-size: 13px;
  line-height: 1.65;
  word-break: break-word;
}

.message-row.user .message-bubble {
  background: var(--ide-accent);
  border-color: var(--ide-accent);
  color: #fff;
}

.loading-bubble {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--ide-text-light);
}

.loading-icon {
  animation: rotate 1s linear infinite;
}

.file-results {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-result {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--ide-border);
  border-radius: 10px;
  background: rgba(var(--ide-bg-rgb, 255, 255, 255), 0.72);
  color: var(--ide-text);
  text-align: left;
  cursor: pointer;
}

.file-result:hover {
  border-color: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.45);
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.08);
}

.file-name,
.file-meta {
  display: block;
}

.file-name {
  color: var(--ide-text-active);
  font-weight: 650;
  line-height: 1.45;
}

.file-meta {
  margin-top: 4px;
  color: var(--ide-text-light);
  font-size: 12px;
}

.agent-input {
  flex-shrink: 0;
  border-top: 1px solid var(--ide-border);
  padding: 10px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.agent-input :deep(.el-textarea__inner) {
  border-radius: 10px;
  box-shadow: none;
}

.send-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--ide-accent);
  color: #fff;
  font-size: 18px;
  flex-shrink: 0;
}

.send-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.agent-panel-enter-active,
.agent-panel-leave-active {
  transition: opacity 160ms ease, transform 220ms cubic-bezier(0.25, 0.8, 0.25, 1);
}

.agent-panel-enter-from,
.agent-panel-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .agent-chat {
    right: 16px;
    bottom: 104px;
  }

  .agent-panel {
    height: min(560px, calc(100vh - 100px));
  }
}
</style>
