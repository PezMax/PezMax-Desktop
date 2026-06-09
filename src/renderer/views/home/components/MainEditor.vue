<template>
  <div class="main-editor" :style="editorStyleVars">
    <!-- Tabs页 (带平滑过渡动画) -->
    <div class="editor-tabs" v-if="openTabs.length > 0">
      <transition-group name="tab-list" tag="div" class="tabs-wrapper">
        <div
          v-for="tab in openTabs"
          :key="tab.id"
          :class="['tab-item', { active: activeTab === tab.id }]"
          :title="tab.title"
          @click="$emit('change-tab', tab.id)"
          @contextmenu.prevent="copyToClipboard(tab.title)"
        >
          <svg-icon icon-class="documentation" class="tab-icon" />
          <span class="tab-title">{{ tab.title }}</span>
          <span class="tab-close" @click.stop="$emit('close-tab', tab.id)" title="关闭">
            &#10005;
          </span>
        </div>
      </transition-group>
    </div>

    <!-- 预览区 -->
    <div class="editor-content" v-if="openTabs.length > 0">
      <!-- 悬浮操作区：Notion 风格毛玻璃“药丸”岛 (按钮组) -->
      <div class="editor-floating-pill-group" v-if="currentFileObj && currentFileObj.type !== 'bookmark' && currentFileObj.originalData">
        <div v-if="currentFileObj.type !== 'bookmark'" class="pill-btn primary-action" @click="$emit('download-file', currentFileObj.originalData)" title="下载原件">
          <el-icon class="pill-icon"><Download /></el-icon>
          <span class="pill-text">下载原件</span>
        </div>
        <div
          class="pill-btn favorite-action"
          :class="{ active: currentFileIsFavorite, disabled: currentFileFavoriteLoading }"
          @click="handleToggleFavorite"
          :title="favoriteButtonTitle"
        >
          <el-icon class="pill-icon">
            <StarFilled v-if="currentFileIsFavorite" />
            <Star v-else />
          </el-icon>
          <span class="pill-text">{{ favoriteButtonText }}</span>
        </div>
        <div v-if="currentFileObj.type !== 'bookmark'" class="pill-btn" @click="$emit('open-info', null, currentFileObj.originalData, $event)" title="文件详情">
          <el-icon class="pill-icon"><Document /></el-icon>
          <span class="pill-text">文件详情</span>
        </div>
        <div v-if="currentFileObj.type !== 'bookmark'" class="pill-btn danger-action" @click="$emit('report-file', currentFileObj.originalData)" title="举报文件">
          <el-icon class="pill-icon"><WarningFilled /></el-icon>
          <span class="pill-text">举报文件</span>
        </div>
      </div>

      <div class="editor-floating-pill-group" v-if="currentFileObj && currentFileObj.type === 'bookmark' && currentFileObj.originalData">
        <div
          class="pill-btn favorite-action"
          :class="{ active: currentFileIsFavorite, disabled: currentFileFavoriteLoading }"
          @click="handleToggleFavorite"
          :title="favoriteButtonTitle"
        >
          <el-icon class="pill-icon">
            <StarFilled v-if="currentFileIsFavorite" />
            <Star v-else />
          </el-icon>
          <span class="pill-text">{{ favoriteButtonText }}</span>
        </div>
        <div class="pill-btn danger-action" @click="$emit('report-bookmark', currentFileObj.originalData)" title="举报书签">
          <el-icon class="pill-icon"><WarningFilled /></el-icon>
          <span class="pill-text">举报书签</span>
        </div>
      </div>

      <div class="preview-area">
        <template v-if="currentFileObj && currentFileObj.url">
          <!-- PDF 或 Word(已转PDF) 预览 -->
          <iframe
            v-if="['pdf', 'doc', 'docx'].includes(currentFileObj.fileExt)"
            :src="currentFileObj.url"
            width="100%"
            height="100%"
            frameborder="0"
            class="preview-iframe"
          ></iframe>
          <!-- 图片预览：支持鼠标滚轮缩放 + 拖拽平移，取消点击弹窗 -->
          <div
            v-else-if="['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(currentFileObj.fileExt)"
            class="image-preview-container"
            @wheel.prevent="onImageWheel"
            @mousedown="onImageDragStart"
            @mousemove="onImageDragMove"
            @mouseup="onImageDragEnd"
            @mouseleave="onImageDragEnd"
            @dblclick="resetImageTransform"
          >
            <img
              :src="normalizeFileUrl(currentFileObj.url)"
              :style="imageTransformStyle"
              :draggable="false"
              class="preview-image-zoomable"
              alt="preview"
            />
            <!-- 缩放提示和重置按钮 -->
            <div class="image-zoom-toolbar" v-if="imageScale !== 1">
              <span class="zoom-percent">{{ Math.round(imageScale * 100) }}%</span>
              <button class="zoom-reset-btn" @click="resetImageTransform" title="重置缩放">↺</button>
            </div>
          </div>
          
          <!-- 文本 / Markdown 预览 -->
          <div 
            v-else-if="['txt', 'md'].includes(currentFileObj.fileExt)"
            class="text-preview-container"
            v-loading="isLoadingText"
            element-loading-text="正在拉取内容..."
            @scroll="onTextScroll"
          >
            <!-- 侧边导航目录 (仅 MD 显示) -->
            <div class="md-sidebar" v-if="currentFileObj.fileExt === 'md' && tocList.length > 0">
              <div class="toc-header">
                文章目录
              </div>
              <div class="toc-list">
                <div 
                  v-for="item in tocList" 
                  :key="item.id"
                  :class="['toc-item', `toc-level-${item.level}`, { active: activeHeading === item.id }]"
                  @click="scrollToHeading(item.id)"
                  :title="item.text"
                >
                  <span class="toc-text">{{ item.text }}</span>
                </div>
              </div>
            </div>

            <div class="text-content-wrapper">
              <!-- Markdown 渲染 -->
              <div 
                v-if="currentFileObj.fileExt === 'md'" 
                class="markdown-body" 
                v-html="renderedTextContent"
              ></div>
              <!-- 普通文本渲染 -->
              <pre v-else class="plain-text-body">{{ renderedTextContent }}</pre>
            </div>
          </div>
          <!-- 外部书签 (URL) 预览 -->
          <div 
            v-else-if="currentFileObj.type === 'bookmark'"
            class="bookmark-preview-container"
          >
            <!-- Dynamic blurred background based on cover -->
            <div 
              class="bookmark-ambient-bg" 
              v-show="currentFileObj.cover_image || currentFileObj.coverImage"
              :style="{ backgroundImage: `url(${normalizeFileUrl(currentFileObj.cover_image || currentFileObj.coverImage || '')})` }"
            ></div>
            
            <div class="bookmark-bento-layout">
              <!-- Hero Section -->
              <div class="bento-hero fade-in-up" style="animation-delay: 0.1s">
                <div class="hero-cover">
                  <img v-if="currentFileObj.cover_image || currentFileObj.coverImage" :src="normalizeFileUrl(currentFileObj.cover_image || currentFileObj.coverImage)" @error="$event.target.style.display='none'" />
                  <div v-else class="hero-cover-placeholder">
                    <el-icon><Link /></el-icon>
                  </div>
                </div>
                <div class="hero-content">
                  <div class="hero-meta">
                    <span class="resource-badge" :class="'type-' + (currentFileObj.resource_type || currentFileObj.resourceType || 'other')">
                      {{ getResourceTypeName(currentFileObj.resource_type || currentFileObj.resourceType) }}
                    </span>
                    <span class="hero-time">{{ currentFileObj.create_time || '刚刚' }}</span>
                    <!-- 书签状态标记 -->
                    <span v-if="bookmarkStatusInfo.text" class="status-badge" :class="bookmarkStatusInfo.class">
                      {{ bookmarkStatusInfo.text }}
                    </span>
                  </div>
                  <h1 class="hero-title" :title="currentFileObj.title">{{ currentFileObj.title || '未命名书签' }}</h1>
                  <a :href="currentFileObj.url" target="_blank" class="hero-url" title="点击在外部浏览器打开">
                    <el-icon><Link /></el-icon>
                    <span class="url-text">{{ currentFileObj.url }}</span>
                  </a>
                  <div class="hero-actions">
                    <button class="apple-btn primary" @click="openExternalUrl(currentFileObj.url)">
                      <el-icon><Position /></el-icon>
                      <span>立即前往</span>
                    </button>
                    <button class="apple-btn secondary" @click="copyToClipboard(currentFileObj.url)">
                      <el-icon><CopyDocument /></el-icon>
                      <span>复制链接</span>
                    </button>
                    <button
                      class="apple-btn secondary bookmark-favorite-btn"
                      :class="{ active: currentFileIsFavorite }"
                      :disabled="currentFileFavoriteLoading"
                      :title="favoriteButtonTitle"
                      @click="handleToggleFavorite"
                    >
                      <el-icon>
                        <StarFilled v-if="currentFileIsFavorite" />
                        <Star v-else />
                      </el-icon>
                      <span>{{ currentFileFavoriteLoading ? '处理中...' : favoriteButtonText }}</span>
                    </button>
                    <button
                      class="apple-btn secondary bookmark-report-btn"
                      @click="$emit('report-bookmark', currentFileObj.originalData)"
                      title="举报该书签"
                    >
                      <el-icon><WarningFilled /></el-icon>
                      <span>举报</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Details Grid -->
              <div class="bento-grid">
                <!-- Description -->
                <div class="bento-card col-span-2 fade-in-up" style="animation-delay: 0.2s">
                  <div class="card-header">
                    <el-icon><Document /></el-icon>
                    <span>内容摘要</span>
                  </div>
                  <div class="card-body">
                    <p class="desc-text">{{ currentFileObj.description || '暂无摘要信息，该资源可能是一个直接的链接。' }}</p>
                  </div>
                </div>

                <!-- Collection -->
                <div class="bento-card fade-in-up" style="animation-delay: 0.3s">
                  <div class="card-header">
                    <el-icon><Folder /></el-icon>
                    <span>所属专栏</span>
                  </div>
                  <div class="card-body flex-center">
                    <span class="highlight-text">{{ currentFileObj.collection || '单篇资源' }}</span>
                  </div>
                </div>

                <!-- Subject -->
                <div class="bento-card fade-in-up" style="animation-delay: 0.35s">
                  <div class="card-header">
                    <el-icon><Collection /></el-icon>
                    <span>关联科目</span>
                  </div>
                  <div class="card-body flex-center">
                    <span class="highlight-text">{{ currentFileObj.subject || '未分类' }}</span>
                  </div>
                </div>

                <div class="bento-card col-span-2 fade-in-up uploader-card" style="animation-delay: 0.4s">
                  <div class="card-header">
                    <el-icon><User /></el-icon>
                    <span>上传者</span>
                  </div>
                  <div class="card-body">
                    <div class="uploader-row">
                      <div class="uploader-avatar">
                        <img v-if="contributorInfo?.avatar && !avatarLoadError" :src="normalizeAvatar(contributorInfo.avatar)" alt="avatar" class="avatar-img" @error="avatarLoadError = true" />
                        <span v-else>{{ bookmarkUploaderInitial }}</span>
                      </div>
                      <div class="uploader-meta">
                        <div class="uploader-name">@{{ bookmarkUploaderName || '匿名英雄' }}</div>
                        <div class="uploader-sub">{{ currentFileObj.create_time || currentFileObj.createTime || '-' }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Remark -->
                <div class="bento-card col-span-2 fade-in-up" style="animation-delay: 0.45s" v-if="currentFileObj.remark">
                  <div class="card-header">
                    <el-icon><EditPen /></el-icon>
                    <span>我的备注</span>
                  </div>
                  <div class="card-body">
                    <p class="remark-text">{{ currentFileObj.remark }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 暂不支持预览的格式 -->
          <div class="preview-placeholder" v-else>
            <svg-icon icon-class="documentation" class="large-icon" />
            <h2>{{ currentFileObj.title }}</h2>
            <p class="preview-desc">该文件格式暂不支持在线预览，或未能成功提取后缀，请点击右下角下载查看</p>
            <div style="margin-top: 12px; font-size: 12px; color: #999; word-break: break-all;">
              <p>调试信息: </p>
              <p>后缀: {{ currentFileObj.fileExt }}</p>
              <p>URL: {{ currentFileObj.url }}</p>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="preview-placeholder">
            <svg-icon icon-class="documentation" class="large-icon" />
            <h2>{{ currentFileObj?.title || '未选择文件' }}</h2>
            <p class="preview-desc">未获取到文件的预览地址，或文件已损坏</p>
            <div style="margin-top: 12px; font-size: 12px; color: #999; word-break: break-all;" v-if="currentFileObj">
              <p>调试信息: URL 字段为空或未返回</p>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="editor-empty" v-else-if="showEmptyEditorTip">
      <img :src="logo" class="empty-icon" />
      <p>请在左侧资源管理器中选择试题查看</p>
      <div class="shortcut-tips">
        <p>打开设置: <kbd>Ctrl</kbd> + <kbd>,</kbd></p>
        <p>关闭文件: <kbd>Ctrl</kbd> + <kbd>W</kbd></p>
      </div>
    </div>

    <el-dialog v-model="reportDialogVisible" title="举报文件" width="520px" append-to-body :z-index="12000">
      <el-form ref="reportFormRef" :model="reportForm" :rules="reportRules" label-width="88px">
        <el-form-item label="文件名称">
          <el-input :model-value="currentFile" disabled />
        </el-form-item>
        <el-form-item label="举报原因" prop="reason">
          <el-input
            v-model="reportForm.reason"
            type="textarea"
            :rows="4"
            maxlength="200"
            show-word-limit
            placeholder="请填写举报原因"
          />
        </el-form-item>
        <el-form-item label="补充说明" prop="remark">
          <el-input
            v-model="reportForm.remark"
            type="textarea"
            :rows="3"
            maxlength="300"
            show-word-limit
            placeholder="可选，填写更多信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取 消</el-button>
        <el-button type="danger" :loading="submittingReport" @click="submitReport">确认举报</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, reactive, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import logo from '@/assets/logo/logo.png'
import { marked } from 'marked' // 引入 marked
import { normalizeAvatar } from '@/utils/avatar' // fxy 引入头像处理工具
import { getUser } from '@/api/datum/user' // 引入获取平台用户信息接口
import { normalizeFileUrl } from '@/utils/url'
/* 引入 Element Plus 图标 */
import { Close, Download, Document, Link, TopRight, Position, CopyDocument, Collection, EditPen, Folder, User, WarningFilled, Star, StarFilled } from '@element-plus/icons-vue'
import useUserStore from '@/store/modules/user'
import { addReportToPtmjReport } from '@/api/datum/report'
import { resolveEditorVisibilityValue } from '@/utils/ideAppearance'

const showEmptyEditorTip = ref(true)
const editorVisibility = ref(72)

const editorStyleVars = computed(() => {
  const visibilityRatio = Math.min(100, Math.max(0, editorVisibility.value)) / 100
  const localEditorOpacity = (0.82 - visibilityRatio * 0.72).toFixed(2)
  const localEditorBlur = `${Math.round((1 - visibilityRatio) * 18)}px`
  const surfaceOpacity = Math.min(0.92, Math.max(0.16, Number(localEditorOpacity) + 0.16)).toFixed(2)

  return {
    '--main-editor-local-bg': `rgba(var(--ide-bg-rgb), ${localEditorOpacity})`,
    '--main-editor-local-surface-bg': `rgba(var(--ide-bg-rgb), ${surfaceOpacity})`,
    '--main-editor-local-blur': localEditorBlur
  }
})

// 监听设置更新事件，实时获取空状态提示开关配置
const handleSettingsUpdate = (e) => {
  const settings = e.detail
  if (settings && typeof settings.showEmptyEditorTip !== 'undefined') {
    showEmptyEditorTip.value = settings.showEmptyEditorTip
  }
  if (settings) {
    editorVisibility.value = resolveEditorVisibilityValue(settings)
  }
}

onMounted(async () => {
  // 初始化时从 electronAPI 读取一次设置
  if (window.electronAPI && window.electronAPI.getSettings) {
    const settings = await window.electronAPI.getSettings()
    if (settings && typeof settings.showEmptyEditorTip !== 'undefined') {
      showEmptyEditorTip.value = settings.showEmptyEditorTip
    }
    editorVisibility.value = resolveEditorVisibilityValue(settings)
  }
  window.addEventListener('settings-updated', handleSettingsUpdate)
})

onUnmounted(() => {
  window.removeEventListener('settings-updated', handleSettingsUpdate)
})

const props = defineProps({
  openTabs: {
    type: Array,
    default: () => []
  },
  activeTab: String,
  favoriteFileIds: {
    type: Array,
    default: () => []
  },
  favoriteBookmarkIds: {
    type: Array,
    default: () => []
  },
  favoriteLoadingIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['change-tab', 'close-tab', 'open-info', 'download-file', 'report-file', 'report-bookmark', 'toggle-favorite'])
const userStore = useUserStore()

const reportDialogVisible = ref(false)
const submittingReport = ref(false)
const reportFormRef = ref()
const reportForm = reactive({
  fileId: '',
  userId: '',
  reason: '',
  remark: ''
})
const reportRules = {
  reason: [
    { required: true, message: '请输入举报原因', trigger: 'blur' }
  ]
}

const currentFileObj = computed(() => {
  if (!props.openTabs || props.openTabs.length === 0) return null
  return props.openTabs.find(t => t.id === props.activeTab)
})

const currentIsBookmark = computed(() => currentFileObj.value?.type === 'bookmark')

const getBookmarkId = (file) => {
  const source = file?.originalData || file
  const id = source?.rawId ?? source?.bookmarkId ?? source?.id
  if (id === undefined || id === null || id === '') return ''
  return `${id}`.replace(/^bookmark-/, '').replace(/^item-/, '')
}

const getFileId = (file) => {
  const source = file?.originalData || file
  const id = source?.fileId ?? source?.fileInfo?.fileId ?? source?.ptmjFile?.fileId ?? source?.id
  return id === undefined || id === null || id === '' ? '' : String(id)
}

const currentFileId = computed(() => getFileId(currentFileObj.value))
const currentBookmarkId = computed(() => getBookmarkId(currentFileObj.value))

const currentFileIsFavorite = computed(() => {
  if (currentIsBookmark.value) {
    return Boolean(currentBookmarkId.value && props.favoriteBookmarkIds.map(String).includes(currentBookmarkId.value))
  }
  return Boolean(currentFileId.value && props.favoriteFileIds.map(String).includes(currentFileId.value))
})

const currentFileFavoriteLoading = computed(() => {
  const loadingId = currentIsBookmark.value ? `bookmark-${currentBookmarkId.value}` : currentFileId.value
  return Boolean(loadingId && props.favoriteLoadingIds.map(String).includes(loadingId))
})

const favoriteButtonText = computed(() => {
  return currentFileIsFavorite.value ? '已收藏' : '收藏'
})

const favoriteButtonTitle = computed(() => {
  if (currentIsBookmark.value) return currentFileIsFavorite.value ? '取消收藏书签' : '收藏书签'
  return currentFileIsFavorite.value ? '取消收藏' : '收藏文件'
})

const handleToggleFavorite = () => {
  if (!currentFileObj.value || currentFileFavoriteLoading.value) return
  emit('toggle-favorite', currentFileObj.value.originalData || currentFileObj.value)
}

const bookmarkUploaderName = computed(() => {
  const obj = currentFileObj.value?.originalData || currentFileObj.value || {}
  const user = contributorInfo.value || {}
  return user.nickName || user.nickname || obj.createBy || obj.create_by || obj.uploader || obj.uploaderName || obj.nickName || obj.userName || obj.username || ''
})

const avatarLoadError = ref(false)
const contributorInfo = ref(null)

watch(() => currentFileObj.value, async (newVal) => {
  avatarLoadError.value = false
  contributorInfo.value = null
  
  if (!newVal) return
  
  const f = newVal.originalData || newVal
  // 尝试从不同字段提取用户 ID
  const userId = f.userId || f.createByUserId || f.uploaderId || f.ptmjUser?.userId || f.create_by_user_id || f.createBy
  
  if (userId && userId !== 'undefined' && userId !== 'null') {
    // 如果 userId 看起来像个名字而不是 ID（比如没有数字），可能需要跳过
    // 但通常 ID 可能是字符串形式的数字
    try {
      const res = await getUser(userId)
      if (res.code === 200) {
        contributorInfo.value = res.data?.user || res.data
      } else {
        console.warn('获取上传者信息接口返回异常:', res)
      }
    } catch (e) {
      console.error('获取上传者信息请求失败:', e)
    }
  }
}, { immediate: true })

const bookmarkUploaderInitial = computed(() => {
  const name = bookmarkUploaderName.value || ''
  return name ? String(name).charAt(0).toUpperCase() : '?'
})

// 获取资源类型中文名称
const getResourceTypeName = (type) => {
  const map = {
    course: '网课/视频',
    blog: '博客/文章',
    paper: '学术/论文',
    tool: '工具/开源',
    entertainment: '娱乐/音乐/资源'
  }
  return map[type] || type || '未分类'
}

// 解析书签状态
const bookmarkStatusInfo = computed(() => {
  const status = currentFileObj.value?.status
  if (status === undefined || status === null) return { text: '', class: '' }
  
  const numStatus = Number(status)
  if (numStatus === 0) {
    return { text: '未审核', class: 'status-pending' }
  } else if (numStatus === 1) {
    return { text: '审核通过', class: 'status-approved' }
  } else if (numStatus === 3) {
    return { text: '被举报', class: 'status-reported' }
  }
  return { text: '', class: '' }
})

// === 文本/MD 预览逻辑 ===
const textContent = ref('')
const isLoadingText = ref(false)
const tocList = ref([])
const activeHeading = ref('')
let isScrolling = false // 防止点击导航触发双重高亮

const loadTextFile = async (url) => {
  if (!url) return
  isLoadingText.value = true
  textContent.value = ''
  tocList.value = []
  activeHeading.value = ''
  
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('网络请求失败')
    const text = await response.text()
    textContent.value = text
  } catch (error) {
    console.error('加载文本文件失败:', error)
    textContent.value = '加载失败: ' + error.message
  } finally {
    isLoadingText.value = false
  }
}

// 计算当前渲染的 MD/TXT 内容
const renderedTextContent = computed(() => {
  if (!currentFileObj.value || !textContent.value) return ''
  if (currentFileObj.value.fileExt === 'md') {
    return marked.parse(textContent.value)
  }
  return textContent.value
})

// 监听当前激活标签的变化，如果是文本类型则去抓取数据
watch(
  () => props.activeTab,
  (newTabId) => {
    const tab = props.openTabs.find(t => t.id === newTabId)
    if (tab && ['txt', 'md'].includes(tab.fileExt)) {
      loadTextFile(tab.url)
    }
  },
  { immediate: true }
)

// 提取 MD 目录逻辑
watch(renderedTextContent, async (newVal) => {
  tocList.value = []
  activeHeading.value = ''
  
  if (!newVal || !currentFileObj.value || currentFileObj.value.fileExt !== 'md') return
  
  await nextTick()
  
  const container = document.querySelector('.markdown-body')
  if (!container) return
  
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const list = []
  
  headings.forEach((heading, index) => {
    // 赋予唯一 ID 以供跳转
    if (!heading.id) {
      heading.id = `md-heading-${index}`
    }
    list.push({
      id: heading.id,
      level: parseInt(heading.tagName.charAt(1)),
      text: heading.innerText
    })
  })
  
  tocList.value = list
  if (list.length > 0) {
    activeHeading.value = list[0].id
  }
})

// 目录点击跳转
const scrollToHeading = (id) => {
  if (isScrolling) return
  
  const el = document.getElementById(id)
  const container = document.querySelector('.text-preview-container')
  if (el && container) {
    isScrolling = true
    activeHeading.value = id
    
    const elRect = el.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    // 预留顶部距离 40px
    const targetScrollTop = container.scrollTop + elRect.top - containerRect.top - 40
    
    container.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    })
    
    // 预估滚动时间，防止与滚动监听冲突
    setTimeout(() => {
      isScrolling = false
    }, 600)
  }
}

