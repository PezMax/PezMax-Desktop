import DOMPurify from 'dompurify'

const RICH_TEXT_CONFIG = {
  USE_PROFILES: { html: true },
  ADD_ATTR: ['target', 'rel'],
  FORBID_TAGS: ['base', 'button', 'embed', 'form', 'iframe', 'input', 'link', 'meta', 'object', 'script', 'select', 'style', 'textarea'],
  FORBID_ATTR: ['style', 'srcset'],
  ALLOW_DATA_ATTR: false
}

let hooksInstalled = false

function isAllowedUrl(value, allowedProtocols) {
  const url = String(value || '').trim()
  if (!url || url.startsWith('#')) return true

  try {
    return allowedProtocols.includes(new URL(url).protocol)
  } catch {
    return false
  }
}

function installHooks() {
  if (hooksInstalled) return
  hooksInstalled = true

  DOMPurify.addHook('afterSanitizeAttributes', node => {
    if (node.nodeName === 'A') {
      const href = node.getAttribute('href')
      if (href && !isAllowedUrl(href, ['http:', 'https:', 'mailto:', 'tel:'])) {
        node.removeAttribute('href')
      }

      const target = node.getAttribute('target')
      if (target && !['_blank', '_self'].includes(target.toLowerCase())) {
        node.removeAttribute('target')
        node.removeAttribute('rel')
      } else if (target && target.toLowerCase() === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer')
      }
    }

    if (node.nodeName === 'IMG') {
      const src = node.getAttribute('src')
      if (src && !isAllowedUrl(src, ['http:', 'https:'])) {
        node.removeAttribute('src')
      }
      node.removeAttribute('srcset')
    }
  })
}

export function sanitizeRichText(value, options = {}) {
  installHooks()
  const html = String(value || '')
  const normalizedHtml = options.preserveLineBreaks ? html.replace(/\n/g, '<br/>') : html
  return DOMPurify.sanitize(normalizedHtml, RICH_TEXT_CONFIG)
}
