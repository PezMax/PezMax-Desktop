<template>
  <div class="ide-container">
    <div class="ide-body" :class="{ 'is-resizing': isResizing }">
      <ActivityBar
        :active-view="activeView"
        @change-view="handleViewChange"
        @open-donate="donateVisible = true"
        @open-settings="settingsVisible = true"
      />

      <transition name="view-fade" mode="out-in">
        <template v-if="activeView === 'rank'">
          <RankView />
        </template>

        <template v-else>
          <!-- 包装一个容器让 transition 能正确处理平级组件 -->
          <div ref="rootRef" class="ide-main-content-wrapper">
            <SidePanel
              :active-view="activeView"
              :width="panelWidth"
              :file-tree-data="fileTreeData"
              :is-resizing="isResizing"
              @change-view="forceChangeView"
              @node-click="handleNodeClick"
              @search="handleLocalSearch"
              @refresh="fetchTreeData"
              @open-info="openFileInfo"
              @download-file="handleContextDownload"
              @toggle-favorite="handleContextFavorite"
              @report-file="handleContextReport"
              @batch-download="handleBatchDownload"
            />

            <!-- 拖拽条 -->
            <div
              class="resizer"
              v-show="activeView !== 'none'"
              @mousedown="startResize"
            ></div>

            <MainEditor
              :open-tabs="openTabs"
              :active-tab="activeTab"
              :favorite-file-ids="favoriteFileIdList"
              :favorite-bookmark-ids="favoriteBookmarkIdList"
              :favorite-loading-ids="favoriteLoadingFileIdList"
              @change-tab="activeTab = $event"
              @close-tab="closeTab"
              @open-info="openFileInfo"
              @download-file="handleDownload"
              @report-file="openReportDialog"
              @report-bookmark="openBookmarkReportDialog"
              @toggle-favorite="toggleFavorite"
            />
          </div>
        </template>
      </transition>
    </div>

    <!-- 全局文件详情侧边悬浮面板 -->
    <FileInfoDrawer
      v-model="infoDrawerVisible"
      :fileInfo="currentInfoFile"
      :is-favorite="isFileFavorited(currentInfoFile)"
      :favorite-loading="isFavoriteLoading(currentInfoFile)"
      @report-file="openReportDialog"
      @toggle-favorite="toggleFavorite"
      @download-file="handleDownload"
      @open-related-file="openRelatedFile"
    />

    <!-- 全局设置模块弹窗 -->
    <SettingsModal v-model="settingsVisible" />
    <DonateModal v-model="donateVisible" />

    <!-- 全局美观加载动画 -->
    <GlobalLoader :visible="isAppLoading" :text="appLoadingText" />
    <ReportFileDialog
      v-model="reportDialogVisible"
      :file-info="reportFileInfo"
      @report-success="ElMessage.success('举报已提交，我们将尽快处理！')"
    />
    <ReportBookmarkDialog
      v-model="reportBookmarkDialogVisible"
      :bookmark-info="reportBookmarkInfo"
      @report-success="ElMessage.success('举报已提交，我们将尽快处理！')"
    />
    <NotificationDialog
      v-model="notificationDialogVisible"
      :notification="currentNotification"
      :from-notification-center="isFromNotificationCenter"
      @update="handleNotificationUpdate"
      @exit="handleNotificationExit"
      @acknowledge="handleNotificationAcknowledge"
    />

    <AgentChatWidget @open-file="openRelatedFile" />

    <!-- fxy 下载进度条悬浮层，物理丝滑进出动画 -->
    <transition name="download-slide">
      <div v-if="isDownloading" class="download-progress-float">
        <div class="download-info">
          <span class="download-filename">正在下载: {{ downloadingFileName }}</span>
          <span class="download-percent">{{ Math.round(downloadPercent) }}%</span>
        </div>
        <el-progress
          :percentage="downloadPercent"
          :show-text="false"
          :stroke-width="8"
          color="var(--ide-accent)"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import ActivityBar from './components/ActivityBar.vue'
import SidePanel from './components/SidePanel.vue'
import MainEditor from './components/MainEditor.vue'
import FileInfoDrawer from './components/FileInfoDrawer.vue'
import AgentChatWidget from './components/AgentChatWidget.vue'
import SettingsModal from './components/SettingsModal.vue'
import DonateModal from './components/DonateModal.vue'
import RankView from '@/views/rank/index.vue'
import { getFileTree } from '@/api/datum/file'
import { normalizeFileUrl } from '@/utils/url'
import GlobalLoader from './components/GlobalLoader.vue'
import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/auth'
import ReportFileDialog from './components/ReportFileDialog.vue'
import ReportBookmarkDialog from './components/ReportBookmarkDialog.vue'
import NotificationDialog from '@/components/NotificationDialog/index.vue'
import useUserStore from '@/store/modules/user'
import { getUserPopupNotifications } from '@/api/datum/notification'
import { blobValidate } from '@/utils/ruoyi'
import { listFavorite, addFavorite, delFavorite } from '@/api/datum/favorite'
import { listBookmarkFavorite, addBookmarkFavorite, delBookmarkFavorite } from '@/api/datum/bookmarkFavorite'

// const activeView = ref('explorer')
// 状态管理
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const normalizeView = (v) => {
  if (
    v === 'explorer' ||
    v === 'upload' ||
    v === 'rank' ||
    v === 'bookmark' ||
    v === 'reportUser' ||
    v === 'none'
  ) return v
  return 'explorer'
}

const activeView = ref(normalizeView(route.query.view)) // explorer, rank, upload, none
const panelWidth = ref(260)
const isResizing = ref(false)
const rootRef = ref(null)
const openTabs = ref([])
const activeTab = ref('')
const settingsVisible = ref(false)
const donateVisible = ref(false)

// 文件树数据
//lxq    allFileTreeData：原始全量数据，fileTreeData：当前展示的数据
const allFileTreeData = ref([])
const fileTreeData = ref([])

// 信息抽屉状态
const infoDrawerVisible = ref(false)
const currentInfoFile = ref({})
const favoriteFileIds = ref(new Set())
const favoriteBookmarkIds = ref(new Set())
const favoriteLoadingIds = ref(new Set())
const favoriteFileIdList = computed(() => Array.from(favoriteFileIds.value))
const favoriteBookmarkIdList = computed(() => Array.from(favoriteBookmarkIds.value))
const favoriteLoadingFileIdList = computed(() => Array.from(favoriteLoadingIds.value))