// 容器滚动时更新左侧目录高亮
const onTextScroll = (e) => {
  if (tocList.value.length === 0 || isScrolling) return
  
  const container = e.target
  const containerRect = container.getBoundingClientRect()
  
  let currentActiveId = tocList.value[0]?.id
  
  for (const item of tocList.value) {
    const el = document.getElementById(item.id)
    if (el) {
      const rect = el.getBoundingClientRect()
      // 当标题接近可视区域顶部时触发高亮
      if (rect.top - containerRect.top <= 100) {
        currentActiveId = item.id
      } else {
        break // 因有序遍历，其后的元素肯定更往下
      }
    }
  }
  
  activeHeading.value = currentActiveId
}

const openReportDialog = () => {
  const currentTab = props.openTabs.find(t => t.id === props.activeTab)
  const fallbackTab = props.openTabs.length > 0 ? props.openTabs[0] : null
  const selectedTab = currentTab || fallbackTab

  reportForm.fileId = selectedTab?.id != null ? String(selectedTab.id) : ''
  reportForm.userId = userStore.id ? String(userStore.id) : ''
  reportForm.reason = ''
  reportForm.remark = ''
  reportDialogVisible.value = true

  if (!selectedTab) {
    ElMessage.warning('未定位到当前文件，请确认已打开文件后再提交举报')
  }
}

