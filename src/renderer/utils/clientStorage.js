function getStorage() {
  try {
    return globalThis?.localStorage ?? null
  } catch {
    return null
  }
}

export function getStorageItem(key, fallback = '') {
  const storage = getStorage()
  if (!storage) return fallback
  const value = storage.getItem(key)
  return value == null ? fallback : value
}

export function setStorageItem(key, value) {
  const storage = getStorage()
  if (!storage) return value
  storage.setItem(key, String(value))
  return value
}

export function removeStorageItem(key) {
  const storage = getStorage()
  if (!storage) return
  storage.removeItem(key)
}
