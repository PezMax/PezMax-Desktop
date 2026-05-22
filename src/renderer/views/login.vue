<template>
  <div class="auth-shell login-shell">
    <div class="shell-background"></div>

    <section class="shell-scene">
      <!-- <div class="scene-badge">CLIENT DESKTOP</div> -->
      <div class="scene-logo">
        <img :src="logo" alt="logo" class="app-logo" />
      </div>
      <h1 class="scene-title">{{ title }}</h1>
      <p class="scene-description">登录拼图满绩，免费获取工大试卷，发现高价值学习资料。</p>

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
            <strong>免费工大试卷库</strong>
            <p>登录后直达试卷入口，并解锁意想不到的学习资料。</p>
          </div>
          <div class="benefit-card benefit-sub benefit-left">
            <span class="mini-dot"></span>
            <p>工大试卷免费获取</p>
          </div>
          <div class="benefit-card benefit-sub benefit-right">
            <span class="mini-dot"></span>
            <p>学习资料持续更新</p>
          </div>
        </div>

        <div class="feature-list">
          <span>拼图满绩登录</span>
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
            <h2 class="panel-title">欢迎回来</h2>
          </div>
          <router-link v-if="register" class="panel-switch" :to="PTMJ_AUTH_ROUTES.register">
            注册
          </router-link>
        </header>

        <main class="panel-body">
          <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="auth-form login-form">
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                type="text"
                size="large"
                auto-complete="off"
                placeholder="账号"
              >
                <template #prefix><svg-icon icon-class="user" class="el-input__icon input-icon" /></template>
              </el-input>
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                size="large"
                auto-complete="off"
                placeholder="密码"
                @keyup.enter="handleLogin"
              >
                <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
              </el-input>
            </el-form-item>

            <el-form-item v-if="captchaEnabled" prop="code">
              <div class="captcha-row">
                <el-input
                  v-model="loginForm.code"
                  class="captcha-input"
                  size="large"
                  auto-complete="off"
                  placeholder="验证码"
                  @keyup.enter="handleLogin"
                >
                  <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
                </el-input>
                <button type="button" class="captcha-card" @click="getCode">
                  <img :src="codeUrl" alt="验证码" class="login-code-img" />
                </button>
              </div>
            </el-form-item>

            <div class="form-tools">
              <el-checkbox v-model="loginForm.rememberMe">记住密码</el-checkbox>
              <router-link class="tool-link" :to="PTMJ_AUTH_ROUTES.forgotPassword">找回密码</router-link>
            </div>

            <el-form-item class="submit-item">
              <el-button
                :loading="loading"
                size="large"
                type="primary"
                class="submit-button"
                @click.prevent="handleLogin"
              >
                <span v-if="!loading">登 录</span>
                <span v-else>登 录 中...</span>
              </el-button>
            </el-form-item>
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
import { ref, watch, getCurrentInstance, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCodeImg } from '@/api/login'
import logo from '@/assets/logo/logo.png'
import { encrypt, decrypt } from '@/utils/jsencrypt'
import { PTMJ_AUTH_ROUTES } from '@/constants/ptmjAuth'
import useUserStore from '@/store/modules/user'
import defaultSettings from '@/settings'
import { getStorageItem, setStorageItem, removeStorageItem } from '@/utils/clientStorage'

// LYZ二次修改：将 PTMJ 客户端登录页视觉层迁移到主登录页，保留原有登录逻辑，
// 同时统一认证路由入口为 `/login`，不再使用独立的 `/ptmj/login` 路由。
const title = import.meta.env.VITE_APP_TITLE
const footerContent = defaultSettings.footerContent
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance()

// LYZ二次修改：客户端登录页默认值改为空，并保留验证码字段用于后端校验
const loginForm = ref({
  username: '',
  password: '',
  rememberMe: false,
  code: '',
  uuid: ''
})

const loginRules = {
  username: [{ required: true, trigger: 'blur', message: '请输入您的账号' }],
  password: [{ required: true, trigger: 'blur', message: '请输入您的密码' }],
  code: [{ required: true, trigger: 'change', message: '请输入验证码' }]
}

const codeUrl = ref('')
const loading = ref(false)
const captchaEnabled = ref(true)
const register = ref(true)
const redirect = ref(undefined)

watch(route, (newRoute) => {
  redirect.value = newRoute.query && newRoute.query.redirect
}, { immediate: true })

function getCode() {
  getCodeImg().then(res => {
    const payload = res.data || {}//LYZ三次修改：兼容后端AjaxResult的data包装
    captchaEnabled.value = payload.captchaEnabled === undefined ? true : payload.captchaEnabled
    if (captchaEnabled.value) {
      codeUrl.value = 'data:image/jpeg;base64,' + payload.img//LYZ三次修改：与后端jpg输出保持一致
      loginForm.value.uuid = payload.uuid
    }
  })
}

