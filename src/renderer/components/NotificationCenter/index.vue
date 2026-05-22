<!--通知中心样式   lxq-->
<template>
  <div ref="centerRef" class="notification-center">
    <!-- 通知图标 -->
    <div class="notification-icon-wrapper" @click.stop="togglePanel">
      <svg-icon icon-class="message" class="notification-icon" />
    </div>

    <!-- 通知中心面板 -->
    <div v-if="showPanel" class="notification-panel">
      <div class="panel-header">
        <h3>通知中心</h3>
      </div>

      <div class="notification-list">
        <div
          v-for="item in notificationList"
          :key="item.notifyId || item.id"
          class="notification-item"
          @click="showDetail(item)"
        >
          <div class="item-icon">
            <img v-if="item.notifyType === '1'" src="@/assets/images/notification/rocket.svg" alt="版本更新" />
            <img v-else-if="item.notifyType === '2'" src="@/assets/images/notification/wrench.svg" alt="系统故障" />
            <img v-else-if="item.notifyType === '3'" src="@/assets/images/notification/wrench.svg" alt="系统维护" />
            <img v-else-if="item.notifyType === '4'" src="@/assets/images/notification/exclamation mark.png" alt="资料下架" />
            <img v-else class="bell-icon" src="@/assets/images/notification/bell.svg" alt="通知" />
          </div>
          <div class="item-content">
            <div class="item-title">{{ item.title }}</div>
            <div class="item-time">{{ formatTime(item.createTime) }}</div>
          </div>
        </div>

        <div v-if="notificationList.length === 0" class="empty-notification">
          暂无通知
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getUserPopupNotifications, getUserScrollNotifications } from '@/api/datum/notification'
import useUserStore from '@/store/modules/user'

// 状态管理
const centerRef = ref(null)
const showPanel = ref(false)
const notificationList = ref([])
const userStore = useUserStore()
// 切换通知中心面板
const togglePanel = async () => {
  showPanel.value = !showPanel.value
  if (showPanel.value) {
    await loadNotifications()
  }
}

// 加载通知
const loadNotifications = async () => {
  //LYZ三次修改：未登录时直接清空并返回，防止调用需鉴权接口
  // if (!getToken()) {
  //   notificationList.value = []
  //   return
  // }
  try {
    let userId = userStore.id
    if (!userId) {
      await userStore.getInfo()
      userId = userStore.id
    }

    // 获取弹窗通知
    const popupRes = await getUserPopupNotifications(userId)
    const popupNotifications = popupRes.code === 200 && popupRes.data ? popupRes.data : []

    // 获取滚动通知
    const scrollRes = await getUserScrollNotifications()
    const scrollNotifications = scrollRes.code === 200 && scrollRes.data ? scrollRes.data : []

    // 合并所有通知
    const allNotifications = [...popupNotifications, ...scrollNotifications]

    // 按创建时间排序（最新的在前）
    allNotifications.sort((a, b) => {
      const timeA = new Date(a.createTime || 0).getTime()
      const timeB = new Date(b.createTime || 0).getTime()
      return timeB - timeA
    })

    notificationList.value = allNotifications
  } catch (error) {
    console.error('获取通知失败:', error)
  }
}

// 显示通知详情
const showDetail = (item) => {
  // 使用现有的 NotificationDialog 组件
  const event = new CustomEvent('showNotification', {
    detail: item
  })
  window.dispatchEvent(event)
  showPanel.value = false
}

const handleDocumentClick = (event) => {
  if (!showPanel.value) return
  if (centerRef.value && !centerRef.value.contains(event.target)) {
    showPanel.value = false
  }
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString()
}

// 组件挂载时加载通知
onMounted(() => {
  loadNotifications()
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.notification-center {
  position: relative;
  z-index: 100;
}

.notification-icon-wrapper {
  cursor: pointer;
  padding: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  .notification-icon {
    font-size: 20px;
    color: var(--ide-text);
  }

  &:hover {
    color: var(--ide-accent);
    transform: translateY(-1px);
  }
}

.notification-panel {
  position: absolute;
  top: 100%;
  right: -32px;
  margin-top: 8px;
  width: clamp(260px, 20vw, 320px);
  max-width: min(320px, calc(100vw - 24px));
  background: var(--ide-notification-panel-bg);
  border: 1px solid var(--ide-notification-panel-border);
  border-radius: 16px;
  box-shadow: none;
  z-index: 1000;
  max-height: min(340px, calc(100vh - 120px));
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--ide-border);
  background: var(--ide-header-bg);

  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--ide-text-active);
    letter-spacing: 0.2px;
  }
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  max-height: min(260px, calc(100vh - 220px));
  background: var(--ide-notification-list-bg);

  .notification-item {
    display: flex;
    align-items: center;
    padding: 12px 14px;
    border-bottom: 1px solid var(--ide-border);
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.2s ease;

    &:hover {
      background-color: var(--ide-notification-item-hover-bg);
    }

    .item-icon {
      width: 36px;
      height: 36px;
      margin-right: 12px;

      img {
        width: 100%;
        height: 100%;
        opacity: 0.82;
      }
      .bell-icon {
        filter: brightness(0) saturate(100%) invert(46%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(88%);
        opacity: 1;
      }
    }

    .item-content {
      flex: 1;
      overflow: hidden;

      .item-title {
        font-size: 13px;
        color: var(--ide-text-active);
        font-weight: 400;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .item-time {
        font-size: 11px;
        color: var(--ide-text-light);
        margin-top: 4px;
      }
    }
  }

  .empty-notification {
    padding: 40px 20px;
    text-align: center;
    color: var(--ide-text-active);
    background: transparent;
    font-size: 16px;
  }
}
:global(html.dark) .notification-panel {
  background: var(--ide-panel-bg);
  border: 1px solid var(--ide-border);
}

:global(html.dark) .panel-header {
  background: var(--ide-header-bg);
  border-bottom: 1px solid var(--ide-border);
}

:global(html.dark) .notification-list {
  background: var(--ide-panel-bg);
}


:global(html.dark) .panel-header h3,
:global(html.dark) .item-title {
  color: var(--ide-text-active);
}

:global(html.dark) .item-time {
  color: var(--ide-text-light);
}
:global(:root) {
  --ide-notification-panel-bg: #f8fafc;
  --ide-notification-panel-border: rgba(0, 0, 0, 0.08);
  --ide-notification-header-bg: #eef2f7;
  --ide-notification-list-bg: #ffffff;
  --ide-notification-item-hover-bg: rgba(0, 0, 0, 0.04);
}

:global(html.dark) {
  --ide-notification-panel-bg: #1b2236;
  --ide-notification-panel-border: rgba(255, 255, 255, 0.08);
  --ide-notification-header-bg: #20283d;
  --ide-notification-list-bg: #1b2236;
  --ide-notification-item-hover-bg: #0f172a;
}
</style>
