import defAva from '@/assets/images/default_avatar.jpg'
import { isEmpty, isHttp } from '@/utils/validate'
import { normalizeFileUrl } from '@/utils/url'

export function normalizeAvatar(avatar) {
  const value = typeof avatar === 'string' ? avatar.trim() : ''
  if (isEmpty(value) || value === 'null' || value === 'default.png') return defAva
  if (value === defAva || value.startsWith('/src/') || value.startsWith('/static/')) return value
  
  // 使用统一的 URL 归一化工具处理所有文件路径（包括 MinIO、本地上传等）
  return normalizeFileUrl(value) || defAva
}
console.log('===== defAva 实际路径 =====', defAva)
