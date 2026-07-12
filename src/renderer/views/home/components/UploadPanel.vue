<template>
  <div class="upload-container">
    <transition name="fade-slide" mode="out-in">
      <!-- 步骤 1：选择上传类型 -->
      <div 
        v-if="uploadStep === 0" 
        class="step-select" 
        key="select"
        @dragenter.prevent="handleDragEnter"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        :class="{ 'drag-over': isDragOver }"
      >
        <!-- 透明的拖拽层，只在 drag 状态激活时显示，防止遮挡正常点击事件 -->
        <div class="drag-overlay" v-if="isDragOver" @dragenter.prevent @dragover.prevent @drop.prevent="handleDrop" @dragleave.prevent="handleDragLeave"></div>

        <div class="drag-mask" v-if="isDragOver">
          <div class="drag-mask-content">
            <svg-icon icon-class="upload" class="drag-icon" />
            <h3>松开鼠标即可上传</h3>
          </div>
        </div>

        <div class="action-card" @click="triggerFileSelect">
          <div class="icon-wrapper file-icon-bg">
            <svg-icon icon-class="documentation" class="card-icon" />
          </div>
          <div class="card-text">
            <h4>上传单份试卷</h4>
            <p>支持 PDF, Word, 图片等格式</p>
          </div>
        </div>
        
        <div class="action-card" @click="triggerFolderSelect">
          <div class="icon-wrapper folder-icon-bg">
            <svg-icon icon-class="nested" class="card-icon" />
          </div>
          <div class="card-text">
            <h4>上传文件夹</h4>
            <p>一次性上传整个目录的内容</p>
          </div>
        </div>

        <div class="upload-illustration">
          <img :src="logo" class="bg-icon" />
          <p>分享你的资料，帮助更多同学</p>
          <div class="drag-hint-text">
            <span>支持拖拽上传单份试卷</span>
            <span class="hint-warn">（暂不支持拖拽文件夹）</span>
          </div>
        </div>
      </div>

      <!-- 步骤 2：填写表单 -->
      <div v-else-if="uploadStep === 1" class="step-form" key="form">
        <div class="selected-header">
          <div class="file-info-mini">
            <svg-icon :icon-class="selectedFile?.isFolder ? 'nested' : 'documentation'" class="mini-icon" />
            <div class="mini-text">
              <span class="mini-name">{{ selectedFile?.name }}</span>
              <span class="mini-size">
                {{ formatSize(selectedFile?.size) }} 
                <span v-if="selectedFile?.isFolder">({{ selectedFile.files.length }} 个文件)</span>
              </span>
            </div>
          </div>
          <div class="close-btn-wrapper" @click="resetUpload" title="重新选择">
            <div class="close-btn">
              <el-icon><Close /></el-icon>
            </div>
          </div>
        </div>

        <div class="modern-form">
          <el-form label-position="top" size="default">
            <!-- 添加一个错误展示框，带淡入动画 -->
            <transition name="fade">
              <el-alert
                v-if="uploadErrorMsg"
                :title="uploadErrorMsg"
                type="error"
                show-icon
                @close="uploadErrorMsg = ''"
                class="upload-error-alert"
              />
            </transition>
            <el-form-item label="资源名称">
              <el-input v-model="uploadForm.fileName" placeholder="给这份资料起个清晰的名字" class="modern-input" />
            </el-form-item>
            <el-form-item label="学校名称">
              <el-autocomplete
                v-model="uploadForm.fileSchool"
                :fetch-suggestions="querySearchSchool"
                placeholder="如: 齐鲁工业大学"
                class="modern-input w-full"
                clearable
                @select="handleSchoolSelect"
                @focus="handleSchoolFocus"
                @blur="handleSchoolBlur"
                :trigger-on-focus="true"
                :debounce="300"
                popper-class="modern-autocomplete-popper"
              >
                <template #default="{ item }">
                  <!-- 正常匹配的学校项 -->
                  <div class="subject-suggestion-item" v-if="!item.isEmptyTip">
                    <span>{{ item.value }}</span>
                    <span class="subject-count" v-if="item.count">({{ item.count }})</span>
                  </div>
                  <!-- 无匹配结果时的灵动提示项 -->
                  <div class="subject-empty-item" v-else>
                    <div class="empty-icon-pulse">
                      <el-icon><Warning /></el-icon>
                    </div>
                    <div class="empty-text">
                      <span class="empty-title">未找到匹配学校</span>
                      <span class="empty-desc">提交后将作为新学校创建</span>
                    </div>
                  </div>
                </template>
              </el-autocomplete>
            </el-form-item>
            <el-form-item label="所属学科">
              <el-autocomplete
                v-model="uploadForm.fileSubject"
                :fetch-suggestions="querySearchSubject"
                placeholder="如: 高等数学"
                class="modern-input w-full"
                clearable
                @select="handleSubjectSelect"
                @focus="handleSubjectFocus"
                :trigger-on-focus="true"
                :debounce="300"
                popper-class="modern-autocomplete-popper"
              >
                <template #default="{ item }">
                  <!-- 正常匹配的科目项 -->
                  <div class="subject-suggestion-item" v-if="!item.isEmptyTip">
                    <span>{{ item.value }}</span>
                    <span class="subject-count" v-if="item.count">({{ item.count }})</span>
                  </div>
                  <!-- 无匹配结果时的灵动提示项 -->
                  <div class="subject-empty-item" v-else>
                    <div class="empty-icon-pulse">
                      <el-icon><Warning /></el-icon>
                    </div>
                    <div class="empty-text">
                      <span class="empty-title">未找到匹配科目</span>
                      <span class="empty-desc">提交后将作为新科目创建</span>
                    </div>
                  </div>
                </template>
              </el-autocomplete>
            </el-form-item>
            <div class="form-row">
              <el-form-item label="文件年份" class="flex-1">
                <el-input v-model="uploadForm.fileYear" placeholder="如: 2023" class="modern-input" />
              </el-form-item>
              <el-form-item label="文件类型" class="flex-1">
                <el-select v-model="uploadForm.fileType" placeholder="选择类型" class="modern-select" :teleported="false">
                  <el-option label="期末" :value="1" />
                  <el-option label="期中" :value="2" />
                  <el-option label="补考" :value="3" />
                  <el-option label="资料" :value="4" />
                  <el-option label="其他学校" :value="5" />
                  <el-option label="保持神秘" :value="6" />
                </el-select>
              </el-form-item>
            </div>
            <div class="form-actions">
              <template v-if="!isUploading">
                <el-button class="action-btn cancel-btn" @click="resetUpload">
                  取消
                </el-button>
                <el-button type="primary" class="action-btn submit-btn" @click="submitUpload">
                  确认上传
                </el-button>
              </template>
              <template v-else>
                <el-button type="danger" plain class="action-btn stop-btn" @click="handleCancelUpload">
                  <el-icon class="mr-1"><CircleClose /></el-icon> 中断上传
                </el-button>
                <div class="uploading-status-text">
                  {{ selectedFile?.isFolder ? `上传中 (${uploadProgress.current}/${uploadProgress.total})` : '正在上传中...' }}
                </div>
              </template>
            </div>
          </el-form>
        </div>

        <div class="upload-tips">
          <svg-icon icon-class="bulb" class="tip-icon" />
          <p>💡 提示：准确选择“文件类型”与“年份”，能让学弟学妹更快找到您的贡献！</p>
        </div>
      </div>

      <!-- 步骤 3：成功反馈 -->
      <div v-else-if="uploadStep === 2" class="step-success" key="success">
        <div class="success-animation">
          <div class="icon-circle">
            <svg-icon icon-class="validCode" class="check-icon" />
          </div>
        </div>
        <h3>感谢您的贡献！</h3>
        <p>资料已成功上传，正在进入审核队列。</p>
        
        <div class="success-actions">
          <el-button type="primary" plain class="action-btn" @click="resetUpload">继续上传</el-button>
          <el-button type="primary" class="action-btn" @click="$emit('change-view', 'explorer')">查看资料</el-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import logo from '@/assets/logo/logo.png'
