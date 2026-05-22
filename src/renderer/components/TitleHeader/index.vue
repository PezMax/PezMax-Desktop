<template>
  <div class="ide-header" style="-webkit-app-region: drag;">

    <!-- 左侧：Mac 风格窗口控制按钮 (仅在 macOS 下显示) -->
    <div class="header-left" style="-webkit-app-region: no-drag;" v-if="isMac">
      <div class="window-controls mac-style">
        <div class="win-btn close" @click="handleWindow('close')" title="关闭">
          <el-icon class="win-icon"><Close /></el-icon>
        </div>
        <div class="win-btn minimize" @click="handleWindow('minimize')" title="最小化">
          <el-icon class="win-icon"><Minus /></el-icon>
        </div>
        <div class="win-btn maximize" v-if="!isAuthPage" @click="handleWindow('maximize')" title="最大化/还原">
          <el-icon class="win-icon"><FullScreen /></el-icon>
        </div>
      </div>
    </div>

    <!-- 中间/左侧：精心设计的毛玻璃品牌胶囊 -->
    <div class="header-center" :class="{ 'is-win': !isMac }">
      <div class="brand-pill">
        <div class="brand-icon-box">
          <img :src="logo" class="logo-icon" />
        </div>
        <div class="brand-text">
          <span class="brand-title">PezMax</span>
          <span class="brand-divider"></span>
          <span class="brand-subtitle">拼图满绩</span>
        </div>
      </div>
    </div>
    <!-- lxq  滚动通知区域 (非登录注册页显示) -->
    <div class="header-notice" style="-webkit-app-region: no-drag;" v-if="!isAuthPage">
      <ScrollNotice :noticeList="scrollNoticeList || []" />
    </div>
    <!-- 右侧：功能区 + Win 风格窗口控制 -->
    <div class="header-right" style="-webkit-app-region: no-drag;">

      <!-- 用户操作区 -->
      <div class="user-actions" v-if="!isAuthPage">
        <!-- 全局上传进度指示器 -->
        <transition name="fade">
          <div 
            v-if="isUploading" 
            class="header-action upload-status-pill" 
            title="文件上传中，点击查看详情"
            @click="goToUpload"
          >
            <div class="upload-icon-box">
              <svg-icon icon-class="upload" class="uploading-icon" />
            </div>
            <div class="upload-progress-text">
              <span v-if="uploadProgress.total > 0">
                {{ uploadProgress.current }}/{{ uploadProgress.total }}
              </span>
              <span v-else>正在上传...</span>
            </div>
            <!-- 新增：悬浮显示的取消按钮 -->
            <div class="upload-cancel-btn" @click.stop="handleCancelUpload" title="取消上传">
              <el-icon><CircleClose /></el-icon>
            </div>
          </div>
        </transition>

        <div
          class="header-action notification-btn"
          title="消息通知"
          v-if="!isAuthPage && hasToken"
        >
          <NotificationCenter />
        </div>

        <div class="header-action avatar-btn" title="个人中心" @click="goUserCenter">
          <el-avatar :size="26" :src="displayAvatar" class="user-avatar" @error="handleAvatarError" />
        </div>
      </div>

      <!-- Mac 模式下，仅保留最简文字品牌标题放在头像右侧 -->
      <div class="header-center is-mac-right" v-if="isMac">
        <div class="brand-text mac-minimal-brand">
          <span class="brand-title">PezMax</span>
        </div>
      </div>

      <!-- Windows 风格窗口控制按钮 (仅在非 macOS 下显示) -->
      <div class="window-controls win-style" v-if="!isMac">
        <div class="win-btn-square" @click="handleWindow('minimize')" title="最小化">
          <svg viewBox="0 0 10 1" class="win-icon-svg"><rect width="10" height="1" fill="currentColor"/></svg>
        </div>
        <div class="win-btn-square" v-if="!isAuthPage" @click="handleWindow('maximize')" :title="isMaximized ? '还原' : '最大化'">
          <svg viewBox="0 0 10 10" class="win-icon-svg" v-if="!isMaximized"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor"/></svg>
          <svg viewBox="0 0 10 10" class="win-icon-svg" v-else>
            <!-- 还原窗口图标 (两个层叠的框) -->
            <path d="M2.5,2.5 h5 v5 h-5 z" fill="none" stroke="currentColor"/>
            <path d="M4.5,2.5 v-2 h5 v5 h-2" fill="none" stroke="currentColor"/>
          </svg>
        </div>
        <div class="win-btn-square close" @click="handleWindow('close')" title="关闭">
          <svg viewBox="0 0 10 10" class="win-icon-svg"><path d="M0,0 L10,10 M10,0 L0,10" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import logo from '@/assets/logo/logo.png'