const submitReport = async () => {
  if (!reportFormRef.value) return

  try {
    await reportFormRef.value.validate()
  } catch {
    return
  }

  if (!reportForm.userId) {
    ElMessage.warning('未获取到当前用户信息，请重新登录后再试')
    return
  }

  if (!reportForm.fileId) {
    ElMessage.warning('未获取到文件标识，请重新选择文件后再试')
    return
  }

  submittingReport.value = true
  try {
    await addReportToPtmjReport({
      fileId: reportForm.fileId,
      userId: reportForm.userId,
      reason: reportForm.reason,
      remark: reportForm.remark
    })
    ElMessage.success('举报已提交')
    reportDialogVisible.value = false
  } catch (err) {
    console.error('举报提交失败:', err)
    ElMessage.error(err?.message || '举报提交失败，请稍后重试')
  } finally {
    submittingReport.value = false
  }
}

// 右键复制文件名
const copyToClipboard = async (text) => {
  try {
    // 首先尝试使用较新的 navigator.clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      ElMessage({
        message: `已成功复制文件名: ${text}`,
        type: 'success',
        duration: 2000,
        grouping: true // 防止重复点击弹出多个
      })
      return
    }

    // 降级处理：传统的 execCommand 方式
    const input = document.createElement('input')
    input.setAttribute('value', text)
    // 防止页面滚动和闪烁
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(input)

    if (successful) {
      ElMessage({
        message: `已成功复制文件名: ${text}`,
        type: 'success',
        duration: 2000,
        grouping: true
      })
    } else {
      throw new Error('复制失败')
    }
  } catch (err) {
    console.error('复制失败:', err)
    ElMessage.warning('复制失败，您的浏览器可能不支持自动复制')
  }
}