import { getToken } from '@/utils/auth'
import { getSubjects, getSchools, checkSchoolExists } from '@/api/datum/file' // 引入获取科目和学校的接口
import { Warning, CircleClose, Close } from '@element-plus/icons-vue' // 引入警告图标
import useUploadStore from '@/store/modules/upload'

const uploadStore = useUploadStore()

// ======== 学校联想补全逻辑 ========
// 存储当前请求到的所有学校，以便在提交时进行校验
const existingSchools = ref([])

// focus 时请求热门学校
const handleSchoolFocus = async () => {
  // 如果输入框有值，不触发默认热门，让 querySearchSchool 去处理搜索
  if (uploadForm.fileSchool) return

  try {
    const res = await getSchools({ limit: 10 })
    if (res.code === 200 && res.data) {
      existingSchools.value = res.data
    }
  } catch (error) {
    console.error('获取热门学校失败:', error)
  }
}

const querySearchSchool = async (queryString, cb) => {
  try {
    // 构造请求参数，带 keyword 则模糊搜索，否则查热门
    const params = { limit: 10 }
    if (queryString) {
      params.keyword = queryString
    }

    const res = await getSchools(params)
    if (res.code === 200 && res.data && res.data.length > 0) {
      // 每次请求回来都更新 existingSchools，确保能判断当前输入是否是新学校
      existingSchools.value = res.data
      cb(res.data)
    } else {
      // 如果查询没有结果，则返回一个特定的"空提示"对象
      cb([{ value: queryString || '无匹配', isEmptyTip: true }])
    }
  } catch (error) {
    console.error('获取学校联想列表失败:', error)
    cb([{ value: queryString || '请求异常', isEmptyTip: true }])
  }
}

