import { getStorageItem, setStorageItem } from '@/utils/clientStorage'
const useAppStore = defineStore(
  'app',
  {
    state: () => ({
      sidebar: {
        opened: getStorageItem('sidebarStatus', '1') === '1',
        withoutAnimation: false,
        hide: false
      },
      device: 'desktop',
      size: getStorageItem('size', 'default')
    }),
    actions: {
      toggleSideBar(withoutAnimation) {
        if (this.sidebar.hide) {
          return false
        }
        this.sidebar.opened = !this.sidebar.opened
        this.sidebar.withoutAnimation = withoutAnimation
        if (this.sidebar.opened) {
          setStorageItem('sidebarStatus', 1)
        } else {
          setStorageItem('sidebarStatus', 0)
        }
      },
      closeSideBar({ withoutAnimation }) {
        setStorageItem('sidebarStatus', 0)
        this.sidebar.opened = false
        this.sidebar.withoutAnimation = withoutAnimation
      },
      toggleDevice(device) {
        this.device = device
      },
      setSize(size) {
        this.size = size
        setStorageItem('size', size)
      },
      toggleSideBarHide(status) {
        this.sidebar.hide = status
      }
    }
  })

export default useAppStore