// 在外部浏览器打开链接
const openExternalUrl = (url) => {
  if (url) {
    window.open(url, '_blank')
  }
}

// === 图片缩放与拖拽 ===
const imageScale = ref(1)
const imageTranslateX = ref(0)
const imageTranslateY = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragTranslateStartX = ref(0)
const dragTranslateStartY = ref(0)

const MIN_SCALE = 0.2
const MAX_SCALE = 5

const imageTransformStyle = computed(() => ({
  transform: `translate(${imageTranslateX.value}px, ${imageTranslateY.value}px) scale(${imageScale.value})`,
  transformOrigin: 'center center',
  cursor: isDragging.value ? 'grabbing' : (imageScale.value > 1 ? 'grab' : 'default'),
  transition: isDragging.value ? 'none' : 'transform 0.15s ease-out'
}))

// 监听文件切换时重置图片变换
watch(() => props.activeTab, () => {
  resetImageTransform()
})

function clampScale(s) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s))
}

function onImageWheel(e) {
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newScale = clampScale(imageScale.value + delta)
  imageScale.value = newScale
  // 缩放到 1 以下时重置平移
  if (newScale <= 1) {
    imageTranslateX.value = 0
    imageTranslateY.value = 0
  }
}

function onImageDragStart(e) {
  if (imageScale.value <= 1) return // 原始大小时无需拖拽，用原生滚动即可
  e.preventDefault()
  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  dragTranslateStartX.value = imageTranslateX.value
  dragTranslateStartY.value = imageTranslateY.value
}

