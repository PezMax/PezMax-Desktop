/**
 * 修正并格式化文件 URL
 * 
 * 背景：后端（RuoYi/MinIO）在开发环境或 Docker 内部网络中常返回 localhost、127.0.0.1 
 * 或 minio 等内部主机名的 URL。在生产环境客户端（用户电脑）上无法直接访问这些地址。
 * 
 * 本工具自动将这些内部地址替换为生产环境配置的公网后端 IP。
 */

/**
 * 格式化文件 URL
 * @param {string} url 原始 URL
 * @returns {string} 格式化后的可访问 URL
 */
export function normalizeFileUrl(url) {
  if (!url || typeof url !== 'string') return ''
  
  const targetUrl = import.meta.env.VITE_APP_TARGET_URL || 'http://localhost:8080'
  const isProd = import.meta.env.VITE_APP_ENV === 'production'
  
  // 1. 处理相对路径 (如 /profile/upload/...)
  if (!url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('blob:')) {
    // 移除可能存在的重复前缀
    const cleanPath = url.replace(/^\/(dev-api|prod-api|stage-api)/, '')
    return cleanPath.startsWith('/') ? `${targetUrl}${cleanPath}` : `${targetUrl}/${cleanPath}`
  }
  
  // 2. 如果 URL 包含内部主机名（如 Docker 服务名），则替换为配置的后端 IP/主机名
  const internalHosts = ['localhost', '127.0.0.1', 'minio', 'server', '172.']
  const hasInternalHost = internalHosts.some(host => url.includes(host))
  
  if (hasInternalHost) {
    try {
      const parsedUrl = new URL(url)
      const parsedTarget = new URL(targetUrl)
      
      // 强制将内部主机名（如 minio）替换为配置的目标地址主机名（如 localhost）
      // 这样确保在任何环境下，文件请求都能正确导向后端机型
      if (parsedUrl.hostname !== parsedTarget.hostname) {
        parsedUrl.hostname = parsedTarget.hostname
        return parsedUrl.toString()
      }
    } catch (e) {
      console.warn('[URL Normalize] 解析失败:', url, e)
    }
  }
  
  return url
}
