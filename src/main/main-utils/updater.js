import fs from 'fs'
import { join, dirname } from 'path'
import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import { execSync } from 'child_process'

const PLACEHOLDER_MARKERS = ['example.com', 'your-owner', 'your-repo']

// 内置预设更新源
const PRESET_UPDATE_SOURCES = [
  {
    key: 'gh-proxy-latest',
    label: 'GitHub',
    provider: 'generic',
    // 通过 GH 代理访问 GitHub Releases 的最新版本下载目录
    url: 'https://gh-proxy.com/https://github.com/Torchman005/PezMax-Desktop/releases/latest/download'
  },
  {
    key: 'gh-proxy-v1',
    label: 'GitHub (v1.0.0)',
    provider: 'generic',
    url: 'https://gh-proxy.com/https://github.com/Torchman005/PezMax-Desktop/releases/download/v1.0.0'
  },
  {
    key: 'github-direct',
    label: 'GitHub 直连',
    provider: 'github',
    owner: 'Torchman005',
    repo: 'PezMax-Desktop'
  }
]

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
let userOverrideConfig = null

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
  // 1. 用户手动配置的更新源 (最高优先级)
  if (userOverrideConfig) {
    return userOverrideConfig
  }

  // 2. 环境变量配置
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

  // 3. 文件配置 (electron-builder.yml 等)
  const fileConfig = resolveFileBasedFeedConfig()
  if (fileConfig) {
    return fileConfig
  }

  // 4. 未配置
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

/**
 * 根据用户设置中的更新源配置重新设置 autoUpdater feed
 * @param {Object|null} updateSource - { provider, url, owner, repo } 或 null (清除覆盖)
 * @returns {Object} 新的 updateState
 */
export const configureFromSettings = (updateSource) => {
  if (updateSource && updateSource.provider) {
    const provider = normalizeValue(updateSource.provider)
    const url = normalizeValue(updateSource.url)
    const owner = normalizeValue(updateSource.owner)
    const repo = normalizeValue(updateSource.repo)

    if (provider === 'generic' && url && !isPlaceholderValue(url)) {
      userOverrideConfig = {
        configured: true,
        provider: 'generic',
        url,
        feedTarget: url
      }
    } else if (provider === 'github' && owner && repo && !isPlaceholderValue(owner) && !isPlaceholderValue(repo)) {
      userOverrideConfig = {
        configured: true,
        provider: 'github',
        owner,
        repo,
        feedTarget: `${owner}/${repo}`
      }
    } else {
      userOverrideConfig = {
        configured: false,
        provider: 'generic',
        url: url || '',
        feedTarget: url || ''
      }
    }
  } else {
    // 清除用户覆盖，回退到环境变量 / 文件配置
    userOverrideConfig = null
  }

  if (initialized) {
    applyResolvedConfig()
  }

  return { ...updateState }
}

/**
 * 获取内置预设更新源列表
 */
export const getPresetUpdateSources = () => {
  return PRESET_UPDATE_SOURCES.map((source) => ({ ...source }))
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

  updateState.status = 'installing'
  updateState.message = '正在准备安装更新...'
  emitUpdateStatus()

  // 通知渲染进程即将重启（渲染端已弹出确认框，此处记录状态即可）
  try {
    autoUpdater.quitAndInstall()
    return { success: true }
  } catch (error) {
    console.error('quitAndInstall 调用失败:', error)
    updateState.status = 'error'
    updateState.message = error?.message || '安装更新失败，请重试'
    emitUpdateStatus()
    return { success: false, reason: 'error', message: error?.message }
  }
}

// ================= 桌面快捷方式管理 =================

const SHORTCUT_STATE_FILE = 'shortcut-state.json'

/**
 * 检查桌面快捷方式是否存在
 * Windows: 检查用户桌面 + 公共桌面
 */