// fxy 下载进度条相关状态
const isDownloading = ref(false)
const downloadPercent = ref(0)
const downloadingFileName = ref('')
/**
 * lxq
 * 添加弹窗通知检查逻辑
 */
const notificationDialogVisible = ref(false)  // 控制弹窗显示/隐藏
const currentNotification = ref({})             // 当前要显示的通知对象
const notificationQueue = ref([])              // 通知队列（可能有多个通知）
const currentIndex = ref(0)                    // 当前显示到第几个通知
const isFromNotificationCenter = ref(false)   // 是否从通知中心打开

/**
 * lxq
 * 弹窗通知检查逻辑
 * 功能：从后端获取需要弹窗显示的通知列表，进行过滤处理后显示
 */
const loadPopupNotifications = async () => {
  //LYZ三次修改：未登录时不拉取弹窗通知，避免登录页/会话切换期触发401
  // if (!getToken()) {
  //   notificationQueue.value = []
  //   return
  // }
  try {
    let userId = userStore.id
    if (!userId) {
      await userStore.getInfo()// 先获取用户信息
      userId = userStore.id
    }
    const res = await getUserPopupNotifications(userId)
    if (res.code === 200 && res.data?.length > 0) {
      // 获取已处理的通知ID（从 localStorage 读取，避免重复显示）
      const processedNotifications = JSON.parse(localStorage.getItem('processedNotifications') || '[]')
      // 过滤通知逻辑：
      // 1. 强制更新通知（notifyType === '1'）和下架通知（notifyType === '4'）：只显示未处理的
      // 2. 其他通知（故障、维护等）：每次都显示
      const filteredNotifications = res.data.filter(notify => {
        if (notify.notifyType === '1' || notify.notifyType === '4') {
          return !processedNotifications.includes(notify.notifyId)
        }
        return true
      })

      notificationQueue.value = filteredNotifications
      currentIndex.value = 0
      showNextNotification()
    }
  } catch (error) {
    console.error('获取弹窗通知失败:', error)
  }
}

/**
 * lxq
 * 显示下一个弹窗通知
 * 功能：从通知队列中取出当前索引的通知并显示
 */
const showNextNotification = () => {
  if (currentIndex.value < notificationQueue.value.length) {
    currentNotification.value = notificationQueue.value[currentIndex.value]
    notificationDialogVisible.value = true
  }
}
const reportDialogVisible = ref(false)
const reportFileInfo = ref(null)

const reportBookmarkDialogVisible = ref(false)
const reportBookmarkInfo = ref(null)
const filePermissionWarned = ref(false)

const notifyFilePermissionDenied = () => {
  if (filePermissionWarned.value) return
  filePermissionWarned.value = true
  ElMessage.warning('当前账号暂无文件树权限，已跳过资源树加载。')
}

const openReportDialog = (file) => {
  reportFileInfo.value = file || null
  reportDialogVisible.value = true
}

// 右键菜单：下载
const handleContextDownload = (file) => {
  if (file) handleDownload(file)
}

// 右键菜单：收藏/取消收藏
const handleContextFavorite = (file) => {
  if (file) toggleFavorite(file)
}

// 右键菜单：举报
const handleContextReport = (file) => {
  if (file) openReportDialog(file)
}

// 右键菜单：批量下载试卷
const handleBatchDownload = async (paperFiles) => {
  if (!paperFiles || paperFiles.length === 0) {
    ElMessage.warning('没有可下载的试卷')
    return
  }

  // 选择目标文件夹（静默下载开启且有默认路径时跳过弹窗）
  const settings = await window.electronAPI.getSettings()
  let folderPath
  if (settings?.silentDownload && settings?.downloadPath) {
    folderPath = settings.downloadPath
  } else {
    folderPath = await window.electronAPI.selectDownloadPath()
    if (!folderPath) return // 用户取消
  }

  let successCount = 0
  let failCount = 0
  isDownloading.value = true
  downloadPercent.value = 0
  downloadingFileName.value = `批量下载中... (0/${paperFiles.length})`

  for (let i = 0; i < paperFiles.length; i++) {
    const file = paperFiles[i]
    const fileName = file.label || file.fileName || 'unknown'
    downloadingFileName.value = `批量下载中... (${i + 1}/${paperFiles.length}) ${fileName}`

    try {
      const fileUrl = file.url || file.fileUrl || (file.fileInfo && file.fileInfo.fileUrl) || ''
      if (!fileUrl) {
        failCount++
        continue
      }

      const finalUrl = normalizeFileUrl(fileUrl)
      const response = await fetch(finalUrl, {
        headers: { 'Authorization': 'Bearer ' + getToken() }
      })

      if (!response.ok) {
        failCount++
        continue
      }

      const blob = await response.blob()
      const isBlob = blobValidate(blob)
      if (!isBlob) {
        failCount++
        continue
      }

      const arrayBuffer = await blob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      const result = await window.electronAPI.saveFile({
        content: uint8Array,
        fileName,
        folderPath,
        skipDialog: true
      })

      if (result.success) {
        successCount++
        // 每下载成功一个文件，立即写入并刷盘（等同于多次单独下载）
        const fId = getFileId(file)
        if (fId && window.electronAPI?.downloadRecords) {
          const src = file?.originalData || file
          // 优先从嵌套的 PtmjFile 实体中取文件元信息
          const info = src?.fileInfo || src?.ptmjFile || {}
          try {
            const record = {
              fileId: Number(fId) || 0,
              fileName,
              fileUrl: src?.url || info?.fileUrl || '',
              fileSize: Number(info?.fileSize) || 0,
              fileFormat: info?.fileFormat || '',
              fileSchool: info?.fileSchool || '',
              fileSubject: info?.fileSubject || '',
              fileYear: info?.fileYear != null ? Number(info?.fileYear) : null,
              fileType: info?.fileType != null ? Number(info?.fileType) : null,
              localPath: result.filePath || '',
              userId: userStore.id ? Number(userStore.id) : null
            }
            console.log('[batch-download] 写入单条记录并刷盘:', record.fileName)
            await window.electronAPI.downloadRecords.add(record)
            await window.electronAPI.downloadRecords.flush()
          } catch (e) { console.warn('[batch-download] 记录写入失败:', e) }
        }
      } else {
        failCount++
      }
    } catch (e) {
      failCount++
      console.error(`批量下载失败: ${fileName}`, e)
    }

    downloadPercent.value = Math.round(((i + 1) / paperFiles.length) * 100)
  }

  isDownloading.value = false
  ElMessage.success(`批量下载完成：成功 ${successCount} 份，失败 ${failCount} 份`)
}

