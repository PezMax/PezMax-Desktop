<template>
  <div
    class="side-panel"
    :style="{ width: computedWidth + 'px', opacity: activeView === 'none' ? 0 : 1, pointerEvents: activeView === 'none' ? 'none' : 'auto' }"
  >
    <div class="panel-header">
      <transition name="fade-title" mode="out-in">
        <span :key="panelTitle">{{ panelTitle }}</span>
      </transition>
      <div class="panel-actions">
        <el-icon
          v-if="activeView === 'explorer'"
          class="action-icon refresh-icon"
          :class="{ 'is-refreshing': isRefreshing }"
          @click="handleRefresh"
          title="刷新文件树"
        >
          <Refresh />
        </el-icon>

        <!-- Explorer 视图下的更多菜单 -->
        <el-dropdown v-if="activeView === 'explorer'" trigger="click" @command="handleExplorerCommand" popper-class="ide-dropdown">
          <span style="display: flex; outline: none; cursor: pointer;">
            <svg-icon icon-class="more-up" class="action-icon" />
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="collapseAll">
                <el-icon><ArrowUp /></el-icon> 收起所有节点
              </el-dropdown-item>
              <el-dropdown-item command="expandAll">
                <el-icon><ArrowDown /></el-icon> 展开所有节点
              </el-dropdown-item>
              <el-dropdown-item divided command="toggleExtension">
                <el-icon><View /></el-icon> 切换后缀名显示
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 书签视图下的更多菜单 -->
        <el-dropdown v-else-if="activeView === 'bookmark'" trigger="click" @command="handleBookmarkCommand" popper-class="ide-dropdown">
          <span style="display: flex; outline: none; cursor: pointer;">
            <svg-icon icon-class="more-up" class="action-icon" />
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="addBookmark">
                <el-icon><Plus /></el-icon> 添加外部资源
              </el-dropdown-item>
              <el-dropdown-item divided command="collapseAll">
                <el-icon><ArrowUp /></el-icon> 收起所有节点
              </el-dropdown-item>
              <el-dropdown-item command="expandAll">
                <el-icon><ArrowDown /></el-icon> 展开所有节点
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 其他视图默认的更多图标 -->
        <svg-icon v-else icon-class="more-up" class="action-icon" />
      </div>
    </div>

    <!-- 侧边栏搜索区 -->
    <transition name="slide-fade">
      <div class="panel-search" v-if="activeView === 'explorer'">
        <el-input
          v-model="searchQuery"
          placeholder="搜索试题、资料..."
          prefix-icon="Search"
          clearable
          class="panel-search-input"
          @input="handleInput"
        ></el-input>
      </div>
    </transition>

    <div class="panel-content">
      <transition name="fade-view" mode="out-in">
        <!-- 资源树视图 -->
        <el-tree
          v-if="activeView === 'explorer'"
          ref="fileTreeRef"
          key="explorer"
          :data="fileTreeData"
          :props="defaultProps"
          @node-click="$emit('node-click', $event)"
          class="ide-tree"
          highlight-current
          icon="ArrowRight"
        >
          <template #default="{ node, data }">
            <div class="custom-tree-node">
              <div class="node-left" style="display: flex; align-items: center; gap: 8px; flex: 1; overflow: hidden;">
                <svg-icon :icon-class="data.type === 'file' ? 'documentation' : 'nested'" class="tree-icon" />
                <span class="tree-label" :title="node.label">
                  {{ showExtension || data.type !== 'file' ? node.label : node.label.replace(/\.[^/.]+$/, '') }}
                </span>
                
                <!-- 新增状态标记 -->
                <span v-if="data.type === 'file' && data.fileInfo" class="tree-status-badge" :class="getStatusClass(data.fileInfo.fileStatus ?? data.fileInfo.status)">
                  {{ getStatusText(data.fileInfo.fileStatus ?? data.fileInfo.status) }}
                </span>
              </div>
              <div class="node-actions" v-if="data.type === 'file'">
                <span class="action-btn" title="文件详情" @click.stop="$emit('open-info', node, data, $event)">ℹ</span>
              </div>
            </div>
          </template>
        </el-tree>

        <div v-else-if="activeView === 'reportUser'" class="report-wrapper">
          <ReportTimelinePanel />
        </div>
        <!-- 其他视图占位 -->
        <div v-else-if="activeView !== 'none'" :key="activeView" class="panel-placeholder" :class="{ 'is-bookmark-view': activeView === 'bookmark' }">
          <!-- 贡献文件视图 (已抽离为独立组件) -->
          <div v-if="activeView === 'upload'" class="upload-wrapper">
            <UploadPanel @change-view="$emit('change-view', $event)" @refresh="handleRefresh" />
          </div>

          <!-- 外部书签/链接视图 (新功能占位) -->
          <div v-if="activeView === 'bookmark'" class="bookmark-wrapper">
            <div class="bookmark-header">
              <el-input
                v-model="bookmarkSearchQuery"
                placeholder="搜索书签..."
                prefix-icon="Search"
                clearable
                class="panel-search-input rounded-search"
                @input="handleBookmarkSearch"
              />
            </div>

            <div class="bookmark-list" v-loading="loadingBookmarks">
              <div v-if="bookmarkList.length === 0" class="empty-state">
                <el-icon class="empty-icon"><Link /></el-icon>
                <p>暂无外部书签</p>
                <span class="empty-sub">点击上方按钮添加新的链接</span>
              </div>

              <!-- 三级树状书签折叠列表 (使用 el-tree 保持与文件树一致的视觉体验) -->
              <div v-else class="bookmark-tree-container">
                <el-tree
                  ref="bookmarkTreeRef"
                  :data="bookmarkTreeData"
                  :props="defaultProps"
                  @node-click="handleBookmarkNodeClick"
                  class="ide-tree"
                  highlight-current
                  icon="ArrowRight"
                  :default-expanded-keys="defaultExpandedBookmarkKeys"
                  node-key="id"
                >
                  <template #default="{ node, data }">
                    <div class="custom-tree-node">
                      <div class="node-left" style="display: flex; align-items: center; gap: 8px; flex: 1; overflow: hidden;">
                        <!-- 类别/专栏图标 -->
                        <el-icon class="tree-icon" v-if="data.type === 'category' || data.type === 'collection'">
                          <component :is="data.icon" />
                        </el-icon>

                        <!-- URL卡片封面 -->
                        <div class="bm-mini-cover" v-else-if="data.type === 'bookmark_item' && data.cover_image">
                          <img :src="normalizeFileUrl(data.cover_image)" @error="handleCoverError($event, data.url)" />
                        </div>
                        <el-icon class="tree-icon" v-else-if="data.type === 'bookmark_item'">
                          <component :is="data.icon" />
                        </el-icon>

                        <span class="tree-label" :title="node.label">{{ node.label }}</span>

                        <!-- 数量徽标 -->
                        <span class="bm-header-count" v-if="data.type !== 'bookmark_item'">
                          {{ data.children ? data.children.length : 0 }}
                        </span>
                      </div>

                    </div>
                  </template>
                </el-tree>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

      <!-- 添加书签弹窗 (Apple/Notion Style) -->
      <el-dialog
        v-model="showAddBookmarkModal"
        title=""
        width="480px"
        top="8vh"
        class="bookmark-bento-dialog"
        :close-on-click-modal="false"
        destroy-on-close
        append-to-body
        @closed="resetBookmarkForm"
      >
        <template #header>
          <div class="bento-dialog-header">
            <div class="icon-wrapper">
              <el-icon><Link /></el-icon>
            </div>
            <h3>添加外部资源</h3>
            <p>收藏网课、文章或任意链接</p>
          </div>
        </template>

        <div class="bookmark-bento-form">
          <!-- 主链接区 -->
          <div class="bento-card bento-card-main fade-in-up" style="animation-delay: 0.1s">
            <el-input
              v-model="newBookmark.url"
              placeholder="请粘贴网页 / 视频链接..."
              clearable
              class="bento-input-large"
            >
              <template #prefix>
                <el-icon class="url-icon"><Link /></el-icon>
              </template>
            </el-input>
          </div>

          <div class="bento-form-grid" v-if="newBookmark.url">
            <!-- 资源标题 -->
            <div class="bento-card col-span-2 fade-in-up" style="animation-delay: 0.2s">
              <div class="card-header"><el-icon><Edit /></el-icon> 资源标题 <span class="required-star">*</span></div>
              <el-input v-model="newBookmark.title" placeholder="给这个链接起个清晰的名字" class="bento-input-flat" />
            </div>

            <!-- 归档信息 (合并分类、科目、专栏) -->
            <div class="bento-card col-span-2 fade-in-up meta-row-card" style="animation-delay: 0.3s">
              <div class="card-header"><el-icon><Folder /></el-icon> 归档与分类 <span class="required-star">*</span></div>
              <div class="meta-grid">
                <div class="meta-item">
                  <div class="meta-label">资源分类</div>
                  <el-select v-model="newBookmark.resource_type" placeholder="选择分类" class="bento-select-flat" popper-class="bookmark-select-popper">
                    <el-option v-for="item in resourceTypeOptions" :key="item.value" :label="item.label" :value="item.value">
                      <span class="select-option-item">
                        <el-icon><component :is="item.icon" /></el-icon> {{ item.label }}
                      </span>
                    </el-option>
                  </el-select>
                </div>
                <div class="meta-item">
                  <div class="meta-label">所属专栏</div>
                  <el-input v-model="newBookmark.collection" placeholder="如：Vue3 进阶" class="bento-input-flat" />
                </div>
                <div class="meta-item col-span-2-inner">
                  <div class="meta-label">关联科目 (可选)</div>
                  <el-input v-model="newBookmark.subject" placeholder="如：高等数学" class="bento-input-flat" />
                </div>
              </div>
            </div>

            <!-- 封面与描述 (左右并排或更紧凑) -->
            <div class="bento-grid-compact col-span-2">
              <!-- 封面图片区域 -->
              <div class="bento-card fade-in-up" style="animation-delay: 0.35s">
                <div class="card-header"><el-icon><Files /></el-icon> 封面预览</div>
                <div class="bento-cover-wrapper-compact">
                  <div class="hero-preview-area-compact" :class="{ 'has-image': newBookmark.cover_image || localPreviewUrl }" @click="handleCoverUploadClick">
                    <Transition name="fade-scale">
                      <div v-if="newBookmark.cover_image || localPreviewUrl" class="preview-content">
                        <img :src="localPreviewUrl || normalizeFileUrl(newBookmark.cover_image)" class="hero-img" />
                        <div class="img-overlay">
                          <el-icon><Upload /></el-icon>
                        </div>
                      </div>
                      <div v-else class="empty-preview">
                        <el-icon class="placeholder-icon"><Picture /></el-icon>
                        <span>点此上传</span>
                      </div>
                    </Transition>
                    <div v-if="pendingCoverFile" class="status-badge-compact">待上传</div>
                  </div>
                </div>
              </div>

              <!-- 内容描述 -->
              <div class="bento-card fade-in-up" style="animation-delay: 0.4s">
                <div class="card-header"><el-icon><Document /></el-icon> 内容摘要</div>
                <el-input
                  v-model="newBookmark.description"
                  type="textarea"
                  :rows="3"
                  placeholder="简单的摘要或描述..."
                  class="bento-textarea-flat-compact"
                  resize="none"
                />
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="bento-dialog-footer">
            <el-button class="apple-btn cancel" @click="showAddBookmarkModal = false">取消</el-button>
            <el-button class="apple-btn confirm" type="primary" @click="submitBookmark" :disabled="!newBookmark.url || !newBookmark.title || !newBookmark.collection" :loading="isSavingBookmark">
              <el-icon v-if="!isSavingBookmark"><Plus /></el-icon> <span>保存资源</span>
            </el-button>
          </div>
        </template>
      </el-dialog>
  </div>
