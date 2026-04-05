import { listUser, getUser, addUser, updateUser, delUser } from '../api/datum/user'
import { listSecurity, getSecurity, addSecurity, updateSecurity, delSecurity } from '../api/datum/security'
import { listReport, getReport, addReport, updateReport, delReport } from '../api/datum/report'
import { listNotification, getNotification, addNotification, updateNotification, delNotification }  from '../api/datum/notification'
import { listFile, getFile, addFile, updateFile, delFile } from '../api/datum/file'
import { listFavorite, getFavorite, addFavorite, updateFavorite, delFavorite } from '../api/datum/favorite'
import { listDownload, getDownload, addDownload, updateDownload, delDownload } from '../api/datum/download'
import { getToken, setToken, removeToken } from './auth'

const userApi = { listUser, getUser, addUser, updateUser, delUser }
const securityApi = { listSecurity, getSecurity, addSecurity, updateSecurity, delSecurity }
const reportApi = { listReport, getReport, addReport, updateReport, delReport }
const notificationApi = { listNotification, getNotification, addNotification, updateNotification, delNotification }
const fileApi = { listFile, getFile, addFile, updateFile, delFile }
const favoriteApi = { listFavorite, getFavorite, addFavorite, updateFavorite, delFavorite }
const downloadApi = { listDownload, getDownload, addDownload, updateDownload, delDownload }
const authApi = { getToken, setToken, removeToken }

const apiRegistry = {
  userApi,
  securityApi,
  reportApi,
  notificationApi,
  fileApi,
  favoriteApi,
  downloadApi,
  authApi
}

// 按名称查找 API 函数，支持从所有模块中查找
export function findApi(name) {
  for (const module of Object.values(apiRegistry)) {
    if (typeof module[name] === 'function') return module[name]
  }
  return null
}

export default apiRegistry