const openBookmarkReportDialog = (bookmark) => {
  reportBookmarkInfo.value = bookmark || null
  reportBookmarkDialogVisible.value = true
}

const isBookmarkItem = (file) => {
  const source = file?.originalData || file
  return source?.type === 'bookmark' || source?.type === 'bookmark_item' || `${source?.id || ''}`.startsWith('bookmark-')
}

const getBookmarkId = (file) => {
  const source = file?.originalData || file
  const id = source?.rawId ?? source?.bookmarkId ?? source?.id
  if (id === undefined || id === null || id === '') return ''
  return `${id}`.replace(/^bookmark-/, '').replace(/^item-/, '')
}

const getFileId = (file) => {
  if (isBookmarkItem(file)) return ''
  const source = file?.originalData || file
  // 按照优先级从各种可能的嵌套结构中寻找 ID
  // 优先取嵌套结构中的真实 fileId，避免拿到 tree node 的合成 id（如 "file-11"）
  const id = source?.fileId ??
             source?.fileInfo?.fileId ??
             source?.ptmjFile?.fileId ??
             source?.id ??
             source?.fileInfo?.id ??
             source?.ptmjFile?.id
             
  return id === undefined || id === null || id === '' ? '' : String(id)
}

const resolveCurrentUserId = async () => {
  if (userStore.id) return String(userStore.id)
  try {
    const info = await userStore.getInfo()
    return String(userStore.id || info?.user?.userId || '')
  } catch (error) {
    console.error('获取当前用户信息失败:', error)
    return ''
  }
}

const refreshFavoriteIds = async () => {
  const userId = await resolveCurrentUserId()
  if (!userId) return

  try {
    const [fileRes, bookmarkRes] = await Promise.all([
      listFavorite({ pageNum: 1, pageSize: 1000, userId }),
      listBookmarkFavorite({ pageNum: 1, pageSize: 1000 })
    ])
    const fileRows = fileRes?.rows || []
    const bookmarkRows = bookmarkRes?.rows || []
    favoriteFileIds.value = new Set(fileRows.map(getFileId).filter(Boolean))
    favoriteBookmarkIds.value = new Set(bookmarkRows.map(getBookmarkId).filter(Boolean))
  } catch (error) {
    console.error('获取收藏列表失败:', error)
  }
}

const refreshBookmarkFavoriteIds = async () => {
  try {
    const res = await listBookmarkFavorite({ pageNum: 1, pageSize: 1000 })
    const rows = res?.rows || []
    favoriteBookmarkIds.value = new Set(rows.map(getBookmarkId).filter(Boolean))
  } catch (error) {
    console.error('获取书签收藏列表失败:', error)
  }
}

const isFileFavorited = (file) => {
  const fileId = getFileId(file)
  return Boolean(fileId && favoriteFileIds.value.has(fileId))
}

const isFavoriteLoading = (file) => {
  const id = isBookmarkItem(file) ? `bookmark-${getBookmarkId(file)}` : getFileId(file)
  return Boolean(id && favoriteLoadingIds.value.has(id))
}

const setFavoriteLoading = (fileId, loading) => {
  const next = new Set(favoriteLoadingIds.value)
  if (loading) {
    next.add(fileId)
  } else {
    next.delete(fileId)
  }
  favoriteLoadingIds.value = next
}

const setFavoriteState = (fileId, favorited) => {
  const next = new Set(favoriteFileIds.value)
  if (favorited) {
    next.add(fileId)
  } else {
    next.delete(fileId)
  }
  favoriteFileIds.value = next
}

const toggleFavorite = async (file) => {
  if (isBookmarkItem(file)) {
    const bookmarkId = getBookmarkId(file)
    if (!bookmarkId) {
      ElMessage.warning('未获取到书签标识，无法收藏')
      return
    }

    const loadingId = `bookmark-${bookmarkId}`
    if (favoriteLoadingIds.value.has(loadingId)) return

    const userId = await resolveCurrentUserId()
    if (!userId) {
      ElMessage.warning('未获取到当前用户信息，请重新登录后再试')
      return
    }

    const favorited = favoriteBookmarkIds.value.has(bookmarkId)
    setFavoriteLoading(loadingId, true)

    try {
      if (favorited) {
        await delBookmarkFavorite(userId, bookmarkId)
        const next = new Set(favoriteBookmarkIds.value)
        next.delete(bookmarkId)
        favoriteBookmarkIds.value = next
        ElMessage.success('已取消收藏')
      } else {
        await addBookmarkFavorite({ bookmarkId, userId })
        const next = new Set(favoriteBookmarkIds.value)
        next.add(bookmarkId)
        favoriteBookmarkIds.value = next
        ElMessage.success('已收藏')
      }
      window.dispatchEvent(new CustomEvent('favorite-updated', {
        detail: { bookmarkId, favorited: !favorited, type: 'bookmark' }
      }))
    } catch (error) {
      console.error('切换书签收藏失败:', error)
      await refreshBookmarkFavoriteIds()
      ElMessage.error(error?.msg || error?.message || '收藏操作失败，请稍后重试')
    } finally {
      setFavoriteLoading(loadingId, false)
    }
    return
  }

  const fileId = getFileId(file)
  if (!fileId) {
    ElMessage.warning('未获取到文件标识，无法收藏')
    return
  }

  if (favoriteLoadingIds.value.has(fileId)) return

  const userId = await resolveCurrentUserId()
  if (!userId) {
    ElMessage.warning('未获取到当前用户信息，请重新登录后再试')
    return
  }

  const favorited = favoriteFileIds.value.has(fileId)
  setFavoriteLoading(fileId, true)

  try {
    if (favorited) {
      await delFavorite(userId, fileId)
      setFavoriteState(fileId, false)
      ElMessage.success('已取消收藏')
    } else {
      await addFavorite({ fileId, userId })
      setFavoriteState(fileId, true)
      ElMessage.success('已收藏')
    }
    window.dispatchEvent(new CustomEvent('favorite-updated', {
      detail: { fileId, favorited: !favorited }
    }))
  } catch (error) {
    console.error('切换收藏失败:', error)
    await refreshFavoriteIds()
    ElMessage.error(error?.msg || error?.message || '收藏操作失败，请稍后重试')
  } finally {
    setFavoriteLoading(fileId, false)
  }
}
/**
 * lxq
 * 用户点击"立即更新"按钮的处理
 * 功能：关闭当前弹窗，显示下一个通知
 */
