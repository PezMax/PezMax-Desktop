<template>
  <!-- LYZ二次修改：客户端注册页重写为单密保问题注册流程，并补齐完整样式 -->
  <div class="auth-shell register-shell">
    <div class="shell-background"></div>

    <section class="shell-scene">
      <!-- <div class="scene-badge">CLIENT DESKTOP</div> -->
      <div class="scene-logo">
        <img :src="logo" alt="logo" class="app-logo" />
      </div>
      <h1 class="scene-title">{{ title }}</h1>
      <p class="scene-description">
        注册拼图满绩，发现高质量学习资料。
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

          </div>
          <div class="benefit-card benefit-sub benefit-left">
            <span class="mini-dot"></span>
            <p>注册即领试卷入口</p>
          </div>
          <div class="benefit-card benefit-sub benefit-right">
            <span class="mini-dot"></span>
            <p>高价值资料可发现</p>
          </div>
        </div>

        <div class="feature-list">
          <span>拼图满绩注册</span>
          <span>精选学习资料</span>
        </div>
      </div>
    </section>

    <section class="shell-panel">
      <div class="panel-card">
        <header class="panel-header">
          <div>
            <p class="panel-eyebrow">拼图满绩</p>
            <h2 class="panel-title">创建学习账号</h2>
          
          </div>
          <router-link class="panel-switch" :to="PTMJ_AUTH_ROUTES.login">登录</router-link>
        </header>

        <main class="panel-body">
          <el-form ref="registerRef" :model="registerForm" :rules="registerRules" class="auth-form register-form">
            <template v-if="step === 1">
              <el-form-item prop="username">
                <el-input
                  v-model="registerForm.username"
                  type="text"
                  size="large"
                  auto-complete="off"
                  placeholder="请输入账号"
                >
                  <template #prefix><svg-icon icon-class="user" class="el-input__icon input-icon" /></template>
                </el-input>
                <p class="username-hint">本软件与学校无关，各位同学请勿将学号，手机号等注册为账号</p>
              </el-form-item>

              <el-form-item prop="password">
                <el-input
                  v-model="registerForm.password"
                  type="password"
                  size="large"
                  auto-complete="off"
                  placeholder="5-15位，需包含数字、字母与符号"
                  @keyup.enter="handleRegisterNext"
                >
                  <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
                </el-input>
              </el-form-item>

              <el-form-item prop="confirmPassword">
                <el-input
                  v-model="registerForm.confirmPassword"
                  type="password"
                  size="large"
                  auto-complete="off"
                  placeholder="请确认密码"
                  @keyup.enter="handleRegisterNext"
                >
                  <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
                </el-input>
              </el-form-item>

              <div class="action-row step-one-row">
                <el-button
                  :loading="loading"
                  size="large"
                  type="primary"
                  class="submit-button"
                  @click.prevent="handleRegisterNext"
                >
                  <span v-if="!loading">下一步</span>
                  <span v-else>校验中...</span>
                </el-button>
              </div>
            </template>

            <template v-else-if="step === 2">
              <p class="security-hint">密保问题用于找回密码，你可以自定义密保问题和答案</p>
              <el-form-item prop="securityQuestionOne">
                <el-input
                  v-model="registerForm.securityQuestionOne"
                  type="text"
                  size="large"
                  auto-complete="off"
                  placeholder="请输入密保问题一"
                >
                  <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
                </el-input>
              </el-form-item>

              <el-form-item prop="securityAnswerOne">
                <el-input
                  v-model="registerForm.securityAnswerOne"
                  type="text"
                  size="large"
                  auto-complete="off"
                  placeholder="请输入密保答案一"
                  @keyup.enter="handleRegisterNext"
                >
                  <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
                </el-input>
              </el-form-item>

              <div class="action-row">
                <el-button class="ghost-button" @click.prevent="handleRegisterPrev">上一步</el-button>
                <el-button
                  :loading="loading"
                  size="large"
                  type="primary"
                  class="submit-button"
                  @click.prevent="handleRegisterNext"
                >
                  <span v-if="!loading">下一步</span>
                  <span v-else>校验中...</span>
                </el-button>
              </div>
            </template>

            <template v-else-if="step === 3">
              <el-form-item prop="securityQuestionTwo">
                <el-input
                  v-model="registerForm.securityQuestionTwo"
                  type="text"
                  size="large"
                  auto-complete="off"
                  placeholder="请输入密保问题二"
                >
                  <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
                </el-input>
              </el-form-item>

              <el-form-item prop="securityAnswerTwo">
                <el-input
                  v-model="registerForm.securityAnswerTwo"
                  type="text"
                  size="large"
                  auto-complete="off"
                  placeholder="请输入密保答案二"
                  @keyup.enter="handleRegisterNext"
                >
                  <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
                </el-input>
              </el-form-item>

              <div class="action-row">
                <el-button class="ghost-button" @click.prevent="handleRegisterPrev">上一步</el-button>
                <el-button
                  :loading="loading"
                  size="large"
                  type="primary"
                  class="submit-button"
                  @click.prevent="handleRegisterNext"
                >
                  <span v-if="!loading">下一步</span>
                  <span v-else>校验中...</span>
                </el-button>
              </div>
            </template>

            <template v-else>
              <el-form-item prop="securityQuestionThree">
                <el-input
                  v-model="registerForm.securityQuestionThree"
                  type="text"
                  size="large"
                  auto-complete="off"
                  placeholder="请输入密保问题三"
                >
                  <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
                </el-input>
              </el-form-item>

              <el-form-item prop="securityAnswerThree">
                <el-input
                  v-model="registerForm.securityAnswerThree"
                  type="text"
                  size="large"
                  auto-complete="off"
                  placeholder="请输入密保答案三"
                  @keyup.enter="handleRegisterSubmit"
                >
                  <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
                </el-input>
              </el-form-item>

              <el-form-item v-if="captchaEnabled" prop="code">
                <div class="captcha-row">
                  <el-input
                    v-model="registerForm.code"
                    class="captcha-input"
                    size="large"
                    auto-complete="off"
                    placeholder="请输入验证码"
                    @keyup.enter="handleRegisterSubmit"
                  >
                    <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
                  </el-input>
                  <button type="button" class="captcha-card" @click="getCode">
                    <img :src="codeUrl" alt="验证码" class="register-code-img" />
                  </button>
                </div>
              </el-form-item>

              <div class="action-row">
                <el-button class="ghost-button" @click.prevent="handleRegisterPrev">上一步</el-button>
                <el-button
                  :loading="loading"
                  size="large"
                  type="primary"
                  class="submit-button"
                  @click.prevent="handleRegisterSubmit"
                >
                  <span v-if="!loading">立即注册</span>
                  <span v-else>注册中...</span>
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

  <!-- 免责声明弹窗 -->
  <el-dialog
    v-model="showDisclaimer"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    width="620px"
    custom-class="disclaimer-dialog"
    top="5vh"
  >
    <div class="disclaimer-content">
      <h2 class="disclaimer-title">用户注册及免责声明</h2>
      <p class="disclaimer-intro">欢迎注册并使用本平台（以下简称"平台"）。在您点击"同意并注册"前，请务必仔细阅读以下条款。一旦完成注册并使用本平台服务，即视为您已充分理解并同意本声明的全部内容。</p>

      <h3 class="disclaimer-section">一、个人信息保护及非技术原因泄露免责</h3>
      <p>1. 平台仅提供用户自主上传、分享学习资料及试卷的技术服务，并采取合理的技术措施保护用户个人信息安全。</p>
      <p>2. 您应妥善保管自己的账号密码，并对通过您账号进行的一切操作承担责任。因您主动泄露密码、出借账号、在不安全网络环境下登录，或因手机、电脑等设备丢失、中毒等非平台技术原因导致的个人信息泄露及任何损失，平台不承担法律责任。</p>
      <p>3. 您了解并同意，在使用平台过程中可能因与他人互动而自愿披露个人信息（例如在评论区、资料描述中主动留下联系方式等），此类行为带来的后果由您自行承担。</p>

      <h3 class="disclaimer-section">二、资料分享与知识产权声明</h3>
      <p>1. 您上传、分享的任何资料（包括但不限于笔记、试卷、课件等），均应保证享有合法权利或已获授权，不得侵犯任何第三方的著作权、隐私权、名誉权等合法权益。</p>
      <p>2. 您上传的付费资料，一经发布即视为您同意以平台设定的方式向其他用户展示及传播。其他用户根据平台规则获取该资料后，可能会将其进一步分享、传播或公开，此行为系用户之间的行为，与平台无关。</p>
      <p>3. 因用户自行将付费资料转发、公开、二次传播导致资料被非付费用户获取的，平台不承担任何责任。</p>

      <h3 class="disclaimer-section">三、免责条款</h3>
      <p>1. 平台仅作为技术提供方，为用户提供信息存储空间及分享服务，不对用户上传的资料内容进行实质性审核，不对其真实性、准确性、完整性和合法性做任何保证。</p>
      <p>2. 用户因使用平台资料产生的任何纠纷（包括但不限于版权纠纷、学业纠纷等）由用户之间自行解决，平台不介入处理，也不承担任何责任。</p>
      <p>3. 若您发现任何资料侵犯了您的合法权益，请通过平台公布的投诉渠道联系我们，我们将依法采取删除、屏蔽等必要措施。</p>

      <h3 class="disclaimer-section">四、其他</h3>
      <p>本声明的解释权归平台所有。平台有权在法律允许的范围内对本声明进行修改，修改后的声明一经公布即有效替代原声明，您继续使用平台即视为同意修改后的内容。</p>
      <p class="disclaimer-warning">如您不同意以上任何条款，请勿注册或使用本平台。</p>

      <div class="disclaimer-tips">
        <h3 class="disclaimer-section">温馨提示</h3>
        <p>• 不要在公开资料中夹带个人真实姓名、手机号、学号等隐私信息。</p>
        <p>• 付费资料一旦发布，请做好可能被传播的心理准备。</p>
        <p>• 如不慎上传了不应公开的内容，请尽快自行删除或联系管理员处理。</p>
      </div>
    </div>

    <template #footer>
      <div class="disclaimer-footer">
        <el-button class="ghost-button" @click="declineDisclaimer">不同意</el-button>
        <el-button
          type="primary"
          class="submit-button"
          :disabled="!canAcceptDisclaimer"
          @click="acceptDisclaimer"
        >
          <span v-if="!canAcceptDisclaimer">请仔细阅读（{{ countdown }}s）</span>
          <span v-else>同意并注册</span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ElMessageBox } from "element-plus"