const handleSchoolSelect = (item) => {
  // 如果用户点击了"无匹配提示项"，则将输入框还原为刚才输入的内容
  if (item.isEmptyTip) {
    setTimeout(() => {
      uploadForm.fileSchool = uploadForm.fileSchool.replace('无匹配', '').replace('请求异常', '')
    }, 0)
    return
  }
  console.log('选择了已存在的学校:', item.value)
}

const handleSchoolBlur = async (event) => {
  const value = event.target.value
  if (value && value.trim()) {
    try {
      const res = await checkSchoolExists(value.trim())
      if (res.code === 200 && !res.data) {
        // 仅在数据库中不存在该学校时询问是否新建
        await ElMessageBox.confirm(
          '该学校不存在，是否新建？',
          '提示',
          {
            confirmButtonText: '确认新建',
            cancelButtonText: '返回修改',
            type: 'warning',
            customClass: 'modern-message-box'
          }
        ).then(() => {
          // 用户确认新建，保持当前输入
        }).catch(() => {
          // 用户返回修改，保持当前输入
        })
      }
    } catch (error) {
      console.error('检查学校名称失败:', error)
    }
  }
}

// ======== 科目联想补全逻辑 ========
// 存储当前请求到的所有科目，以便在提交时进行校验
const existingSubjects = ref([])

// 使用 store 中的状态
const uploadStep = computed(() => uploadStore.uploadStep)
const isUploading = computed(() => uploadStore.isUploading)
const selectedFile = computed(() => uploadStore.selectedFile)
const uploadProgress = computed(() => uploadStore.uploadProgress)
const uploadErrorMsg = computed({
  get: () => uploadStore.uploadErrorMsg,
  set: (val) => { uploadStore.uploadErrorMsg = val }
})
const uploadForm = uploadStore.uploadForm

// focus 时请求热门学科
const handleSubjectFocus = async () => {
  // 如果输入框有值，不触发默认热门，让 querySearchSubject 去处理搜索
  if (uploadForm.fileSubject) return
  
  try {
    const res = await getSubjects({ limit: 10 })
    if (res.code === 200 && res.data) {
      existingSubjects.value = res.data
    }
  } catch (error) {
    console.error('获取热门科目失败:', error)
  }
}

const querySearchSubject = async (queryString, cb) => {
  try {
    // 构造请求参数，带 keyword 则模糊搜索，否则查热门
    const params = { limit: 10 }
    if (queryString) {
      params.keyword = queryString
    }
    
    const res = await getSubjects(params)
    if (res.code === 200 && res.data && res.data.length > 0) {
      // 每次请求回来都更新 existingSubjects，确保能判断当前输入是否是新科目
      existingSubjects.value = res.data
      cb(res.data)
    } else {
      // 如果查询没有结果，则返回一个特定的“空提示”对象，通过自定义项模板进行渲染
      // 给 value 赋值以避免 Element Plus 报错，但并不影响视觉展示
      cb([{ value: queryString || '无匹配', isEmptyTip: true }])
    }
  } catch (error) {
    console.error('获取科目联想列表失败:', error)
    cb([{ value: queryString || '请求异常', isEmptyTip: true }])
  }
}