const handleNotificationUpdate = () => {
  isFromNotificationCenter.value = false
  currentIndex.value++
  showNextNotification()
}

/**
 * lxq
 * 用户点击"确认并退出"按钮的处理
 * 功能：关闭应用
 */
const handleNotificationExit = () => {
  window.electronAPI?.closeWindow?.() || window.close()
}

/**
 * lxq
 * 用户点击"确定/我知道了"按钮的处理
 * 功能：关闭当前弹窗，显示下一个通知
 */
const handleNotificationAcknowledge = () => {
  isFromNotificationCenter.value = false
  currentIndex.value++
  showNextNotification()
}

// lxq 获取并格式化后端返回的文件树
const fetchTreeData = async () => {
  try {
    const res = await getFileTree()
    if (res.code === 200) {
      const tree = formatTreeData(res.data)
      allFileTreeData.value = tree
      fileTreeData.value = tree
    } else {
      ElMessage.error(res.msg || '获取文件树失败')
    }
  } catch (error) {
    if (error?.response?.status === 403) {
      allFileTreeData.value = []
      fileTreeData.value = []
      notifyFilePermissionDenied()
      return
    }
    console.error('获取文件树异常:', error)
  }
}
// 侧边栏搜索逻辑
// lxq 本地搜索：直接在已有文件树中按文件夹名筛选，排除单个文件，不发起后端请求
let searchTimer = null

//只按学科（根级文件夹）搜索，不匹配学校/类型/年份等子级文件夹

const filterFolders = (nodes, kw) => {
  if (!Array.isArray(nodes)) return []

  const result = []
  nodes.forEach(node => {
    const isFolder = node.type === 'folder' || (node.children && node.children.length > 0)
    if (!isFolder) return

    const label = (node.label || '').toLowerCase()
    if (label.includes(kw)) {
      result.push(node)
    }
  })

  return result
}

// lxq 搜索防抖处理：用户停止输入 300ms 后在本地文件树中筛选
const handleLocalSearch = (query) => {
  const keyword = (query || '').trim()

  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    // 清空搜索时恢复原始文件树
    if (!keyword) {
      fileTreeData.value = allFileTreeData.value
      return
    }

    // 在已有文件树中筛选匹配的文件夹
    const matchedList = filterFolders(allFileTreeData.value, keyword.toLowerCase())
    fileTreeData.value = matchedList
  }, 300)
}
// 获取并格式化后端返回的文件树
// const fetchTreeData = async () => {
//   try {
//     const res = await getFileTree()
//     if (res.code === 200) {
//       fileTreeData.value = formatTreeData(res.data)
//     } else {
//       ElMessage.error(res.msg || '获取文件树失败')
//     }
//   } catch (error) {
//     console.error('获取文件树异常:', error)
//   }
// }

// 页面/应用加载状态
const isAppLoading = ref(true)
const appLoadingText = ref('Initializing Workspace...')

//lxq 响应通知中心的点击事件
const handleShowNotification = (event) => {
  const notification = event.detail
  if (notification) {
    currentNotification.value = notification
    isFromNotificationCenter.value = true
    notificationDialogVisible.value = true
  }
}

onMounted(async () => {
  isAppLoading.value = true
  appLoadingText.value = 'Synchronizing Space...'

  await fetchTreeData()
  await refreshFavoriteIds()
  await loadPopupNotifications()
  window.addEventListener('showNotification', handleShowNotification)

  setTimeout(() => {
    isAppLoading.value = false
  }, 400)

  // 检查是否有从其他页面（如收藏页）跳转过来需要打开的文件
  const pendingFile = sessionStorage.getItem('pendingOpenFile')
  if (pendingFile) {
    sessionStorage.removeItem('pendingOpenFile')
    try {
      const fileData = JSON.parse(pendingFile)
      setTimeout(() => {
        handleNodeClick(fileData)
      }, 600)
    } catch (e) {
      console.warn('解析待打开文件数据失败:', e)
    }
  }
})

// 视图切换
const handleViewChange = (view) => {
  if (activeView.value === view) {
    // 如果已经在该视图，点击则关闭（切换到 none）
    router.push({ path: '/index', query: { view: 'none' } })
  } else {
    // 正常切换到目标视图
    isAppLoading.value = true
    appLoadingText.value = view === 'upload' ? 'Preparing Upload...' : 'Switching View...'
    router.push({ path: '/index', query: { view: view } })
    setTimeout(() => {
      isAppLoading.value = false
    }, 300)
  }
}

// 暴露一个用于从外部（如子组件）强制切换视图的方法
const forceChangeView = (view) => {
  if (activeView.value === view) return
  
  isAppLoading.value = true
  appLoadingText.value = 'Navigating...'

  // 使用 router.push 而不是直接修改 activeView.value，以保持与 URL 同步并触发监听器
  router.push({ path: '/index', query: { view: view } })
  
  if (view === 'explorer') {
    fetchTreeData()
  }
  
  setTimeout(() => {
    isAppLoading.value = false
  }, 300)
}