import { getCodeImg, register } from "@/api/login"
import logo from '@/assets/logo/logo.png'
import defaultSettings from '@/settings'
import { PTMJ_AUTH_ROUTES } from '@/constants/ptmjAuth'
import defAva from '@/assets/images/default_avatar.jpg'

const title = import.meta.env.VITE_APP_TITLE
const footerContent = defaultSettings.footerContent
const router = useRouter()
const { proxy } = getCurrentInstance()

const step = ref(1)
const showDisclaimer = ref(false)
const canAcceptDisclaimer = ref(false)
const countdown = ref(1)
let countdownTimer = null
const registerForm = ref({
  username: "",//LYZ三次修改：将username改为userName，保持与后端DTO字段一致
  password: "",
  confirmPassword: "",
  securityQuestionOne: "",
  securityAnswerOne: "",
  securityQuestionTwo: "",
  securityAnswerTwo: "",
  securityQuestionThree: "",
  securityAnswerThree: "",
  code: "",
  uuid: "",
  avatar: defAva
})

const equalToPassword = (_rule, value, callback) => {
  if (registerForm.value.password !== value) {
    callback(new Error("两次输入的密码不一致"))
    return
  }
  callback()
}

const registerRules = {
  userName: [
    { required: true, trigger: "blur", message: "请输入您的账号" },
    { min: 2, max: 20, message: "用户账号长度必须介于 2 和 20 之间", trigger: "blur" }
  ],//LYZ三次修改：校验字段名改为userName，与注册表单和后端DTO一致
  password: [
    { required: true, trigger: "blur", message: "请输入您的密码" },
    { min: 5, max: 20, message: "用户密码长度必须介于 5 和 20 之间", trigger: "blur" },
    { pattern: /^[^<>"'|\\]+$/, message: "不能包含非法字符：< > \" ' \\ |", trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, trigger: "blur", message: "请再次输入您的密码" },
    { required: true, validator: equalToPassword, trigger: "blur" }
  ],
  securityQuestionOne: [
    { required: true, trigger: "blur", message: "请输入密保问题一" },
    { max: 50, message: "密保问题一不能超过 50 个字", trigger: "blur" }
  ],
  securityAnswerOne: [
    { required: true, trigger: "blur", message: "请输入密保答案一" },
    { max: 50, message: "密保答案一不能超过 50 个字", trigger: "blur" }
  ],
  securityQuestionTwo: [
    { required: true, trigger: "blur", message: "请输入密保问题二" },
    { max: 50, message: "密保问题二不能超过 50 个字", trigger: "blur" }
  ],
  securityAnswerTwo: [
    { required: true, trigger: "blur", message: "请输入密保答案二" },
    { max: 50, message: "密保答案二不能超过 50 个字", trigger: "blur" }
  ],
  securityQuestionThree: [
    { required: true, trigger: "blur", message: "请输入密保问题三" },
    { max: 50, message: "密保问题三不能超过 50 个字", trigger: "blur" }
  ],
  securityAnswerThree: [
    { required: true, trigger: "blur", message: "请输入密保答案三" },
    { max: 50, message: "密保答案三不能超过 50 个字", trigger: "blur" }
  ],
  code: [{ required: true, trigger: "change", message: "请输入验证码" }]
}

const codeUrl = ref("")
const loading = ref(false)
const captchaEnabled = ref(true)

function clearRegisterValidation() {
  proxy.$refs.registerRef?.clearValidate?.()
}

function handleRegisterNext() {
  proxy.$refs.registerRef.validate(valid => {
    if (!valid) {
      return
    }
    if (step.value < 4) {
      step.value += 1
      clearRegisterValidation()
    }
  })
}

function handleRegisterPrev() {
  if (step.value === 1) {
    return
  }
  step.value -= 1
  clearRegisterValidation()
}

function startCountdown() {
  canAcceptDisclaimer.value = false
  countdown.value = 1
  clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
      canAcceptDisclaimer.value = true
    }
  }, 1000)
}

