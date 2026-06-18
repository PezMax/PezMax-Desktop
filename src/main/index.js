import { app, shell, BrowserWindow, ipcMain, globalShortcut, dialog, net } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { Blob } from 'buffer'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { apiRegistry,findApi } from './main-utils/apiRegistry'
import { checkForUpdates, configureFromSettings, downloadUpdate, getPresetUpdateSources, getUpdateInfo, initUpdater, quitAndInstallUpdate, saveShortcutStateBeforeUpdate, handleShortcutAfterUpdate } from './main-utils/updater'
import { insertDownloadRecord, listDownloadRecords, deleteDownloadRecord, flushDb, closeDatabase } from './main-utils/database'

// ================= 持久化设置与开机自启逻辑 =================
const settingsPath = join(app.getPath('userData'), 'ptmj-settings.json')
const defaultSettings = {
  autoStart: false,
  downloadPath: app.getPath('downloads'),
  theme: 'light',
  accentColor: '#409EFF',
  backgroundImage: '',
  backgroundOpacity: 20,
  backgroundBlur: 0,
  editorVisibility: 72,
  updateSource: null,  // { provider, url?, owner?, repo? } 用户手动配置的更新源
  autoJumpAfterUpload: true,
  defaultSchool: '',
  defaultSubject: '',
  defaultYear: '',
  silentDownload: false,
  shortcuts: {
    globalWake: 'CommandOrControl+Shift+Space', // 全局唤醒
    upload: 'CommandOrControl+U',               // 上传文件
    settings: 'CommandOrControl+,',             // 打开设置
    closeTab: 'CommandOrControl+W'              // 关闭标签
  }
}

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8')
      return { ...defaultSettings, ...JSON.parse(data) }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
  return defaultSettings
}

// 注册全局快捷键
function registerGlobalShortcuts(settings, win) {
  globalShortcut.unregisterAll()

  if (settings.shortcuts && settings.shortcuts.globalWake) {
    try {
      globalShortcut.register(settings.shortcuts.globalWake, () => {
        if (win) {
          if (win.isVisible() && win.isFocused()) {
            win.hide()
          } else {
            win.show()
            win.focus()
          }
        }
      })
    } catch (e) {
      console.error('注册全局快捷键失败:', e)
    }
  }
}

function saveSettings(settings, win) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8')

    // 设置开机自启逻辑 (仅在打包后的生产环境或明确要求下生效)
    if (app.isPackaged || true) {
      app.setLoginItemSettings({
        openAtLogin: settings.autoStart === true,
        path: process.execPath,
        args: []
      })
    }

    // 更新全局快捷键
    if (win) {
      registerGlobalShortcuts(settings, win)
    }
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

// 提前加载配置，用于初始化窗口背景色
const currentSettings = loadSettings()

// LYZ: 版本更新强制清理缓存逻辑
function checkVersionAndClearCache() {
  const lastVersion = currentSettings.lastRunVersion || '0.0.0'
  const currentVersion = app.getVersion()

  if (lastVersion !== currentVersion) {
    console.log(`检测到版本更新: ${lastVersion} -> ${currentVersion}，正在执行强制清理缓存...`)
    
    // 更新版本记录
    currentSettings.lastRunVersion = currentVersion
    saveSettings(currentSettings)

    // 在 ready 后执行清理
    app.whenReady().then(async () => {
      if (mainWindow && mainWindow.webContents) {
        await mainWindow.webContents.session.clearCache()
        await mainWindow.webContents.session.clearStorageData({
          // 仅清理缓存和持久化数据，保留 localStorage (用户设置)
          storages: ['appcache', 'cookies', 'filesystem', 'indexdb', 'shadercache', 'serviceworkers', 'cachestorage']
        })
        console.log('版本更新缓存清理完成')
      }
    })
  }
}

const DEFAULT_WINDOW_BOUNDS = Object.freeze({
  client: {
    width: 1180,
    height: 760,
    minWidth: 1180,
    minHeight: 700
  },
  admin: {
    width: 900,
    height: 670,
    minWidth: 900,
    minHeight: 670
  }
})