// 递归格式化树节点，区分文件和文件夹
const formatTreeData = (nodes) => {
  if (!nodes) return []
  return nodes
    .filter(node => {
      // 过滤掉未审核（0）和未通过（2）的文件，仅显示审核通过（1）的文件
      const entity = node.ptmjFile || node.fileInfo || node
      const status = entity.fileStatus ?? entity.status
      return status === undefined || status === null || (Number(status) !== 0 && Number(status) !== 2)
    })
    .map(node => {
      // 调试：如果找到疑似文件的节点，在控制台打印
      if (!node.children || node.children.length === 0) {
        console.log('发现叶子节点:', node)
      }

      // 假设 PtmjFile 实体包含 fileId 和 fileName 字段
      // 有些后端可能会把实体包装在 node.ptmjFile 中，这里做个兼容
      const entity = node.ptmjFile || node.fileInfo || node

    // 如果 children 为空或者不存在，就认为是文件
    const isLeaf = !node.children || node.children.length === 0
    const hasFileProps = entity.fileId !== undefined || entity.fileName !== undefined || entity.fileUrl !== undefined

    // 如果它包含明确的文件特有属性，或者它没有 children 并且包含 url/后缀，就认为是文件
    // 增加条件：如果 node 的 label/fileName 带有明显的扩展名（如 .pdf, .doc），也倾向于是文件
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(node.label || entity.fileName || '')
    const isFile = hasFileProps || (isLeaf && (entity.fileUrl || entity.fileFormat || hasExtension))

    // 我们额外检查如果节点明确标识自己是文件夹（比如带有 type: 'folder'），就不作为文件
    const finalIsFile = isFile && node.type !== 'folder' && entity.type !== 'folder'

    const label = node.label || entity.fileName || '未命名'
    const id = node.id || entity.fileId || Math.random().toString(36).substr(2, 9)

    // 获取预览地址，优先看是否有专门的 previewUrl，再看 fileUrl
    let url = entity.previewUrl || entity.fileUrl || ''

    // 如果 URL 是相对路径，拼上后端基础地址
    if (url && !url.startsWith('http')) {
      const baseUrl = import.meta.env.VITE_APP_TARGET_URL || 'http://localhost:8080'
      url = url.startsWith('/') ? baseUrl + url : baseUrl + '/' + url
    }

    return {
      ...node,
      id,
      label,
      type: finalIsFile ? 'file' : 'folder',
      url,
      // 如果后端把真正的后缀名存在了 fileFormat 中
      fileExt: entity.fileFormat || '',
      children: finalIsFile ? null : formatTreeData(node.children)
    }
  })
}

watch(activeView, (v) => {
  if (v === 'explorer') fetchTreeData()
})

watch(
  () => route.query.view,
  (v) => {
    activeView.value = normalizeView(v)
  }
)

// 打开文件详情信息抽屉
const openFileInfo = (node, data, event) => {
  if (event) {
    event.stopPropagation()
  }
  // 获取文件完整信息
  const fileInfo = data.fileInfo || data
  currentInfoFile.value = fileInfo
  infoDrawerVisible.value = true
}

const openRelatedFile = (file) => {
  if (!file) return
  handleNodeClick({
    id: file.fileId || file.id,
    label: file.fileName || file.label || '未命名',
    url: file.fileUrl || file.url || '',
    type: 'file',
    fileExt: file.fileFormat || '',
    fileInfo: file
  })
}

// 树节点点击(打开文件或书签)
const handleNodeClick = (data) => {
  // 1. 如果是书签类型
  if (data.type === 'bookmark') {
    const existingTab = openTabs.value.find(tab => tab.id === data.id)
    if (!existingTab) {
      openTabs.value.push({
        id: data.id,
        title: data.label,
        url: data.url,
        type: 'bookmark',
        originalData: data,
        cover_image: data.cover_image || data.coverImage,
        createBy: data.createBy || data.create_by || data.uploader || data.uploaderName || data.nickName || data.userName || data.username,
        userId: data.userId || data.createByUserId || data.uploaderId,
        resource_type: data.resource_type,
        resourceType: data.resourceType,
        collection: data.collection,
        description: data.description,
        subject: data.subject,
        remark: data.remark,
        create_time: data.create_time,
        status: data.status
      })
    }
    // 强制触发响应式更新
    activeTab.value = ''
    setTimeout(() => {
      activeTab.value = data.id
    }, 0)
    return
  }

  // 2. 如果是普通文件
  if (data.type === 'file' && (data.url || (data.fileInfo && data.fileInfo.fileUrl))) {
    const existingTab = openTabs.value.find(tab => tab.id === data.id)
    if (!existingTab) {
      // 兼容某些后端将实体包在 fileInfo 里的情况
      const fileUrl = data.url || (data.fileInfo && data.fileInfo.fileUrl) || ''
      const fileLabel = data.label || (data.fileInfo && data.fileInfo.fileName) || '未命名'

      // 使用归一化工具处理 URL，自动修复相对路径和 localhost/内部 IP 问题
      const finalUrl = normalizeFileUrl(fileUrl)

      // 通过 url 或 label(fileName) 提取真实的文件扩展名
      const extractExt = (str) => {
        if (!str) return ''
        const parts = str.split('.')
        return parts.length > 1 ? parts.pop().toLowerCase() : ''
      }

      const realExtension = data.fileExt || (data.fileInfo && data.fileInfo.fileFormat) || extractExt(finalUrl) || extractExt(fileLabel) || 'unknown'

      // 调试：输出提取到的扩展名和 URL
      console.log('打开文件:', { label: fileLabel, url: finalUrl, ext: realExtension, originalData: data })

      openTabs.value.push({
        id: data.id,
        title: fileLabel,
        url: finalUrl,
        fileExt: realExtension.toLowerCase(),
        originalData: data.fileInfo || data
      })
    }
    // 强制触发响应式更新
    activeTab.value = ''
    setTimeout(() => {
      activeTab.value = data.id
    }, 0)
  } else {
    console.log('点击了文件夹或文件缺少URL:', data)
  }
}

