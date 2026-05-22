import { createVNode, render } from 'vue'
import SessionExpiredModal from './index.vue'

let modalInstance = null
let modalContainer = null

export function showSessionExpired() {
  return new Promise((resolve, reject) => {
    // 防止重复创建弹窗
    if (modalInstance) {
      return
    }

    modalContainer = document.createElement('div')
    document.body.appendChild(modalContainer)

    const removeModal = () => {
      if (modalContainer) {
        render(null, modalContainer)
        modalContainer.remove()
        modalContainer = null
      }
      modalInstance = null
    }

    const vnode = createVNode(SessionExpiredModal, {
      onConfirm: () => {
        resolve()
      },
      onCancel: () => {
        reject(new Error('cancel'))
      },
      remove: removeModal
    })

    render(vnode, modalContainer)
    modalInstance = vnode
  })
}
