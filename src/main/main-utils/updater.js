import fs from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { autoUpdater } from 'electron-updater'

const PLACEHOLDER_MARKERS = ['example.com', 'your-owner', 'your-repo']

const updateState = {
  currentVersion: app.getVersion(),
  configured: false,
  provider: '',
  feedTarget: '',
  status: 'idle',
  latestVersion: '',
  progress: 0,
  message: ''
}

let initialized = false
let currentWindow = null
let resolvedFeedConfig = null

const readTextIfExists = (filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return ''
    }
    return fs.readFileSync(filePath, 'utf8')
  } catch (error) {
    console.warn(`读取更新配置失败: ${filePath}`, error)
    return ''
  }
}

const normalizeValue = (value) => {
  if (value === undefined || value === null) return ''
  return String(value).trim()
}

const isPlaceholderValue = (value) => {
  const normalized = normalizeValue(value).toLowerCase()
  if (!normalized) return true
  return PLACEHOLDER_MARKERS.some((marker) => normalized.includes(marker))
}

const extractYamlValue = (content, key) => {
  const match = content.match(new RegExp(`^\\s*${key}:\\s*['"]?([^\\n'"]+)['"]?\\s*$`, 'm'))
  return normalizeValue(match?.[1])
}

const resolveFileBasedFeedConfig = () => {
  const configCandidates = [
    join(process.resourcesPath, 'app-update.yml'),
    join(process.cwd(), 'app-update.yml'),
    join(process.cwd(), 'dev-app-update.yml'),
    join(process.cwd(), 'electron-builder.yml')
  ]

  for (const candidate of configCandidates) {
    const content = readTextIfExists(candidate)
    if (!content) continue

    const provider = extractYamlValue(content, 'provider')
    const url = extractYamlValue(content, 'url')
    const owner = extractYamlValue(content, 'owner')
    const repo = extractYamlValue(content, 'repo')

    if (!provider) continue

    if (provider === 'generic' && !isPlaceholderValue(url)) {
      return {
        configured: true,
        provider,
        url,
        feedTarget: url
      }
    }

    if (provider === 'github' && !isPlaceholderValue(owner) && !isPlaceholderValue(repo)) {
      return {
        configured: true,
        provider,
        owner,
        repo,
        feedTarget: `${owner}/${repo}`
      }
    }
  }

  return null
}

const resolveFeedConfig = () => {
  const envProvider = normalizeValue(process.env.PTMJ_UPDATE_PROVIDER)
  const envUrl = normalizeValue(process.env.PTMJ_UPDATE_URL)
  const envOwner = normalizeValue(process.env.PTMJ_UPDATE_GH_OWNER)
  const envRepo = normalizeValue(process.env.PTMJ_UPDATE_GH_REPO)

  if (envProvider === 'generic' && !isPlaceholderValue(envUrl)) {
    return {
      configured: true,
      provider: 'generic',
      url: envUrl,
      feedTarget: envUrl
    }
  }

  if (envProvider === 'github' && !isPlaceholderValue(envOwner) && !isPlaceholderValue(envRepo)) {
    return {
      configured: true,
      provider: 'github',
      owner: envOwner,
      repo: envRepo,
      feedTarget: `${envOwner}/${envRepo}`
    }
  }

  const fileConfig = resolveFileBasedFeedConfig()
  if (fileConfig) {
    return fileConfig
  }

  return {
    configured: false,
    provider: envProvider || '',
    url: envUrl,
    owner: envOwner,
    repo: envRepo,
    feedTarget: ''
  }
}

const emitUpdateStatus = () => {
  if (!currentWindow || currentWindow.isDestroyed()) return
  currentWindow.webContents.send('update-status', { ...updateState })
}