// 处理下载文件逻辑 (调用后端接口并使用主进程保存)
const handleDownload = async (fileData) => {
  if (!fileData) {
    ElMessage.warning('未能获取到文件信息，无法下载')
    return
  }

  const fileId = getFileId(fileData)
  const fileName = fileData.fileName || fileData.label || 'downloaded_file'

  if (!fileId) {
    ElMessage.error('该文件缺少有效ID，无法通过统计接口下载')
    return
  }

  try {
    isDownloading.value = true
    downloadPercent.value = 0
    downloadingFileName.value = fileName

    // 1. 获取文件 URL 并直接下载 (避免在下载大文件时后端统计接口因超时或挂起导致失败)
    // 兼容多种数据结构获取 URL
    const fileUrl = fileData.fileUrl || fileData.url || (fileData.fileInfo && fileData.fileInfo.fileUrl) || ''
    if (!fileUrl) {
      ElMessage.error('未能获取到文件下载地址')
      isDownloading.value = false
      return
    }

    // 使用归一化工具处理 URL，自动修复相对路径和 localhost/内部 IP 问题
    const finalUrl = normalizeFileUrl(fileUrl)

    // 2. 发起文件流请求
    const response = await fetch(finalUrl, {
      headers: {
        'Authorization': 'Bearer ' + getToken()
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const blob = await response.blob()

    // 3. 检查是否为有效的二进制流
    const isBlob = blobValidate(blob)
    if (!isBlob) {
      const resText = await blob.text()
      try {
        const rspObj = JSON.parse(resText)
        ElMessage.error(rspObj.msg || '下载失败，服务器内部错误')
      } catch (e) {
        ElMessage.error('下载失败，返回格式错误')
      }
      isDownloading.value = false
      return
    }

    // 4. 将 Blob 转为 Uint8Array 传给主进程保存
    const arrayBuffer = await blob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // 5. 调用主进程保存文件
    const result = await window.electronAPI.saveFile({
      content: uint8Array,
      fileName: fileName
    })

    if (result.success) {
      downloadPercent.value = 100
      setTimeout(() => {
        isDownloading.value = false
        ElMessage.success(`下载完成: ${fileName}`)
      }, 500)

      // 6. 下载成功后记录到本地 SQLite（弃用服务端 MySQL 下载记录）
      try {
        const record = {
          fileId: Number(fileId) || 0,
          fileName,
          fileUrl: fileData.fileUrl || fileData.url || '',
          fileSize: Number(fileData.fileSize) || 0,
          fileFormat: fileData.fileFormat || '',
          fileSchool: fileData.fileSchool || '',
          fileSubject: fileData.fileSubject || '',
          fileYear: fileData.fileYear != null ? Number(fileData.fileYear) : null,
          fileType: fileData.fileType != null ? Number(fileData.fileType) : null,
          localPath: result.filePath || '',
          userId: userStore.id ? Number(userStore.id) : null
        }
        console.log('[home] 保存本地下载记录:', JSON.stringify(record))
        await window.electronAPI.downloadRecords.add(record)
        await window.electronAPI.downloadRecords.flush()
        console.log('[home] 本地下载记录已保存: fileId=', fileId)
      } catch (recordErr) {
        console.warn('[home] 本地下载记录保存失败，但不影响文件:', recordErr)
      }
    } else {
      isDownloading.value = false
      if (result.reason !== 'canceled') {
        ElMessage.error(`保存失败: ${result.message || '未知错误'}`)
      }
    }
  } catch (error) {
    isDownloading.value = false
    console.error('下载出错:', error)
    ElMessage.error('下载失败，请检查网络或联系管理员')
  }
}

// 全局快捷键响应逻辑
const handleGlobalKeydown = (e) => {
  if (window.electronAPI && window.electronAPI.getSettings) {
    window.electronAPI.getSettings().then(settings => {
      const shortcuts = settings.shortcuts
      if (!shortcuts) return

      const isMac = navigator.userAgent.indexOf('Mac') > -1
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

      // 检查上传快捷键 (CommandOrControl+U)
      if (shortcuts.upload && shortcuts.upload.includes('U') && isCmdOrCtrl && !e.shiftKey && !e.altKey && e.key.toUpperCase() === 'U') {
        e.preventDefault()
        activeView.value = 'upload'
      }

      // 检查设置快捷键 (CommandOrControl+,)
      if (shortcuts.settings && shortcuts.settings.includes(',') && isCmdOrCtrl && !e.shiftKey && !e.altKey && e.key === ',') {
        e.preventDefault()
        settingsVisible.value = !settingsVisible.value
      }

      // 检查关闭标签快捷键 (CommandOrControl+W)
      if (shortcuts.closeTab && shortcuts.closeTab.includes('W') && isCmdOrCtrl && !e.shiftKey && !e.altKey && e.key.toUpperCase() === 'W') {
        e.preventDefault()
        if (activeTab.value) {
          closeTab(activeTab.value)
        }
      }
    })
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)

  // fxy 注册下载进度监听器
  if (window.electronAPI?.onDownloadProgress) {
    window.electronAPI.onDownloadProgress((data) => {
      if (data && data.progress !== undefined) {
        downloadPercent.value = parseFloat(data.progress)
      }
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

// 关闭 Tab
const closeTab = (id) => {
  const index = openTabs.value.findIndex(tab => tab.id === id)
  if (index !== -1) {
    openTabs.value.splice(index, 1)
    if (activeTab.value === id) {
      activeTab.value = openTabs.value.length > 0 ? openTabs.value[openTabs.value.length - 1].id : ''
    }
  }
}

const startResize = () => {
  isResizing.value = true
  document.body.style.cursor = 'ew-resize'
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
}

const handleMouseMove = (e) => {
  if (!isResizing.value) return
  const rect = rootRef.value?.getBoundingClientRect()
  const baseLeft = rect?.left ?? 0
  const newWidth = e.clientX - baseLeft
  if (newWidth > 150 && newWidth < 600) {
    panelWidth.value = newWidth
  }
}

const stopResize = () => {
  isResizing.value = false
  document.body.style.cursor = ''
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
  // lxq  组件卸载时清理搜索防抖定时器，避免销毁后继续触发请求
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  window.removeEventListener('showNotification', handleShowNotification)
})
</script>

<style>
/* ==========================================================================
   全局流体主题引擎 (Global Fluid Theme Engine)
   ========================================================================== */
/* 浅色模式 (Light) - 默认 */
:root {
  --ide-bg: #f5f7fa;             /* 全局背景色，浅灰白 */
  --ide-bg-rgb: 245, 247, 250;   /* 用于半透明计算 */
  --ide-header-bg: #e4eaf1;      /* 顶部栏背景，柔和的浅蓝灰 */
  --ide-activity-bg: #ffffff;    /* 最左侧活动栏背景，纯白 */
  --ide-panel-bg: #ffffff;       /* 左侧面板背景，纯白 */
  --ide-editor-bg: #ffffff;      /* 主编辑器背景，纯白 */

  --ide-border: #ebeef5;         /* 边框颜色，柔和 */
  --ide-border-hover: #dcdfe6;   /* 边框悬停色 */

  --ide-text: #606266;           /* 主要文字颜色，深灰 */
  --ide-text-light: #909399;     /* 辅助文字颜色，浅灰 */
  --ide-text-active: #303133;    /* 激活文字颜色，近黑 */

  --ide-accent: #409eff;         /* 主色调：冷色蓝 */
  --ide-accent-hover: #66b1ff;   /* 主色调悬停 */
  --ide-accent-light: #ecf5ff;   /* 主色调浅色背景 */
  --ide-accent-rgb: 64, 158, 255;

  --ide-tab-bg: #f5f7fa;         /* 未激活标签页背景 */
  --ide-tab-active-bg: #ffffff;  /* 激活标签页背景 */

  --ide-status-bg: var(--ide-accent);      /* 底部状态栏背景 */
  --ide-status-text: #ffffff;    /* 底部状态栏文字 */

  --ide-shadow-1: 0 2px 12px rgba(0, 0, 0, 0.04);
  --ide-shadow-2: 0 4px 24px rgba(0, 0, 0, 0.08);
}

/* 深色模式 (Dark) - 挂载在 html.dark 上 */
html.dark {
  --ide-bg: #0f172a;             /* 极深蓝灰，深空感 */
  --ide-bg-rgb: 15, 23, 42;      /* 用于半透明计算 */
  --ide-header-bg: #1e293b;      /* 顶栏略微提亮 */
  --ide-activity-bg: #1e293b;    /* 活动栏 */
  --ide-panel-bg: #162032;       /* 侧边栏，介于背景和顶栏之间 */
  --ide-editor-bg: #1e293b;      /* 编辑器背景 */

  --ide-border: #334155;         /* 深色边框 */
  --ide-border-hover: #475569;   /* 深色边框悬停 */

  /* 优化深色模式下的文字对比度，使其更加清晰锐利 */
  --ide-text: #f1f5f9;           /* 提升基础文本亮度 (由 #e2e8f0 提升为 #f1f5f9) */
  --ide-text-light: #cbd5e1;     /* 提升辅助文本亮度 (由 #94a3b8 提升为 #cbd5e1) */
  --ide-text-active: #ffffff;    /* 高亮纯白文字 */

  --ide-accent-light: rgba(var(--ide-accent-rgb), 0.25); /* 深色下浅色背景需提高透明度以增强辨识度 */

  --ide-tab-bg: #0f172a;
  --ide-tab-active-bg: #1e293b;

  --ide-status-bg: var(--ide-accent);
  --ide-status-text: #ffffff;

  --ide-shadow-1: 0 4px 16px rgba(0, 0, 0, 0.4);
  --ide-shadow-2: 0 8px 32px rgba(0, 0, 0, 0.6);

  /* 覆盖 Element Plus 的原生深色变量 */
  --el-bg-color: var(--ide-editor-bg);
  --el-bg-color-overlay: var(--ide-panel-bg);
  --el-text-color-primary: var(--ide-text-active);
  --el-text-color-regular: var(--ide-text);
  --el-border-color: var(--ide-border);
  --el-border-color-light: var(--ide-border);
  --el-fill-color-blank: var(--ide-bg);
}

/* ==========================================================================
   自定义背景图系统 (Custom Background System)
   ========================================================================== */
html.has-custom-bg {
  /* 底层背景图渲染与滤镜 */
  &::before {
    content: '';
    position: fixed;
    /* 移除会导致图片拉伸变糊的放大 (110vw/vh) 设定，还原为原始大小 100% 贴合屏幕 */
    top: 0; left: 0; width: 100vw; height: 100vh;
    background-image: var(--ide-bg-image);
    background-size: cover;
    background-position: center;
    filter: blur(var(--ide-bg-blur));
    /* 当背景没有设置高斯模糊时，强制使用抗锯齿和平滑缩放，提升画质 */
    image-rendering: -webkit-optimize-contrast;
    z-index: -2;
  }

  /* 智能明暗叠加层，保证文本可读性 */
  &::after {
    content: '';
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background-color: rgb(var(--ide-bg-rgb));
    opacity: var(--ide-bg-opacity);
    z-index: -1;
  }

  /* 透明化所有的背景变量，将其转换为通透的玻璃态，完美展现底层壁纸 */
  --ide-bg: rgba(var(--ide-bg-rgb), 0.45);
  --ide-header-bg: rgba(var(--ide-bg-rgb), 0.65);
  --ide-activity-bg: rgba(var(--ide-bg-rgb), 0.5);
  --ide-panel-bg: rgba(var(--ide-bg-rgb), 0.65);
  /* 主编辑区遮罩，使用专门的透明度变量 */
  --ide-editor-bg: rgba(var(--ide-bg-rgb), var(--ide-editor-opacity, 0));
  --ide-tab-bg: rgba(var(--ide-bg-rgb), 0.45);
  --ide-tab-active-bg: rgba(var(--ide-bg-rgb), 0.65);

  /* 在自定义背景模式下，强行加深/加亮字体和图标颜色，提升可读性 */
  --ide-text: #1a1a1a;
  --ide-text-light: #404040;
  --ide-text-active: #000000;

  /* 覆盖 Element Plus 的原生变量以匹配更深的文字 */
  --el-text-color-primary: var(--ide-text-active);
  --el-text-color-regular: var(--ide-text);

  /* 强行注入毛玻璃滤镜 */
  #app, body, .ide-container, .ide-body {
    background: transparent !important; /* 让大容器完全透明，漏出底层背景图 */
  }

  /* 移除强制的全局毛玻璃，让用户自定义背景完全清晰 */
  .ide-body {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    will-change: transform;
  }

  /* 仅为有内容的局部面板（侧边栏、活动栏、顶部等）注入独立的毛玻璃，保证文字和图标清晰可读，而不影响主编辑区的全透明壁纸展示 */
  .ide-header,
  .activity-bar,
  .side-panel,
  .rank-side,
  .rank-panel,
  .editor-tabs,
  .el-drawer,
  .el-dialog,
  .info-drawer,
  .settings-modal-content {
    backdrop-filter: blur(20px) saturate(150%);
    -webkit-backdrop-filter: blur(20px) saturate(150%);
    /* 给面板增加非常轻微的内外发光以增强质感，提升与透明编辑区的分离度 */
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

/* 深色模式下的自定义背景优化 */
html.dark.has-custom-bg {
  --ide-text: #ffffff;
  --ide-text-light: #e0e0e0;
  --ide-text-active: #ffffff;

  --el-text-color-primary: var(--ide-text-active);
  --el-text-color-regular: var(--ide-text);
}


/* 在拖拽时禁用滤镜，防止每一帧的重绘导致掉帧卡顿 */
.ide-body.is-resizing {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* 全局流体动画层 (Fluid Transition Layer)
   仅给那些真正需要颜色过渡的基础元素加上动画，避免污染 Vue 组件自身的 transition/animation */
body {
  transition: background-color 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), color 0.4s ease;
}

  /* 针对主要面板、侧边栏、顶部栏的颜色过渡 */
.ide-container,
.ide-body,
.ide-header,
.side-panel,
.activity-bar,
.main-editor,
.editor-toolbar,
.editor-floating-pill,
.setting-card-group,
.setting-item,
.theme-preview,
.info-card,
.license-header {
  transition-property: background-color, border-color, color, box-shadow, fill !important;
  transition-duration: 0.4s !important;
  transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1) !important;
}

/* 排除拖拽条等需要瞬间响应或自带特定布局动画的元素 */
.resizer,
.el-drawer__body,
.el-drawer__header {
  transition-property: none !important;
}
/* Element Plus Switch 开关丝滑优化 */
.el-switch {
  /* 确保开关外框颜色过渡丝滑 */
  .el-switch__core {
    transition: border-color 0.3s, background-color 0.3s !important;
  }
  /* 确保开关圆点位移丝滑 */
  .el-switch__action {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
  }
}
</style>

<style lang="scss">
/* 自定义背景图系统需要作用到全局 html/body，不能放在 scoped 样式里 */
html.has-custom-bg {
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-image: var(--ide-bg-image);
    background-size: cover;
    background-position: center;
    filter: blur(var(--ide-bg-blur));
    image-rendering: -webkit-optimize-contrast;
    z-index: -2;
  }

  &::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgb(var(--ide-bg-rgb));
    opacity: var(--ide-bg-opacity);
    z-index: -1;
  }

  --ide-bg: rgba(var(--ide-bg-rgb), 0.45);
  --ide-header-bg: rgba(var(--ide-bg-rgb), 0.65);
  --ide-activity-bg: rgba(var(--ide-bg-rgb), 0.5);
  --ide-panel-bg: rgba(var(--ide-bg-rgb), 0.65);
  --ide-editor-bg: rgba(var(--ide-bg-rgb), var(--ide-editor-opacity, 0));
  --ide-tab-bg: rgba(var(--ide-bg-rgb), 0.45);
  --ide-tab-active-bg: rgba(var(--ide-bg-rgb), 0.65);

  --ide-text: #1a1a1a;
  --ide-text-light: #404040;
  --ide-text-active: #000000;
  --el-text-color-primary: var(--ide-text-active);
  --el-text-color-regular: var(--ide-text);

  #app,
  body,
  .ide-container,
  .ide-body {
    background: transparent !important;
  }

  .ide-body {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    will-change: transform;
  }

  .ide-header,
  .activity-bar,
  .side-panel,
  .rank-side,
  .rank-panel,
  .editor-tabs,
  .el-drawer,
  .el-dialog,
  .info-drawer,
  .settings-modal-content {
    backdrop-filter: blur(20px) saturate(150%);
    -webkit-backdrop-filter: blur(20px) saturate(150%);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

html.dark.has-custom-bg {
  --ide-text: #ffffff;
  --ide-text-light: #e0e0e0;
  --ide-text-active: #ffffff;
  --el-text-color-primary: var(--ide-text-active);
  --el-text-color-regular: var(--ide-text);
}
</style>

<style scoped lang="scss">
.ide-container {
  /* lxq  定位改为 relative，层级改为 1，避免覆盖页面标题栏 */
  position: relative;//lxq
  width: 100%;
  height: 100%;
  z-index: 1; //lxq
  background-color: var(--ide-bg);
  color: var(--ide-text);
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  overflow: hidden;
}


.ide-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  background-color: var(--ide-bg);
  padding: 8px;
  gap: 8px;
  transition: gap 0.3s ease;
}

.workspace-root {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  gap: 8px;
}

.rank-wrapper {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
}

/* 拖拽条 */
.resizer {
  width: 6px;
  margin: 0 -3px;
  cursor: ew-resize;
  transition: background-color 0.3s ease, opacity 0.3s ease;
  z-index: 10;
  border-radius: 3px;

  &:hover, &:active {
    background-color: var(--ide-accent);
  }
}

/* 右侧内容包裹层，解决 transition 需要单根节点的问题 */
.ide-main-content-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
  gap: 8px; /* 继承原来的间距 */
}

/* 页面切换的丝滑过渡动画 */
.view-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); /* 进场采用苹果弹簧感 */
}
.view-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); /* 退场采用顺滑减速 */
}