function onImageDragMove(e) {
  if (!isDragging.value) return
  const dx = e.clientX - dragStartX.value
  const dy = e.clientY - dragStartY.value
  imageTranslateX.value = dragTranslateStartX.value + dx
  imageTranslateY.value = dragTranslateStartY.value + dy
}

function onImageDragEnd() {
  isDragging.value = false
}

function resetImageTransform() {
  imageScale.value = 1
  imageTranslateX.value = 0
  imageTranslateY.value = 0
  isDragging.value = false
}
</script>

<style scoped lang="scss">
.main-editor { 
  flex: 1; 
  background-color: var(--main-editor-local-bg, var(--ide-editor-bg)); 
  /* 使用 CSS 变量控制主编辑区毛玻璃效果，在无背景图或设置为 0 时不生效 */
  backdrop-filter: blur(var(--main-editor-local-blur, var(--ide-editor-blur, 0px)));
  -webkit-backdrop-filter: blur(var(--main-editor-local-blur, var(--ide-editor-blur, 0px)));
  display: flex; 
  flex-direction: column; 
  overflow: hidden; 
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--ide-border);
  /* 添加丝滑过渡效果 */
  transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
              backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              -webkit-backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* 性能优化：提示浏览器该属性会变化 */
  will-change: backdrop-filter, background-color;
}

.editor-tabs {
  height: 40px;
  background-color: var(--ide-bg);
  display: flex;
  align-items: flex-end;
  padding: 0 10px;
  overflow-x: auto;
  border-bottom: 1px solid var(--ide-border);
  flex-shrink: 0;

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background-color: var(--ide-border-hover); }
}

.tabs-wrapper {
  display: flex;
  height: 100%;
  align-items: flex-end;
}

.tab-item {
  height: 32px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: transparent;
  color: var(--ide-text-light);
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  min-width: 120px;
  max-width: 200px;

  /* 添加底边框动画特效 */
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: transparent;
    transition: background-color 0.3s ease;
  }

  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
    color: var(--ide-text);
  }

  &.active {
    background-color: var(--ide-editor-bg);
    color: var(--ide-text-active);
    font-weight: 500;

    &::after {
      background-color: var(--ide-accent);
    }
  }

  .tab-icon { font-size: 14px; color: var(--ide-accent); }

  .tab-title {
    font-size: 13px;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tab-close {
    opacity: 1 !important; /* 强制常驻显示 */
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
    color: var(--ide-text-light); /* 默认淡色 */
    font-size: 12px;
    font-weight: 800;

    &:hover {
      background-color: #f56c6c !important;
      color: #ffffff !important;
    }
  }

  &:hover .tab-close, &.active .tab-close {
    color: var(--ide-text); /* 选中或 hover 时加深叉号颜色 */
  }
}

/* ======== Tabs 标签页动画 (Vue Transition Group) ======== */
.tab-list-move,
.tab-list-enter-active,
.tab-list-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.tab-list-enter-from {
  opacity: 0;
  transform: translateY(10px) scaleY(0.9);
}

.tab-list-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.9);
}

/* 确保离开的元素被从文档流中移除，以便其他元素能够平滑移动 */
.tab-list-leave-active {
  position: absolute;
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  /* 移除重复的背景色和毛玻璃，由父级 .main-editor 统一控制 */
  background-color: transparent;
}