const checkDesktopShortcutExists = () => {
  try {
    const productName = 'PezMax'
    const userDesktop = join(app.getPath('desktop'), `${productName}.lnk`)
    if (fs.existsSync(userDesktop)) return true

    // 也检查公共桌面（All Users）
    const publicDesktop = join(
      process.env.PUBLIC || 'C:\\Users\\Public',
      'Desktop',
      `${productName}.lnk`
    )
    if (fs.existsSync(publicDesktop)) return true

    return false
  } catch (e) {
    console.error('检查桌面快捷方式失败:', e)
    return false
  }
}

/**
 * 更新前保存快捷方式状态
 */
const saveShortcutState = () => {
  try {
    const existed = checkDesktopShortcutExists()
    const statePath = join(app.getPath('userData'), SHORTCUT_STATE_FILE)
    fs.writeFileSync(statePath, JSON.stringify({ shortcutExisted: existed, savedAt: Date.now() }), 'utf8')
    console.log('快捷方式状态已保存:', { shortcutExisted: existed })
    return { success: true, shortcutExisted: existed }
  } catch (e) {
    console.error('保存快捷方式状态失败:', e)
    return { success: false, error: e.message }
  }
}

/**
 * 删除旧桌面快捷方式
 */
const removeOldShortcuts = () => {
  if (process.platform !== 'win32') return

  const productName = 'PezMax'
  const candidates = [
    join(app.getPath('desktop'), `${productName}.lnk`),
    join(process.env.PUBLIC || 'C:\\Users\\Public', 'Desktop', `${productName}.lnk`)
  ]

  for (const shortcutPath of candidates) {
    try {
      if (fs.existsSync(shortcutPath)) {
        fs.unlinkSync(shortcutPath)
        console.log('已删除旧快捷方式:', shortcutPath)
      }
    } catch (e) {
      console.error('删除旧快捷方式失败:', shortcutPath, e)
    }
  }
}

/**
 * 创建新的桌面快捷方式（指向当前可执行文件）
 */
const createDesktopShortcut = () => {
  if (process.platform !== 'win32') return

  const productName = 'PezMax'
  const desktopPath = app.getPath('desktop')
  const shortcutPath = join(desktopPath, `${productName}.lnk`)
  const targetPath = process.execPath
  const workingDir = dirname(targetPath)

  // 先清理可能残留的旧快捷方式
  removeOldShortcuts()

  try {
    // 使用 PowerShell 创建快捷方式（比 VBS 更可靠）
    const psScript = `
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut('${shortcutPath.replace(/'/g, "''")}')
$Shortcut.TargetPath = '${targetPath.replace(/'/g, "''")}'
$Shortcut.WorkingDirectory = '${workingDir.replace(/'/g, "''")}'
$Shortcut.Description = '${productName}'
$Shortcut.IconLocation = '${targetPath.replace(/'/g, "''")},0'
$Shortcut.Save()
Write-Output 'OK'
`
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"')}"`, {
      timeout: 15000,
      windowsHide: true
    })
    console.log('桌面快捷方式已创建:', shortcutPath)
  } catch (e) {
    console.error('创建桌面快捷方式失败:', e)
  }
}

/**
 * 启动时处理更新后的快捷方式重建
 * 读取之前保存的状态，如果更新前存在快捷方式则重建
 */
export const handleShortcutAfterUpdate = () => {
  // 仅在打包环境执行
  if (!app.isPackaged) return

  const statePath = join(app.getPath('userData'), SHORTCUT_STATE_FILE)
  if (!fs.existsSync(statePath)) return

  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'))
    if (state.shortcutExisted) {
      console.log('更新前桌面有快捷方式，重新创建...')
      createDesktopShortcut()
    } else {
      console.log('更新前桌面无快捷方式，跳过创建')
    }
    // 清理状态文件
    fs.unlinkSync(statePath)
  } catch (e) {
    console.error('处理更新后快捷方式失败:', e)
    // 状态文件损坏时也清理，避免反复尝试
    try { fs.unlinkSync(statePath) } catch (_) {}
  }
}

export const saveShortcutStateBeforeUpdate = () => {
  return saveShortcutState()
}