function acceptDisclaimer() {
  if (!canAcceptDisclaimer.value) return
  showDisclaimer.value = false
  clearInterval(countdownTimer)
  countdownTimer = null
  doRegister()
}

function declineDisclaimer() {
  showDisclaimer.value = false
  clearInterval(countdownTimer)
  countdownTimer = null
  canAcceptDisclaimer.value = false
  router.push('/')
}

function handleRegisterSubmit() {
  proxy.$refs.registerRef.validate(valid => {
    if (!valid) {
      return
    }
    // 弹出免责声明弹窗
    showDisclaimer.value = true
    startCountdown()
  })
}

function doRegister() {
  loading.value = true
  register(registerForm.value).then(() => {
      //sxm-2026-05-19-修改注册成功提示框样式，使用Flexbox实现文字和按钮完全居中
      ElMessageBox.alert(
        `<p style="
    color: #666;
    font-size: 18px;
    margin: 0 0 30px 0;
    text-align: center;
  ">
    您的账号已注册成功
  </p>
  <button
    onclick="document.querySelector('.el-message-box__btns').querySelector('button').click()"
    style="
      display: block;
      margin: 0 auto;
      background: #81D4FA;
      color: white;
      border: none;
      padding: 12px 60px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(100, 181, 246, 0.3);
    "
    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(100, 181, 246, 0.4)'"
    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(100, 181, 246, 0.3)'"
  >
    确定
  </button>
        `,
        '', //sxm-2026-05-19-清空标题但保留对话框结构
        {
          dangerouslyUseHTMLString: true,
          showConfirmButton: false, //sxm-2026-05-19-隐藏默认确认按钮，使用自定义按钮
          showCancelButton: false,  //sxm-2026-05-19-隐藏取消按钮
          closeOnClickModal: false,
          closeOnPressEscape: false,
          customClass: 'custom-register-success-dialog'
        }
      ).then(() => {
        router.push(PTMJ_AUTH_ROUTES.login)
      }).catch(() => {})
    }).catch(() => {
      if (captchaEnabled.value) {
        getCode()
      }
    }).finally(() => {
      loading.value = false
    })
}