/* ======== 悬浮毛玻璃“药丸”岛 按钮组 (Notion 风格) ======== */
.editor-floating-pill-group {
  position: absolute;
  bottom: 32px;
  right: 32px;
  z-index: 100;
  display: flex;
  gap: 12px; /* 两个药丸之间的间距 */
  flex-direction: row-reverse; /* 让最右侧的按钮先显示在 HTML 结构中，如果需要调整顺序的话。当前直接靠右对齐即可 */
  
  .pill-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 48px;
    width: 48px; /* 默认是一个圆形 */
    border-radius: 24px;
    background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.05); /* 极度透明的主题色背景 */
    backdrop-filter: blur(12px) saturate(150%);
    -webkit-backdrop-filter: blur(12px) saturate(150%);
    /* 荧光主题色轮廓 */
    border: 1px solid rgba(var(--ide-accent-rgb, 64, 158, 255), 0.8);
    box-shadow: 
      0 0 12px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.3), /* 外部荧光光晕 */
      inset 0 0 8px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.2); /* 内部微弱光晕 */
    color: var(--ide-text-active);
    cursor: pointer;
    overflow: hidden;
    transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), padding 0.4s ease, background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease, transform 0.2s ease;
    
    html.dark & {
      background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.08);
      border-color: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.9);
      box-shadow: 
        0 0 16px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.4),
        inset 0 0 8px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.2);
    }
    
    .pill-icon {
      font-size: 20px;
      flex-shrink: 0;
      color: var(--ide-accent); /* 图标使用主题强调色 */
      filter: drop-shadow(0 0 4px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.6)); /* 图标添加荧光 */
      transition: color 0.3s ease, filter 0.3s ease;
      
      html.dark & {
        color: var(--ide-accent);
        filter: drop-shadow(0 0 6px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.8));
      }
    }
    
    .pill-text {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      opacity: 0;
      width: 0;
      margin-left: 0;
      transform: translateX(10px);
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    
    /* 悬停状态：向左展开成胶囊形状 */
    &:hover {
      width: 130px; /* 展开后的宽度 */
      padding: 0 16px;
      background: rgba(255, 255, 255, 0.85);
      border-color: rgba(255, 255, 255, 0.8);
      box-shadow: 
        0 8px 24px rgba(0, 0, 0, 0.08),
        0 2px 8px rgba(0, 0, 0, 0.04);
      
      .pill-icon {
        color: var(--ide-accent);
      }
      
      .pill-text {
        opacity: 1;
        width: auto;
        margin-left: 8px;
        transform: translateX(0);
        color: var(--ide-text-active);
      }
    }
    
    /* 下载按钮的主色调特殊处理 */
    &.primary-action:hover {
      background: var(--ide-accent);
      border-color: var(--ide-accent-hover, #66b1ff);
      color: #ffffff;
      box-shadow: 
        0 8px 24px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.3),
        0 2px 8px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.15);
        
      .pill-icon, .pill-text {
        color: #ffffff;
      }
    }

    &.favorite-action {
      &.disabled {
        pointer-events: none;
        opacity: 0.64;
      }
    }

    /* 举报按钮的危险色调特殊处理 */
    &.danger-action {
      .pill-icon {
        color: #f56c6c;
        filter: drop-shadow(0 0 4px rgba(245, 108, 108, 0.6));
      }
      html.dark & .pill-icon {
        filter: drop-shadow(0 0 6px rgba(245, 108, 108, 0.8));
      }
      
      &:hover {
        background: #f56c6c;
        border-color: #f89898;
        color: #ffffff;
        box-shadow: 
          0 8px 24px rgba(245, 108, 108, 0.3),
          0 2px 8px rgba(245, 108, 108, 0.15);
          
        .pill-icon, .pill-text {
          color: #ffffff;
        }
      }
    }
    
    /* 点击按压回弹效果 */
    &:active {
      transform: scale(0.95);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }
}

.preview-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  /* 移除重复的背景色和毛玻璃，由父级 .main-editor 统一控制 */
  background-color: transparent; 
  background-image: radial-gradient(var(--ide-border) 1px, transparent 1px);    
  background-size: 20px 20px;
  overflow: hidden; /* 防止拖拽超出区域 */
}

.image-preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
}

/* --- 文本预览相关样式 --- */
.text-preview-container {
  width: 100%;
  height: 100%;
  /* 移除重复的背景色和毛玻璃 */
  background: transparent;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 40px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 32px;
  color: var(--ide-text);
  position: absolute;
  top: 0;
  left: 0;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--ide-border-hover);
    border-radius: 4px;
  }
}

/* 侧边栏导航 */
.md-sidebar {
  position: sticky;
  top: 0;
  width: 260px;
  flex-shrink: 0;
  max-height: calc(100vh - 160px);
  overflow-y: auto;
  background: var(--main-editor-local-surface-bg, var(--ide-editor-surface-bg, var(--ide-bg)));
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--ide-border);
  backdrop-filter: blur(var(--main-editor-local-blur, var(--ide-editor-blur, 0px)));
  -webkit-backdrop-filter: blur(var(--main-editor-local-blur, var(--ide-editor-blur, 0px)));
  animation: slideUpFade 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background-color: var(--ide-border-hover); border-radius: 2px; }
}

.toc-header {
  font-size: 16px;
  font-weight: 600;
  color: var(--ide-text-active);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ide-border);
  display: flex;
  align-items: center;
}

.toc-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 4px;
    width: 1px;
    background-color: var(--ide-border);
    z-index: 0;
  }
}

.toc-item {
  font-size: 13px;
  color: var(--ide-text-light);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  
  &::before {
    content: '';
    position: absolute;
    left: 2px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background-color: var(--ide-border-hover);
    transition: all 0.2s ease;
  }
  
  &:hover {
    background-color: var(--ide-editor-bg);
    color: var(--ide-text);
    &::before { background-color: var(--ide-text-light); }
  }
  
  &.active {
    color: var(--ide-accent);
    background-color: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.08);
    font-weight: 600;
    
    &::before {
      background-color: var(--ide-accent);
      box-shadow: 0 0 8px var(--ide-accent);
      transform: scale(1.2);
    }
  }
}

.toc-level-1 { margin-left: 0; font-weight: 500; margin-top: 8px; color: var(--ide-text); }
.toc-level-2 { margin-left: 12px; }
.toc-level-3 { margin-left: 24px; font-size: 12px; }
.toc-level-4 { margin-left: 36px; font-size: 12px; }
.toc-level-5 { margin-left: 48px; font-size: 12px; }
.toc-level-6 { margin-left: 60px; font-size: 12px; }

.text-content-wrapper {
  width: 100%;
  max-width: 860px;
  height: max-content;
  background: var(--main-editor-local-surface-bg, var(--ide-editor-surface-bg, var(--ide-bg)));
  padding: 40px 60px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--ide-border);
  backdrop-filter: blur(var(--main-editor-local-blur, var(--ide-editor-blur, 0px)));
  -webkit-backdrop-filter: blur(var(--main-editor-local-blur, var(--ide-editor-blur, 0px)));
  animation: slideUpFade 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
              backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              -webkit-backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.plain-text-body {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', monospace;
  font-size: 14.5px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  color: var(--ide-text-active);
  tab-size: 4;
  padding: 16px 24px;
  background-color: var(--main-editor-local-bg, var(--ide-editor-bg));
  border-radius: 8px;
  border: 1px solid var(--ide-border);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.02);
}

