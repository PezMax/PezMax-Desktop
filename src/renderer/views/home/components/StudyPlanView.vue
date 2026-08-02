<template>
  <div class="study-root">
    <aside class="study-side">
      <section class="study-panel">
        <header class="panel-header">
          <div class="panel-title">
            <svg-icon icon-class="education" class="panel-title-icon" />
            <span>学习计划</span>
          </div>
          <el-button link type="primary" :icon="Refresh" size="small" :loading="loading" @click="generatePlan">
            生成
          </el-button>
        </header>

        <div class="panel-body">
          <el-form label-position="top" class="plan-form" @submit.prevent>
            <el-form-item label="目标">
              <el-input
                v-model="form.goal"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 5 }"
                resize="none"
                placeholder="例如：两周复习高等数学期末，每天 2 小时"
              />
            </el-form-item>

            <el-form-item label="科目">
              <el-select v-model="form.subject" clearable filterable placeholder="选择或输入科目" allow-create default-first-option>
                <el-option v-for="item in subjectOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>

            <div class="form-grid">
              <el-form-item label="天数">
                <el-input-number v-model="form.days" :min="1" :max="60" controls-position="right" />
              </el-form-item>
              <el-form-item label="每天小时">
                <el-input-number v-model="form.hoursPerDay" :min="0.5" :max="12" :step="0.5" controls-position="right" />
              </el-form-item>
            </div>

            <div class="form-grid">
              <el-form-item label="年份">
                <el-input-number v-model="form.year" :min="2000" :max="2100" controls-position="right" />
              </el-form-item>
              <el-form-item label="学校">
                <el-input v-model="form.school" clearable placeholder="可选" />
              </el-form-item>
            </div>

            <el-button class="generate-btn" type="primary" :icon="MagicStick" :loading="loading" @click="generatePlan">
              生成学习计划
            </el-button>

            <div class="mock-actions">
              <el-input-number v-model="mockQuestionCount" :min="3" :max="20" controls-position="right" />
              <el-button class="mock-btn" :icon="EditPen" :loading="mockLoading" @click="generateMockExam">
                根据真题出模拟题
              </el-button>
            </div>
          </el-form>
        </div>
      </section>
    </aside>

    <main class="study-main">
      <section class="study-panel result-panel">
        <header class="panel-header">
          <div class="panel-title">
            <svg-icon icon-class="documentation" class="panel-title-icon" />
            <span>计划内容</span>
          </div>
          <el-tag v-if="plan" size="small">{{ plan.days }} 天 · 每天 {{ plan.hoursPerDay }} 小时</el-tag>
        </header>

        <div class="panel-body">
          <el-skeleton v-if="loading" animated :rows="10" />

          <div v-else-if="!plan" class="empty-state">
            <svg-icon icon-class="education" class="empty-icon" />
            <p>填写目标后生成一份可执行的复习计划</p>
          </div>

          <div v-else class="plan-content">
            <div v-if="mockExam" class="mock-section">
              <div class="mock-header">
                <div>
                  <h3>模拟题</h3>
                  <p>{{ mockExam.summary || '已生成模拟题。' }}</p>
                </div>
                <el-tag size="small">{{ mockExam.questions?.length || 0 }} 题</el-tag>
              </div>

              <div v-if="mockExam.paperAnalysis" class="material-analysis">{{ mockExam.paperAnalysis }}</div>

              <div v-if="mockExam.documentTexts?.length" class="document-section">
                <div class="source-title">真题正文解析</div>
                <div
                  v-for="item in mockExam.documentTexts"
                  :key="item.fileId || item.fileName || item.fileUrl"
                  class="document-card"
                  :class="{ 'is-error': item.error && !item.text }"
                >
                  <div class="document-head">
                    <span>{{ item.fileName || '未命名资料' }}</span>
                    <el-tag size="small" effect="plain">{{ item.fileFormat || '文件' }}</el-tag>
                  </div>
                  <p v-if="item.text">{{ previewText(item.text) }}</p>
                  <p v-else>{{ item.error || '暂未解析到可用正文' }}</p>
                </div>
              </div>

              <div class="mock-question-list">
                <article v-for="question in mockExam.questions" :key="question.number" class="mock-question">
                  <div class="question-head">
                    <span>第 {{ question.number }} 题 · {{ question.type || '题目' }}</span>
                    <el-tag size="small" effect="plain">{{ question.topic || question.difficulty || '综合' }}</el-tag>
                  </div>
                  <p class="question-stem">{{ question.stem }}</p>
                  <div v-if="question.options?.length" class="question-options">
                    <div v-for="option in question.options" :key="option">{{ option }}</div>
                  </div>
                  <div v-if="question.answer" class="question-answer">答案：{{ question.answer }}</div>
                  <div v-if="question.analysis" class="question-analysis">解析：{{ question.analysis }}</div>
                  <div v-if="question.sourceBasis" class="question-source">{{ question.sourceBasis }}</div>
                </article>
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-text">{{ plan.summary || '已生成学习计划。' }}</div>
              <div v-if="plan.materialAnalysis" class="material-analysis">{{ plan.materialAnalysis }}</div>
              <div v-if="plan.suggestions?.length" class="suggestions">
                <div v-for="item in plan.suggestions" :key="item" class="suggestion">{{ item }}</div>
              </div>
            </div>

            <div v-if="plan.webSources?.length" class="source-section">
              <div class="source-title">网络参考</div>
              <a
                v-for="source in plan.webSources"
                :key="source.url || source.title"
                class="source-card"
                :href="source.url"
                target="_blank"
                rel="noreferrer"
              >
                <span class="source-name">{{ source.title || '网络资源' }}</span>
                <span class="source-snippet">{{ source.snippet || source.url }}</span>
              </a>
            </div>

            <div class="day-list">
              <article v-for="day in plan.plan" :key="day.day" class="day-card">
                <div class="day-head">
                  <div>
                    <h3>{{ day.title || `第 ${day.day} 天` }}</h3>
                    <p>{{ day.focus || '按计划完成当日任务' }}</p>
                  </div>
                  <el-tag size="small" effect="plain">Day {{ day.day }}</el-tag>
                </div>

                <div class="task-list">
                  <div v-for="task in day.tasks" :key="`${day.day}-${task.title}`" class="task-row">
                    <div class="task-main">
                      <span class="task-title">{{ task.title }}</span>
                      <span class="task-detail">{{ task.detail }}</span>
                    </div>
                    <strong>{{ task.minutes }} 分钟</strong>
                  </div>
                </div>

                <div v-if="day.recommendedFiles?.length" class="file-list">
                  <button
                    v-for="file in day.recommendedFiles"
                    :key="`${day.day}-${file.fileId || file.fileName}`"
                    class="file-card"
                    type="button"
                    @click="$emit('open-file', file)"
                  >
                    <span class="file-name">{{ file.fileName || '未命名资料' }}</span>
                    <span class="file-meta">{{ file.fileSchool || '未知学校' }} · {{ file.fileSubject || '未知科目' }} · {{ file.fileYear || '未知年份' }}</span>
                  </button>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { EditPen, MagicStick, Refresh } from '@element-plus/icons-vue'
