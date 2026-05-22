import router from '@/router'
import { ElMessageBox, } from 'element-plus'
import { login, logout, getInfo } from '@/api/login'
import { getToken, setToken, removeToken } from '@/utils/auth'
import useLockStore from '@/store/modules/lock'
import { normalizeAvatar } from '@/utils/avatar'
import defAva from '@/assets/images/default_avatar.jpg'

const useUserStore = defineStore(
  'user',
  {
    state: () => ({
      token: getToken(),
      id: '',
      name: '',
      nickName: '',
      avatar: '',
      count: 0,
      roles: [],
      permissions: []
    }),
    actions: {
      // 登录
      login(userInfo) {
        const username = (userInfo.userName ?? userInfo.username ?? '').trim() //LYZ三次修改：兼容userName/username两种登录字段
        const password = userInfo.password
        const code = userInfo.code
        const uuid = userInfo.uuid
        return new Promise((resolve, reject) => {
          login(username, password, code, uuid).then(res => {
          //LYZ三次修改：增加对登录响应中token的兼容处理，优先使用res.token，如果res.token不存在，则使用res.data?.token
          const token = res.token || res.data?.token
          if (!token) {
            return reject(new Error('登录响应缺少 token'))
          }
          setToken(token)
          this.token = token

           //LYZ四次修改：登录成功后立即获取用户信息，检查是否被封号
          getInfo().then(info => {
          const payload = info.data || info
          const status = payload?.user?.status

          if (String(status) === '0') {
            removeToken()
            this.token = ''
            reject(new Error('账号已被封禁，无法登录'))
            return
          }

          useLockStore().unlockScreen()
          resolve()
        }).catch(reject)    
          }).catch(error => {
            reject(error)
          })
        })
      },
      // 获取用户信息
      getInfo() {
        return new Promise((resolve, reject) => {
          getInfo().then(res => {
            const payload = res.data || res //LYZ三次修改：兼容后端AjaxResult的data包装
            const user = payload.user
            if (!user) {
              reject(new Error('获取用户信息失败：响应缺少 user'))
              return
            }
            const avatar = normalizeAvatar(user.avatar)
            console.log('===== 头像处理结果 =====', '输入:', user.avatar, '输出:', avatar)
            const roles = payload.roles || []
            const permissions = payload.permissions || []
            if (roles.length > 0) { // 验证返回的roles是否是一个非空数组
              this.roles = roles
              this.permissions = permissions
            } else {
              this.roles = ['ROLE_DEFAULT']
              this.permissions = permissions
            }
            this.id = user.userId
            this.name = user.userName
            this.nickName = user.nickName
            this.avatar = avatar
            this.count = Number(user.count || user.uploadCount || 0)
            /* 初始密码提示 */
            if(payload.isDefaultModifyPwd) {
              ElMessageBox.confirm('您的密码还是初始密码，请修改密码！',  '安全提示', {  confirmButtonText: '确定',  cancelButtonText: '取消',  type: 'warning' }).then(() => {
                router.push({ name: 'PtmjUserCenter', query: { activeSection: 'resetPwd' } })
              }).catch(() => {})
            }
            /* 过期密码提示 */
            if(!payload.isDefaultModifyPwd && payload.isPasswordExpired) {
              ElMessageBox.confirm('您的密码已过期，请尽快修改密码！',  '安全提示', {  confirmButtonText: '确定',  cancelButtonText: '取消',  type: 'warning' }).then(() => {
                router.push({ name: 'PtmjUserCenter', query: { activeSection: 'resetPwd' } })
              }).catch(() => {})
            }
            resolve(payload)
          }).catch(error => {
            reject(error)
          })
        })
      },
      // 退出系统
      logOut() {
        return new Promise((resolve, reject) => {
          logout(this.token).then(() => {
            this.token = ''
            this.roles = []
            this.permissions = []
            removeToken()
            resolve()
          }).catch(error => {
            reject(error)
          })
        })
      }
    }
  })

export default useUserStore