.markdown-body {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 15px;
  line-height: 1.75;
  color: var(--ide-text);
  word-wrap: break-word;

  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin-top: 1.5em;
    margin-bottom: 0.75em;
    font-weight: 600;
    color: var(--ide-text-active);
    line-height: 1.25;
  }
  
  :deep(h1) { font-size: 2.2em; border-bottom: 1px solid var(--ide-border); padding-bottom: 0.3em; }
  :deep(h2) { font-size: 1.65em; border-bottom: 1px solid var(--ide-border); padding-bottom: 0.3em; }
  :deep(h3) { font-size: 1.35em; }
  :deep(h4) { font-size: 1.15em; }
  
  :deep(p) { margin-top: 0; margin-bottom: 1.2em; }
  
  :deep(a) { 
    color: var(--ide-accent); 
    text-decoration: none; 
    transition: all 0.2s;
    border-bottom: 1px solid transparent;
    &:hover { border-bottom-color: var(--ide-accent); } 
  }
  
  :deep(ul), :deep(ol) {
    padding-left: 2em;
    margin-top: 0;
    margin-bottom: 1.2em;
    li { margin-bottom: 0.25em; }
    li > p { margin-bottom: 0.5em; }
  }

  :deep(strong) { font-weight: 600; color: var(--ide-text-active); }
  
  :deep(blockquote) {
    margin: 1.5em 0;
    padding: 1em 1.5em;
    color: var(--ide-text-light);
    background-color: rgba(0, 0, 0, 0.02);
    border-left: 4px solid var(--ide-accent);
    border-radius: 0 8px 8px 0;
    
    p:last-child { margin-bottom: 0; }
  }

  :deep(code) {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    background-color: var(--ide-editor-bg);
    color: var(--ide-accent);
    border: 1px solid var(--ide-border);
    border-radius: 4px;
  }
  
  :deep(pre) {
    padding: 1.2em;
    margin: 1.5em 0;
    overflow: auto;
    font-size: 85%;
    line-height: 1.5;
    background-color: #1e1e1e;
    color: #e6e6e6;
    border-radius: 8px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    
    &::-webkit-scrollbar { height: 8px; width: 8px; }
    &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    
    code {
      background-color: transparent;
      padding: 0;
      border: none;
      color: inherit;
      font-size: 100%;
    }
  }

  :deep(table) {
    border-spacing: 0;
    border-collapse: collapse;
    margin-top: 0;
    margin-bottom: 16px;
    width: 100%;
    overflow: auto;
    
    th, td {
      padding: 10px 12px;
      border: 1px solid var(--ide-border);
    }
    th {
      font-weight: 600;
      background-color: var(--ide-editor-bg);
      color: var(--ide-text-active);
    }
    tr:nth-child(2n) {
      background-color: rgba(0, 0, 0, 0.015);
    }
  }
  
  :deep(img) {
    max-width: 100%;
    box-sizing: content-box;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin: 1em 0;
  }
  
  :deep(hr) {
    height: 2px;
    padding: 0;
    margin: 2em 0;
    background-color: var(--ide-border);
    border: 0;
  }
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  position: absolute;
  top: 0;
  left: 0;
}

.preview-image-zoomable {
  max-width: 100%;
  max-height: 100%;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: auto;
  will-change: transform;
}

.image-zoom-toolbar {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  font-size: 13px;
  z-index: 10;
  pointer-events: auto;

  .zoom-percent {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .zoom-reset-btn {
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.35);
    }
  }
}

.preview-placeholder {
  text-align: center;
  padding: 40px;
  background: var(--main-editor-local-surface-bg, var(--ide-editor-surface-bg, rgba(255, 255, 255, 0.8)));
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--ide-border);
  backdrop-filter: blur(var(--main-editor-local-blur, var(--ide-editor-blur, 0px)));
  -webkit-backdrop-filter: blur(var(--main-editor-local-blur, var(--ide-editor-blur, 0px)));
  transition: transform 0.3s ease, background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
              backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              -webkit-backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: scale(1.02);
  }

  .large-icon {
    font-size: 80px;
    color: var(--ide-accent);
    margin-bottom: 24px;
    opacity: 0.8;
  }

  h2 {
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--ide-text-active);
    font-size: 20px;
  }

  .preview-desc {
    color: var(--ide-text-light);
    font-size: 14px;
  }
}

.editor-empty {
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  color: var(--ide-text-active);
  background-image: radial-gradient(rgba(128, 128, 128, 0.15) 1px, transparent 1px);
  background-size: 20px 20px;
  position: relative;
  
  /* 添加毛玻璃背景框，防止在自定义背景下文字看不清 */
  &::before {
    content: '';
    position: absolute;
    width: 480px;
    height: 320px;
    background: var(--main-editor-local-surface-bg, var(--ide-editor-surface-bg, rgba(255, 255, 255, 0.6)));
    backdrop-filter: blur(calc(var(--main-editor-local-blur, var(--ide-editor-blur, 0px)) + 12px)) saturate(150%);
    -webkit-backdrop-filter: blur(calc(var(--main-editor-local-blur, var(--ide-editor-blur, 0px)) + 12px)) saturate(150%);
    border-radius: 32px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.2);
    z-index: -1;
    transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                -webkit-backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    html.dark & {
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    }
  }
  
  .empty-icon { 
    width: 100px;
    height: 100px;
    object-fit: contain;
    opacity: 0.8; 
    margin-bottom: 24px; 
    filter: drop-shadow(0 8px 16px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.2));
  }

  p {
    font-size: 16px;
    font-weight: 500;
    color: var(--ide-text-active);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .shortcut-tips {
    margin-top: 40px;
    display: flex;
    flex-direction: row;
    gap: 24px;
    align-items: center;

    p {
      font-size: 13px;
      font-weight: 500;
      color: var(--ide-text-light);
      text-shadow: none;
    }
    
    kbd { 
      background-color: rgba(var(--ide-bg-rgb, 245, 245, 247), 0.8); 
      border: 1px solid var(--ide-border);
      border-radius: 6px; 
      padding: 4px 10px; 
      font-size: 12px; 
      font-weight: 600;
      color: var(--ide-text-active); 
      box-shadow: 0 2px 0 var(--ide-border-hover); 
      font-family: 'JetBrains Mono', monospace;
      margin: 0 4px;
      
      html.dark & {
        background-color: rgba(40, 40, 40, 0.8);
      }
    } 
  }
}
/* ======== 书签详情仪表盘样式 ======== */
.bookmark-preview-container {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  background: transparent;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--ide-border);
    border-radius: 3px;
  }
}