const handleSubjectSelect = (item) => {
  // 如果用户点击了“无匹配提示项”，则将输入框还原为刚才输入的内容
  if (item.isEmptyTip) {
    // 强制阻止选中该提示项的默认文字行为
    // 因为 Element 会默认将 item.value 填入输入框
    setTimeout(() => {
      uploadForm.fileSubject = uploadForm.fileSubject.replace('无匹配', '').replace('请求异常', '')
    }, 0)
    return
  }
  // 用户点击了推荐项，触发的钩子
  console.log('选择了已存在的规范科目:', item.value)
}

const emit = defineEmits(['change-view'])

// ======= 文件上传逻辑 ========
const isDragOver = ref(false)
let dragCounter = 0 // 记录进入/离开的层级深度，防止内部元素触发闪烁

// 读取本地设置，并应用默认值
onMounted(async () => {
  try {
    if (window.electronAPI && window.electronAPI.getSettings) {
        const settings = await window.electronAPI.getSettings()
        if (settings) {
          if (!uploadForm.fileSchool) {
            uploadForm.fileSchool = settings.defaultSchool || ''
          }
          if (settings.defaultSubject && !uploadForm.fileSubject) {
            uploadForm.fileSubject = settings.defaultSubject
          }
          if (settings.defaultYear && !uploadForm.fileYear) {
            uploadForm.fileYear = settings.defaultYear
          }
        }
      }
  } catch (error) {
    console.error('读取默认上传设置失败:', error)
  }
})

const handleDragEnter = (e) => {
  e.preventDefault()
  e.stopPropagation()
  dragCounter++
  isDragOver.value = true
}

const handleDragOver = (e) => {
  e.preventDefault()
  e.stopPropagation()
  e.dataTransfer.dropEffect = 'copy'
}

const handleDragLeave = (e) => {
  e.preventDefault()
  e.stopPropagation()
  dragCounter--
  if (dragCounter === 0) {
    isDragOver.value = false
  }
}

const handleDrop = async (e) => {
  e.preventDefault()
  e.stopPropagation()
  dragCounter = 0
  isDragOver.value = false
  const files = e.dataTransfer.files

  if (!files || files.length === 0) {
    ElMessage.error('未检测到文件，请重试')
    return
  }

  const file = files[0]
  const rawFile = e.dataTransfer.files[0]
  
  // 利用 Electron 传过来的真实物理绝对路径进行拦截
  const filePath = rawFile.path || file.path || file._path || ''
  const fs = window.require ? window.require('fs') : null
  
  if (filePath && fs) {
    try {
      const stats = fs.statSync(filePath)
      if (stats.isDirectory()) {
        ElMessage.warning('出于安全策略，暂不支持直接拖拽文件夹上传，请使用上方按钮选择文件夹')
        return
      }
    } catch (e) {
      console.log('通过 fs.statSync 判断文件夹失败:', e)
    }
  }

  // 或者如果拖拽的是文件夹，它的 size 有时是 0，或者能取到路径的话判断路径后缀
  // 放宽判断，避免有些文件真的没有后缀名被误拦，只要是没有后缀且没有 type 即可
  if (file && file.type === '' && file.size === 0) {
    ElMessage.warning('出于安全策略，暂不支持直接拖拽文件夹上传，请使用上方按钮选择文件夹')
    return
  }

  // 以下为单文件处理逻辑
  // 检查文件大小限制 50MB (52428800 bytes)
  if (file.size > 52428800) {
    ElMessage.warning(`单文件大小不能超过 50MB (当前文件: ${formatSize(file.size)})`)
    return
  }

  console.log('拖拽文件详情:', { name: file.name, path: filePath, size: file.size })

  setFile({
    path: filePath,
    name: file.name,
    size: file.size,
    isFolder: false
  })
}

const triggerFileSelect = async () => {
  if (!window.electronAPI?.selectFile) {
    ElMessage.error('Electron 接口未加载，无法选择文件')
    return
  }

  try {
    const fileInfo = await window.electronAPI.selectFile()
    if (fileInfo) {
      // 检查文件大小限制 50MB = 50 * 1024 * 1024 = 52428800 字节
      if (fileInfo.size > 52428800) {
        ElMessage.warning(`单文件大小不能超过 50MB (当前文件: ${formatSize(fileInfo.size)})`)
        return
      }

      setFile(fileInfo)
    }
  } catch (error) {
    console.error('选择文件失败:', error)
    ElMessage.error('选择文件失败')
  }
}