// LYZ四次修改：新增认证页固定窗口尺寸配置，原因：登录/注册/找回密码页面需要物理上禁止拖拽缩放，而主页面仍保持原有窗口能力
const AUTH_WINDOW_BOUNDS = Object.freeze({
  width: 1180,
  height: 760,
  minWidth: 1180,
  minHeight: 760,
  maxWidth: 1180,
  maxHeight: 760,
  resizable: false,
  maximizable: true,
  fullscreenable: true
})

function normalizeWindowValue(value, fallback) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback
}

function getWindowBounds(isClientLaunch) {
  // 生产环境 process.env.VITE_AUTH_ENTRY_MODE 可能为 undefined，此时默认按 client 处理
  const effectiveMode = isClientLaunch !== false // 只有明确为 false (admin) 时走 admin 路径
  const mode = effectiveMode ? 'client' : 'admin'
  const defaults = DEFAULT_WINDOW_BOUNDS[mode]
  const envPrefix = effectiveMode ? 'VITE_CLIENT_WINDOW' : 'VITE_ADMIN_WINDOW'
  const width = normalizeWindowValue(process.env[`${envPrefix}_WIDTH`], defaults.width)
  const height = normalizeWindowValue(process.env[`${envPrefix}_HEIGHT`], defaults.height)
  const minWidth = Math.min(
    width,
    normalizeWindowValue(process.env[`${envPrefix}_MIN_WIDTH`], defaults.minWidth)
  )
  const minHeight = Math.min(
    height,
    normalizeWindowValue(process.env[`${envPrefix}_MIN_HEIGHT`], defaults.minHeight)
  )

  return {
    width,
    height,
    minWidth,
    minHeight
  }
}

// LYZ四次修改：抽出窗口模式切换方法，原因：需要在认证页与主页面之间动态切换窗口是否可缩放以及尺寸上下限
let currentWindowMode = null

function applyWindowMode(mode) {
  if (!mainWindow || mainWindow.isDestroyed()) return

  // 防止重复设置相同模式时重复居中窗口
  if (mode === currentWindowMode) return
  currentWindowMode = mode

  if (mode === 'auth') {
    mainWindow.setResizable(AUTH_WINDOW_BOUNDS.resizable)
    mainWindow.setMaximizable(AUTH_WINDOW_BOUNDS.maximizable)
    mainWindow.setFullScreenable(AUTH_WINDOW_BOUNDS.fullscreenable)
    mainWindow.setMinimumSize(AUTH_WINDOW_BOUNDS.minWidth, AUTH_WINDOW_BOUNDS.minHeight)
    mainWindow.setMaximumSize(AUTH_WINDOW_BOUNDS.maxWidth, AUTH_WINDOW_BOUNDS.maxHeight)
    mainWindow.setSize(AUTH_WINDOW_BOUNDS.width, AUTH_WINDOW_BOUNDS.height)
    mainWindow.center()
    return
  }

  const isClientLaunch = process.env.VITE_AUTH_ENTRY_MODE === 'client'
  const windowBounds = getWindowBounds(isClientLaunch)
  mainWindow.setResizable(true)
  mainWindow.setMaximizable(true)
  mainWindow.setFullScreenable(true)
  // 0 表示不限制最大尺寸（Electron 文档），用 10000 在打包后可能干扰最小尺寸
  mainWindow.setMaximumSize(0, 0)
  mainWindow.setMinimumSize(windowBounds.minWidth, windowBounds.minHeight)
  const currentSize = mainWindow.getSize()
  const nextWidth = Math.max(currentSize[0], windowBounds.minWidth)
  const nextHeight = Math.max(currentSize[1], windowBounds.minHeight)
  mainWindow.setSize(nextWidth, nextHeight)
  mainWindow.center()
}

let mainWindow = null