function getCode() {
  getCodeImg().then(res => {
    const payload = res.data || {}//LYZ三次修改：兼容后端AjaxResult的data包装
    captchaEnabled.value = payload.captchaEnabled === undefined ? true : payload.captchaEnabled
    if (captchaEnabled.value) {
      codeUrl.value = "data:image/jpeg;base64," + payload.img//LYZ三次修改：与后端jpg输出保持一致
      registerForm.value.uuid = payload.uuid
    }
  })
}

getCode()

onUnmounted(() => {
  clearInterval(countdownTimer)
  countdownTimer = null
})
</script>

<style lang='scss' scoped>
/* LYZ二次修改：客户端注册页重写完整样式，保持与登录页统一视觉 */
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
  box-shadow: 0 26px 60px rgba(103, 126, 164, 0.18);
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
  overflow: visible;
  padding-right: 0;
}

.auth-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.auth-form :deep(.el-input),
.security-select :deep(.el-select) {
  height: 42px;
}

.auth-form :deep(.el-input__wrapper),
.security-select :deep(.el-select__wrapper) {
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

.username-hint {
  margin: 4px 0 0 4px;
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

.security-hint {
  margin: 0 0 12px 4px;
  font-size: 12px;
  color: #999;
  line-height: 1.4;
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

.captcha-input {
  min-width: 0;
}

.captcha-card {
  border: none;
  border-radius: 8px;
  background: rgba(244, 248, 255, 0.98);
  box-shadow: 0 0 0 1px rgba(126, 150, 184, 0.16) inset;
  cursor: pointer;
  padding: 0 10px;
}

.register-code-img {
  display: block;
  width: 100%;
  height: 42px;
  object-fit: contain;
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
  min-width: 80px;
  padding: 0 14px;
  box-sizing: border-box;
  overflow: visible;
  border: none;
  background: linear-gradient(135deg, #4d8fff 0%, #69b6ff 52%, #7fe0d5 100%);
  box-shadow: none;
  justify-content: center;
}

.action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
  align-items: center;
}

.step-one-row {
  grid-template-columns: 1fr 1fr;
}

.step-one-row .submit-button {
  grid-column: 2;
}

.ghost-button {
  width: 100%;
  padding: 0;
  border: 1px solid rgba(126, 150, 184, 0.18);
  background: rgba(255, 255, 255, 0.92);
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

  .captcha-card {
    height: 40px;
    padding: 0 8px;
  }

  .action-row {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .step-one-row {
    grid-template-columns: 1fr 1fr;
  }

  .ghost-button,
  .submit-button {
    height: 42px;
  }
}

/* sxm-2026-05-19-注册成功提示框居中样式 */
:global(.custom-register-success-dialog) {
  position: fixed !important; /* sxm-2026-05-19 */
  top: 50% !important; /* sxm-2026-05-19 */
  left: 50% !important; /* sxm-2026-05-19 */
  transform: translate(-50%, -50%) !important; /* sxm-2026-05-19 */
  margin: 0 !important; /* sxm-2026-05-19 */

  .el-message-box__header {
    display: none; /* sxm-2026-05-19 */
  }

  .el-message-box__content {
    padding: 0 !important; /* sxm-2026-05-19 */
    text-align: center !important; /* sxm-2026-05-19 */
  }

  .el-message-box__message {
    margin: 0 !important; /* sxm-2026-05-19 */
    padding: 0 !important; /* sxm-2026-05-19 */
    width: 100% !important; /* sxm-2026-05-19 */
    display: flex !important; /* sxm-2026-05-19 */
    flex-direction: column !important; /* sxm-2026-05-19 */
    align-items: center !important; /* sxm-2026-05-19 */
    justify-content: center !important; /* sxm-2026-05-19 */
  }
}

/* 免责声明弹窗样式 */
:global(.disclaimer-dialog) {
  border-radius: 20px;
  overflow: hidden;

  .el-dialog__header {
    display: none;
  }

  .el-dialog__body {
    padding: 0;
    max-height: 65vh;
    overflow-y: auto;
  }

  .el-dialog__footer {
    padding: 16px 28px 24px;
  }
}

.disclaimer-content {
  padding: 28px 28px 8px;
  font-size: 13px;
  line-height: 1.8;
  color: #444;

  h2.disclaimer-title {
    margin: 0 0 16px;
    font-size: 22px;
    font-weight: 700;
    color: #17304f;
    text-align: center;
  }

  .disclaimer-intro {
    margin: 0 0 16px;
    color: #555;
    font-size: 13px;
    line-height: 1.8;
  }

  h3.disclaimer-section {
    margin: 18px 0 8px;
    font-size: 15px;
    font-weight: 600;
    color: #17304f;
  }

  p {
    margin: 4px 0;
    font-size: 13px;
    line-height: 1.8;
    color: #555;
  }

  .disclaimer-warning {
    margin-top: 12px;
    color: #e45649;
    font-weight: 600;
  }

  .disclaimer-tips {
    margin-top: 16px;
    padding: 14px 16px;
    background: rgba(90, 165, 255, 0.06);
    border-radius: 10px;
    border: 1px solid rgba(90, 165, 255, 0.12);

    h3 {
      margin-top: 0;
      color: #205caa;
    }

    p {
      color: #617694;
      font-size: 12px;
    }
  }
}

.disclaimer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .submit-button {
    min-width: 160px;

    &:disabled {
      background: #c8d6e5;
      color: #fff;
      cursor: not-allowed;
    }
  }

  .ghost-button {
    min-width: 88px;
    border: 1px solid rgba(126, 150, 184, 0.3);
    background: #fff;
    color: #617694;

    &:hover {
      border-color: #e45649;
      color: #e45649;
    }
  }
}
</style>
