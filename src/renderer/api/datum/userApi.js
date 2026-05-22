const DATUM_USER_API_BASE = import.meta.env.VITE_DATUM_USER_API_BASE || '/datum/user'

export function buildDatumUserApiUrl(path = '') {
  if (!path) return DATUM_USER_API_BASE
  return `${DATUM_USER_API_BASE}/${String(path).replace(/^\/+/, '')}`
}

export { DATUM_USER_API_BASE }