</template>

<script setup>
import ReportTimelinePanel from './ReportTimelinePanel.vue'
import { computed, ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Plus, Link, Search, Delete, VideoCamera, Document, Reading, Box, Film, ArrowRight, Folder, Upload, Edit, Location, Files, Collection, Picture, ArrowUp, ArrowDown, View, Select } from '@element-plus/icons-vue'
import UploadPanel from './UploadPanel.vue'
import { normalizeFileUrl } from '@/utils/url'
import { listBookmark, addBookmark, updateBookmark } from '@/api/datum/bookmark'
import useUserStore from '@/store/modules/user'
import axios from 'axios'
import { getToken } from '@/utils/auth'
const uploadUrl = ref(import.meta.env.VITE_APP_BASE_API + "/common/upload")
const uploadHeaders = ref({
  Authorization: "Bearer " + getToken()
})



const props = defineProps({
  activeView: String,
  width: Number,
  fileTreeData: Array,
  isResizing: Boolean
})

const searchQuery = ref('')
const isRefreshing = ref(false)
const pendingCoverFile = ref(null) // 存储本地文件信息 { path, name, size }
const localPreviewUrl = ref('')    // 用于本地图片的即时预览
const showAddBookmarkModal = ref(false)
const isSavingBookmark = ref(false)