import { generateMockExamByAgent, generateStudyPlanByAgent } from '@/api/agent'
import useUserStore from '@/store/modules/user'

defineEmits(['open-file'])

const userStore = useUserStore()
const loading = ref(false)
const mockLoading = ref(false)
const plan = ref(null)
const mockExam = ref(null)
const mockQuestionCount = ref(8)
const subjectOptions = [
  '高等数学',
  '线性代数',
  '概率论与数理统计',
  '大学物理',
  '大学英语',
  '数据结构',
  '计算机网络',
  '操作系统',
  '数据库',
  '离散数学'
]

const form = reactive({
  goal: '两周复习高等数学期末，每天 2 小时',
  subject: '高等数学',
  days: 14,
  hoursPerDay: 2,
  year: new Date().getFullYear(),
  school: ''
})

async function generatePlan() {
  const goal = form.goal.trim()
  if (!goal && !form.subject) {
    ElMessage.warning('请填写学习目标或选择科目')
    return
  }

  loading.value = true
  try {
    const res = await generateStudyPlanByAgent({
      userId: Number(userStore.id) || undefined,
      goal,
      subject: form.subject,
      days: Number(form.days) || undefined,
      hoursPerDay: Number(form.hoursPerDay) || undefined,
      year: Number(form.year) || undefined,
      school: form.school.trim() || undefined
    })
    plan.value = res?.data || res
    ElMessage.success('学习计划已生成')
  } catch (error) {
    console.error('生成学习计划失败:', error)
    ElMessage.error(error?.message || '生成学习计划失败')
  } finally {
    loading.value = false
  }
}

async function generateMockExam() {
  const goal = form.goal.trim()
  if (!goal && !form.subject) {
    ElMessage.warning('请填写学习目标或选择科目')
    return
  }

  mockLoading.value = true
  try {
    const res = await generateMockExamByAgent({
      userId: Number(userStore.id) || undefined,
      goal,
      subject: form.subject,
      school: form.school.trim() || undefined,
      year: Number(form.year) || undefined,
      questionCount: Number(mockQuestionCount.value) || 8,
      difficulty: '中等'
    })
    mockExam.value = res?.data || res
    if (!plan.value) {
      plan.value = {
        summary: mockExam.value?.summary || '已生成模拟题。',
        days: form.days,
        hoursPerDay: form.hoursPerDay,
        plan: [],
        webSources: mockExam.value?.webSources || [],
        materialAnalysis: mockExam.value?.paperAnalysis || ''
      }
    }
    ElMessage.success('模拟题已生成')
  } catch (error) {
    console.error('生成模拟题失败:', error)
    ElMessage.error(error?.message || '生成模拟题失败')
  } finally {
    mockLoading.value = false
  }
}

function previewText(text) {
  if (!text) return ''
  return text.length > 260 ? `${text.slice(0, 260)}...` : text
}
</script>

<style scoped lang="scss">
.study-root {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  gap: 8px;
}

.study-side {
  width: 320px;
  min-width: 280px;
  display: flex;
  overflow: hidden;
}