function getCookie() {
  const username = getStorageItem('username')
  const password = getStorageItem('password')
  const rememberMe = getStorageItem('rememberMe')

  loginForm.value = {
    username: username || loginForm.value.username,
    password: password ? decrypt(password) : loginForm.value.password,
    rememberMe: rememberMe === 'true',
    code: loginForm.value.code || '',
    uuid: loginForm.value.uuid || ''
  }
}

function handleLogin() {
  proxy.$refs.loginRef.validate(valid => {
    if (valid) {
      loading.value = true
      if (loginForm.value.rememberMe) {
        setStorageItem('username', loginForm.value.username)
        setStorageItem('password', encrypt(loginForm.value.password))
        setStorageItem('rememberMe', loginForm.value.rememberMe)
      } else {
        removeStorageItem('username')
        removeStorageItem('password')
        removeStorageItem('rememberMe')
      }

      userStore.login(loginForm.value).then(() => {
        const query = route.query
        const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
          if (cur !== 'redirect') {
            acc[cur] = query[cur]
          }
          return acc
        }, {})
        router.push({ path: redirect.value || '/', query: otherQueryParams })
      }).catch(() => {
        if (captchaEnabled.value) {
          getCode()
        }
      }).finally(() => {
        loading.value = false //LYZ三次修改：无论跳转成功与否都结束登录态，避免按钮长期“登录中”
      })
    }
  })
}

onMounted(() => {
  getCode()
  getCookie()
})
</script>

<style lang='scss' scoped>
/* LYZ浜屾淇敼锛氱櫥褰曢〉鏍峰紡杩佺Щ涓?ptmj-auth 瑙嗚椋庢牸 */
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
  display: flex;
  align-items: center;
  gap: 10px;
  width: 176px;
  padding: 12px 14px;
  font-size: 13px;
  color: var(--text-sub);
}

.benefit-left {
  left: 0;
  bottom: 8px;
  animation: floatCard 6.8s ease-in-out infinite;
  animation-delay: 1s;
}

.benefit-right {
  right: 0;
  bottom: 44px;
  animation: floatCard 6.8s ease-in-out infinite;
  animation-delay: 2s;
}

.mini-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-a), var(--accent-b));
  box-shadow: 0 0 0 6px rgba(90, 165, 255, 0.08);
}

.feature-list {
  position: absolute;
  left: 38px;
  bottom: 28px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.feature-list span {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
  color: #41658d;
  font-size: 12px;
  box-shadow: 0 10px 24px rgba(103, 126, 164, 0.12);
}

.shell-panel {
  padding: 28px 32px 28px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.panel-card {
  width: min(100%, 420px);
  max-height: calc(100vh - 56px);
  border-radius: 28px;
  padding: 24px 24px 18px;
  background: var(--panel-bg);
  border: 1px solid rgba(255, 255, 255, 0.98);
  box-shadow: 0 28px 62px rgba(95, 118, 157, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(22px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 20px;
}

.panel-eyebrow {
  margin: 0 0 8px;
  color: #6d84a3;
  font-size: 11px;
  letter-spacing: 0.18em;
}

.panel-title {
  margin: 0;
  font-size: 26px;
  line-height: 1.18;
  color: var(--text-main);
}

.panel-description {
  margin: 8px 0 0;
  color: var(--text-sub);
  font-size: 13px;
  line-height: 1.65;
}

.panel-switch {
  padding: 9px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(90, 165, 255, 0.14);
  color: #2f72c7;
  font-size: 12px;
  text-decoration: none;
  white-space: nowrap;
}

.panel-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding-right: 0;
}

.panel-footer {
  margin-top: 14px;
  text-align: center;
  color: #7c8fa9;
  font-size: 12px;
}

.auth-form {
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-input__wrapper) {
    min-height: 42px;
    border-radius: 14px;
    box-shadow: 0 0 0 1px rgba(134, 154, 188, 0.12) inset;
  }

  .input-icon {
    height: 18px;
    width: 18px;
  }
}

.captcha-row {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 128px;
  gap: 10px;
}

.captcha-input {
  width: 100%;
}

.captcha-card {
  height: 42px;
  border: none;
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(245, 249, 255, 0.95);
  box-shadow: 0 0 0 1px rgba(134, 154, 188, 0.12) inset;
  cursor: pointer;
}

.login-code-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-radius: 8px;
}

.form-tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin: 2px 0 14px;
}

.tool-link {
  color: #2f72c7;
  text-decoration: none;
}

.submit-item {
  width: 100%;
}

.submit-button {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #63a8ff, #76dacb);
  box-shadow: none;
}

@keyframes orbitPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.06);
    opacity: 0.6;
  }
}

@keyframes floatCard {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@media (max-width: 1120px) {
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

  .captcha-card {
    height: 40px;
    padding: 0 8px;
  }

  .submit-button {
    height: 42px;
  }
}
</style>
