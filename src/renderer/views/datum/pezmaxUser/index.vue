<template>
  <div class="user-center-page">
    <aside class="settings-sidebar">
      <div class="profile-summary">
        <el-avatar :size="52" :src="displayAvatar" />
        <div>
          <p class="profile-name">{{ userProfile.userName || userStore.name || '未命名用户' }}</p>
          <p class="profile-caption">个人中心</p>
        </div>
      </div>
      <nav class="nav-list">
        <button
          v-for="item in navItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeNavKey === item.key }"
          @click="activeSection = item.key"
        >
          <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </button>
      </nav>
      <button class="nav-item logout-nav" @click="handleLogout">
        <el-icon class="nav-icon"><SwitchButton /></el-icon>
        <span>退出登录</span>
      </button>
    </aside>

    <section class="settings-main">
      <header class="settings-header">
        <div>
          <div class="page-title">个人中心</div>
          <div class="page-subtitle">{{ currentSectionLabel }}</div>
        </div>
        <el-button class="close-home" text aria-label="返回首页" @click="router.push('/index')">
          <el-icon><Close /></el-icon>
        </el-button>
      </header>

      <div class="settings-content-wrapper">
        <div v-if="activeSection === 'info'" class="settings-content info-content">
          <h3 class="section-header">用户详情</h3>
          <div class="info-overview">
            <section class="identity-panel">
              <div class="identity-main">
                <el-avatar :size="74" :src="displayAvatar" />
                <div class="identity-text">
                  <span class="identity-kicker">当前账号</span>
                  <strong class="identity-name">{{ profileName }}</strong>
                  <span class="identity-meta">
                    <el-icon><Calendar /></el-icon>
                    注册时间 {{ registeredAt }}
                  </span>
                </div>
              </div>
              <div class="identity-status" :class="{ 'is-disabled': !isAccountNormal }">
                {{ accountStatusText }}
              </div>
            </section>

            <div class="info-stat-grid">
              <div
                v-for="item in infoStatCards"
                :key="item.key"
                class="info-stat-card"
              >
                <span class="info-stat-icon">
                  <el-icon><component :is="item.icon" /></el-icon>
                </span>
                <span class="info-stat-label">{{ item.label }}</span>
                <strong class="info-stat-value">{{ item.value }}</strong>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeSection === 'favorite'" class="settings-content settings-content--wide">
          <h3 class="section-header">我的收藏</h3>
          <div class="embedded-panel">
            <FavoritePage embedded ref="favoriteRef" />
          </div>
        </div>

        <div v-if="activeSection === 'download'" class="settings-content settings-content--wide">
          <h3 class="section-header">我的下载</h3>
          <div class="embedded-panel">
            <DownloadPage embedded ref="downloadRef" />
          </div>
        </div>

        <div v-if="activeSection === 'upload'" class="settings-content settings-content--wide">
          <h3 class="section-header">我的上传</h3>
          <div class="embedded-panel">
            <UploadPage embedded ref="uploadRef" />
          </div>
        </div>

        <div v-if="activeSection === 'account'" class="settings-content">
          <h3 class="section-header">账号设置</h3>
          <div class="setting-card-group">
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">头像</span>
              </div>
              <div class="setting-action setting-action--avatar">
                <el-avatar :size="40" :src="displayAvatar" />
                <el-button class="action-btn" @click="activeSection = 'avatar-edit'">修改</el-button>
              </div>
            </div>
            <div class="divider"></div>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">用户名</span>
              </div>
              <div class="setting-action">
                <span class="inline-value">{{ userProfile.userName || userStore.name || '-' }}</span>
                <el-button class="action-btn" @click="activeSection = 'username-edit'">修改</el-button>
              </div>
            </div>
            <div class="divider"></div>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">密保问题</span>
              </div>
              <el-button class="action-btn" @click="activeSection = 'security-verify'">修改</el-button>
            </div>
            <div class="divider"></div>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">登录密码</span>
              </div>
              <el-button class="action-btn" @click="activeSection = 'password-verify'">修改</el-button>
            </div>
          </div>
        </div>

        <div v-if="activeSection === 'security-verify'" class="settings-content">
          <h3 class="section-header">修改密保 · 身份校验</h3>
          <div class="setting-card-group">
            <el-form ref="securityVerifyRef" :model="securityVerifyForm" :rules="securityVerifyRules" class="setting-form">
              <div class="setting-item form-item-row">
                <div class="setting-info">
                  <span class="setting-label">登录密码</span>
                  <span class="setting-desc">校验通过后才能修改密保问题</span>
                </div>
                <el-form-item prop="password" class="inline-form-item">
                  <el-input v-model.trim="securityVerifyForm.password" type="password" show-password placeholder="请输入登录密码" />
                </el-form-item>
              </div>
              <div class="divider"></div>
              <div class="form-actions">
                <el-button @click="activeSection = 'account'">返回</el-button>
                <el-button type="primary" :loading="securityVerifying" @click="verifySecurityStep">校验并下一步</el-button>
              </div>
            </el-form>
          </div>
        </div>

        <div v-if="activeSection === 'avatar-edit'" class="settings-content">
          <h3 class="section-header">修改头像</h3>
          <div class="setting-card-group">
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">当前头像</span>
                <span class="setting-desc">当前账号正在使用的头像</span>
              </div>
              <el-avatar :size="52" :src="displayAvatar" />
            </div>
            <div class="divider"></div>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">新头像</span>
                <span class="setting-desc">支持 JPG / PNG / JPEG / GIF，文件大小不超过 2MB</span>
              </div>
              <el-upload
                class="avatar-uploader"
                :show-file-list="false"
                :http-request="handleAvatarUpload"
                :before-upload="beforeAvatarUpload"
                accept=".png,.jpg,.jpeg,.gif,image/png,image/jpeg,image/gif"
              >
                <el-button type="primary" :loading="uploadingAvatar">选择并上传</el-button>
              </el-upload>
            </div>
            <div class="divider"></div>
            <div class="form-actions">
              <el-button @click="activeSection = 'account'">返回</el-button>
            </div>
          </div>
        </div>

        <div v-if="activeSection === 'username-edit'" class="settings-content">
          <h3 class="section-header">修改用户名</h3>
          <div class="setting-card-group">
            <el-form ref="usernameEditRef" :model="usernameEditForm" :rules="usernameEditRules" class="setting-form">
              <div class="setting-item form-item-row">
                <div class="setting-info">
                  <span class="setting-label">新用户名</span>
                  <span class="setting-desc">用户名将用于登录和个人信息展示</span>
                </div>
                <el-form-item prop="userName" class="inline-form-item">
                  <el-input v-model.trim="usernameEditForm.userName" maxlength="30" show-word-limit placeholder="请输入新用户名" />
                </el-form-item>
              </div>
              <div class="divider"></div>
              <div class="form-actions">
                <el-button @click="activeSection = 'account'">返回</el-button>
                <el-button type="primary" :loading="savingUserName" @click="submitUserNameEdit">保存用户名</el-button>
              </div>
            </el-form>
          </div>
        </div>

        <div v-if="activeSection === 'security-edit'" class="settings-content">
          <h3 class="section-header">修改密保 · 设置新密保</h3>
          <div class="setting-card-group">
            <el-form ref="securityEditRef" :model="securityEditForm" :rules="securityEditRules" label-width="86px" class="setting-form security-form">
              <div v-for="index in 3" :key="index" class="security-block">
                <div class="security-block-title">密保 {{ index }}</div>
                <div class="security-fields">
                  <el-form-item :label="`问题${index}`" :prop="`securityQuestion${index}`">
                    <el-input v-model.trim="securityEditForm[`securityQuestion${index}`]" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" maxlength="50" show-word-limit placeholder="请输入密保问题" />
                  </el-form-item>
                  <el-form-item :label="`新答案${index}`" :prop="`securityAnswer${index}`">
                    <el-input v-model.trim="securityEditForm[`securityAnswer${index}`]" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" maxlength="50" show-word-limit placeholder="请输入新密保答案" />
                  </el-form-item>
                </div>
              </div>
              <div class="divider"></div>
              <div class="form-actions">
                <el-button @click="activeSection = 'security-verify'">上一步</el-button>
                <el-button type="primary" :loading="savingSecurity" @click="submitSecurityEdit">保存密保</el-button>
              </div>
            </el-form>
          </div>
        </div>

        <div v-if="activeSection === 'password-verify'" class="settings-content">
          <h3 class="section-header">修改密码 · 旧密码校验</h3>
          <div class="setting-card-group">
            <el-form ref="passwordVerifyRef" :model="passwordVerifyForm" :rules="passwordVerifyRules" class="setting-form">
              <div class="setting-item form-item-row">
                <div class="setting-info">
                  <span class="setting-label">旧密码</span>
                  <span class="setting-desc">校验通过后才能设置新密码</span>
                </div>
                <el-form-item prop="oldPassword" class="inline-form-item">
                  <el-input v-model.trim="passwordVerifyForm.oldPassword" type="password" show-password placeholder="请输入旧密码" />
                </el-form-item>
              </div>
              <div class="divider"></div>
              <div class="form-actions">
                <el-button @click="activeSection = 'account'">返回</el-button>
                <el-button type="primary" :loading="passwordVerifying" @click="verifyPasswordStep">校验并下一步</el-button>
              </div>
            </el-form>
          </div>
        </div>

        <div v-if="activeSection === 'password-edit'" class="settings-content">
          <h3 class="section-header">修改密码 · 设置新密码</h3>
          <div class="setting-card-group">
            <el-form ref="passwordEditRef" :model="passwordEditForm" :rules="passwordEditRules" class="setting-form">
              <div class="setting-item form-item-row">
                <div class="setting-info">
                  <span class="setting-label">新密码</span>
                  <span class="setting-desc">请输入新的登录密码</span>
                </div>
                <el-form-item prop="newPassword" class="inline-form-item">
                  <el-input v-model.trim="passwordEditForm.newPassword" type="password" show-password placeholder="请输入新密码" />
                </el-form-item>
              </div>
              <div class="divider"></div>
              <div class="setting-item form-item-row">
                <div class="setting-info">
                  <span class="setting-label">确认新密码</span>
                  <span class="setting-desc">再次输入新密码，避免输错</span>
                </div>
                <el-form-item prop="confirmNewPassword" class="inline-form-item">
                  <el-input v-model.trim="passwordEditForm.confirmNewPassword" type="password" show-password placeholder="请再次输入新密码" />
                </el-form-item>
              </div>
              <div class="divider"></div>
              <div class="form-actions">
                <el-button @click="activeSection = 'password-verify'">上一步</el-button>
                <el-button type="primary" :loading="savingPassword" @click="submitPasswordEdit">保存新密码</el-button>
              </div>
            </el-form>
          </div>
        </div>

      </div>
    </section>
  </div>