import { Close, Minus, FullScreen, CircleClose } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScrollNotice from '@/components/ScrollNotice/index.vue'//lxq  引入 ScrollNotice 组件
import { getUserScrollNotifications } from '@/api/datum/notification'//lxq  获取滚动通知的 API
import NotificationCenter from '@/components/NotificationCenter/index.vue'//lxq  引入通知中心组件
import useUserStore from '@/store/modules/user'
import useUploadStore from '@/store/modules/upload'
import defAva from '@/assets/images/default_avatar.jpg'
import { normalizeAvatar } from '@/utils/avatar'
import { isPtmjAuthRoute } from '@/constants/ptmjAuth'
// 获取当前操作系统 (默认假设为 Windows, 如果能拿到 electronAPI 则判断)
const currentPlatform = window.electronAPI ? window.electronAPI.platform : 'win32'
//const currentPlatform = 'darwin'
const isMac = computed(() => currentPlatform === 'darwin')

const isMaximized = ref(false)
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const uploadStore = useUploadStore()

const isUploading = computed(() => uploadStore.isUploading)
const uploadProgress = computed(() => uploadStore.uploadProgress)

const avatarLoadFailed = ref(false)
const displayAvatar = computed(() => avatarLoadFailed.value ? defAva : normalizeAvatar(userStore.avatar))
const isAuthPage = computed(() => isPtmjAuthRoute(route.path))
const hasToken = computed(() => !!userStore.token)

const goToUpload = () => {
  if (route.path === '/index' || route.path === '/') {
    // 如果已经在首页，则通过 query 切换视图
    router.push({ path: route.path, query: { ...route.query, view: 'upload' } })
  } else {
    // 否则直接跳转到首页并带上上传视图参数
    router.push({ path: '/index', query: { view: 'upload' } })
  }
}

const handleCancelUpload = async () => {
  try {
    await ElMessageBox.confirm('确定要中断当前上传任务吗？', '提示', {
      confirmButtonText: '确定中断',
      cancelButtonText: '继续上传',
      type: 'warning',
      customClass: 'modern-message-box'
    })
    await uploadStore.cancelUpload()
    ElMessage.info('已请求中断上传')
  } catch (e) {
    // 用户取消中断操作
  }
}
watch(() => userStore.avatar, () => {
  avatarLoadFailed.value = false
})

const handleAvatarError = () => {
  avatarLoadFailed.value = true
  return true
}

const goUserCenter = () => {
  router.push('/datum/ptmj-user')
}

// lxq  滚动通知相关
const scrollNoticeList = ref([])
let scrollTimer = null

const loadScrollNotifications = async () => {
  if (!hasToken.value|| isAuthPage.value) return
  try {
    const res = await getUserScrollNotifications()
    if (res.code === 200 && res.data) {
      scrollNoticeList.value = res.data
    }
  } catch (error) {
    console.error('获取滚动通知失败:', error)
  }
}

const setupScrollNotifications = () => {
  if (scrollTimer) {
    clearInterval(scrollTimer)
    scrollTimer = null
  }

  if (!isAuthPage.value &&hasToken.value) {
    loadScrollNotifications()
    scrollTimer = setInterval(loadScrollNotifications, 60 * 1000)
  } else {
    scrollNoticeList.value = []
  }
}


// 监听路由变化，登录状态可能会改变
watch(() => route.path, () => {
  setupScrollNotifications()
})
// lxq 监听 token 变化，登录后重新拉取滚动通知
watch(hasToken, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    setupScrollNotifications()
  }
})

onMounted(() => {
  // 监听主进程发来的窗口状态变化
  if (window.electronAPI && window.electronAPI.onWindowMaximized) {
    window.electronAPI.onWindowMaximized((status) => {
      isMaximized.value = status
    })
  }
  setupScrollNotifications()
})

onUnmounted(() => {
  if (scrollTimer) clearInterval(scrollTimer)
})

// 窗口控制逻辑
const handleWindow = (action) => {
  if (window.electronAPI && window.electronAPI.windowControl) {
    window.electronAPI.windowControl(action)
  } else {
    console.log(`模拟窗口操作: ${action}`)
  }
}

</script>

<style scoped lang="scss">
.ide-header {
  height: 48px;
  background-color: var(--ide-header-bg, rgba(255,255,255,0.85));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  user-select: none;
  position: relative;
  z-index: 10; /* 继续调低 z-index，让它不再遮挡主要编辑区和其他常规组件 */
  /* 移除生硬边框，改用极其柔和的阴影，让它与下方内容无缝融合 */
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
}

/* lxq  滚动通知区域 */
.header-notice {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
  margin: 0 12px;
  z-index: 1;
  -webkit-app-region: no-drag;
}

