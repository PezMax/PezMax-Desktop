/**
 * 与主界面设置弹窗一致：从 Electron 读取外观并应用到 document（主题 + 强调色）
 */
function hexToRgb(color) {
  const hex = color.replace('#', '').trim()
  if (hex.length !== 6) return null
  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16)
  ]
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

function getLightColor(color, level) {
  const rgb = hexToRgb(color)
  if (!rgb) return color
  return rgbToHex(
    Math.floor((255 - rgb[0]) * level + rgb[0]),
    Math.floor((255 - rgb[1]) * level + rgb[1]),
    Math.floor((255 - rgb[2]) * level + rgb[2])
  )
}

function getDarkColor(color, level) {
  const rgb = hexToRgb(color)
  if (!rgb) return color
  return rgbToHex(
    Math.floor(rgb[0] * (1 - level)),
    Math.floor(rgb[1] * (1 - level)),
    Math.floor(rgb[2] * (1 - level))
  )
}

export function resolveEditorVisibilityValue(settings = {}) {
  const directValue = Number(settings?.editorVisibility)
  if (Number.isFinite(directValue)) {
    return Math.min(100, Math.max(0, directValue))
  }

  // 兼容旧配置：由历史的透明度/模糊度反推出一个可见度值。
  const legacyOpacity = Number(settings?.editorOpacity ?? 0)
  const legacyBlur = Number(settings?.editorBlur ?? 0)
  const visibilityFromOpacity = 100 - Math.min(100, Math.max(0, legacyOpacity))
  const visibilityFromBlur = 100 - Math.min(100, Math.max(0, legacyBlur * 4))
  return Math.round((visibilityFromOpacity + visibilityFromBlur) / 2)
}

export function applyWorkspaceBackgroundSettings(settings = {}, enabled = true) {
  const root = document.documentElement
  if (!enabled || !settings?.backgroundImage) {
    root.style.removeProperty('--ide-bg-image')
    root.style.removeProperty('--ide-bg-opacity')
    root.style.removeProperty('--ide-bg-blur')
    root.style.removeProperty('--ide-editor-blur')
    root.style.removeProperty('--ide-editor-opacity')
    root.style.removeProperty('--ide-editor-surface-bg')
    root.classList.remove('has-custom-bg')
    return
  }

  const bgRgb = getComputedStyle(root).getPropertyValue('--ide-bg-rgb').trim() || '245, 247, 250'
  const editorVisibility = resolveEditorVisibilityValue(settings)
  const visibilityRatio = editorVisibility / 100
  const editorOpacity = 0.82 - visibilityRatio * 0.72
  const editorBlur = Math.round((1 - visibilityRatio) * 18)
  const editorSurfaceOpacity = Math.min(0.92, Math.max(0.16, editorOpacity + 0.16))

  root.style.setProperty('--ide-bg-image', `url(${settings.backgroundImage})`)
  root.style.setProperty('--ide-bg-opacity', (Number(settings.backgroundOpacity ?? 20) / 100).toFixed(2))
  root.style.setProperty('--ide-bg-blur', `${Number(settings.backgroundBlur ?? 0)}px`)
  root.style.setProperty('--ide-editor-blur', `${editorBlur}px`)
  root.style.setProperty('--ide-editor-opacity', editorOpacity.toFixed(2))
  root.style.setProperty('--ide-editor-surface-bg', `rgba(${bgRgb}, ${editorSurfaceOpacity.toFixed(2)})`)
  root.classList.add('has-custom-bg')
}