function createWindow() {
  const isClientLaunch = process.env.VITE_AUTH_ENTRY_MODE === 'client'
  const windowBounds = getWindowBounds(isClientLaunch)
  // Create the browser window.
  mainWindow = new BrowserWindow({
    ...windowBounds,
    resizable: true,
    maximizable: true,
    fullscreenable: true,
    show: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    // 设置窗口图标，解决 Windows 任务栏图标可能显示不全或缺失的问题
    icon: icon,
    // 根据持久化的主题设置提前给窗口上底色，完美避免启动白屏闪烁！
    backgroundColor: currentSettings.theme === 'dark' ? '#0f172a' : '#f5f7fa',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,           // 关闭沙箱
      contextIsolation: true,   // 开启上下文隔离（这是关键安全措施）
      nodeIntegration: false,   // 禁用 Node 集成
      webSecurity: false,       // 禁用 Web 安全以允许从 file:// 协议跨域请求远程 API
      allowRunningInsecureContent: true, // 允许在 file:// 中加载 http 内容
      plugins: true             // 开启插件支持（必须开启才能在 Electron 中原生预览 PDF）
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    // 确保最小尺寸在窗口显示后生效（防止打包后失效）
    const bounds = getWindowBounds(process.env.VITE_AUTH_ENTRY_MODE === 'client')
    mainWindow.setMinimumSize(bounds.minWidth, bounds.minHeight)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 窗口状态监听
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized', false)
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 只在开发环境设置 DevTools 快捷键
  if (is.dev) {
    globalShortcut.register('F12', () => {
      mainWindow.webContents.openDevTools()
    })
  }

  // 生产环境也可以通过 F12 打开控制台便于排查网络问题
  if (!is.dev) {
    globalShortcut.register('F12', () => {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools()
      } else {
        mainWindow.webContents.openDevTools()
      }
    })
  }
}

// 通用API调用处理器
ipcMain.handle('call-api', async (event, apiName, ...args) => {
  const fn = findApi(apiName)
  if (!fn) {
    throw new Error(`API "${apiName}" not found`)
  }
  try {
    const result = await fn(...args)
    return result
  } catch (error) {
    console.error(`API ${apiName} 调用失败:`, error)
    throw error
  }
})

// 清理资源
app.on('will-quit', () => {
  // 注销所有全局快捷键
  globalShortcut.unregisterAll()
  // 关闭 SQLite 数据库
  closeDatabase()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // 清除本地缓存逻辑
  ipcMain.handle('clear-app-cache', async () => {
    try {
      if (mainWindow && mainWindow.webContents) {
        // 1. 清除 WebContents 缓存 (内存缓存, HTTP 缓存等)
        await mainWindow.webContents.session.clearCache()
        // 2. 清除 Storage Data (LocalStorage, Cookies, IndexedDB 等)
        // 注意：这会清除所有数据，包括登录状态和本地设置
        // 如果只想清除缓存不清除设置，可以指定特定的 storages
        await mainWindow.webContents.session.clearStorageData({
          storages: ['appcache', 'cookies', 'filesystem', 'indexdb', 'shadercache', 'serviceworkers', 'cachestorage']
          // 排除 'localstorage' 以保留用户设置
        })
        return { success: true }
      }
      return { success: false, msg: '窗口实例不存在' }
    } catch (error) {
      console.error('清除缓存失败:', error)
      return { success: false, msg: error.message }
    }
  })

  // Settings IPC
  ipcMain.handle('get-settings', () => {
    const settings = loadSettings()
    // 启动时同步更新源配置
    if (settings.updateSource) {
      configureFromSettings(settings.updateSource)
    }
    return settings
  })
  ipcMain.handle('get-app-version', () => app.getVersion())
  ipcMain.on('save-settings', (event, settings) => {
    saveSettings(settings, mainWindow)
    // 保存设置时同步更新源配置
    if (settings.updateSource !== undefined) {
      configureFromSettings(settings.updateSource || null)
    }
  })
  ipcMain.handle('update:get-info', () => getUpdateInfo())
  ipcMain.handle('update:check', () => checkForUpdates())
  ipcMain.handle('update:download', () => downloadUpdate())
  ipcMain.handle('update:quit-and-install', () => quitAndInstallUpdate())
  ipcMain.handle('update:save-shortcut-state', () => saveShortcutStateBeforeUpdate())

  // 更新源配置
  ipcMain.handle('update:get-preset-sources', () => getPresetUpdateSources())
  ipcMain.handle('update:configure-source', (event, updateSource) => {
    const newState = configureFromSettings(updateSource)
    return newState
  })

  // 处理保存文件
  ipcMain.handle('save-file', async (event, { content, fileName, folderPath, skipDialog }) => {
    try {
      const settings = loadSettings()
      const saveDir = folderPath || settings.downloadPath || app.getPath('downloads')
      const defaultSavePath = join(saveDir, fileName)

      let finalFilePath = defaultSavePath

      // 如果没有开启静默下载且未指定跳过对话框，则弹出选择框
      if (!skipDialog && !settings.silentDownload) {
        const result = await dialog.showSaveDialog(mainWindow, {
          defaultPath: defaultSavePath,
          title: '保存文件',
          buttonLabel: '保存'
        })

        if (result.canceled || !result.filePath) {
          return { success: false, reason: 'canceled' }
        }
        finalFilePath = result.filePath
      } else {
        // 如果是静默下载，且文件已存在，则自动重命名（例如 test.pdf -> test (1).pdf）
        let counter = 1
        const path = require('path')
        const ext = path.extname(fileName)
        const base = path.basename(fileName, ext)
        
        while (fs.existsSync(finalFilePath)) {
          finalFilePath = join(saveDir, `${base} (${counter})${ext}`)
          counter++
        }
      }

      // content 应该是 Buffer 或 Uint8Array
      // sxm: 增加 Buffer 转换逻辑，确保写入正确
      const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content)
      fs.writeFileSync(finalFilePath, buffer)
      return { success: true, filePath: finalFilePath }
    } catch (error) {
      console.error('保存文件失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 用系统默认程序打开文件
  ipcMain.handle('open-path', async (event, filePath) => {
    return shell.openPath(filePath)
  })

  // ================= 本地下载记录（SQLite） =================
  ipcMain.handle('download:list', async (event, userId) => {
    try {
      const rows = await listDownloadRecords(userId)
      return { success: true, rows }
    } catch (e) {
      console.error('[download:list] 查询下载记录失败:', e)
      return { success: false, rows: [], message: e.message }
    }
  })

  ipcMain.handle('download:add', async (event, record) => {
    try {
      console.log('[download:add] 收到记录:', JSON.stringify(record))
      await insertDownloadRecord(record)
      // 不自动刷盘 — 由调用方决定何时 flush
      return { success: true }
    } catch (e) {
      console.error('[download:add] 插入下载记录失败:', e)
      return { success: false, message: e.message }
    }
  })

  ipcMain.handle('download:delete', async (event, { userId, fileId }) => {
    try {
      console.log('[download:delete] userId=', userId, 'fileId=', fileId)
      await deleteDownloadRecord(userId, fileId)
      // deleteDownloadRecord 内部已 saveDb
      return { success: true }
    } catch (e) {
      console.error('[download:delete] 删除下载记录失败:', e)
      return { success: false, message: e.message }
    }
  })

  // 批量下载完成后一次性刷盘
  ipcMain.handle('download:flush', async () => {
    try {
      flushDb()
      return { success: true }
    } catch (e) {
      console.error('[download:flush] 刷盘失败:', e)
      return { success: false, message: e.message }
    }
  })

  // 处理选择下载文件夹
  ipcMain.handle('select-download-path', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: '选择默认下载保存路径'
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  // ================= 核心：彻底接管下载（文件流直写方案） =================
  ipcMain.handle('download-file-directly', async (event, { url, fileName, token }) => {
    return new Promise((resolve, reject) => {
      try {
        // 1. 读取最新设置
        const settings = loadSettings()
        const defaultPath = settings.downloadPath || app.getPath('downloads')

        let finalSavePath = join(defaultPath, fileName)

        // 2. 如果没有开启静默下载，则弹出选择框
        if (!settings.silentDownload) {
          const saveDialogResult = dialog.showSaveDialogSync(mainWindow, {
            defaultPath: finalSavePath,
            title: '保存文件'
          })

          if (!saveDialogResult) {
            // 用户取消了保存
            resolve({ success: false, reason: 'canceled' })
            return
          }
          finalSavePath = saveDialogResult
        }

        // 3. 使用 Electron 的 net 模块发起请求
        const request = net.request(url)
        if (token) {
          request.setHeader('Authorization', `Bearer ${token}`)
        }

        request.on('response', (response) => {
          // 确保请求成功
          if (response.statusCode !== 200) {
            reject(new Error(`下载失败，服务器返回: ${response.statusCode}`))
            return
          }

          const totalSize = parseInt(response.headers['content-length'] || 0, 10)
          let downloadedSize = 0

          // 创建文件写入流
          const fileStream = fs.createWriteStream(finalSavePath)

          response.on('data', (chunk) => {
            downloadedSize += chunk.length
            fileStream.write(chunk)

            // 计算进度并通过 IPC 发送给前端 (可选，留作后续展示进度条用)
            if (totalSize > 0) {
              const progress = ((downloadedSize / totalSize) * 100).toFixed(2)
              event.sender.send('download-progress', { fileName, progress })
            }
          })

          response.on('end', () => {
            fileStream.end()
            console.log('文件流直写完成:', finalSavePath)
            resolve({ success: true, savedPath: finalSavePath })
          })

          response.on('error', (err) => {
            fileStream.destroy()
            // 下载出错时，清理已创建的残余文件
            if (fs.existsSync(finalSavePath)) {
              fs.unlinkSync(finalSavePath)
            }
            reject(err)
          })
        })

        request.on('error', (err) => {
          reject(err)
        })

        request.end()
      } catch (error) {
        console.error('底层下载任务异常:', error)
        reject(error)
      }
    })
  })
  // =========================================================
  // 窗口控制逻辑 (最大化、最小化、关闭)
  ipcMain.on('window-control', (event, action) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    switch (action) {
      case 'close':
        win.close()
        break
      case 'minimize':
        win.minimize()
        break
      case 'maximize':
        if (win.isMaximized()) {
          win.unmaximize()
        } else {
          win.maximize()
        }
        break
    }
  })

  // LYZ四次修改：新增窗口模式切换 IPC，原因：前端路由切换到认证页时需要通知主进程锁定窗口尺寸，离开时恢复
  ipcMain.on('set-window-mode', (event, mode) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win || win !== mainWindow) return
    applyWindowMode(mode)
  })

  // 选择并读取背景图片
  ipcMain.handle('select-background-image', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      title: '选择工作区背景图片',
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }
      ]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const filePath = result.filePaths[0]
    try {
      const path = require('path')
      const buffer = fs.readFileSync(filePath)
      const ext = path.extname(filePath).substring(1).toLowerCase()
      const mimeType = ext === 'jpg' ? 'jpeg' : ext
      const base64Str = `data:image/${mimeType};base64,${buffer.toString('base64')}`
      return base64Str
    } catch (err) {
      console.error('读取背景图片失败:', err)
      return null
    }
  })

  // 处理选择文件
  ipcMain.handle('select-file', async () => {
    try {
      // 获取当前活跃的窗口，作为文件选择器的父窗口，强制使其置顶避免被遮挡
      const focusedWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]

      const result = await dialog.showOpenDialog(focusedWindow, {
        properties: ['openFile'],
        title: '选择要上传的文件'
      })

      if (result.canceled || result.filePaths.length === 0) {
        return null
      }

      const filePath = result.filePaths[0]
      const fileName = filePath.split(/[/\\]/).pop()

      // 获取文件大小
      const fs = require('fs')
      let fileSize = 0
      let preview = ''
      try {
        const stats = fs.statSync(filePath)
        fileSize = stats.size

        // 读取预览图 (Base64) - 仅针对图片
        const ext = fileName.split('.').pop().toLowerCase()
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
          const buffer = fs.readFileSync(filePath)
          preview = `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buffer.toString('base64')}`
        }
      } catch (e) {
        console.error('获取文件信息失败:', e)
      }

      return {
        path: filePath,
        name: fileName,
        size: fileSize,
        preview
      }
    } catch (err) {
      console.error('打开文件选择器异常:', err)
      return null
    }
  })

  // 提取读取文件夹内容的公共函数
  const readFolderRecursively = (folderPath) => {
    const fs = require('fs')
    const path = require('path')

    // 将路径中的斜杠统一转换为操作系统的分隔符
    const normalizedPath = path.normalize(folderPath)
    const folderName = path.basename(normalizedPath)

    const fileList = []
    let totalSize = 0

    const readDir = (dir, relativePath = '') => {
      const items = fs.readdirSync(dir)
      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stats = fs.statSync(fullPath)

        // 保证相对路径中一律使用正斜杠 '/'，这符合 webkitRelativePath 规范和前端期望
        const newRelativePath = relativePath ? `${relativePath}/${item}` : item

        if (stats.isDirectory()) {
          readDir(fullPath, newRelativePath)
        } else {
          fileList.push({
            path: fullPath, // 物理路径
            name: item,
            size: stats.size,
            webkitRelativePath: `${folderName}/${newRelativePath}`
          })
          totalSize += stats.size
        }
      }
    }

    readDir(normalizedPath)

    return {
      name: folderName,
      size: totalSize,
      isFolder: true,
      files: fileList
    }
  }

  // 处理选择文件夹（批量上传）
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: '选择要上传的文件夹'
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    try {
      return readFolderRecursively(result.filePaths[0])
    } catch (e) {
      console.error('读取文件夹失败:', e)
      return null
    }
  })

  // 处理拖拽读取文件夹
  ipcMain.handle('read-folder-path', async (event, folderPath) => {
    try {
      return readFolderRecursively(folderPath)
    } catch (e) {
      console.error('读取拖拽文件夹失败:', e)
      return null
    }
  })

  // 上传取消控制器映射，支持同时取消
  let uploadAbortController = null

  ipcMain.handle('cancel-upload', () => {
    if (uploadAbortController) {
      uploadAbortController.abort()
      uploadAbortController = null
      return { success: true }
    }
    return { success: false, msg: '没有正在运行的上传任务' }
  })

  // 处理文件上传 (通用方法)
  ipcMain.handle('upload-file', async (event, uploadData) => {
    try {
      const { filePath, metadata, token, baseUrl, customApiUrl } = uploadData

      if (!fs.existsSync(filePath)) {
        throw new Error('文件不存在: ' + filePath)
      }

      // 每次上传开始前，创建一个新的 AbortController
      uploadAbortController = new AbortController()
      const { signal } = uploadAbortController

      // 使用 Node.js 的原生 fetch 和 FormData 进行直传，匹配后端 @RequestParam("file")
      const fileBuffer = fs.readFileSync(filePath)
      const fileName = filePath.split(/[/\\]/).pop()
      const blob = new Blob([fileBuffer])

      const formData = new FormData()
      // "file" 字段对应后端 @RequestParam("file")
      formData.append('file', blob, fileName)

      // 遍历元数据，添加到 formData（对应后端的 @RequestParam 字段）
      if (metadata) {
        for (const key in metadata) {
          if (metadata[key] !== undefined && metadata[key] !== null && metadata[key] !== '') {
            formData.append(key, metadata[key])
          }
        }
      }

      let apiUrl = customApiUrl || (baseUrl ? `${baseUrl}/datum/file` : 'http://localhost:8080/datum/file')

      console.log('upload-file 请求准备:', {
        apiUrl,
        fileName,
        fileSize: fileBuffer.length,
        metadataKeys: metadata ? Object.keys(metadata) : []
      })

      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: formData,
        signal // 传入取消信号
      })

      // 上传完成后清除控制器（如果是正常结束）
      uploadAbortController = null

      const status = response.status
      let result
      try {
        result = await response.json()
      } catch {
        const text = await response.text()
        console.error('upload-file 响应解析 JSON 失败，状态码:', status, '响应体:', text.substring(0, 500))
        // 兼容后端异常时直接返回错误信息字符串的情况
        return { code: status !== 200 ? status : 500, msg: text || `服务器异常 (状态码: ${status})` }
      }

      if (status !== 200) {
        console.error('upload-file 请求失败，状态码:', status, '响应:', result)
      } else {
        console.log('upload-file 请求成功:', {
          status,
          code: result?.code
        })
      }

      return result
    } catch (error) {
      console.error('主进程上传文件失败:', error)
      throw error
    }
  })

  createWindow()
  checkVersionAndClearCache() // 检测版本更新并清理缓存
  initUpdater(mainWindow)
  handleShortcutAfterUpdate() // 更新后重建桌面快捷方式

  // 初始化时注册全局快捷键
  registerGlobalShortcuts(currentSettings, mainWindow)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      initUpdater(mainWindow)
    }
  })
})

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)
})

process.on('unhandledRejection', (error) => {
  console.error('未处理的 Promise 拒绝:', error)
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