const clearCover = () => {
  newBookmark.cover_image = ''
  pendingCoverFile.value = null
  localPreviewUrl.value = ''
}

const emit = defineEmits(['node-click', 'search', 'refresh', 'change-view', 'open-info'])

// lxq 搜索输入联动：将用户输入的关键字实时传递给父组件执行搜索
const handleInput = (value) => {
  emit('search', value)
}

// 控制文件扩展名显示
const showExtension = ref(true)

// 获取 Tree 实例
const fileTreeRef = ref(null)

const handleExplorerCommand = (command) => {
  if (command === 'collapseAll') {
    // 遍历折叠所有节点
    if (fileTreeRef.value) {
      const nodes = fileTreeRef.value.store._getAllNodes()
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].expanded = false
      }
      ElMessage.success('已收起所有节点')
    }
  } else if (command === 'expandAll') {
    // 遍历展开所有节点
    if (fileTreeRef.value) {
      const nodes = fileTreeRef.value.store._getAllNodes()
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].expanded = true
      }
      ElMessage.success('已展开所有节点')
    }
  } else if (command === 'toggleExtension') {
    showExtension.value = !showExtension.value
    ElMessage.success(showExtension.value ? '已显示文件后缀名' : '已隐藏文件后缀名')
  }
}

const handleRefresh = () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  emit('refresh')

  // 动画至少持续 800ms，保证丝滑的视觉反馈
  setTimeout(() => {
    isRefreshing.value = false
  }, 800)
}

const bookmarkTreeRef = ref(null)

const handleBookmarkCommand = (command) => {
  if (command === 'addBookmark') {
    showAddBookmarkModal.value = true
  } else if (command === 'collapseAll') {
    if (bookmarkTreeRef.value) {
      const nodes = bookmarkTreeRef.value.store._getAllNodes()
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].expanded = false
      }
      ElMessage.success('已收起所有节点')
    }
  } else if (command === 'expandAll') {
    if (bookmarkTreeRef.value) {
      const nodes = bookmarkTreeRef.value.store._getAllNodes()
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].expanded = true
      }
      ElMessage.success('已展开所有节点')
    }
  }
}

const defaultProps = {
  children: 'children',
  label: 'label',
}

const panelTitle = computed(() => {
  const titles = {
    explorer: '资源管理器',
    bookmark: '外部书签',
    rank: '排行榜',
    upload: '贡献文件',
    reportUser: '我的举报'
  }
  return titles[props.activeView] || ''
})

// 动态计算宽度，只有在隐藏时才将宽度设为 0，以此实现平滑推拉
const computedWidth = computed(() => {
  return props.activeView === 'none' ? 0 : props.width
})

// ======== 外部书签/链接逻辑 ========
const bookmarkSearchQuery = ref('')
const loadingBookmarks = ref(false)
const bookmarkList = ref([])

// 将扁平数组转化为三级树状结构，供 el-tree 使用
const defaultExpandedBookmarkKeys = ref([])

const bookmarkTreeData = computed(() => {
  const tree = []
  const typeMap = {
    course: { label: '网课/视频', icon: 'VideoCamera', children: {} },
    blog: { label: '博客/文章', icon: 'Document', children: {} },
    paper: { label: '学术/论文', icon: 'Reading', children: {} },
    tool: { label: '工具/开源', icon: 'Box', children: {} },
    entertainment: { label: '娱乐/音乐/资源', icon: 'Film', children: {} },
  }

  const query = (bookmarkSearchQuery.value || '').toLowerCase().trim()

  // 1. 挂载数据到对应类别和专栏 (同时处理搜索过滤)
  bookmarkList.value.forEach(item => {
    // 过滤 status 为 2 的书签
    if (item.status !== undefined && item.status !== null && Number(item.status) === 2) {
      return
    }

    const type = item.resourceType || item.resource_type || 'entertainment'
    const collection = item.collection || '未分类单篇'

    // 搜索过滤逻辑：书签的标题、URL、描述、或是所属专栏（文件夹名）、所属分类名包含搜索词即可
    if (query) {
      const matchTitle = (item.title || '').toLowerCase().includes(query)
      const matchUrl = (item.url || '').toLowerCase().includes(query)
      const matchDesc = (item.description || '').toLowerCase().includes(query)
      const matchCollection = collection.toLowerCase().includes(query)
      const matchType = (typeMap[type]?.label || '').toLowerCase().includes(query)
      
      // 如果以上所有项都没有匹配到，则跳过这个书签
      if (!matchTitle && !matchUrl && !matchDesc && !matchCollection && !matchType) {
        return 
      }
    }

    if (!typeMap[type]) {
      typeMap[type] = { label: type, icon: 'Link', children: {} }
    }
    if (!typeMap[type].children[collection]) {
      typeMap[type].children[collection] = []
    }
    typeMap[type].children[collection].push(item)
  })

  // 2. 转换为 el-tree 所需的格式
  Object.keys(typeMap).forEach(typeKey => {
    const typeNode = typeMap[typeKey]
    const collections = Object.keys(typeNode.children)

    if (collections.length > 0) {
      const typeItem = {
        id: `type-${typeKey}`,
        label: typeNode.label,
        type: 'category',
        icon: typeNode.icon,
        children: []
      }

      collections.forEach(colKey => {
        const colItem = {
          id: `col-${typeKey}-${colKey}`,
          label: colKey,
          type: 'collection',
          icon: 'Folder',
          children: typeNode.children[colKey].map(item => ({
              ...item,
              id: `item-${item.id}`,
              rawId: item.id,
              label: item.title || item.url,
              type: 'bookmark_item',
              cover_image: item.cover_image || item.coverImage, // 兼容性映射
              statusInfo: item.status, // 新增注入书签状态字段
              icon: getResourceIcon(item.resourceType || item.resource_type)
            }))
        }
        
        // 只有当该专栏下有书签时，才推入专栏数组
        if (colItem.children.length > 0) {
          typeItem.children.push(colItem)
        }
      })

      // 如果这个类别下没有有效的专栏（比如搜索过滤后都空了），则不推入该类别
      if (typeItem.children.length > 0) {
        // 对专栏排序，把“未分类单篇”沉底
        typeItem.children.sort((a, b) => {
          if (a.label === '未分类单篇') return 1
          if (b.label === '未分类单篇') return -1
          return a.label.localeCompare(b.label)
        })

        tree.push(typeItem)
      }
    }
  })

  return tree
})