export function applyIdeAccentColor(color) {
  if (!color || typeof color !== 'string') return
  const rgb = hexToRgb(color)
  const isDark = document.documentElement.classList.contains('dark')
  const accentContrast = rgb
    ? ((rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 >= 160 ? '#0f172a' : '#ffffff')
    : '#ffffff'
  document.documentElement.style.setProperty('--ide-accent', color)
  document.documentElement.style.setProperty('--el-color-primary', color)
  document.documentElement.style.setProperty('--ide-accent-hover', `${color}CC`)
  document.documentElement.style.setProperty('--ide-accent-light', isDark ? `rgba(${rgb?.join(', ') || '64, 158, 255'}, 0.25)` : getLightColor(color, 0.88))
  document.documentElement.style.setProperty('--ide-accent-contrast', accentContrast)

  if (rgb) {
    document.documentElement.style.setProperty('--ide-accent-rgb', rgb.join(', '))
    document.documentElement.style.setProperty('--el-color-primary-rgb', rgb.join(', '))
  }

  for (let i = 1; i <= 9; i++) {
    document.documentElement.style.setProperty(`--el-color-primary-light-${i}`, getLightColor(color, i / 10))
    document.documentElement.style.setProperty(`--el-color-primary-dark-${i}`, getDarkColor(color, i / 10))
  }
}

export function applyIdeThemeState(isDark) {
  const vars = isDark
    ? {
        '--ide-bg': '#0f172a',
        '--ide-bg-rgb': '15, 23, 42',
        '--ide-header-bg': '#1e293b',
        '--ide-activity-bg': '#1e293b',
        '--ide-panel-bg': '#162032',
        '--ide-panel-bg-rgb': '22, 32, 50',
        '--ide-editor-bg': '#1e293b',
        '--ide-border': '#334155',
        '--ide-border-hover': '#475569',
        '--ide-text-active': '#ffffff',
        '--ide-text': '#f1f5f9',
        '--ide-text-light': '#cbd5e1',
        '--ide-tab-bg': '#0f172a',
        '--ide-tab-active-bg': '#1e293b',
        '--ide-status-bg': 'var(--ide-accent)',
        '--ide-status-text': '#ffffff',
        '--ide-shadow-1': '0 4px 16px rgba(0, 0, 0, 0.4)',
        '--ide-shadow-2': '0 8px 32px rgba(0, 0, 0, 0.6)',
        '--el-bg-color': 'var(--ide-editor-bg)',
        '--el-bg-color-overlay': 'var(--ide-panel-bg)',
        '--el-text-color-primary': 'var(--ide-text-active)',
        '--el-text-color-regular': 'var(--ide-text)',
        '--el-border-color': 'var(--ide-border)',
        '--el-border-color-light': 'var(--ide-border)',
        '--el-fill-color-blank': 'var(--ide-bg)'
      }
    : {
        '--ide-bg': '#f5f7fa',
        '--ide-bg-rgb': '245, 247, 250',
        '--ide-header-bg': '#e4eaf1',
        '--ide-activity-bg': '#ffffff',
        '--ide-panel-bg': '#ffffff',
        '--ide-panel-bg-rgb': '255, 255, 255',
        '--ide-editor-bg': '#ffffff',
        '--ide-border': '#ebeef5',
        '--ide-border-hover': '#dcdfe6',
        '--ide-text-active': '#303133',
        '--ide-text': '#606266',
        '--ide-text-light': '#909399',
        '--ide-tab-bg': '#f5f7fa',
        '--ide-tab-active-bg': '#ffffff',
        '--ide-status-bg': 'var(--ide-accent)',
        '--ide-status-text': '#ffffff',
        '--ide-shadow-1': '0 2px 12px rgba(0, 0, 0, 0.04)',
        '--ide-shadow-2': '0 4px 24px rgba(0, 0, 0, 0.08)',
        '--el-bg-color': '#ffffff',
        '--el-bg-color-overlay': '#ffffff',
        '--el-text-color-primary': '#303133',
        '--el-text-color-regular': '#606266',
        '--el-border-color': '#e4e7ed',
        '--el-border-color-light': '#e4e7ed',
        '--el-fill-color-blank': '#ffffff'
      }
  if (isDark) document.documentElement.classList.add('dark')
  else document.documentElement.classList.remove('dark')

  Object.entries(vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value)
  })
}

export function applyIdeThemeFromValue(theme) {
  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches)
  applyIdeThemeState(isDark)
}

let mediaQueryList = null
let mediaHandler = null

export async function applyIdeAppearanceFromSettings() {
  try {
    if (!window.electronAPI?.getSettings) return
    const s = await window.electronAPI.getSettings()
    const theme = s?.theme ?? 'light'

    if (mediaQueryList && mediaHandler) {
      mediaQueryList.removeEventListener('change', mediaHandler)
      mediaQueryList = null
      mediaHandler = null
    }

    if (theme === 'dark') {
      applyIdeThemeState(true)
    } else if (theme === 'light') {
      applyIdeThemeState(false)
    } else {
      mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
      mediaHandler = (e) => {
        applyIdeThemeState(e.matches)
        applyIdeAccentColor(s?.accentColor || '#409EFF')
      }
      mediaQueryList.addEventListener('change', mediaHandler)
      applyIdeThemeState(mediaQueryList.matches)
    }

    applyIdeAccentColor(s?.accentColor || '#409EFF')
    applyWorkspaceBackgroundSettings(s, true)
  } catch (e) {
    console.warn('[ideAppearance]', e)
  }
}

export function teardownIdeAppearanceMediaListener() {
  if (mediaQueryList && mediaHandler) {
    mediaQueryList.removeEventListener('change', mediaHandler)
    mediaQueryList = null
    mediaHandler = null
  }
}