const triggerFolderSelect = async () => {
  if (!window.electronAPI?.selectFolder) {
    ElMessage.error('Electron 接口未加载，无法选择文件夹')
    return
  }

  try {
    const folderInfo = await window.electronAPI.selectFolder()
    if (folderInfo) {
      // 检查是否有文件
      if (!folderInfo.files || folderInfo.files.length === 0) {
        ElMessage.warning('选中的文件夹为空或无法读取')
        return
      }

      // 检查文件夹总大小限制 300MB = 300 * 1024 * 1024 = 314572800 字节
      if (folderInfo.size > 314572800) {
        ElMessage.warning(`文件夹总大小不能超过 300MB (当前: ${formatSize(folderInfo.size)})`)
        return
      }

      setFile(folderInfo)
    }
  } catch (error) {
    console.error('选择文件夹失败:', error)
    ElMessage.error('选择文件夹失败')
  }
}

const setFile = (fileInfo) => {
  uploadStore.setSelectedFile(fileInfo)
}

const resetUpload = () => {
  uploadStore.resetUpload()
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

const submitUpload = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择需要上传的文件')
    return
  }
  
  const currentSchool = uploadForm.fileSchool.trim()
  if (!currentSchool) {
    ElMessage.warning('请填写学校名称')
    return
  }
  
  const currentSubject = uploadForm.fileSubject.trim()
  if (!currentSubject) {
    ElMessage.warning('请填写所属学科')
    return
  }

  // 增加前端初步校验：年份必须是数字
  if (uploadForm.fileYear && isNaN(Number(uploadForm.fileYear))) {
    ElMessage.warning('文件年份必须为数字')
    return
  }

  // ==== 检查科目是否是全新的 ====
  const isExisting = existingSubjects.value.some(
    item => item.value.toLowerCase() === currentSubject.toLowerCase()
  )
  
  if (!isExisting) {
    try {
      // 构造现代化的自定义 HTML 弹窗内容
      const customHtml = `
        <div class="custom-confirm-dialog">
          <div class="dialog-icon-wrapper">
            <svg viewBox="0 0 24 24" class="sparkle-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div class="dialog-content-wrapper">
            <h3 class="dialog-title">创建新学科确认</h3>
            <p class="dialog-desc">系统中目前不存在 <strong class="subject-highlight">【${currentSubject}】</strong>。</p>
            <div class="dialog-tip-box">
              为了防止学科名称混乱（例如已有"高等数学"请勿创建"高数"），请确认这是否是一个全新的学科？
            </div>
          </div>
        </div>
      `

      await ElMessageBox.confirm(
        customHtml,
        '', // 清空原生标题
        {
          confirmButtonText: '确认创建',
          cancelButtonText: '我再改改',
          dangerouslyUseHTMLString: true,
          showClose: false, // 隐藏原生的右上角关闭按钮，更现代
          customClass: 'modern-message-box',
          icon: 'none', // 隐藏原生图标
          center: true // 开启原生居中模式，方便重构布局
        }
      )
      // 如果用户点击确认，把这个新科目临时加入本地列表
      existingSubjects.value.push({ value: currentSubject, count: 1 })
    } catch (e) {
      // 用户点击取消，终止上传流程
      return
    }
  }

  if (!window.electronAPI?.uploadFile) {
    uploadErrorMsg.value = 'Electron 接口未加载，无法执行上传'
    return
  }

  const result = await uploadStore.performUpload()
  if (result.success && result.autoJump) {
    emit('change-view', 'explorer')
  }
}

// 格式化文件大小
const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped lang="scss">
.upload-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* ======== 步骤 1：选择文件卡片 ======== */
.step-select {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  position: relative;
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
    border-color: var(--ide-accent);
    
    .icon-wrapper { transform: scale(1.1); }
  }
  
  .icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease;
    
    &.file-icon-bg { background: rgba(64, 158, 255, 0.1); color: #409eff; }
    &.folder-icon-bg { background: rgba(103, 194, 58, 0.1); color: #67c23a; }
    
    .card-icon { font-size: 24px; }
  }
  
  .card-text {
    flex: 1;
    h4 { margin: 0 0 6px 0; color: var(--ide-text-active); font-size: 15px; font-weight: 600; }
    p { margin: 0; color: var(--ide-text-light); font-size: 12px; }
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
    width: 100px;
    height: 100px;
    object-fit: contain;
    opacity: 0.1;
    margin-bottom: 20px;
  }
  
  p {
    font-size: 13px;
    color: var(--ide-text);
    margin-bottom: 8px;
  }

  .drag-hint-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--ide-text-light);

    .hint-warn {
      color: #e6a23c;
      font-size: 11px;
    }
  }
}