</template>

<script setup>
import {computed, onMounted, reactive, ref, watch} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { PTMJ_AUTH_ROUTES } from '@/constants/ptmjAuth'
import {
  Calendar,
  Close,
  Download as DownloadIcon,
  Setting,
  Star,
  SwitchButton,
  Upload,
  User
} from '@element-plus/icons-vue'
import useUserStore from '@/store/modules/user'
import FavoritePage from '@/views/datum/favorite/index.vue'
import DownloadPage from '@/views/datum/download/index.vue'
import UploadPage from '@/views/datum/upload/index.vue'
import { getInfo } from '@/api/login'
import { listFavorite } from '@/api/datum/favorite'
import { listFavoriteBookmark } from '@/api/datum/bookmarkFavorite'
import { listDownload } from '@/api/datum/download'
import {
  updateDesktopUserName,
  uploadDesktopAvatar,
  verifyDesktopPassword, updateDesktopPassword, getDesktopSecurity, updateDesktopSecurity
} from '@/api/datum/desktopUser'
import { normalizeAvatar } from '@/utils/avatar'
// sxm 2026-05-10：导入默认头像，用于头像加载失败时的降级展示
import defAva from '@/assets/images/default_avatar.jpg'

defineOptions({ name: 'PezMaxUserCenter' })

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const navItems = [
  { key: 'info', label: '用户信息', icon: User },
  { key: 'favorite', label: '我的收藏', icon: Star },
  { key: 'download', label: '我的下载', icon: DownloadIcon },
  { key: 'upload', label: '我的上传', icon: Upload },
  { key: 'account', label: '账号设置', icon: Setting }
]
const flowSections = ['avatar-edit', 'username-edit', 'security-verify', 'security-edit', 'password-verify', 'password-edit']
const activeSection = ref('info')
const activeNavKey = computed(() => flowSections.includes(activeSection.value) ? 'account' : activeSection.value)
const currentSectionLabel = computed(() => {
  const map = {
    info: '查看账户概览与使用统计',
    favorite: '管理收藏的试卷与资料',
    download: '查看下载记录',
    upload: '管理上传的文件和书签',
    account: '维护用户名、头像、密保和密码',
    'avatar-edit': '更新个人头像',
    'username-edit': '修改登录用户名',
    'security-verify': '验证身份后修改密保',
    'security-edit': '设置新的密保问题',
    'password-verify': '验证旧密码',
    'password-edit': '设置新密码'
  }
  return map[activeSection.value] || ''
})

