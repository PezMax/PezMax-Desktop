<!--页面顶部显示横向滚动的文字通知   lxq-->
<template>
  <div class="scroll-notice" v-if="noticeList && noticeList.length > 0">
    <div
      class="scroll-content"
      @mouseenter="isPaused = true"
      @mouseleave="isPaused = false"
      style="cursor: pointer;"
    >
      <div
        ref="trackRef"
        class="scroll-track"
        :class="{ paused: isPaused }"
        :style="trackStyle"
      >
        <div ref="groupRef" class="scroll-group">
          <template v-for="(item, i) in noticeList" :key="`a-${item.notifyId || item.id || i}`">
            <span class="notice-item">
              {{ item.title }}
              <span v-if="item.content" class="sep">|</span>
              {{ item.content }}
            </span>
          </template>
        </div>
        <div class="scroll-group" aria-hidden="true">
          <template v-for="(item, i) in noticeList" :key="`b-${item.notifyId || item.id || i}`">
            <span class="notice-item">
              {{ item.title }}
              <span v-if="item.content" class="sep">|</span>
              {{ item.content }}
            </span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  noticeList: {
    type: Array,
    default: () => []
  }
})

const trackRef = ref(null)
const groupRef = ref(null)
const isPaused = ref(false)
const scrollDistance = ref(0)
const duration = ref('20s')

const SCROLL_SPEED = 55

const trackStyle = computed(() => ({
  '--scroll-distance': `${scrollDistance.value}px`,
  animationDuration: duration.value
}))

const updateMetrics = () => {
  nextTick(() => {
    if (!trackRef.value || !groupRef.value) return

    const groupWidth = groupRef.value.getBoundingClientRect().width
    const containerWidth = trackRef.value.parentElement?.getBoundingClientRect().width || 0
    const distance = Math.max(groupWidth, containerWidth)

    scrollDistance.value = distance
    duration.value = `${Math.max(8, distance / SCROLL_SPEED).toFixed(2)}s`
  })
}

let resizeObserver = null

onMounted(() => {
  updateMetrics()

  if (window.ResizeObserver && trackRef.value?.parentElement) {
    resizeObserver = new ResizeObserver(() => {
      updateMetrics()
    })
    resizeObserver.observe(trackRef.value.parentElement)
    resizeObserver.observe(groupRef.value)
  } else {
    window.addEventListener('resize', updateMetrics)
  }
})

watch(
  () => props.noticeList,
  () => {
    updateMetrics()
  },
  { deep: true }
)

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  } else {
    window.removeEventListener('resize', updateMetrics)
  }
})
</script>

<style scoped>
.scroll-notice {
  display: flex;
  align-items: center;
  height: 32px;
  width: 100%;
  overflow: hidden;
  background-color: var(--ide-scroll-bg, #eef1f5);
  border-radius: 16px;
  padding: 0 16px;
  border: 1px solid var(--ide-scroll-border, #d9dee6);
}

.scroll-content {
  overflow: hidden;
  flex: 1;
  width: 100%;
  pointer-events: auto;
}

.scroll-track {
  display: flex;
  width: max-content;
  min-width: 100%;
  white-space: nowrap;
  will-change: transform;
  animation-name: scroll;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.scroll-group {
  display: inline-flex;
  flex-shrink: 0;
  width: max-content;
  min-width: 100%;
}

.notice-item {
  display: inline-flex;
  align-items: center;
  padding: 0 20px;
  font-size: 13px;
  color: var(--ide-scroll-text, var(--ide-text));
  flex-shrink: 0;
  white-space: nowrap;
}

.scroll-track.paused,
.scroll-content:hover .scroll-track {
  animation-play-state: paused !important;
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(-1 * var(--scroll-distance)));
  }
}

.sep {
  margin: 0 8px;
  color: var(--ide-scroll-sep, var(--ide-text-light));
}
:global(html.dark) .scroll-notice {
  --ide-scroll-bg: #222c3d;
  --ide-scroll-border: #3b4a60;
  --ide-scroll-text: #ffffff;
  --ide-scroll-sep: #cbd5e1;
}
</style>