// 监听树结构，初始化时默认展开顶层
watch(bookmarkTreeData, (newVal) => {
  if (defaultExpandedBookmarkKeys.value.length === 0 && newVal.length > 0) {
    defaultExpandedBookmarkKeys.value = newVal.map(t => t.id)
  }
}, { immediate: true })

const getStatusText = (status) => {
  if (status === undefined || status === null) return ''
  const numStatus = Number(status)
  if (numStatus === 0) return '未审核'
  if (numStatus === 1) return '已审核' // 审核通过的不显示额外标签以保持整洁
  if (numStatus === 3) return '被举报'
  return ''
}

const getStatusClass = (status) => {
  if (status === undefined || status === null) return ''
  const numStatus = Number(status)
  if (numStatus === 0) return 'status-pending'
  if (numStatus === 3) return 'status-reported'
  return ''
}

const handleBookmarkNodeClick = (data, node) => {
  if (data.type === 'bookmark_item') {
    openBookmark(data)
  }
}

const newBookmark = reactive({
  url: '',
  title: '',
  description: '',
  cover_image: '',
  subject: '',
  remark: '',
  resource_type: 'entertainment',
  collection: ''
})

const resourceTypeOptions = ref([
  { label: '网课/视频', value: 'course', icon: 'VideoCamera' },
  { label: '博客/文章', value: 'blog', icon: 'Document' },
  { label: '学术/论文', value: 'paper', icon: 'Reading' },
  { label: '工具/开源', value: 'tool', icon: 'Box' },
  { label: '娱乐/音乐/资源', value: 'entertainment', icon: 'Film' }
])

const collectionOptions = computed(() => {
  const collections = new Set()
  bookmarkList.value.forEach(item => {
    if (item.collection && item.collection !== '未分类单篇') {
      collections.add(item.collection)
    }
  })
  return Array.from(collections)
})

const getResourceIcon = (type) => {
  const map = {
    course: 'VideoCamera',
    blog: 'Document',
    paper: 'Reading',
    tool: 'Box',
    entertainment: 'Film'
  }
  return map[type] || 'Link'
}

const getResourceLabel = (type) => {
  const map = {
    course: '网课',
    blog: '博客',
    paper: '论文',
    tool: '工具',
    entertainment: '娱乐',
    other: '其他'
  }
  return map[type] || '其他'
}

const getDomain = (url) => {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch (e) {
    return url
  }
}

const handleCoverError = (e, url) => {
  // 如果封面加载失败，尝试回退到网站 favicon
  const defaultFavicon = `https://www.google.com/s2/favicons?domain=${getDomain(url)}&sz=128`
  if (e.target.src !== defaultFavicon) {
    e.target.src = defaultFavicon
  } else {
    e.target.style.display = 'none'
  }
}

const isUploadingCover = ref(false)

const handleCoverUploadClick = async () => {
  // 1. 基础校验：后端接口要求 resourceType 必须有值
  if (!newBookmark.resource_type) {
    ElMessage({
      message: '请先选择「资源分类」，这是上传封面的必要归档信息',
      type: 'warning',
      zIndex: 10000
    })
    return
  }

  if (!window.electronAPI?.selectFile) {
    ElMessage.error('Electron 接口未加载，无法选择图片')
    return
  }

  try {
    // 2. 调起原生文件选择器
    const fileInfo = await window.electronAPI.selectFile()
    if (!fileInfo) return // 用户取消选择

    // 3. 文件合法性校验
    const ext = fileInfo.name.split('.').pop().toLowerCase()
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      ElMessage.error('只能上传图片文件!')
      return
    }

    if (fileInfo.size > 20971520) {
      ElMessage.warning('封面大小不能超过 20MB')
      return
    }

    // 4. 记录本地文件并生成预览，暂不调用上传接口
    pendingCoverFile.value = fileInfo
    newBookmark.cover_image = '' // 清空 URL 输入框，表示使用本地图片
    localPreviewUrl.value = fileInfo.preview || ''

    ElMessage.info('已选择本地图片，将在保存资源时上传')
  } catch (error) {
    console.error('选择图片异常:', error)
    ElMessage.error('选择图片失败')
  }
}

const fetchBookmarks = async () => {
  loadingBookmarks.value = true
  try {
    const res = await listBookmark({
      title: bookmarkSearchQuery.value || undefined,
      pageNum: 1,
      pageSize: 100
    })
    if (res.code === 200) {
      bookmarkList.value = res.rows || []
    }
  } catch (error) {
    console.error('获取书签失败', error)
  } finally {
    loadingBookmarks.value = false
  }
}

// 监听视图切换，自动刷新书签
watch(() => props.activeView, (newView) => {
  if (newView === 'bookmark') {
    fetchBookmarks()
  }
}, { immediate: true })

const handleBookmarkSearch = () => {
  // 原先这里是调用接口 fetchBookmarks()，如果想纯前端搜索，保持为空即可。
  // 因为上面 bookmarkTreeData 是计算属性，输入框绑定了 bookmarkSearchQuery.value 变化时会自动重新计算过滤。
}

const resetBookmarkForm = () => {
  Object.assign(newBookmark, {
    url: '', title: '', description: '', cover_image: '', subject: '', remark: '', resource_type: 'entertainment', collection: ''
  })
  pendingCoverFile.value = null
  localPreviewUrl.value = ''
}

const resolveBookmarkId = (res) => {
  const candidates = [
    res?.bookmarkId,
    res?.id,
    res?.data?.bookmarkId,
    res?.data?.id,
    typeof res?.data === 'number' ? res.data : null
  ]

  const found = candidates.find((v) => v !== undefined && v !== null && v !== '')
  return found !== undefined ? String(found) : ''
}

const fetchSavedBookmarkId = async ({ url, title, resourceType, collection }) => {
  try {
    const res = await listBookmark({
      url: url || undefined,
      title: title || undefined,
      resourceType: resourceType || undefined,
      collection: collection || undefined,
      pageNum: 1,
      pageSize: 50
    })

    const rows = res?.rows || []
    const matched = rows.find((r) => (r?.url || '') === (url || ''))
      || rows.find((r) => (r?.title || '') === (title || '') && (r?.collection || '') === (collection || ''))
      || rows[0]

    const id = matched?.id ?? matched?.bookmarkId
    return id !== undefined && id !== null && id !== '' ? String(id) : ''
  } catch (e) {
    console.error('回查 bookmarkId 失败:', e)
    return ''
  }
}

