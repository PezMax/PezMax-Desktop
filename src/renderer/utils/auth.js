const TokenKey = 'Admin-Token'

function getStorage() {
  try {
    return globalThis?.localStorage ?? null
  } catch {
    return null
  }
}

export function getToken() {
  return getStorage()?.getItem(TokenKey) || ''
}

export function setToken(token) {
  const storage = getStorage()
  if (!storage) return token
  storage.setItem(TokenKey, token)
  return token
}

export function removeToken() {
  const storage = getStorage()
  if (!storage) return
  storage.removeItem(TokenKey)
}
