<template>
  <div id="app">
    <!-- 全局统一的标题栏，自适应 Win/Mac，内置用户信息和通知 -->
    <TitleHeader />
    <div class="app-main-content">
      <RouterView />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch, ref } from 'vue'
import { useRoute } from 'vue-router'
import TitleHeader from '@/components/TitleHeader/index.vue'
import { applyIdeAppearanceFromSettings, applyIdeThemeState, teardownIdeAppearanceMediaListener } from '@/utils/ideAppearance'
import { isPtmjAuthRoute } from '@/constants/ptmjAuth'

const route = useRoute()
const savedDarkMode = ref(null)

onMounted(async () => {
  await applyIdeAppearanceFromSettings()
  savedDarkMode.value = document.documentElement.classList.contains('dark')
  if (isPtmjAuthRoute(route.path)) {
    applyIdeThemeState(false)
  }
})

watch(() => route.path, (newPath, oldPath) => {
  const enteringAuth = isPtmjAuthRoute(newPath)
  const leavingAuth = isPtmjAuthRoute(oldPath)
  if (enteringAuth && !leavingAuth) {
    savedDarkMode.value = document.documentElement.classList.contains('dark')
    applyIdeThemeState(false)
  } else if (!enteringAuth && leavingAuth) {
    if (savedDarkMode.value) {
      applyIdeThemeState(true)
    }
  }
})

onUnmounted(() => {
  teardownIdeAppearanceMediaListener()
})
</script>

<style>
#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
.app-main-content {
  flex: 1;
  overflow: auto;
  position: relative;
}
.app-main-content::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.app-main-content::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.4);
  border-radius: 3px;
}
</style>