const submitBookmark = async () => {
  isSavingBookmark.value = true
  try {
    const hasLocalCover = !!pendingCoverFile.value

    // 1. 先保存书签主体，拿到 bookmarkId（本地封面上传依赖此参数）
    const payload = {
      url: newBookmark.url,
      title: newBookmark.title,
      description: newBookmark.description,
      coverImage: hasLocalCover ? '' : String(newBookmark.cover_image || ''),
      resourceType: newBookmark.resource_type,
      collection: newBookmark.collection,
      subject: newBookmark.subject,
      remark: newBookmark.remark
    }

    const saveRes = await addBookmark(payload)
    if (saveRes.code !== 200) {
      ElMessage.error(saveRes.msg || '保存失败')
      return
    }

    // 上传成功，更新用户上传计数
    const userStore = useUserStore()
    userStore.count += 1

    // 2. 如果是本地封面，按后端要求继续调用 uploadCover
    if (hasLocalCover) {
      let bookmarkId = resolveBookmarkId(saveRes)
      if (!bookmarkId) {
        bookmarkId = await fetchSavedBookmarkId({
          url: newBookmark.url,
          title: newBookmark.title,
          resourceType: newBookmark.resource_type,
          collection: newBookmark.collection
        })
      }
      if (!bookmarkId) {
        ElMessage({
          message: '书签已保存，但未获取到 bookmarkId，封面未上传',
          type: 'warning',
          zIndex: 10000
        })
      } else {
        isUploadingCover.value = true
        const token = getToken()
        const baseUrl = import.meta.env.VITE_APP_TARGET_URL || 'http://localhost:8080'
        const customApiUrl = baseUrl + '/datum/bookmark/uploadCover'

        const metadata = {
          resourceType: newBookmark.resource_type,
          resource_type: newBookmark.resource_type, // 增加下划线版本兼容性
          collection: newBookmark.collection || '',
          bookmarkName: newBookmark.title || '',
          bookmarkId: bookmarkId,
          id: bookmarkId // 增加通用 id 字段
        }

        let uploadRes
        try {
          uploadRes = await window.electronAPI.uploadFile({
            filePath: pendingCoverFile.value.path,
            metadata,
            token,
            baseUrl,
            customApiUrl
          })
        } catch (uploadErr) {
          console.error('封面 MinIO 上传请求异常:', uploadErr)
          uploadRes = { code: 500, msg: '封面图片上传请求失败: ' + (uploadErr.message || '未知错误') }
        } finally {
          isUploadingCover.value = false
        }

        if (uploadRes && uploadRes.code === 200) {
          let coverUrl = ''
          if (typeof uploadRes.data === 'string') coverUrl = uploadRes.data
          else if (uploadRes.data && typeof uploadRes.data === 'object') coverUrl = uploadRes.data.url || uploadRes.data.fileUrl || uploadRes.data.fileName || ''
          else coverUrl = uploadRes.url || uploadRes.fileUrl || uploadRes.fileName || ''
          if (coverUrl) {
            newBookmark.cover_image = coverUrl
            // 如果上传了封面，额外调用一次更新接口确保数据库记录同步
            try {
              await updateBookmark({
                id: bookmarkId,
                coverImage: coverUrl
              })
              console.log('书签封面数据库同步成功')
            } catch (updateErr) {
              console.warn('书签封面数据库同步失败:', updateErr)
            }
          }
          ElMessage.success('上传成功，等审核通过后可见')
        } else {
          console.warn('封面 MinIO 上传失败，后端响应:', uploadRes)
          ElMessage({
            message: '书签已保存，但封面上传失败: ' + (uploadRes?.msg || ''),
            type: 'warning',
            zIndex: 10000
          })
        }
      }
    } else {
      ElMessage.success('上传成功，等审核通过后可见')
    }

    showAddBookmarkModal.value = false
    resetBookmarkForm()
    await fetchBookmarks()
  } catch (e) {
    console.error('保存书签异常:', e)
    ElMessage.error(e.message || '网络请求失败，请稍后重试')
  } finally {
    isSavingBookmark.value = false
    isUploadingCover.value = false
  }
}

// 在主编辑器打开书签
const openBookmark = (item) => {
  // 将书签作为一种特殊的 tab 打开
  emit('node-click', {
    type: 'bookmark',
    id: `bookmark-${item.id}`,
    rawId: item.rawId || item.id,
    label: item.title,
    url: item.url,
    icon: 'Link',
    description: item.description,
    cover_image: item.cover_image || item.coverImage,
    createBy: item.createBy || item.create_by || item.uploader || item.uploaderName || item.nickName || item.userName || item.username,
    resource_type: item.resourceType || item.resource_type,
    collection: item.collection,
    subject: item.subject,
    remark: item.remark,
    userId: item.userId || item.createByUserId || item.uploaderId || item.uploader_id,
    create_time: item.createTime,
    status: item.statusInfo !== undefined ? item.statusInfo : item.status,
    originalData: item
  })
}

const handleBookmarkUpdated = () => {
  if (props.activeView === 'bookmark') {
    fetchBookmarks()
  }
}

// 模拟初始数据
onMounted(() => {
  // 移除假数据，交由 watch(activeView) 去触发真实的接口拉取
  window.addEventListener('bookmark-updated', handleBookmarkUpdated)
})

onUnmounted(() => {
  window.removeEventListener('bookmark-updated', handleBookmarkUpdated)
})
</script>

<style scoped lang="scss">
.side-panel {
  background-color: var(--ide-panel-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--ide-border);
  /* 使用 CSS 变量或类来控制是否启用 transition，避免拖拽时卡顿 */
  transition: width 0.35s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease;
  will-change: width, opacity;
}

/* 如果正在拖拽，取消宽度的 transition 避免粘滞感 */
.is-resizing .side-panel {
  transition: opacity 0.3s ease;
}

