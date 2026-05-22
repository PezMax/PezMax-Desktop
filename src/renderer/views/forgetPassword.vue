<template>
  <!-- LYZ二次修改：客户端找回密码页改为两步单密保流程，并补齐完整样式 -->
  <div class="auth-shell forget-shell">
    <div class="shell-background"></div>

    <section class="shell-scene">
      <!-- <div class="scene-badge">CLIENT DESKTOP</div> -->
      <div class="scene-logo">
        <img :src="logo" alt="logo" class="app-logo" />
      </div>
      <h1 class="scene-title">{{ title }}</h1>
      <p class="scene-description">
        找回拼图满绩账号，继续免费使用工大试卷与精选学习资料。
      </p>

      <div class="scene-stage">
        <div class="stage-grid"></div>
        <div class="stage-orbit orbit-a"></div>
        <div class="stage-orbit orbit-b"></div>
        <div class="stage-orbit orbit-c"></div>
        <div class="stage-core"></div>

        <div class="stage-panel">
          <div class="stage-line line-a"></div>
          <div class="stage-line line-b"></div>
          <div class="benefit-card benefit-main">
            <span class="benefit-chip">拼图满绩</span>
            <strong>两步恢复学习入口</strong>

          </div>
          <div class="benefit-card benefit-sub benefit-left">
            <span class="mini-dot"></span>
            <p>快速恢复试卷入口</p>
          </div>
          <div class="benefit-card benefit-sub benefit-right">
            <span class="mini-dot"></span>
            <p>继续探索学习资料</p>
          </div>
        </div>

        <div class="feature-list">
          <span>拼图满绩找回</span>
          <span>工大免费试卷</span>
          <span>精选学习资料</span>
        </div>
      </div>
    </section>

    <section class="shell-panel">
      <div class="panel-card">
        <header class="panel-header">
          <div>
            <p class="panel-eyebrow">拼图满绩</p>
            <h2 class="panel-title">找回学习账号</h2>
          </div>
          <router-link class="panel-switch" :to="PTMJ_AUTH_ROUTES.login">登录</router-link>
        </header>

        <main class="panel-body">
          <el-form ref="formRef" :model="form" :rules="rules" class="auth-form">
            <template v-if="step === 1">
              <el-form-item prop="username">
                <el-input
                  v-model="form.username"
                  type="text"
                  size="large"
                  auto-complete="off"
                  placeholder="请输入账号"
                >
                  <template #prefix><svg-icon icon-class="user" class="el-input__icon input-icon" /></template>
                </el-input>
              </el-form-item>

              <el-form-item prop="code">
                <div class="captcha-row">
                  <el-input
                    v-model="form.code"
                    class="captcha-input"
                    size="large"
                    auto-complete="off"
                    placeholder="请输入验证码"
                    @keyup.enter="handleNext"
                  >
                    <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
                  </el-input>
                  <button type="button" class="captcha-card" @click="getCode">
                    <img :src="codeUrl" alt="验证码" class="captcha-img" />
                  </button>
                </div>
              </el-form-item>

              <el-form-item class="submit-item">
                <el-button
                  class="submit-button"
                  type="primary"
                  :loading="loading"
                  @click.prevent="handleNext"
                >
                  下一步
                </el-button>
              </el-form-item>
            </template>

            <template v-else-if="step === 2">
              <div class="question-card">
                <span class="question-tag">密保问题一</span>
                <p class="question-text">{{ form.securityQuestionOne }}</p>
              </div>

              <el-form-item prop="securityAnswerOne">
                <el-input
                  v-model="form.securityAnswerOne"
                  type="text"
                  size="large"
                  auto-complete="off"
                  placeholder="请输入密保答案一"
                  @keyup.enter="handleStepNext"
                >
                  <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
                </el-input>
              </el-form-item>

              <div class="action-row">
                <el-button class="ghost-button" @click.prevent="handleStepPrev">上一步</el-button>
                <el-button
                  class="submit-button"
                  type="primary"
                  :loading="loading"
                  @click.prevent="handleStepNext"
                >
                  下一步
                </el-button>
              </div>
            </template>

            <template v-else-if="step === 3">
              <div class="question-card">
                <span class="question-tag">密保问题二</span>
                <p class="question-text">{{ form.securityQuestionTwo }}</p>
              </div>

              <el-form-item prop="securityAnswerTwo">
                <el-input
                  v-model="form.securityAnswerTwo"
                  type="text"
                  size="large"
                  auto-complete="off"
                  placeholder="请输入密保答案二"
                  @keyup.enter="handleStepNext"
                >
                  <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
                </el-input>
              </el-form-item>

              <div class="action-row">
                <el-button class="ghost-button" @click.prevent="handleStepPrev">上一步</el-button>
                <el-button
                  class="submit-button"
                  type="primary"
                  :loading="loading"
                  @click.prevent="handleStepNext"
                >
                  下一步
                </el-button>
              </div>
            </template>

            <template v-else>
              <div class="question-card">
                <span class="question-tag">密保问题三</span>
                <p class="question-text">{{ form.securityQuestionThree }}</p>
              </div>

              <el-form-item prop="securityAnswerThree">
                <el-input
                  v-model="form.securityAnswerThree"
                  type="text"
                  size="large"
                  auto-complete="off"
                  placeholder="请输入密保答案三"
                  @keyup.enter="handleSubmit"
                >
                  <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
                </el-input>
              </el-form-item>

              <el-form-item prop="newPassword">
                <el-input
                  v-model="form.newPassword"
                  type="password"
                  size="large"
                  auto-complete="off"
                  show-password
                  placeholder="请输入新密码"
                >
                  <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
                </el-input>
              </el-form-item>

              <el-form-item prop="confirmPassword">
                <el-input
                  v-model="form.confirmPassword"
                  type="password"
                  size="large"
                  auto-complete="off"
                  show-password
                  placeholder="请确认新密码"
                  @keyup.enter="handleSubmit"
                >
                  <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
                </el-input>
              </el-form-item>

              <div class="action-row">
                <el-button class="ghost-button" @click.prevent="handleStepPrev">上一步</el-button>
                <el-button
                  class="submit-button"
                  type="primary"
                  :loading="loading"
                  @click.prevent="handleSubmit"
                >
                  重置密码
                </el-button>
              </div>
            </template>
          </el-form>
        </main>

        <footer class="panel-footer">
          <span>{{ footerContent }}</span>
        </footer>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import defaultSettings from '@/settings'