const applyResolvedConfig = () => {
  resolvedFeedConfig = resolveFeedConfig()
  updateState.currentVersion = app.getVersion()
  updateState.configured = !!resolvedFeedConfig.configured
  updateState.provider = resolvedFeedConfig.provider || ''
  updateState.feedTarget = resolvedFeedConfig.feedTarget || ''
  updateState.status = resolvedFeedConfig.configured ? 'idle' : 'unconfigured'
  updateState.latestVersion = ''
  updateState.progress = 0
  updateState.message = resolvedFeedConfig.configured
    ? (app.isPackaged ? '已就绪，可检查更新。' : '更新源已识别，需使用打包版本测试更新。')
    : '未检测到有效更新源，请配置环境变量或发布源。'

  if (!resolvedFeedConfig.configured) {
    return
  }

  if (resolvedFeedConfig.provider === 'generic') {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: resolvedFeedConfig.url
    })
    return
  }

  if (resolvedFeedConfig.provider === 'github') {
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: resolvedFeedConfig.owner,
      repo: resolvedFeedConfig.repo
    })
  }
}

const registerUpdaterEvents = () => {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    updateState.status = 'checking'
    updateState.progress = 0
    updateState.message = '正在检查更新...'
    emitUpdateStatus()
  })

  autoUpdater.on('update-available', (info) => {
    updateState.status = 'available'
    updateState.latestVersion = normalizeValue(info?.version)
    updateState.progress = 0
    updateState.message = '检测到新版本，可手动下载。'
    emitUpdateStatus()
  })

  autoUpdater.on('update-not-available', () => {
    updateState.status = 'not-available'
    updateState.latestVersion = ''
    updateState.progress = 0
    updateState.message = '当前已是最新版本。'
    emitUpdateStatus()
  })

  autoUpdater.on('download-progress', (progressObj) => {
    updateState.status = 'downloading'
    updateState.progress = Math.max(0, Math.min(100, Math.round(progressObj?.percent || 0)))
    updateState.message = `正在下载更新 ${updateState.progress}%`
    emitUpdateStatus()
  })

  autoUpdater.on('update-downloaded', (info) => {
    updateState.status = 'downloaded'
    updateState.latestVersion = normalizeValue(info?.version) || updateState.latestVersion
    updateState.progress = 100
    updateState.message = '更新包已下载完成，可立即重启安装。'
    emitUpdateStatus()
  })

  autoUpdater.on('error', (error) => {
    updateState.status = 'error'
    updateState.message = error?.message || '更新失败，请稍后重试。'
    emitUpdateStatus()
  })
}

const ensureUpdaterReady = () => {
  if (!initialized) {
    registerUpdaterEvents()
    initialized = true
  }

  applyResolvedConfig()
  emitUpdateStatus()
}

export const initUpdater = (browserWindow) => {
  currentWindow = browserWindow
  ensureUpdaterReady()
}

export const getUpdateInfo = () => {
  ensureUpdaterReady()
  return { ...updateState }
}

export const checkForUpdates = async () => {
  ensureUpdaterReady()

  if (!updateState.configured) {
    updateState.status = 'unconfigured'
    updateState.message = '更新源未配置，无法检查更新。'
    emitUpdateStatus()
    return { success: false, reason: 'unconfigured' }
  }

  if (!app.isPackaged) {
    updateState.status = 'error'
    updateState.message = '开发环境不支持检查更新，请使用打包版本测试。'
    emitUpdateStatus()
    return { success: false, reason: 'development' }
  }

  await autoUpdater.checkForUpdates()
  return { success: true }
}

export const downloadUpdate = async () => {
  ensureUpdaterReady()

  if (!updateState.configured) {
    updateState.status = 'unconfigured'
    updateState.message = '更新源未配置，无法下载更新。'
    emitUpdateStatus()
    return { success: false, reason: 'unconfigured' }
  }

  if (!app.isPackaged) {
    updateState.status = 'error'
    updateState.message = '开发环境不支持下载更新，请使用打包版本测试。'
    emitUpdateStatus()
    return { success: false, reason: 'development' }
  }

  await autoUpdater.downloadUpdate()
  return { success: true }
}

export const quitAndInstallUpdate = () => {
  ensureUpdaterReady()

  if (updateState.status !== 'downloaded') {
    return { success: false, reason: 'not-ready' }
  }

  autoUpdater.quitAndInstall()
  return { success: true }
}