.study-main {
  flex: 1;
  min-width: 0;
  display: flex;
  overflow: hidden;
}

.study-panel {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: var(--ide-panel-bg);
  box-shadow: var(--ide-shadow-1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid var(--ide-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ide-text-active);
  font-size: 14px;
  font-weight: 700;
}

.panel-title-icon {
  color: var(--ide-accent);
  font-size: 18px;
}

.panel-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
}

.plan-form {
  :deep(.el-select),
  :deep(.el-input-number) {
    width: 100%;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}

.generate-btn {
  width: 100%;
  height: 40px;
}

.mock-actions {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 8px;

  :deep(.el-input-number) {
    width: 100%;
  }
}

.mock-btn {
  width: 100%;
}

.empty-state {
  height: 100%;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--ide-text-light);
}

.empty-icon {
  font-size: 44px;
  color: var(--ide-accent);
  opacity: 0.72;
}

.plan-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mock-section {
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  padding: 14px;
  background: var(--ide-editor-bg);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mock-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h3 {
    margin: 0;
    color: var(--ide-text-active);
    font-size: 15px;
  }

  p {
    margin: 4px 0 0;
    color: var(--ide-text-light);
    font-size: 12px;
    line-height: 1.5;
  }
}

.mock-question-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mock-question {
  padding: 12px;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: rgba(var(--ide-bg-rgb, 245, 247, 250), 0.58);
}

.question-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--ide-text-active);
  font-size: 13px;
  font-weight: 700;
}

.question-stem {
  margin: 9px 0 0;
  color: var(--ide-text-active);
  font-size: 13px;
  line-height: 1.65;
}

.question-options {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 6px;
  color: var(--ide-text);
  font-size: 12px;
  line-height: 1.5;
}

.question-answer,
.question-analysis,
.question-source {
  margin-top: 8px;
  color: var(--ide-text);
  font-size: 12px;
  line-height: 1.6;
}

.question-answer {
  color: var(--ide-accent);
  font-weight: 700;
}

.question-source {
  color: var(--ide-text-light);
}

.document-section {
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  padding: 12px;
  background: rgba(var(--ide-bg-rgb, 245, 247, 250), 0.5);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.document-card {
  padding: 10px;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: var(--ide-panel-bg);

  p {
    margin: 7px 0 0;
    color: var(--ide-text-light);
    font-size: 12px;
    line-height: 1.6;
  }
}

.document-card.is-error {
  border-color: rgba(245, 108, 108, 0.34);
}

.document-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--ide-text-active);
  font-size: 13px;
  font-weight: 650;
}

.summary-card {
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  padding: 14px;
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.08);
}

.summary-text {
  color: var(--ide-text-active);
  font-size: 14px;
  font-weight: 650;
  line-height: 1.6;
}

.suggestions {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.material-analysis {
  margin-top: 8px;
  color: var(--ide-text);
  font-size: 13px;
  line-height: 1.6;
}

.suggestion {
  color: var(--ide-text);
  font-size: 13px;
  line-height: 1.5;
}

.source-section {
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  padding: 12px;
  background: var(--ide-editor-bg);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-title {
  color: var(--ide-text-active);
  font-size: 13px;
  font-weight: 700;
}

.source-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 10px;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
  background: rgba(var(--ide-bg-rgb, 245, 247, 250), 0.55);
}

.source-card:hover {
  border-color: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.45);
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.08);
}

.source-name {
  color: var(--ide-text-active);
  font-size: 13px;
  font-weight: 650;
}

.source-snippet {
  color: var(--ide-text-light);
  font-size: 12px;
  line-height: 1.5;
}

.day-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

.day-card {
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: var(--ide-editor-bg);
  padding: 14px;
}

.day-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h3 {
    margin: 0;
    color: var(--ide-text-active);
    font-size: 15px;
    line-height: 1.45;
  }

  p {
    margin: 4px 0 0;
    color: var(--ide-text-light);
    font-size: 12px;
    line-height: 1.5;
  }
}

.task-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  border-top: 1px solid var(--ide-border);

  strong {
    color: var(--ide-accent);
    font-size: 12px;
    white-space: nowrap;
  }
}

.task-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.task-title {
  color: var(--ide-text-active);
  font-size: 13px;
  font-weight: 650;
}

.task-detail {
  color: var(--ide-text-light);
  font-size: 12px;
  line-height: 1.5;
}

.file-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-card {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: rgba(var(--ide-bg-rgb, 245, 247, 250), 0.65);
  text-align: left;
  cursor: pointer;
}

.file-card:hover {
  border-color: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.45);
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.08);
}

.file-name,
.file-meta {
  display: block;
}

.file-name {
  color: var(--ide-text-active);
  font-size: 13px;
  font-weight: 650;
  line-height: 1.45;
}

.file-meta {
  margin-top: 4px;
  color: var(--ide-text-light);
  font-size: 12px;
}

@media (max-width: 900px) {
  .study-root {
    flex-direction: column;
  }

  .study-side {
    width: 100%;
    min-height: 360px;
  }

  .day-list {
    grid-template-columns: 1fr;
  }
}
</style>