.view-fade-enter-from {
  opacity: 0;
  transform: translateX(10px) scale(0.99); /* 改为轻微的横向滑入+缩放 */
}

.view-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px) scale(0.99); /* 改为轻微的横向滑出+缩放 */
}

/* ================= fxy 重新设计的极简高级感下载进度条悬浮层 ================= */
.download-progress-float {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 280px; /* fxy 进一步收窄宽度 */

  /* fxy 适配深/浅色模式的毛玻璃材质 */
  background: rgba(var(--ide-bg-rgb, 255, 255, 255), 0.85);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid var(--ide-border);
  border-radius: 16px; /* fxy 配合减小的高度，圆角稍微收敛一点 */
  padding: 10px 16px; /* fxy 大幅缩减上下内边距，降低整体高度 */

  /* 自适应层次阴影 */
  box-shadow: var(--ide-shadow-2, 0 8px 32px rgba(0, 0, 0, 0.08));

  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 6px; /* fxy 缩小文字和进度条之间的间距 */

  .download-info {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .download-filename {
      font-size: 12px; /* fxy 字号稍微缩小，使其在窄高度下不显得拥挤 */
      font-weight: 500;
      /* fxy 使用主题文字颜色自适应 */
      color: var(--ide-text-active);
      letter-spacing: 0.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 75%;
    }

    .download-percent {
      font-size: 12px; /* fxy 字号稍微缩小 */
      font-weight: 600;
      color: var(--ide-accent, #409eff);
      font-variant-numeric: tabular-nums;
    }
  }

  /* 深度美化 el-progress */
  :deep(.el-progress) {
    line-height: 1;
    .el-progress-bar__outer {
      background-color: var(--ide-border) !important;
      border-radius: 8px;
      height: 6px !important; /* fxy 强制调细进度条的高度 */
    }
    .el-progress-bar__inner {
      transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
      background: linear-gradient(90deg, var(--ide-accent), var(--ide-accent-hover, #66b1ff));
      border-radius: 8px;
      /* 浅色高光，在深浅色模式下都增加立体感 */
      box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.3);
    }
  }
}

/* 深色模式下的特殊补强 */
html.dark .download-progress-float {
  background: rgba(30, 30, 30, 0.75); /* 深色模式下更通透一点 */
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 8px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

/* 进出动画：苹果风格的平滑升起与回弹 */
.download-slide-enter-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.download-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.download-slide-enter-from,
.download-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, 60px) scale(0.9);
}
</style>