const userProfile = reactive({})
const stats = reactive({ favoriteCount: 0, downloadCount: 0, uploadCount: 0 })
const favoriteRef = ref()
const downloadRef = ref()
const uploadRef = ref()

// sxm 2026-05-10：头像加载失败状态标记，初始为 false
const avatarLoadFailed = ref(false)

// sxm 2026-05-10：头像显示逻辑，优先使用 normalizeAvatar 处理后的头像，加载失败时降级到默认头像
const displayAvatar = computed(() => {
  return avatarLoadFailed.value ? defAva : normalizeAvatar(userProfile.avatar || userStore.avatar)
})

const profileName = computed(() => userProfile.userName || userStore.name || '-')

const isAccountNormal = computed(() => `${userProfile.status ?? '1'}` === '1')

const accountStatusText = computed(() => isAccountNormal.value ? '正常使用' : '已停用')

const infoStatCards = computed(() => [
  {
    key: 'favorite',
    label: '收藏数量',
    value: stats.favoriteCount,
    icon: Star
  },
  {
    key: 'download',
    label: '下载数量',
    value: stats.downloadCount,
    icon: DownloadIcon
  },
  {
    key: 'upload',
    label: '上传文件数',
    value: stats.uploadCount,
    icon: Upload
  }
])

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return `${value}`
  const pad = (num) => `${num}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const registeredAt = computed(() => formatDateTime(userProfile.createTime))

// sxm 2026-05-10：头像加载失败处理函数，标记失败状态并返回 true 阻止默认错误展示
const handleAvatarError = () => {
  avatarLoadFailed.value = true
  return true
}

const securityVerifyRef = ref()
const securityVerifyForm = reactive({ password: '' })
const securityVerifyRules = { password: [{ required: true, message: '请输入登录密码', trigger: 'blur' }] }
const securityVerifying = ref(false)

const securityEditRef = ref()
const securityEditForm = reactive({
  securityQuestion1: '',
  securityAnswer1: '',
  securityQuestion2: '',
  securityAnswer2: '',
  securityQuestion3: '',
  securityAnswer3: ''
})
const securityEditRules = {
  securityQuestion1: [
    { required: true, message: '请输入密保问题一', trigger: 'blur' },
    { max: 50, message: '密保问题一不能超过 50 个字', trigger: 'blur' }
  ],
  securityAnswer1: [
    { required: true, message: '请输入密保答案一', trigger: 'blur' },
    { max: 50, message: '密保答案一不能超过 50 个字', trigger: 'blur' }
  ],
  securityQuestion2: [
    { required: true, message: '请输入密保问题二', trigger: 'blur' },
    { max: 50, message: '密保问题二不能超过 50 个字', trigger: 'blur' }
  ],
  securityAnswer2: [
    { required: true, message: '请输入密保答案二', trigger: 'blur' },
    { max: 50, message: '密保答案二不能超过 50 个字', trigger: 'blur' }
  ],
  securityQuestion3: [
    { required: true, message: '请输入密保问题三', trigger: 'blur' },
    { max: 50, message: '密保问题三不能超过 50 个字', trigger: 'blur' }
  ],
  securityAnswer3: [
    { required: true, message: '请输入密保答案三', trigger: 'blur' },
    { max: 50, message: '密保答案三不能超过 50 个字', trigger: 'blur' }
  ]
}
const savingSecurity = ref(false)

const uploadingAvatar = ref(false)

const usernameEditRef = ref()
const usernameEditForm = reactive({ userName: '' })
const usernameEditRules = {
  userName: [
    { required: true, message: '请输入新的用户名', trigger: 'blur' },
    { min: 2, max: 30, message: '用户名长度应为 2-30 个字符', trigger: 'blur' }
  ]
}
const savingUserName = ref(false)

const passwordVerifyRef = ref()
const passwordVerifyForm = reactive({ oldPassword: '' })
const passwordVerifyRules = { oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }] }
const passwordVerifying = ref(false)

const passwordEditRef = ref()
const passwordEditForm = reactive({ newPassword: '', confirmNewPassword: '' })
const passwordEditRules = {
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirmNewPassword: [{ required: true, message: '请再次输入新密码', trigger: 'blur' }]
}
const savingPassword = ref(false)

const loadProfile = async () => {
  const res = await getInfo()
  const payload = res?.data || res || {}
  const profile = payload.user || {}
  Object.assign(userProfile, profile)
  usernameEditForm.userName = profile.userName || userStore.name || ''
}

const resolveCurrentUserId = async () => {
  if (userStore.id) return `${userStore.id}`
  const res = await getInfo()
  return `${res?.user?.userId || ''}`
}

const loadStats = async () => {
  const userId = await resolveCurrentUserId()
  const [favoriteResult, bookmarkFavoriteResult, downloadResult] = await Promise.allSettled([
    listFavorite({ pageNum: 1, pageSize: 1000, userId }),
    listFavoriteBookmark({ pageNum: 1, pageSize: 1000, userId }),
    listDownload({ pageNum: 1, pageSize: 1000, userId })
  ])
  const favoriteRes = favoriteResult.status === 'fulfilled' ? favoriteResult.value : null
  const bookmarkFavoriteRes = bookmarkFavoriteResult.status === 'fulfilled' ? bookmarkFavoriteResult.value : null
  const downloadRes = downloadResult.status === 'fulfilled' ? downloadResult.value : null
  const fileFavoriteCount = Number(favoriteRes?.total) || favoriteRes?.rows?.length || 0
  const bookmarkFavoriteCount = Number(bookmarkFavoriteRes?.total) || bookmarkFavoriteRes?.rows?.length || 0
  stats.favoriteCount = fileFavoriteCount + bookmarkFavoriteCount
  stats.downloadCount = Number(downloadRes?.total) || downloadRes?.rows?.length || 0
  stats.uploadCount = Number(userProfile.uploadCount ?? userProfile.count) || 0
}

const refreshGlobalUser = async () => {
  try {
    await userStore.getInfo()
  } catch (error) {
    console.warn('刷新全局用户信息失败：', error)
  }
}

const loadSecurityQuestions = async () => {
  const res = await getDesktopSecurity()
  const payload = res?.data || res || {}
  const rawQuestions = Array.isArray(payload.questions)
    ? payload.questions
    : `${payload.question || ''}`.split('|')
  const questions = rawQuestions.map((question) => `${question || ''}`.trim())
  securityEditForm.securityQuestion1 = questions[0] || ''
  securityEditForm.securityQuestion2 = questions[1] || ''
  securityEditForm.securityQuestion3 = questions[2] || ''
  securityEditForm.securityAnswer1 = ''
  securityEditForm.securityAnswer2 = ''
  securityEditForm.securityAnswer3 = ''
}

const beforeAvatarUpload = (file) => {
  const allowTypes = ['image/jpeg', 'image/png', 'image/gif']
  const isAllowedType = allowTypes.includes(file.type)
  if (!isAllowedType) {
    ElMessage.error('仅支持 JPG / PNG / GIF 格式图片')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB')
    return false
  }
  return true
}

const handleAvatarUpload = async ({ file }) => {
  uploadingAvatar.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    await uploadDesktopAvatar(formData)
    await loadProfile()
    await refreshGlobalUser()
    ElMessage.success('头像更新成功')
  } finally {
    uploadingAvatar.value = false
  }
}

const submitUserNameEdit = () => usernameEditRef.value?.validate(async (valid) => {
  if (!valid) return
  savingUserName.value = true
  try {
    await updateDesktopUserName(usernameEditForm.userName)
    await loadProfile()
    await refreshGlobalUser()
    activeSection.value = 'account'
    ElMessage.success('用户名更新成功')
  } finally {
    savingUserName.value = false
  }
})

const verifySecurityStep = () => securityVerifyRef.value?.validate(async (valid) => {
  if (!valid) return
  securityVerifying.value = true
  try {
    await verifyDesktopPassword(securityVerifyForm.password)
    await loadSecurityQuestions()
    activeSection.value = 'security-edit'
    ElMessage.success('登录密码校验通过')
  } finally {
    securityVerifying.value = false
  }
})

const submitSecurityEdit = () => securityEditRef.value?.validate(async (valid) => {
  if (!valid) return
  savingSecurity.value = true
  try {
    await updateDesktopSecurity({
      securityQuestionOne: securityEditForm.securityQuestion1,
      securityAnswerOne: securityEditForm.securityAnswer1,
      securityQuestionTwo: securityEditForm.securityQuestion2,
      securityAnswerTwo: securityEditForm.securityAnswer2,
      securityQuestionThree: securityEditForm.securityQuestion3,
      securityAnswerThree: securityEditForm.securityAnswer3
    })
    securityVerifyForm.password = ''
    securityEditForm.securityAnswer1 = ''
    securityEditForm.securityAnswer2 = ''
    securityEditForm.securityAnswer3 = ''
    activeSection.value = 'account'
    ElMessage.success('密保已更新')
  } finally {
    savingSecurity.value = false
  }
})

const verifyPasswordStep = () => passwordVerifyRef.value?.validate(async (valid) => {
  if (!valid) return
  passwordVerifying.value = true
  try {
    await verifyDesktopPassword(passwordVerifyForm.oldPassword)
    activeSection.value = 'password-edit'
    ElMessage.success('旧密码校验通过')
  } finally {
    passwordVerifying.value = false
  }
})

const submitPasswordEdit = () => passwordEditRef.value?.validate(async (valid) => {
  if (!valid) return
  if (passwordEditForm.newPassword !== passwordEditForm.confirmNewPassword) {
    ElMessage.error('两次输入的新密码不一致')
    return
  }
  savingPassword.value = true
  try {
    await updateDesktopPassword(passwordVerifyForm.oldPassword, passwordEditForm.newPassword)
    passwordVerifyForm.oldPassword = ''
    passwordEditForm.newPassword = ''
    passwordEditForm.confirmNewPassword = ''
    activeSection.value = 'account'
    ElMessage.success('密码已更新')
  } finally {
    savingPassword.value = false
  }
})

const handleLogout = async () => {
  await ElMessageBox.confirm('退出后将返回登录页，当前未保存的操作可能丢失。', '确认退出账号', {
    type: 'warning',
    confirmButtonText: '退出登录',
    cancelButtonText: '继续使用',
    distinguishCancelAndClose: true
  })
  await userStore.logOut()
  router.push(PTMJ_AUTH_ROUTES.login)
}

watch(activeSection, async (key) => {
  if (flowSections.includes(key)) return
  if (key === 'favorite') favoriteRef.value?.refresh?.()
  if (key === 'download') downloadRef.value?.refresh?.()
  if (key === 'upload') uploadRef.value?.refresh?.()
  await loadStats()
})

onMounted(async () => {
  const preferredSection = route.query.activeSection || route.query.activeTab
  if (preferredSection === 'resetPwd') {
    activeSection.value = 'password-verify'
  } else if (typeof preferredSection === 'string' && flowSections.includes(preferredSection)) {
    activeSection.value = preferredSection
  } else if (typeof preferredSection === 'string' && navItems.some((item) => item.key === preferredSection)) {
    activeSection.value = preferredSection
  }
  await loadProfile()
  await loadStats()
})
</script>

<style scoped lang="scss">
.user-center-page {
  height: calc(100vh - 24px);
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 0;
  padding: 0;
  overflow: hidden;
  background: var(--ide-editor-bg, #fff);
  border: 1px solid var(--ide-border, #ebeef5);
  border-radius: 20px;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
}

.settings-sidebar {
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 28px 20px;
  background: var(--ide-bg, #f5f7fa);
  border-right: 1px solid var(--ide-border, #ebeef5);
  overflow: hidden;
}

.profile-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 0 8px 24px;
  border-bottom: 1px solid var(--ide-border, #ebeef5);
  margin-bottom: 24px;
}

.profile-summary :deep(.el-avatar) {
  flex: 0 0 auto;
  border: 1px solid var(--ide-border, #ebeef5);
}

.profile-name {
  margin: 0;
  color: var(--ide-text-active, #303133);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
  word-break: break-all;
}

.profile-caption {
  margin: 4px 0 0;
  color: var(--ide-text-light, #909399);
  font-size: 12px;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.logout-nav {
  margin-top: auto;
}

.nav-item {
  width: 100%;
  height: 38px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--ide-text, #606266);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.nav-item:hover {
  background: var(--ide-panel-bg, #fff);
  color: var(--ide-text-active, #303133);
}

.nav-item.active {
  background: var(--ide-panel-bg, #fff);
  color: var(--ide-accent, #409eff);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}

.nav-icon {
  font-size: 17px;
}

.settings-main {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--ide-editor-bg, #fff);
  overflow: hidden;
}

.settings-header {
  position: relative;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 34px 92px 24px 42px;
  border-bottom: 1px solid var(--ide-border, #ebeef5);
}

.close-home {
  position: absolute;
  top: 28px;
  right: 32px;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: var(--ide-bg, #f5f7fa);
  color: var(--ide-text-light, #909399);
  font-size: 20px;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.close-home:hover {
  background: var(--ide-border, #ebeef5);
  color: var(--ide-text-active, #303133);
}

.page-title {
  color: var(--ide-text-active, #303133);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.25;
}

.page-subtitle {
  margin-top: 6px;
  color: var(--ide-text-light, #909399);
  font-size: 13px;
}

.settings-content-wrapper {
  flex: 1;
  min-height: 0;
  padding: 34px 42px;
  overflow: auto;
  background: var(--ide-editor-bg, #fff);
}

.settings-content {
  max-width: 720px;
  margin: 0 auto;
}

.settings-content--wide {
  max-width: 1120px;
}

.info-content {
  max-width: 1080px;
}

.info-overview {
  display: grid;
  gap: 18px;
}

.identity-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 26px 30px;
  border: 1px solid var(--ide-border, #ebeef5);
  border-radius: 16px;
  background: var(--ide-panel-bg, #fff);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
}

.identity-main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 18px;
}

.identity-main :deep(.el-avatar) {
  flex: 0 0 auto;
  border: 1px solid var(--ide-border, #ebeef5);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.identity-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.identity-kicker {
  margin-bottom: 5px;
  color: var(--ide-text-light, #909399);
  font-size: 12px;
  font-weight: 650;
}

.identity-name {
  max-width: 520px;
  overflow: hidden;
  color: var(--ide-text-active, #303133);
  font-size: 32px;
  font-weight: 750;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  color: var(--ide-text-light, #909399);
  font-size: 13px;
  line-height: 1.4;
}

.identity-status {
  flex: 0 0 auto;
  min-width: 82px;
  padding: 8px 12px;
  border: 1px solid rgba(var(--ide-accent-rgb, 64, 158, 255), 0.22);
  border-radius: 999px;
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.08);
  color: var(--ide-accent, #409eff);
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}

.identity-status.is-disabled {
  border-color: rgba(148, 163, 184, 0.35);
  background: rgba(148, 163, 184, 0.12);
  color: var(--ide-text-light, #909399);
}

.info-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.info-stat-card {
  min-width: 0;
  min-height: 142px;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
  align-items: start;
  gap: 12px 14px;
  padding: 22px;
  border: 1px solid var(--ide-border, #ebeef5);
  border-radius: 14px;
  background: var(--ide-panel-bg, #fff);
  color: var(--ide-text-active, #303133);
  text-align: left;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.info-stat-icon {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.08);
  color: var(--ide-accent, #409eff);
  font-size: 20px;
}

.info-stat-label {
  align-self: center;
  color: var(--ide-text, #606266);
  font-size: 14px;
  font-weight: 650;
}

.info-stat-value {
  grid-column: 1 / -1;
  align-self: end;
  color: var(--ide-text-active, #303133);
  font-size: 36px;
  font-weight: 760;
  line-height: 1;
}

.section-header {
  margin: 0 0 22px;
  color: var(--ide-text-active, #303133);
  font-size: 21px;
  font-weight: 650;
  line-height: 1.3;
}

.setting-card-group {
  overflow: hidden;
  border: 1px solid var(--ide-border, #ebeef5);
  border-radius: 16px;
  background: var(--ide-panel-bg, #fff);
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.02);
}

.setting-item {
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 22px;
}

.setting-info {
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
  text-align: left;
}

.setting-label {
  color: var(--ide-text-active, #303133);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
}

.setting-desc {
  max-width: 420px;
  color: var(--ide-text-light, #909399);
  font-size: 12px;
  line-height: 1.45;
}

.setting-value {
  flex: 0 1 260px;
  min-width: 88px;
  color: var(--ide-text-active, #303133);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  text-align: right;
  word-break: break-all;
}

.setting-value--text {
  color: var(--ide-text, #606266);
  font-size: 15px;
  font-weight: 600;
}

.inline-value {
  max-width: 180px;
  overflow: hidden;
  color: var(--ide-text, #606266);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.setting-action {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.setting-action--avatar {
  min-width: 118px;
}

.action-btn {
  min-width: 72px;
  height: 36px;
  border: 1px solid var(--ide-border, #dcdfe6);
  border-radius: 8px;
  background: var(--ide-panel-bg, #fff);
  color: var(--ide-text-active, #303133);
  font-weight: 500;
}

.action-btn:hover,
.action-btn:focus {
  border-color: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.55);
  background: var(--ide-panel-bg, #fff);
  color: var(--ide-accent, #409eff);
}

.divider {
  height: 1px;
  margin: 0 22px;
  background: var(--ide-border, #ebeef5);
}

.embedded-panel {
  overflow: hidden;
  border: 1px solid var(--ide-border, #ebeef5);
  border-radius: 16px;
  background: var(--ide-panel-bg, #fff);
}

.setting-form {
  width: 100%;
}

.form-item-row {
  align-items: flex-start;
}

.inline-form-item {
  width: min(320px, 44vw);
  margin: 0;
}

.inline-form-item :deep(.el-form-item__content) {
  display: block;
}

.inline-form-item :deep(.el-form-item__error) {
  padding-top: 6px;
  position: static;
}

.form-actions {
  min-height: 68px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 22px;
}

.form-actions :deep(.el-button) {
  min-width: 88px;
  border-radius: 8px;
}

.avatar-uploader {
  flex: 0 0 auto;
}

.security-form {
  max-width: none;
}

.security-block {
  padding: 18px 22px 2px;
}

.security-block + .security-block {
  border-top: 1px solid var(--ide-border, #ebeef5);
}

.security-block-title {
  margin-bottom: 14px;
  color: var(--ide-text-active, #303133);
  font-size: 15px;
  font-weight: 650;
}

.security-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
}

.security-fields :deep(.el-form-item) {
  margin-bottom: 18px;
}

.security-fields :deep(.el-form-item__label) {
  color: var(--ide-text, #606266);
  font-weight: 600;
  justify-content: flex-start;
}

:global(html.dark) .user-center-page,
:global(html.dark) .settings-main,
:global(html.dark) .settings-content-wrapper {
  background: var(--ide-editor-bg, #1e1e1e);
}

:global(html.dark) .settings-sidebar {
  background: var(--ide-bg, #141414);
}

:global(html.dark) .user-center-page {
  box-shadow: 0 18px 38px rgba(0, 0, 0, 0.34);
}

:global(html.dark) .nav-item:hover,
:global(html.dark) .nav-item.active {
  background: rgba(255, 255, 255, 0.08);
}

@media (max-width: 980px) {
  .user-center-page {
    grid-template-columns: 214px minmax(0, 1fr);
  }

  .settings-sidebar {
    padding: 22px 16px;
  }

  .settings-header {
    padding: 26px 82px 20px 28px;
  }

  .settings-content-wrapper {
    padding: 28px;
  }

  .info-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .user-center-page {
    grid-template-columns: 176px minmax(0, 1fr);
  }

  .profile-summary {
    align-items: flex-start;
    padding-left: 4px;
    padding-right: 4px;
  }

  .profile-name {
    font-size: 16px;
  }

  .nav-item {
    padding: 0 10px;
  }

  .settings-header {
    padding: 22px 74px 22px 22px;
  }

  .close-home {
    top: 18px;
    right: 22px;
    width: 38px;
    height: 38px;
  }

  .settings-content-wrapper {
    padding: 22px;
  }

  .identity-panel {
    align-items: flex-start;
    flex-direction: column;
    padding: 22px;
  }

  .identity-name {
    max-width: 100%;
    font-size: 26px;
  }

  .identity-status {
    align-self: flex-start;
  }

  .info-stat-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .setting-item,
  .form-item-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .setting-value,
  .setting-action,
  .inline-form-item {
    width: 100%;
    flex-basis: auto;
    text-align: left;
    justify-content: flex-start;
  }

  .form-actions {
    justify-content: flex-start;
  }
}
</style>