/* ======== 左侧：Mac 风格窗口控制 ======== */
.header-left {
  display: flex;
  align-items: center;
  width: 220px;
  flex-shrink: 0;
}


.window-controls.mac-style {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px; /* 增加感应区域 */

  /* 只有当鼠标悬停在整个按钮组上时，内部的图标才显示 */
  &:hover .win-icon {
    opacity: 1;
    transform: scale(1);
  }
}

/* 全局上传进度指示器 */
.upload-status-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(64, 158, 255, 0.1);
  border: 1px solid rgba(64, 158, 255, 0.2);
  padding: 4px 10px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 8px;

  &:hover {
    background: rgba(64, 158, 255, 0.15);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
  }

  .upload-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    
    .uploading-icon {
      font-size: 14px;
      color: var(--ide-accent);
      animation: uploading-bounce 1.5s infinite ease-in-out;
    }
  }

  .upload-progress-text {
    font-size: 12px;
    font-weight: 600;
    color: var(--ide-accent);
    white-space: nowrap;
  }

  .upload-cancel-btn {
    width: 0;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f56c6c;
    font-size: 14px;
    transition: all 0.3s ease;
    opacity: 0;
  }

  &:hover {
    background: rgba(64, 158, 255, 0.15);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);

    .upload-cancel-btn {
      width: 20px;
      margin-left: 4px;
      opacity: 1;
    }
    
    .uploading-icon {
      animation-play-state: paused;
    }
  }
}