.panel-header {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 13px;
  text-transform: uppercase;
  color: var(--ide-text-active);
  font-weight: 600;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 12px;

  .action-icon {
    cursor: pointer;
    color: var(--ide-text-light);
    transition: color 0.3s, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;

    &:hover {
      color: var(--ide-accent);
      background-color: var(--ide-bg);
    }
  }

  .refresh-icon {
    font-size: 16px;
    &.is-refreshing {
      animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      color: var(--ide-accent);
    }
  }

  svg-icon.action-icon {
    transform: rotate(90deg);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.panel-search {
  padding: 0 12px 12px 12px;
  flex-shrink: 0;

  :deep(.el-input__wrapper) {
    background-color: var(--ide-bg);
    box-shadow: 0 0 0 1px var(--ide-border) inset;
    border-radius: 6px;
    transition: all 0.3s ease;

    &:hover { box-shadow: 0 0 0 1px var(--ide-border-hover) inset; }
    &.is-focus { box-shadow: 0 0 0 1px var(--ide-accent) inset; }

    .el-input__inner {
      color: var(--ide-text-active);
      font-size: 13px;
      &::placeholder { color: var(--ide-text-light); }
    }
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  padding: 0 8px 8px;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--ide-border-hover);
    border-radius: 3px;
  }

  :deep(.el-tree) {
    background: transparent;
    color: var(--ide-text);
    user-select: none; /* 防止文件树文字被选中 */

    .el-tree-node__content {
      height: 32px;
      border-radius: 4px;
      margin-bottom: 2px;
      transition: all 0.2s;

      &:hover { background-color: var(--ide-bg); }
    }

    .el-tree-node.is-current > .el-tree-node__content {
      background-color: var(--ide-accent-light);
      color: var(--ide-accent);
      font-weight: 500;
    }

    .el-tree-node__expand-icon {
      color: var(--ide-text-light);
      &.is-leaf { color: transparent; }
    }
  }
}

.custom-tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-size: 13.5px;
  color: var(--ide-text);
  padding: 4px 0;

  .tree-icon {
    font-size: 16px;
    color: var(--ide-accent); /* 文件图标颜色使用主色调 */
  }

  .node-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;

    .tree-status-badge {
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 4px;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-left: auto;
        
        &.status-pending {
          background: rgba(230, 162, 60, 0.15);
          color: #e6a23c;
          border: 1px solid rgba(230, 162, 60, 0.3);
        }

        &.status-reported {
          background: rgba(245, 108, 108, 0.15);
          color: #f56c6c;
          border: 1px solid rgba(245, 108, 108, 0.3);
        }
      }

      .tree-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
  }

  .node-actions {
    display: none;
    padding-right: 8px;

    .action-btn {
      font-size: 14px;
      color: var(--ide-text-light);
      cursor: pointer;
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--ide-accent);
      }
    }
  }

  &:hover {
    .node-actions {
      display: flex;
    }
  }
}

.panel-placeholder {
  padding: 40px 20px;
  text-align: center;
  color: var(--ide-text-light);
  height: 100%;
  display: flex;
  flex-direction: column;
  &.is-bookmark-view {
    padding: 0 4px;
    text-align: left;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex: 1;

    .empty-icon {
      font-size: 48px;
      opacity: 0.5;
      color: var(--ide-accent);
    }

    p {
      font-size: 14px;
      margin: 0;
    }
  }
}
.upload-wrapper,
.report-wrapper {
  height: 100%;
}
/* 上传容器样式 */
.upload-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
}

/* --- 步骤 1：选择文件 --- */
.step-select {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 8px;
  height: 100%;
  position: relative;
  border: 2px dashed transparent;
  transition: all 0.3s ease;

  &.drag-over {
    border-color: var(--ide-accent);
    background-color: rgba(64, 158, 255, 0.05);
    border-radius: 12px;
  }
}

.drag-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 101;
}

.drag-mask {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  backdrop-filter: blur(2px);

  .drag-mask-content {
    text-align: center;
    color: var(--ide-accent);
    pointer-events: none;

    .drag-icon {
      font-size: 48px;
      margin-bottom: 12px;
      animation: bounce 1s infinite;
    }

    h3 { margin: 0; font-size: 16px; font-weight: 600; }
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.action-card {
  background: var(--ide-bg);
  border: 1px solid var(--ide-border);
  border-radius: 12px;
  padding: 20px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.06);
    border-color: var(--ide-accent);

    .icon-wrapper {
      transform: scale(1.1);
    }
  }

  .icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease;
    flex-shrink: 0;

    &.file-icon-bg {
      background: rgba(64, 158, 255, 0.1);
      .card-icon { color: #409eff; font-size: 24px; }
    }

    &.folder-icon-bg {
      background: rgba(103, 194, 58, 0.1);
      .card-icon { color: #67c23a; font-size: 24px; }
    }
  }

  .card-text {
    display: flex;
    flex-direction: column;
    gap: 4px;

    h4 {
      margin: 0;
      font-size: 15px;
      color: var(--ide-text-active);
      font-weight: 600;
    }

    p {
      margin: 0;
      font-size: 12px;
      color: var(--ide-text-light);
    }
  }
}

.upload-illustration {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
  margin-top: 20px;

  .bg-icon {
    font-size: 80px;
    color: var(--ide-accent);
    margin-bottom: 16px;
  }

  p {
    font-size: 13px;
    color: var(--ide-text);
  }
}

/* --- 步骤 2：表单填写 --- */
.step-form {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px;
}

.selected-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--ide-bg);
  border-radius: 8px;
  border: 1px solid var(--ide-border);
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);

  .file-info-mini {
    display: flex;
    align-items: center;
    gap: 12px;
    overflow: hidden;

    .mini-icon {
      font-size: 24px;
      color: var(--ide-accent);
      flex-shrink: 0;
    }

    .mini-text {
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .mini-name {
        font-size: 13px;
        font-weight: 500;
        color: var(--ide-text-active);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mini-size {
        font-size: 11px;
        color: var(--ide-text-light);
      }
    }
  }

  .close-btn {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--ide-text-light);
    background: transparent;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
      background: #f56c6c22;
      color: #f56c6c;
    }
  }
}

.modern-form {
  flex: 1;

  .form-row {
    display: flex;
    gap: 12px;
    .flex-1 { flex: 1; }
  }

  :deep(.el-form-item__label) {
    padding-bottom: 6px;
    color: var(--ide-text-active);
    font-size: 13px;
    font-weight: 500;
  }

  /* 极简输入框样式 */
  :deep(.el-input__wrapper) {
    background-color: var(--ide-bg);
    box-shadow: 0 2px 4px rgba(0,0,0,0.02) inset, 0 0 0 1px transparent inset !important;
    border-bottom: 2px solid var(--ide-border);
    border-radius: 4px 4px 0 0;
    padding: 4px 12px;
    transition: border-color 0.3s ease, background-color 0.3s ease;

    &:hover {
      background-color: #eef2f7;
      border-bottom-color: var(--ide-border-hover);
    }

    &.is-focus {
      background-color: #fff;
      border-bottom-color: var(--ide-accent);
    }

    .el-input__inner {
      color: var(--ide-text-active);
      font-size: 14px;
    }
  }

  .form-actions {
    display: flex;
    gap: 12px;
    margin-top: 16px;

    .action-btn {
      flex: 1;
      height: 40px;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .cancel-btn {
      background-color: var(--ide-bg);
      border: 1px solid var(--ide-border);
      color: var(--ide-text);

      &:hover {
        border-color: var(--ide-border-hover);
        color: var(--ide-text-active);
        background-color: var(--ide-border);
      }
    }

    .submit-btn {
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
      }
    }
  }
}