.bookmark-ambient-bg {
  position: absolute;
  top: -10%;
  left: -10%;
  width: 120%;
  height: 120%;
  background-size: cover;
  background-position: center;
  filter: blur(60px) saturate(200%);
  opacity: 1;
  z-index: 0;
  pointer-events: none;
  transition: background-image 0.5s ease, opacity 0.5s ease;
  
  /* 深色模式下 */
  html.dark & {
    filter: blur(60px) saturate(150%);
    opacity: 0.8;
  }
}

.bookmark-bento-layout {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 860px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.status-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  margin-left: 12px;

  &.status-pending {
    color: #e6a23c;
    background: rgba(230, 162, 60, 0.1);
    border-color: rgba(230, 162, 60, 0.2);
  }

  &.status-approved {
    color: #67c23a;
    background: rgba(103, 194, 58, 0.1);
    border-color: rgba(103, 194, 58, 0.2);
  }

  &.status-reported {
    color: #f56c6c;
    background: rgba(245, 108, 108, 0.1);
    border-color: rgba(245, 108, 108, 0.2);
  }
}

/* 动画基类 */
.fade-in-up {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Hero Section */
.bento-hero {
  display: flex;
  gap: 32px;
  background: rgba(var(--ide-bg-rgb), 0.6);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid var(--ide-border);
  border-radius: 24px;
  padding: 32px;
  box-shadow: var(--ide-shadow-2);
  
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 24px;
    gap: 24px;
  }
}

.hero-cover {
  width: 220px;
  height: 140px;
  flex-shrink: 0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  background: var(--ide-panel-bg);
  position: relative;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
    
    &:hover {
      transform: scale(1.05);
    }
  }
  
  .hero-cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    color: var(--ide-accent);
    opacity: 0.5;
    background: linear-gradient(135deg, var(--ide-bg), var(--ide-border));
  }
}

.hero-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  
  .hero-time {
    font-size: 13px;
    color: var(--ide-text-light);
    font-family: 'JetBrains Mono', monospace;
  }
}

.resource-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  
  &.type-course { color: #f56c6c; background: rgba(245, 108, 108, 0.1); border: 1px solid rgba(245, 108, 108, 0.2); }
  &.type-blog { color: #67c23a; background: rgba(103, 194, 58, 0.1); border: 1px solid rgba(103, 194, 58, 0.2); }
  &.type-paper { color: #e6a23c; background: rgba(230, 162, 60, 0.1); border: 1px solid rgba(230, 162, 60, 0.2); }
  &.type-tool { color: #909399; background: rgba(144, 147, 153, 0.1); border: 1px solid rgba(144, 147, 153, 0.2); }
  &.type-entertainment { color: #b37feb; background: rgba(179, 127, 235, 0.1); border: 1px solid rgba(179, 127, 235, 0.2); }
  &.type-other { color: var(--ide-text); background: var(--ide-border); border: 1px solid var(--ide-border-hover); }
}

.hero-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--ide-text-active);
  margin: 0 0 12px 0;
  line-height: 1.3;
  letter-spacing: -0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-url {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--ide-text-light);
  text-decoration: none;
  margin-bottom: 24px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--ide-bg);
  border: 1px solid var(--ide-border);
  transition: all 0.2s ease;
  width: fit-content;
  max-width: 100%;
  
  .url-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  &:hover {
    color: var(--ide-accent);
    border-color: var(--ide-accent);
    background: var(--ide-accent-light);
  }
}

.hero-actions {
  display: flex;
  gap: 12px;
  
  .apple-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 40px;
    padding: 0 20px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    border: none;
    outline: none;
    
    &.primary {
      background: var(--ide-accent);
      color: #fff;
      box-shadow: 0 4px 12px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.3);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.4);
        background: var(--ide-accent-hover, #66b1ff);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
    
    &.secondary {
      background: var(--ide-bg);
      color: var(--ide-text-active);
      border: 1px solid var(--ide-border);
      
      &:hover {
        background: var(--ide-border);
        transform: translateY(-2px);
      }
    }
  }

  .bookmark-favorite-btn {
    color: var(--ide-accent);
    border-color: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.24);
    background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.08);

    &.active {
      color: #fff;
      border-color: var(--ide-accent);
      background: var(--ide-accent);
      box-shadow: 0 4px 12px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.24);
    }

    &:hover:not(:disabled) {
      color: #fff;
      border-color: var(--ide-accent);
      background: var(--ide-accent);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.64;
    }
  }

  .bookmark-report-btn {
    color: #f56c6c;
    border-color: rgba(245, 108, 108, 0.24);
    background: rgba(245, 108, 108, 0.08);

    &:hover {
      color: #fff;
      border-color: #f56c6c;
      background: #f56c6c;
    }
  }
}

/* Bento Grid */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.col-span-2 {
  grid-column: span 2;
}

.bento-card {
  background: rgba(var(--ide-bg-rgb), 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--ide-border);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.06);
    border-color: var(--ide-border-hover);
  }
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ide-text-light);
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 16px;
    
    .el-icon {
      font-size: 16px;
      color: var(--ide-accent);
    }
  }
  
  .card-body {
    flex: 1;
    
    &.flex-center {
      display: flex;
      align-items: center;
    }
  }
  
  .desc-text {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: var(--ide-text);
  }
  
  .highlight-text {
    font-size: 20px;
    font-weight: 600;
    color: var(--ide-text-active);
    background: linear-gradient(120deg, var(--ide-text-active), var(--ide-text-light));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .remark-text {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--ide-text);
    font-style: italic;
    border-left: 3px solid var(--ide-accent);
    padding-left: 12px;
    background: var(--ide-bg);
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
  }
}

.uploader-card {
  .uploader-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .uploader-avatar {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, rgba(var(--ide-accent-rgb, 64, 158, 255), 0.95), rgba(88, 86, 214, 0.85));
    box-shadow: 0 8px 20px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.28);
    flex-shrink: 0;
    overflow: hidden; /* fxy 防止图片溢出圆角 */
  }
  /* fxy 真实的头像图片样式 */
  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .uploader-meta {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .uploader-name {
    font-size: 15px;
    font-weight: 650;
    color: var(--ide-text-active);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .uploader-sub {
    font-size: 12px;
    color: var(--ide-text-light);
    opacity: 0.75;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