@keyframes uploading-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.win-btn {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, filter 0.3s ease;

  &.close { background-color: #ff5f56; border: 1px solid #e0443e; }
  &.minimize { background-color: #ffbd2e; border: 1px solid #dea123; }
  &.maximize { background-color: #27c93f; border: 1px solid #1aab29; }

  .win-icon {
    font-size: 8px;
    color: rgba(0, 0, 0, 0.6);
    font-weight: 900;
    opacity: 0;
    transition: opacity 0.2s ease, transform 0.2s ease;
    transform: scale(0.5);
  }

  &:hover {
    transform: scale(1.15);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    filter: brightness(1.1);

    .win-icon {
      opacity: 1;
      transform: scale(1);
    }
  }

  &:active {
    transform: scale(0.9);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    filter: brightness(0.9);
  }
}

/* ======== 中间/左侧：精心设计的毛玻璃品牌胶囊 ======== */
.header-center {
  position: absolute;
  left: 50%;
  width: 220px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  pointer-events: none; /* 让顶部的拖拽区域不会被标题挡住 */
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);

  &.is-win {
    position: relative;
    left: 0;
    transform: none;
    margin-right: auto; /* 推开右侧元素 */
  }

  &.is-mac-right {
    position: relative;
    left: 0;
    transform: none;
    margin-left: 16px;
  }
}

.brand-pill {
  display: flex;
  align-items: center;
  gap: 12px; /* 增加了一点图标和文字的间距 */
  padding: 5px 16px 5px 5px; /* 左边预留给图标的空间 */
  background: rgba(255, 255, 255, 0.7); /* 调高底色的不透明度，让底色更白一些，文字对比度更高 */
  backdrop-filter: blur(16px) saturate(200%); /* 增强毛玻璃强度 */
  -webkit-backdrop-filter: blur(16px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px; /* 胶囊形状 */
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08), /* 稍微增加一点阴影使其浮现感更强 */
    inset 0 2px 4px rgba(255, 255, 255, 0.8);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  pointer-events: auto; /* 胶囊本身可以响应鼠标事件 */

  &:hover {
    transform: translateY(-1px) scale(1.02);
    background: rgba(255, 255, 255, 0.8);
    box-shadow:
      0 6px 20px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.15),
      inset 0 2px 4px rgba(255, 255, 255, 0.8);

    .brand-icon-box {
      background: linear-gradient(135deg, var(--ide-accent) 0%, var(--ide-accent-hover, #66b1ff) 100%);
      box-shadow: 0 2px 8px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.4);
      .logo-icon { color: white; }
    }
  }
}

/* 品牌图标底托 */
.brand-icon-box {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e4eaf1 0%, #f5f7fa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;

  .logo-icon {
    width: 14px;
    height: 14px;
    object-fit: contain;
    transition: transform 0.3s ease;
  }
}

/* 品牌文字排版 */
.brand-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  &.mac-minimal-brand {
    padding: 4px 10px;
    background: transparent;
    border: none;
    box-shadow: none;
    .brand-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--ide-text-active);
      background: none;
      -webkit-background-clip: unset;
      -webkit-text-fill-color: unset;
      letter-spacing: 0.8px;
    }
  }

  .brand-title {
    font-size: 15px; /* 略微调大字号 */
    font-weight: 900; /* 加粗字体，使其更厚重清晰 */
    letter-spacing: 0.6px;
    background: linear-gradient(135deg, var(--ide-text-active, #1a1a1a) 0%, var(--ide-accent, #409EFF) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); /* 添加微弱的阴影增强对比度 */
  }

  .brand-divider {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: var(--ide-text-active, #333);
    opacity: 0.9;
  }

  .brand-subtitle {
    font-size: 13px; /* 略微调大副标题字号 */
    font-weight: 700; /* 加粗副标题 */
    color: var(--ide-text-active, #333); /* 改变颜色为更深的激活色，避免原本的 light 色下不清晰 */
    letter-spacing: 1.2px;
  }
}

/* 深色模式下的品牌标题适配 */
html.dark {
  .brand-pill {
    background: rgba(45, 45, 45, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 
      0 4px 16px rgba(0, 0, 0, 0.4),
      inset 0 1px 1px rgba(255, 255, 255, 0.05);
    
    &:hover {
      background: rgba(55, 55, 55, 0.8);
      box-shadow: 
        0 8px 24px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.2);
    }
  }

  .brand-icon-box {
    background: linear-gradient(135deg, #3a3a3a 0%, #222222 100%);
    border: 1px solid rgba(255, 255, 255, 0.05);
    
    .logo-icon {
      color: var(--ide-accent);
      filter: brightness(0.9);
    }
  }

  .brand-title {
    background: linear-gradient(135deg, #e0e0e0 0%, var(--ide-accent) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    opacity: 0.85; /* 降低一点不透明度，使其不那么刺眼 */
  }

  .brand-text.mac-minimal-brand .brand-title {
    background: none;
    -webkit-background-clip: unset;
    -webkit-text-fill-color: unset;
    color: rgba(255, 255, 255, 0.8);
  }

  .brand-subtitle {
    color: rgba(255, 255, 255, 0.65);
  }

  .brand-divider {
    background-color: rgba(255, 255, 255, 0.3);
  }
}

/* ======== 右侧：功能区 ======== */
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 250px;//lxq  调整右侧功能区大小
  justify-content: flex-end;
  flex-shrink: 0;
  pointer-events: auto !important; /* 强制确保可点击 */
  z-index: 10;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-right: 8px; /* 和最右侧控制按钮拉开一点距离 */
  pointer-events: auto !important; /* 强制确保可点击 */
  z-index: 10;
}

/* Windows 11 风格极简窗口控制按钮 */
.window-controls.win-style {
  display: flex;
  height: 100%;
  margin-right: -16px; /* 抵消 header 的 padding，让控制按钮贴边 */
  pointer-events: auto !important; /* 强制确保可点击 */
  z-index: 10;
}

.win-btn-square {
  width: 46px;
  height: 48px; /* 撑满整个 header 高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--ide-text-light, #606266);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;

  .win-icon-svg {
    width: 10px;
    height: 10px;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Fluent Design 悬停效果 */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.3s ease, height 0.3s ease, border-radius 0.3s ease;
    z-index: -1;
  }

  &:hover {
    color: var(--ide-text-active, #303133);

    &::before {
      width: 100%;
      height: 100%;
      border-radius: 0; /* 充满整个按钮 */
      background: rgba(0, 0, 0, 0.06);
    }

    .win-icon-svg {
      transform: scale(1.1);
    }
  }

  &:active {
    &::before {
      background: rgba(0, 0, 0, 0.1);
    }
    .win-icon-svg {
      transform: scale(0.9);
    }
  }

  /* Windows 关闭按钮悬停变红 */
  &.close {
    &:hover {
      color: white;
      &::before {
        background: #e81123;
      }
    }
    &:active {
      color: white;
      &::before {
        background: #f1707a;
      }
    }
  }
}

.header-action {
  cursor: pointer;
  color: var(--ide-text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  z-index: 10;
  pointer-events: auto !important;

  &.notification-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    font-size: 18px;
    padding: 2px;
    border: 2px solid transparent;

    &:hover {
      color: var(--ide-text-active);
      background: var(--ide-bg);
      transform: translateY(-2px);
      border-color: var(--ide-accent);
      box-shadow: 0 4px 12px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.2);
    }
  }

  &.avatar-btn {
    padding: 2px;
    border-radius: 50%;
    border: 2px solid transparent;

    &:hover {
      border-color: var(--ide-accent);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.2);
    }
  }

  .user-avatar {
    transition: transform 0.3s ease;
  }

  &:active .user-avatar {
    transform: scale(0.9);
  }
}

/* 修改 ElBadge 的红点样式，使其更精致 */
:deep(.badge-item) {
  .el-badge__content.is-fixed.is-dot {
    right: 4px;
    top: 4px;
    border: 1px solid var(--ide-header-bg); /* 与背景颜色一致的边框，制造挖空效果 */
  }
}
</style>