.upload-tips {
  margin-top: 20px;
  padding: 12px;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 8px;
  display: flex;
  gap: 8px;

  .tip-icon {
    color: #e6a23c;
    font-size: 16px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  p {
    margin: 0;
    font-size: 12px;
    color: #b88230;
    line-height: 1.5;
  }
}

/* --- 步骤 3：成功状态 --- */
.step-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  text-align: center;

  .success-anim-wrapper {
    margin-bottom: 24px;

    .success-circle {
      width: 80px;
      height: 80px;
      background: #f0f9eb;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: scale-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;

      .check-icon {
        font-size: 40px;
        color: #67c23a;
      }
    }
  }

  h3 {
    margin: 0 0 12px 0;
    color: var(--ide-text-active);
    font-size: 20px;
  }

  p {
    margin: 0 0 32px 0;
    color: var(--ide-text-light);
    font-size: 14px;
    line-height: 1.5;
  }

  .success-actions {
    display: flex;
    gap: 12px;
    width: 100%;

    .action-btn {
      flex: 1;
      height: 40px;
      border-radius: 20px;
      font-weight: 500;
    }
  }
}

/* ======== Vue 过渡动画 ======== */

/* Fade-Slide 用于三个步骤之间的无缝切换 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@keyframes scale-bounce {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

/* 1. 内容视图淡入淡出 */
.fade-view-enter-active,
.fade-view-leave-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.fade-view-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}
.fade-view-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* 2. 标题文字淡入淡出 */
.fade-title-enter-active,
.fade-title-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-title-enter-from {
  opacity: 0;
  transform: translateY(5px);
}
.fade-title-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* 3. 搜索框滑入 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
  margin-top: -44px; /* 让高度缩减，避免突兀留白 */
}
/* ======== 书签视图专属样式 ======== */
.bookmark-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 200px;
}

.bookmark-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  min-width: 180px;

  .rounded-search {
    width: 100%;
    :deep(.el-input__wrapper) {
      background-color: var(--ide-bg);
      box-shadow: 0 0 0 1px var(--ide-border) inset;
      border-radius: 20px;
      padding-left: 14px;
      transition: all 0.3s ease;

      &:hover { box-shadow: 0 0 0 1px var(--ide-border-hover) inset; }
      &.is-focus { box-shadow: 0 0 0 1px var(--ide-accent) inset; }

      .el-input__inner {
        color: var(--ide-text-active);
        font-size: 13px;
        &::placeholder { color: var(--ide-text-light); }
      }
    }
  }
}

.bookmark-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--ide-border);
    border-radius: 3px;
  }
}

.bookmark-tree-container {
  display: flex;
  flex-direction: column;
  min-width: 180px;

  .bm-mini-cover {
    width: 16px;
    height: 16px;
    border-radius: 2px;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid var(--ide-border);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .bm-header-count {
    font-size: 11px;
    color: var(--ide-text-light);
    background: var(--ide-border);
    padding: 1px 5px;
    border-radius: 10px;
    margin-left: 6px;
  }

  .danger-btn {
    color: #f56c6c !important;
    &:hover {
      background: #fef0f0 !important;
    }
  }
}

/* ======== 添加书签弹窗样式 ======== */
.bookmark-dialog {
  .url-input-area {
    margin-bottom: 20px;
  }
}
/* ======== 书签表单便当盒 (Bento Box) 样式 ======== */
:deep(.bookmark-bento-dialog) {
  border-radius: 34px !important;
  overflow: hidden !important;
  background: rgba(var(--ide-panel-bg-rgb), 0.85);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.15), 0 0 0 1px inset rgba(255, 255, 255, 0.05);

  html.dark & {
    background: rgba(30, 30, 30, 0.8);
    border-color: rgba(255, 255, 255, 0.05);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4), 0 0 0 1px inset rgba(255, 255, 255, 0.02);
  }

  .el-dialog__header {
    padding: 0;
    margin: 0;
    border-bottom: none;
    .el-dialog__headerbtn {
      top: 12px;
      right: 16px;
      z-index: 10;
      .el-dialog__close {
        color: var(--ide-text-light);
        font-size: 20px;
        transition: all 0.3s;
        &:hover { color: var(--ide-accent); transform: rotate(90deg); }
      }
    }
  }

  .el-dialog__body {
    padding: 18px 24px 20px;
  }

  .el-dialog__footer {
    padding: 0 24px 22px;
    border-top: none;
  }
}



.bento-dialog-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10px;
  padding-bottom: 4px;

  .icon-wrapper {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--ide-accent), var(--ide-accent-hover));
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin-bottom: 10px;
    box-shadow: 0 12px 24px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.3);
  }

  h3 {
    margin: 0 0 6px 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--ide-text-active);
  }

  p {
    margin: 0;
    font-size: 13px;
    color: var(--ide-text-light);
  }
}

.bookmark-bento-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.bento-card {
  background: rgba(var(--ide-bg-rgb), 0.5);
  border: 1px solid var(--ide-border);
  border-radius: 18px;
  padding: 10px 14px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover {
    background: rgba(var(--ide-bg-rgb), 0.8);
    border-color: var(--ide-border-hover);
    box-shadow: 0 8px 24px rgba(0,0,0,0.04);
  }

  &:focus-within {
    border-color: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.55);
    box-shadow: 0 0 0 4px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.12), 0 12px 28px rgba(0,0,0,0.06);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--ide-text-light);
    margin-bottom: 6px;

    .el-icon {
      font-size: 14px;
      color: var(--ide-accent);
    }

    .required-star {
      color: #f56c6c;
      margin-left: 2px;
    }
  }
}

.bento-card-main {
  padding: 6px 10px;
  background: var(--ide-bg);
  border-width: 2px;

  &:focus-within {
    border-color: var(--ide-accent);
    box-shadow: 0 0 0 4px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.1);
  }
}

.bento-form-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .meta-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--ide-text-light);
    opacity: 0.8;
  }

  .col-span-2-inner {
    grid-column: span 2;
  }
}

.bento-grid-compact {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 10px;
}

.bento-cover-wrapper-compact {
  width: 100%;
}