import { getForgetCodeImg, getSecurityQuestions, resetPasswordBySecurity } from '@/api/login'
import logo from '@/assets/logo/logo.png'
import { PTMJ_AUTH_ROUTES } from '@/constants/ptmjAuth'

const title = import.meta.env.VITE_APP_TITLE
const footerContent = defaultSettings.footerContent
const router = useRouter()

const step = ref(1)
const loading = ref(false)
const codeUrl = ref('')
const formRef = ref()

const form = reactive({
  username: '',
  code: '',
  uuid: '',
  securityQuestionOne: '',
  securityQuestionTwo: '',
  securityQuestionThree: '',
  securityAnswerOne: '',
  securityAnswerTwo: '',
  securityAnswerThree: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (_rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入新密码'))
    return
  }
  if (value !== form.newPassword) {
    callback(new Error('两次输入的新密码不一致'))
    return
  }
  callback()
}

const rules = {
  username: [{ required: true, trigger: 'blur', message: '请输入账号' }],
  code: [{ required: true, trigger: 'blur', message: '请输入验证码' }],
  securityAnswerOne: [{ required: true, trigger: 'blur', message: '请输入密保答案一' }],
  securityAnswerTwo: [
    {
      validator: (_rule, value, callback) => {
        if (form.securityQuestionTwo && !value) {
          callback(new Error('请输入密保答案二'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  securityAnswerThree: [
    {
      validator: (_rule, value, callback) => {
        if (form.securityQuestionThree && !value) {
          callback(new Error('请输入密保答案三'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  newPassword: [
    { required: true, trigger: 'blur', message: '请输入新密码' },
    { min: 5, max: 20, trigger: 'blur', message: '新密码长度必须介于 5 和 20 之间' }
  ],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
}

function clearForgotValidation() {
  formRef.value?.clearValidate?.()
}

async function getCode() {
  const res = await getForgetCodeImg()
  const payload = res.data || {}//LYZ三次修改：兼容后端AjaxResult的data包装
  codeUrl.value = `data:image/jpeg;base64,${payload.img}`//LYZ三次修改：与后端jpg输出保持一致
  form.uuid = payload.uuid
}

async function handleNext() {
  try {
    await formRef.value.validateField(['username', 'code'])
  } catch (_error) {
    return
  }

  loading.value = true
  try {
    // LYZ二次修改：第一步同时提交用户名、验证码和 uuid，后端返回单个密保问题
    const res = await getSecurityQuestions({
      userName: form.username,//LYZ三次修改：查询参数统一使用userName键，取值来自username输入框
      code: form.code,
      uuid: form.uuid
    })
    // LYZ三次修改：兼容后端返回的密保问题列表结构 [{ question: '...' }, ...]
    const questionList = Array.isArray(res.data) ? res.data : []
    const questions = questionList
      .map(item => item?.question || '')
      .filter(Boolean)

    if (questions.length === 0) {
      ElMessage.error('未获取到密保问题')
      return
    }

    form.securityQuestionOne = questions[0] || ''
    form.securityQuestionTwo = questions[1] || ''
    form.securityQuestionThree = questions[2] || ''
    form.securityAnswerOne = ''
    form.securityAnswerTwo = ''
    form.securityAnswerThree = ''
    form.newPassword = ''
    form.confirmPassword = ''
    step.value = 2
    clearForgotValidation()
  } catch (_error) {
    form.code = ''
    await getCode()
  } finally {
    loading.value = false
  }
}

function backToStepOne() {
  // LYZ二次修改：返回上一步时保留用户名，重新获取验证码，避免使用已消费的验证码
  step.value = 1
  form.code = ''
  form.securityQuestionOne = ''
  form.securityQuestionTwo = ''
  form.securityQuestionThree = ''
  form.securityAnswerOne = ''
  form.securityAnswerTwo = ''
  form.securityAnswerThree = ''
  form.newPassword = ''
  form.confirmPassword = ''
  getCode()
  clearForgotValidation()
}

function handleStepPrev() {
  if (step.value === 1) {
    return
  }
  if (step.value === 2) {
    backToStepOne()
    return
  }
  step.value -= 1
  clearForgotValidation()
}

function handleStepNext() {
  formRef.value.validate(valid => {
    if (!valid) {
      return
    }
    if (step.value < 4) {
      step.value += 1
      clearForgotValidation()
    }
  })
}

function handleSubmit() {
  formRef.value.validate(async valid => {
    if (!valid) {
      return
    }
    loading.value = true
    try {
      await resetPasswordBySecurity({
        username: form.username,
        code: form.code,
        uuid: form.uuid,
        securityAnswerOne: form.securityAnswerOne,
        securityAnswerTwo: form.securityAnswerTwo,
        securityAnswerThree: form.securityAnswerThree,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword
      })//LYZ三次修改：重置密码补充验证码参数，匹配后端强校验
      ElMessage.success('密码重置成功')
      router.push(PTMJ_AUTH_ROUTES.login)
    } finally {
      loading.value = false
    }
  })
}

getCode()
</script>

<style scoped lang="scss">
/* LYZ二次修改：客户端找回密码页完整样式，与登录注册页保持统一 */
.auth-shell {
  --text-main: #17304f;
  --text-sub: #617694;
  --panel-bg: rgba(255, 255, 255, 0.9);
  --accent-a: #5aa5ff;
  --accent-b: #8fe2d2;
  --accent-c: #ffd3aa;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(420px, 1.05fr) minmax(400px, 0.95fr);
  background:
    radial-gradient(circle at top left, rgba(143, 226, 210, 0.22), transparent 28%),
    radial-gradient(circle at bottom right, rgba(255, 211, 170, 0.24), transparent 24%),
    linear-gradient(135deg, #fbfcff 0%, #f2f6fb 52%, #edf3fa 100%);
  overflow: hidden;
  position: relative;
}

.shell-background {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(90, 165, 255, 0.05), transparent 30%),
    linear-gradient(315deg, rgba(143, 226, 210, 0.08), transparent 35%);
  pointer-events: none;
}

.shell-scene,
.shell-panel {
  position: relative;
  z-index: 1;
  min-height: 0;
}

.shell-scene {
  padding: 40px 44px 34px 58px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.scene-logo {
  margin-bottom: 24px;
  .app-logo {
    width: 64px;
    height: 64px;
    object-fit: contain;
    filter: drop-shadow(0 8px 16px rgba(64, 158, 255, 0.2));
  }
}

.scene-badge {
  width: fit-content;
  padding: 9px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(255, 255, 255, 0.94);
  box-shadow: 0 14px 34px rgba(102, 126, 167, 0.12);
  color: var(--text-sub);
  font-size: 12px;
  letter-spacing: 0.22em;
}

.scene-title {
  margin: 18px 0 12px;
  font-size: clamp(44px, 6vw, 68px);
  line-height: 1.04;
  letter-spacing: 0.08em;
  color: var(--text-main);
}

.scene-description {
  max-width: 450px;
  margin: 0 0 22px;
  font-size: 15px;
  line-height: 1.75;
  color: var(--text-sub);
}

.scene-stage {
  position: relative;
  width: min(100%, 520px);
  height: 336px;
  border-radius: 30px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.5));
  border: 1px solid rgba(255, 255, 255, 0.94);
  box-shadow: 0 28px 60px rgba(98, 121, 160, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.82);
  overflow: hidden;
}

.stage-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(111, 137, 179, 0.12) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(111, 137, 179, 0.12) 1px, transparent 1px);
  background-size: 24px 24px;
}

.stage-orbit,
.stage-core {
  position: absolute;
  border-radius: 50%;
}

.stage-orbit {
  border: 1px solid rgba(90, 165, 255, 0.22);
  animation: orbitPulse 6s ease-in-out infinite;
}

.orbit-a {
  width: 180px;
  height: 180px;
  left: 46px;
  top: 44px;
}

.orbit-b {
  width: 250px;
  height: 250px;
  left: 12px;
  top: 10px;
  animation-delay: 1.4s;
}

.orbit-c {
  width: 96px;
  height: 96px;
  left: 88px;
  top: 86px;
  animation-delay: 0.7s;
}

.stage-core {
  width: 16px;
  height: 16px;
  left: 130px;
  top: 128px;
  background: linear-gradient(135deg, var(--accent-a), var(--accent-b));
  box-shadow: 0 0 0 10px rgba(90, 165, 255, 0.1);
}

.stage-panel {
  position: absolute;
  right: 26px;
  top: 34px;
  width: 246px;
  height: 222px;
}

.stage-line {
  position: absolute;
  left: 18px;
  right: 18px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(90, 165, 255, 0.26), transparent);
}

.line-a {
  top: 70px;
}

.line-b {
  bottom: 58px;
}

.benefit-card {
  position: absolute;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.94);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 18px 38px rgba(103, 126, 164, 0.14);
  backdrop-filter: blur(18px);
}

.benefit-main {
  left: 0;
  right: 0;
  top: 18px;
  padding: 18px 18px 16px;
  animation: floatCard 6.8s ease-in-out infinite;
}

.benefit-main strong {
  display: block;
  margin: 10px 0 8px;
  font-size: 22px;
  line-height: 1.2;
  color: var(--text-main);
}

.benefit-main p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-sub);
}

.benefit-chip {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(90, 165, 255, 0.14), rgba(143, 226, 210, 0.24));
  color: #205caa;
  font-size: 12px;
  font-weight: 600;
}

.benefit-sub {
  width: 108px;
  padding: 12px 14px;
}

.benefit-left {
  left: 10px;
  bottom: 0;
  animation: floatCard 5.4s ease-in-out infinite reverse;
}

.benefit-right {
  right: 8px;
  bottom: 22px;
  animation: floatCard 5.9s ease-in-out infinite;
}

.benefit-sub p {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--text-sub);
}

.mini-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  background: linear-gradient(135deg, var(--accent-a), var(--accent-c));
  box-shadow: 0 0 0 5px rgba(255, 211, 170, 0.22);
}

.feature-list {
  position: absolute;
  left: 30px;
  right: 30px;
  bottom: 18px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.feature-list span {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--text-sub);
  font-size: 12px;
}

.shell-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 34px;
}

.panel-card {
  width: min(100%, 420px);
  border-radius: 32px;
  padding: 28px;
  background: var(--panel-bg);
  border: 1px solid rgba(255, 255, 255, 0.94);
  box-shadow: none;
  backdrop-filter: blur(18px);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.panel-eyebrow {
  margin: 0;
  color: #6a84a3;
  font-size: 12px;
  letter-spacing: 0.24em;
}

.panel-title {
  margin: 10px 0 8px;
  color: var(--text-main);
  font-size: 26px;
}

.panel-description {
  margin: 0;
  color: var(--text-sub);
  line-height: 1.7;
  font-size: 14px;
}

.panel-switch {
  color: #205caa;
  text-decoration: none;
  font-size: 14px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(90, 165, 255, 0.12);
}

.panel-body {
  margin-top: 26px;
  max-height: none;
  overflow: hidden;
  padding-right: 0;
}

.auth-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.auth-form :deep(.el-input) {
  height: 42px;
}

.auth-form :deep(.el-input__wrapper) {
  height: 42px;
  min-height: 42px;
  border-radius: 14px;
  box-shadow: 0 0 0 1px rgba(126, 150, 184, 0.16) inset;
  background: rgba(255, 255, 255, 0.94);
}

.auth-form :deep(.el-input__inner) {
  height: 42px;
  line-height: 42px;
  font-size: 15px;
}

.input-icon {
  color: #7d96b6;
}

.captcha-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 116px;
  gap: 12px;
  width: 100%;
}

.captcha-card {
  border: none;
  border-radius: 8px;
  background: rgba(244, 248, 255, 0.98);
  box-shadow:none;
  cursor: pointer;
  padding: 0 10px;
}

.captcha-img {
  display: block;
  width: 100%;
  height: 42px;
  object-fit: contain;
}

.question-card {
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 12px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(236, 244, 255, 0.92));
  box-shadow: none;
}

.question-tag {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(90, 165, 255, 0.14);
  color: #2b6fbd;
  font-size: 12px;
}

.question-text {
  margin: 10px 0 0;
  color: var(--text-main);
  font-size: 16px;
  line-height: 1.6;
}

.submit-item {
  margin-bottom: 0 !important;
}

.submit-button,
.ghost-button {
  height: 44px;
  border-radius: 18px;
  font-size: 15px;
  font-weight: 600;
}

.submit-button {
  width: 100%;
  min-width: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  border: none;
  background: linear-gradient(135deg, #4d8fff 0%, #69b6ff 52%, #7fe0d5 100%);
  box-shadow: none;
}

.action-row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 10px;
  margin-top: 10px;
  align-items: center;
}

.ghost-button {
  width: 96px;
  padding: 0;
  border: 1px solid rgba(126, 150, 184, 0.18);
  background: rgba(255, 255, 255, 0.84);
  color: var(--text-sub);
}

.panel-footer {
  margin-top: 20px;
  text-align: center;
  color: #7a90ad;
  font-size: 12px;
}

@keyframes orbitPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.66;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
}

@keyframes floatCard {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@media (max-width: 1080px) {
  .auth-shell {
    grid-template-columns: 1fr;
    height: 100%;
    min-height: 0;
    place-items: center;
  }

  .shell-scene {
    display: none;
  }

  .shell-panel {
    width: 100%;
    height: 100%;
    padding: 14px 16px 16px;
  }

  .panel-card {
    max-height: none;
  }

  .panel-header {
    flex-direction: column;
  }

  .panel-title {
    font-size: 28px;
  }

  .panel-body {
    margin-top: 18px;
  }
}

@media (max-width: 640px) {
  .shell-panel {
    padding: 12px 12px 14px;
  }

  .panel-card {
    padding: 20px 16px 16px;
    border-radius: 24px;
  }

  .panel-header {
    flex-direction: column;
  }

  .panel-title {
    font-size: 26px;
  }

  .panel-description {
    font-size: 13px;
    line-height: 1.55;
  }

  .auth-form :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  .captcha-row {
    grid-template-columns: 1fr 104px;
    gap: 8px;
  }

  .action-row {
    grid-template-columns: 88px minmax(0, 1fr);
    gap: 8px;
  }

  .ghost-button {
    width: 88px;
  }
}

</style>