/* ======== 步骤 2：填写表单 ======== */
.step-form {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.selected-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(64, 158, 255, 0.05);
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 8px;
  margin-bottom: 24px;
  
  .file-info-mini {
    display: flex;
    align-items: center;
    gap: 12px;
    overflow: hidden;
    
    .mini-icon { font-size: 24px; color: var(--ide-accent); }
    
    .mini-text {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      
      .mini-name {
        color: var(--ide-text-active);
        font-weight: 500;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .mini-size { color: var(--ide-text-light); font-size: 12px; margin-top: 2px; }
    }
  }
  
  .close-btn-wrapper {
    padding: 6px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
    
    .close-btn {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(245, 108, 108, 0.15);
      color: #f56c6c;
      border: 1px solid rgba(245, 108, 108, 0.2);
      transition: all 0.3s ease;
      
      .el-icon {
        font-size: 11px; /* 稍微调小一点叉号 */
        font-weight: 900;
      }
    }
    
    &:hover {
      transform: scale(1.1) rotate(90deg);
      
      .close-btn {
        background: #f56c6c;
        color: #ffffff;
        border-color: #f56c6c;
        box-shadow: 0 4px 12px rgba(245, 108, 108, 0.35);
      }
    }
    
    &:active {
      transform: scale(0.9);
    }
  }
}

.modern-form {
  flex: 1;
  
  :deep(.el-form-item__label) {
    padding-bottom: 4px;
    color: var(--ide-text);
    font-size: 13px;
    font-weight: 500;
  }
  
  .form-row {
    display: flex;
    gap: 12px;
    .flex-1 { flex: 1; }
  }
  
  :deep(.el-input__wrapper), :deep(.el-select__wrapper) {
    background-color: transparent !important;
    box-shadow: none !important;
    border: none !important;
    border-bottom: 2px solid var(--ide-border) !important;
    border-radius: 0 !important;
    padding-left: 0;
    padding-right: 0;
    transition: all 0.3s ease;
    
    &:hover { 
      border-bottom-color: var(--ide-accent) !important;
    }
    &.is-focus, &.is-focused { 
      border-bottom-color: var(--ide-accent) !important; 
    }
    
    .el-input__inner { 
      color: var(--ide-text-active); 
      font-size: 14px;
    }
  }

  .form-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    align-items: center;

    .action-btn {
      flex: 1;
      height: 40px;
      border-radius: 10px;
      font-weight: 600;
      transition: all 0.3s ease;

      &.cancel-btn {
        background-color: var(--ide-bg);
        border: 1px solid var(--ide-border);
        color: var(--ide-text);
        
        &:hover {
          border-color: var(--ide-border-hover) !important;
          color: var(--ide-text-active) !important;
          background-color: var(--ide-border) !important;
        }
      }

      &.submit-btn {
        background: var(--ide-accent);
        border-color: var(--ide-accent);
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.3);
        
        &:hover {
          background: var(--ide-accent-hover, #66b1ff) !important;
          border-color: var(--ide-accent-hover, #66b1ff) !important;
          color: #ffffff !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.4);
        }
      }

      &.stop-btn {
        flex: 0 0 auto;
        padding: 0 20px;
      }
    }

    .uploading-status-text {
      flex: 1;
      font-size: 13px;
      color: var(--ide-accent);
      font-weight: 600;
      text-align: center;
      animation: pulse 2s infinite;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.upload-tips {
  margin-top: 20px;
  padding: 12px;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  
  .tip-icon { color: #e6a23c; font-size: 16px; margin-top: 2px; }
  p { margin: 0; font-size: 12px; color: #b88230; line-height: 1.5; }
}

.upload-error-alert {
  margin-bottom: 16px;
  border-radius: 8px;
  border: 1px solid #fde2e2;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* ======== 步骤 3：成功反馈 ======== */
.step-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  text-align: center;
  
  .success-animation {
    margin-bottom: 24px;
    
    .icon-circle {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: rgba(103, 194, 58, 0.1);
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

/* ======= 自定义科目联想下拉样式 ======== */
.modern-autocomplete-popper {
  border-radius: 12px !important;
  border: 1px solid var(--ide-border) !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08) !important;
  overflow: hidden;
  
  .el-autocomplete-suggestion__wrap {
    padding: 4px;
  }
  
  li {
    border-radius: 8px;
    margin: 2px 0;
    transition: all 0.2s ease;
    
    &:hover, &.highlighted {
      background-color: var(--ide-bg);
    }
  }
}

.subject-suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 4px;
  font-weight: 500;
  
  .subject-count {
    font-size: 12px;
    color: var(--ide-text-light);
    background: rgba(0, 0, 0, 0.04);
    padding: 2px 8px;
    border-radius: 12px;
    font-family: 'JetBrains Mono', monospace;
  }
}

/* 无匹配结果的灵动提示项 */
.subject-empty-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 4px;
  background: rgba(230, 162, 60, 0.05); /* 极淡的橙色背景 */
  border-radius: 8px;
  margin: 2px;
  cursor: default;
  
  .empty-icon-pulse {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(230, 162, 60, 0.15);
    color: #e6a23c;
    font-size: 16px;
    position: relative;
    
    /* 呼吸发光特效 */
    &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid rgba(230, 162, 60, 0.4);
      animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    }
  }
  
  .empty-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    
    .empty-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--ide-text-active);
      line-height: 1.2;
    }
    
    .empty-desc {
      font-size: 12px;
      color: var(--ide-text-light);
      line-height: 1.2;
    }
  }
}

@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 0.8; }
  80% { transform: scale(1.6); opacity: 0; }
  100% { transform: scale(1.6); opacity: 0; }
}

