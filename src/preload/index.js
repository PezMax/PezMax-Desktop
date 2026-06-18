import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('electronAPI', {
      callApi: (apiName, ...args) => ipcRenderer.invoke('call-api', apiName, ...args),
      selectFile: () => ipcRenderer.invoke('select-file'),
      uploadFile: (uploadData) => ipcRenderer.invoke('upload-file', uploadData),
      cancelUpload: () => ipcRenderer.invoke('cancel-upload'), // 新增取消上传接口
      selectFolder: () => ipcRenderer.invoke('select-folder'), // 新增文件夹选择接口
      readFolderPath: (path) => ipcRenderer.invoke('read-folder-path', path), // 新增拖拽文件夹读取接口
      windowControl: (action) => ipcRenderer.send('window-control', action), // 暴露窗口控制接口
      closeWindow: () => ipcRenderer.send('window-control', 'close'), // 强制关闭窗口（供通知弹窗等使用）
      setWindowMode: (mode) => ipcRenderer.send('set-window-mode', mode), // LYZ四次修改：切换认证页/主页面窗口模式，原因：仅认证页需要固定不可拖拽尺寸
      onWindowMaximized: (callback) => ipcRenderer.on('window-maximized', (event, isMaximized) => callback(isMaximized)), // 监听窗口最大化状态
      getSettings: () => ipcRenderer.invoke('get-settings'), // 读取本地设置
      getAppVersion: () => ipcRenderer.invoke('get-app-version'), // 获取应用版本号
      saveSettings: (settings) => ipcRenderer.send('save-settings', settings), // 异步保存本地设置
      selectBackgroundImage: () => ipcRenderer.invoke('select-background-image'), // 选择背景图片
      selectDownloadPath: () => ipcRenderer.invoke('select-download-path'), // 选择下载路径
      saveFile: (data) => ipcRenderer.invoke('save-file', data), // 保存文件到本地
      downloadFileDirectly: (data) => ipcRenderer.invoke('download-file-directly', data), // 触发底层下载
      onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data)), // 监听下载进度
      clearAppCache: () => ipcRenderer.invoke('clear-app-cache'), // 清除应用缓存
      openPath: (filePath) => ipcRenderer.invoke('open-path', filePath), // 用系统默认程序打开文件
      getUpdateInfo: () => ipcRenderer.invoke('update:get-info'),
      checkForUpdates: () => ipcRenderer.invoke('update:check'),
      downloadUpdate: () => ipcRenderer.invoke('update:download'),
      quitAndInstallUpdate: () => ipcRenderer.invoke('update:quit-and-install'),
      getPresetUpdateSources: () => ipcRenderer.invoke('update:get-preset-sources'),
      configureUpdateSource: (updateSource) => ipcRenderer.invoke('update:configure-source', updateSource),
      onUpdateStatus: (callback) => {
        const listener = (event, data) => callback(data)
        ipcRenderer.on('update-status', listener)
        return () => ipcRenderer.removeListener('update-status', listener)
      },
      platform: process.platform, // 暴露当前操作系统类型 (darwin, win32, linux)
      // 本地下载记录（SQLite）
      downloadRecords: {
        list: (userId) => ipcRenderer.invoke('download:list', userId),
        add: (record) => ipcRenderer.invoke('download:add', record),
        delete: (userId, fileId) => ipcRenderer.invoke('download:delete', { userId, fileId }),
        flush: () => ipcRenderer.invoke('download:flush')
      }
    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
