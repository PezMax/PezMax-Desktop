import { defineStore } from 'pinia'
import { getToken } from '@/utils/auth'
import useUserStore from '@/store/modules/user'

const useUploadStore = defineStore('upload', {
  state: () => ({
    isUploading: false,
    uploadStep: 0, // 0: 选文件, 1: 填表单, 2: 成功
    selectedFile: null, // { path: '...', name: '...', size: 1024, isFolder: false, files: [] }
    uploadProgress: { current: 0, total: 0 },
    uploadErrorMsg: '',
    uploadForm: {
      fileName: '',
      fileSubject: '',
      fileYear: '',
      fileType: null
    },
    isCancelled: false
  }),
  actions: {
    setSelectedFile(fileInfo) {
      this.selectedFile = fileInfo
      // 自动填充去除后缀的文件名
      const nameParts = fileInfo.name.split('.')
      if (!fileInfo.isFolder && nameParts.length > 1) {
        nameParts.pop()
      }
      this.uploadForm.fileName = nameParts.join('.') || fileInfo.name
      this.uploadStep = 1
    },
    resetUpload() {
      this.uploadStep = 0
      this.selectedFile = null
      this.uploadErrorMsg = ''
      this.uploadProgress = { current: 0, total: 0 }
      this.uploadForm.fileName = ''
      this.uploadForm.fileType = null
      this.isUploading = false
      this.isCancelled = false

      // 重新读取设置中的默认值
      if (window.electronAPI && window.electronAPI.getSettings) {
        window.electronAPI.getSettings().then(settings => {
          if (settings) {
            this.uploadForm.fileSubject = settings.defaultSubject || ''
            this.uploadForm.fileYear = settings.defaultYear || ''
          }
        })
      }
    },
    setUploadStep(step) {
      this.uploadStep = step
    },
    async cancelUpload() {
      if (!this.isUploading) return
      this.isCancelled = true
      try {
        if (window.electronAPI && window.electronAPI.cancelUpload) {
          await window.electronAPI.cancelUpload()
        }
      } catch (e) {
        console.error('取消上传失败:', e)
      }
    },
    async performUpload() {
      if (!this.selectedFile) return
      
      this.isUploading = true
      this.uploadErrorMsg = ''
      this.isCancelled = false
      
      try {
        const token = getToken()
        const baseUrl = import.meta.env.VITE_APP_TARGET_URL || 'http://localhost:8080'

        if (!this.selectedFile.isFolder) {
          const metadata = {
            fileName: this.uploadForm.fileName,
            fileSubject: this.uploadForm.fileSubject,
            fileYear: this.uploadForm.fileYear,
            fileType: this.uploadForm.fileType,
            fileSize: this.selectedFile.size || 0
          }

          const filePath = this.selectedFile.path
          const res = await window.electronAPI.uploadFile({ filePath, metadata, token, baseUrl })
          
          if (res.code === 200) {
            // 上传成功，更新用户上传计数
            const userStore = useUserStore()
            userStore.count += 1

            const settings = await window.electronAPI.getSettings()
            if (settings && settings.autoJumpAfterUpload) {
              this.resetUpload()
              return { success: true, autoJump: true }
            } else {
              this.uploadStep = 2
              return { success: true, autoJump: false }
            }
          } else {
            this.uploadErrorMsg = this.formatErrorMessage(res.msg)
            return { success: false, msg: this.uploadErrorMsg }
          }
        } else {
          // 文件夹批量上传逻辑
          const files = this.selectedFile.files
          this.uploadProgress = { current: 0, total: files.length }
          
          let successCount = 0
          let errorMsgs = []

          for (let i = 0; i < files.length; i++) {
            // 每次循环前检查是否已取消
            if (this.isCancelled) {
              this.uploadErrorMsg = `上传已手动取消 (已完成 ${successCount}/${files.length})`
              return { success: false, msg: this.uploadErrorMsg, cancelled: true }
            }

            const file = files[i]
            const filePath = file.path
            
            const relativePath = file.webkitRelativePath
            const folderPathParts = relativePath.split(/[/\\]/)
            folderPathParts.pop()
            
            let folderPath = folderPathParts.join('/')
            folderPath = folderPath.replace(/[()\[\]{}?*&^%$#@!+='",;:<>|\\]/g, '_')
            const safeFileName = file.name.replace(/[()\[\]{}?*&^%$#@!+='",;:<>|\\]/g, '_')

            const metadata = {
              fileName: safeFileName,
              fileSubject: this.uploadForm.fileSubject,
              fileYear: this.uploadForm.fileYear,
              fileType: this.uploadForm.fileType,
              fileSize: file.size || 0,
              remark: folderPath
            }

            try {
              const res = await window.electronAPI.uploadFile({ filePath, metadata, token, baseUrl })
              if (res.code === 200) {
                successCount++
                // 批量上传中每成功一个文件也更新计数
                const userStore = useUserStore()
                userStore.count += 1
              } else {
                errorMsgs.push(`${file.name}: ${this.formatErrorMessage(res.msg || '失败')}`)
              }
            } catch (e) {
              // 如果是因为取消导致的异常，直接退出
              if (this.isCancelled) {
                this.uploadErrorMsg = `上传已手动取消 (已完成 ${successCount}/${files.length})`
                return { success: false, msg: this.uploadErrorMsg, cancelled: true }
              }
              errorMsgs.push(`${file.name}: ${this.formatErrorMessage(e.message)}`)
            }
            
            this.uploadProgress.current = i + 1
          }

          if (successCount === files.length) {
            const settings = await window.electronAPI.getSettings()
            if (settings && settings.autoJumpAfterUpload) {
              this.resetUpload()
              return { success: true, autoJump: true }
            } else {
              this.uploadStep = 2
              return { success: true, autoJump: false }
            }
          } else if (successCount > 0) {
            this.uploadErrorMsg = `部分成功 (${successCount}/${files.length})。失败详情：${errorMsgs.slice(0, 3).join('; ')}`
            return { success: false, msg: this.uploadErrorMsg }
          } else {
            this.uploadErrorMsg = `全部失败！详情：${errorMsgs.slice(0, 3).join('; ')}`
            return { success: false, msg: this.uploadErrorMsg }
          }
        }
      } catch (error) {
        if (this.isCancelled) {
          this.uploadErrorMsg = '上传已手动取消'
          return { success: false, msg: this.uploadErrorMsg, cancelled: true }
        }
        console.error('上传异常:', error)
        this.uploadErrorMsg = this.formatErrorMessage(error.message || '未知错误')
        return { success: false, msg: this.uploadErrorMsg }
      } finally {
        this.isUploading = false
      }
    },
    formatErrorMessage(msg) {
      if (!msg) return '上传失败，请检查填写项或网络'
      const isYearError = msg.includes('NumberFormatException') || 
                         msg.includes('Integer') || 
                         msg.includes('convert') || 
                         msg.includes('typeMismatch')

      if (isYearError && this.uploadForm.fileYear && isNaN(Number(this.uploadForm.fileYear))) {
        return '文件年份必须填写为数字（如：2024）'
      }
      return msg
    }
  }
})

export default useUploadStore