.w-full {
  width: 100%;
}

</style>

<style lang="scss">
/* 深色模式下的输入框适配 (全局覆盖) */
html.dark {
  .upload-container .modern-input,
  .upload-container .modern-select {
    .el-input__wrapper,
    .el-select__wrapper {
      background-color: transparent !important;
      box-shadow: none !important;
    }
    
    .el-input__inner {
      color: var(--ide-text-active) !important;
      -webkit-text-fill-color: var(--ide-text-active) !important;
      &::placeholder {
        color: var(--ide-text-light) !important;
        -webkit-text-fill-color: var(--ide-text-light) !important;
      }
    }
    
    /* 修复时间选择器前置图标的颜色 */
    .el-input__prefix,
    .el-input__prefix-inner {
      color: var(--ide-text-light) !important;
      .el-icon {
        color: var(--ide-text-light) !important;
      }
    }
    
    /* 修复清除按钮等后置图标的颜色 */
    .el-input__suffix,
    .el-input__suffix-inner {
      color: var(--ide-text-light) !important;
      .el-icon {
        color: var(--ide-text-light) !important;
      }
    }
  }
}

/* ==== 现代弹窗基础覆盖 (不局限于 .ide-container) ==== */
/* 作用于原生的 el-message-box__wrapper */
html.dark .modern-message-box {
  background-color: var(--ide-panel-bg, #162032) !important;
  border: 1px solid var(--ide-border, #334155) !important;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset !important;
  
  .el-message-box__content {
    color: var(--ide-text, #f1f5f9) !important;
  }

  .custom-confirm-dialog {
    .dialog-title {
      color: var(--ide-text-active, #ffffff) !important;
    }
    .dialog-desc {
      color: var(--ide-text, #cbd5e1) !important;
      .subject-highlight { color: #e6a23c !important; }
    }
    .dialog-tip-box {
      background: rgba(255, 255, 255, 0.05) !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      color: var(--ide-text-light, #94a3b8) !important;
    }
  }
}

/* 深色模式下的弹窗按钮样式 */
html.dark .modern-message-box {
  .el-message-box__btns {
    .el-button {
      background: transparent !important;
      border-color: var(--ide-border) !important;
      color: var(--ide-text-light) !important;
      
      &:hover {
        background: rgba(255, 255, 255, 0.05) !important;
        color: #ffffff !important;
      }
      
      &.el-button--primary {
        background: #e6a23c !important;
        border-color: #e6a23c !important;
        color: #ffffff !important;
        box-shadow: 0 4px 12px rgba(230, 162, 60, 0.3) !important;
        
        &:hover {
          background: #ebb563 !important;
          border-color: #ebb563 !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 16px rgba(230, 162, 60, 0.4) !important;
        }
      }
    }
  }
}

/* 下拉菜单弹出层在深色模式下的适配 */
html.dark .modern-autocomplete-popper {
  background-color: var(--ide-panel-bg) !important;
  border-color: var(--ide-border) !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset !important;
  
  .el-autocomplete-suggestion__list li {
    color: var(--ide-text);
    
    &:hover, &.highlighted {
      background-color: rgba(255, 255, 255, 0.05);
      color: var(--ide-text-active);
    }
  }
  
  .subject-suggestion-item .subject-count {
    background: rgba(255, 255, 255, 0.1);
    color: var(--ide-text-light);
  }
  
  .subject-empty-item {
    background: rgba(230, 162, 60, 0.1);
    
    .empty-icon-pulse {
      background: rgba(230, 162, 60, 0.2);
    }
  }
  
  /* 覆盖弹出层自带的三角形箭头 */
  .el-popper__arrow::before {
    background: var(--ide-panel-bg) !important;
    border-color: var(--ide-border) !important;
  }
}
</style>

<style lang="scss">
/* 覆盖 Element Plus 弹窗样式使其更现代 (极简/Notion/毛玻璃风格) */
.modern-message-box {
  width: 440px !important;
  padding: 0 !important;
  border-radius: 20px !important;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  background: var(--ide-panel-bg, rgba(255, 255, 255, 0.9)) !important;
  backdrop-filter: blur(12px) saturate(200%);
  -webkit-backdrop-filter: blur(12px) saturate(200%);
  box-shadow: 
    0 24px 48px rgba(0, 0, 0, 0.12),
    0 8px 16px rgba(0, 0, 0, 0.08) !important;
  overflow: hidden;
  
  /* 隐藏原生的 header，使用自定义内容 */
  .el-message-box__header {
    display: none !important;
  }
  
  .el-message-box__content {
    padding: 32px 32px 24px !important;
  }
  
  .custom-confirm-dialog {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20px;
    
    .dialog-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #fff4e5 0%, #fde2ba 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 
        0 8px 16px rgba(230, 162, 60, 0.15),
        inset 0 2px 4px rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(230, 162, 60, 0.2);
      
      .sparkle-icon {
        width: 28px;
        height: 28px;
        color: #e6a23c;
        animation: subtle-pulse 2s ease-in-out infinite;
      }
    }
    
    .dialog-content-wrapper {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }
    
    .dialog-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--ide-text-active);
      letter-spacing: 0.5px;
    }
    
    .dialog-desc {
      margin: 0;
      font-size: 15px;
      color: var(--ide-text);
      line-height: 1.5;
      
      strong, .subject-highlight {
        color: #e6a23c;
        font-weight: 600;
        background: rgba(230, 162, 60, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
      }
    }
    
    .dialog-tip-box {
      margin-top: 12px;
      padding: 12px 16px;
      background: var(--ide-bg, #f8fafc);
      border-radius: 10px;
      font-size: 13px;
      color: var(--ide-text-light, #64748b);
      line-height: 1.6;
      text-align: left;
      border: 1px solid var(--ide-border, #edf2f7);
    }
  }
  
  /* 底部按钮区重构 */
  .el-message-box__btns {
    padding: 0 32px 32px !important;
    display: flex;
    gap: 12px;
    justify-content: center; /* 按钮居中，也可以改为 flex-end */
    
    .el-button {
      margin: 0 !important;
      flex: 1; /* 按钮等宽 */
      height: 44px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.5px;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      
      &--default {
        background: var(--ide-bg, #f1f5f9);
        border: none;
        color: var(--ide-text, #334155);
        
        &:hover {
          background: var(--ide-border, #e2e8f0);
          color: var(--ide-text-active);
          transform: translateY(-2px);
        }
      }
      
      &--primary {
        background: var(--ide-accent);
        border: none;
        box-shadow: 0 4px 12px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.3);
        
        &:hover {
          background: var(--ide-accent-hover, #66b1ff);
          box-shadow: 0 6px 16px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.4);
          transform: translateY(-2px);
        }
      }
      
      &:active {
        transform: scale(0.96) !important;
      }
    }
  }
}

@keyframes subtle-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.9); opacity: 0.8; }
}

/* 全局遮罩层加深模糊，突出弹窗 */
.el-overlay.is-message-box {
  background-color: rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(4px);
  transition: all 0.4s ease;
}
</style>