.hero-preview-area-compact {
  width: 100%;
  height: 80px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px dashed var(--ide-border);
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &.has-image {
    border-style: solid;
    background: #000;
  }

  &:hover {
    border-color: var(--ide-accent);
    background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.05);
  }

  .preview-content {
    width: 100%;
    height: 100%;

    .hero-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .img-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.3);
      opacity: 0;
      transition: opacity 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
    }

    &:hover .img-overlay {
      opacity: 1;
    }
  }

  .empty-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--ide-text-light);
    gap: 4px;

    .placeholder-icon {
      font-size: 24px;
      opacity: 0.3;
    }

    span { font-size: 11px; opacity: 0.5; }
  }

  .status-badge-compact {
    position: absolute;
    top: 6px;
    left: 6px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    background: var(--ide-accent);
    color: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
}

.bento-textarea-flat-compact {
  :deep(.el-textarea__inner) {
    box-shadow: none !important;
    background: rgba(var(--ide-bg-rgb), 0.22) !important;
    border: 1px solid var(--ide-border) !important;
    border-radius: 12px !important;
    padding: 8px 12px !important;
    font-size: 13px !important;
    color: var(--ide-text-active);
    line-height: 1.5;

    &:focus {
      border-color: var(--ide-accent) !important;
      background: white !important;
    }
  }
}

.col-span-2 {
  width: 100%;
}

/* 输入框扁平化覆盖 */
.bento-input-large, .bento-input-flat, .bento-select-flat {
  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    box-shadow: none !important;
    background: rgba(var(--ide-bg-rgb), 0.22) !important;
    border: 1px solid var(--ide-border) !important;
    border-radius: 12px !important;
    padding: 4px 12px !important;
    font-size: 14px;
    color: var(--ide-text-active);
    transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);

    &::placeholder {
      color: var(--ide-text-light);
      opacity: 0.6;
    }

    &:hover {
      border-color: var(--ide-border-hover) !important;
    }

    &.is-focus {
      border-color: var(--ide-accent) !important;
      background: white !important;
    }
  }
}

.bento-input-large {
  :deep(.el-input__wrapper) {
    padding: 6px 12px;
    font-size: 15px;
    border-radius: 14px !important;
  }
  .url-icon {
    font-size: 18px;
    color: var(--ide-accent);
    margin-right: 6px;
  }
}



@media (max-width: 620px) {
  .meta-grid {
    grid-template-columns: 1fr;
  }
  .bento-grid-compact {
    grid-template-columns: 1fr;
  }
}

/* 动画：缩放淡入 */
.fade-scale-enter-active, .fade-scale-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fade-scale-enter-from { opacity: 0; transform: scale(0.9); }
.fade-scale-leave-to { opacity: 0; transform: scale(1.05); }

.select-option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  .el-icon { font-size: 16px; }
}

/* 底部操作区 */
.bento-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;

  .apple-btn {
    height: 44px;
    padding: 0 24px;
    border-radius: 22px;
    font-size: 15px;
    font-weight: 600;
    border: none;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

    &.cancel {
      background: var(--ide-bg);
      color: var(--ide-text);
      border: 1px solid var(--ide-border);

      &:hover {
        background: var(--ide-border);
        color: var(--ide-text-active);
      }
    }

    &.confirm {
      background: var(--ide-accent);
      color: white;
      box-shadow: 0 8px 20px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.3);
      display: inline-flex;
      align-items: center;
      gap: 8px;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 12px 24px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.4);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        background: var(--ide-border);
        color: var(--ide-text-light);
        box-shadow: none;
        cursor: not-allowed;
      }
    }
  }
}

/* 动画基类 */
.fade-in-up {
  opacity: 0;
  transform: translateY(16px);
  animation: fadeInUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<!--
  全局样式，用于覆盖 el-select 挂载到 body 上的 popper 样式。
  因为 scoped 样式无法影响到组件外的 DOM 元素。
-->
<style lang="scss">
.bookmark-select-popper {
  z-index: 10050 !important;
  pointer-events: auto !important;

  &.el-popper {
    z-index: 10050 !important;
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  .el-popper__arrow {
    display: none !important;
  }

  .el-select-dropdown {
    border-radius: 18px !important;
    overflow: hidden !important;
    border: 1px solid rgba(255, 255, 255, 0.16) !important;
    background: rgba(var(--ide-panel-bg-rgb, 255, 255, 255), 0.85) !important;
    backdrop-filter: blur(30px) saturate(150%) !important;
    -webkit-backdrop-filter: blur(30px) saturate(150%) !important;
    box-shadow: 0 18px 46px rgba(0, 0, 0, 0.2) !important;
    padding: 0 !important;
  }

  html.dark .el-select-dropdown {
    background: rgba(30, 30, 30, 0.85) !important;
    border-color: rgba(255, 255, 255, 0.05) !important;
    box-shadow: 0 18px 46px rgba(0, 0, 0, 0.4) !important;
  }

  .el-select-dropdown__wrap {
    padding: 6px !important;
  }

  .el-select-dropdown__item {
    border-radius: 12px !important;
    margin: 2px 0 !important;
    color: var(--ide-text-active) !important;
    pointer-events: auto !important;
    transition: all 0.2s ease !important;
    font-size: 14px !important;
    height: 38px !important;
    line-height: 38px !important;

    &:hover, &.hover {
      background-color: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.1) !important;
      color: var(--ide-accent) !important;
    }

    &.selected {
      background-color: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.15) !important;
      color: var(--ide-accent) !important;
      font-weight: 600 !important;
    }
  }

  .el-select-dropdown__item * {
    pointer-events: auto !important;
  }
}

.ide-dropdown {
  z-index: 10000 !important;
  border-radius: 12px !important;
  overflow: hidden !important;
  border: 1px solid rgba(255, 255, 255, 0.16) !important;
  background: rgba(var(--ide-panel-bg-rgb, 255, 255, 255), 0.85) !important;
  backdrop-filter: blur(30px) saturate(150%) !important;
  -webkit-backdrop-filter: blur(30px) saturate(150%) !important;
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.2) !important;

  html.dark & {
    background: rgba(30, 30, 30, 0.85) !important;
    border-color: rgba(255, 255, 255, 0.05) !important;
    box-shadow: 0 18px 46px rgba(0, 0, 0, 0.4) !important;
  }

  .el-dropdown-menu {
    padding: 6px !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }

  .el-dropdown-menu__item {
    border-radius: 8px !important;
    margin: 2px 0 !important;
    color: var(--ide-text-active) !important;
    transition: all 0.2s ease !important;
    font-size: 13px !important;
    padding: 8px 16px !important;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover, &.hover {
      background-color: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.1) !important;
      color: var(--ide-accent) !important;
    }
  }
}
</style>
