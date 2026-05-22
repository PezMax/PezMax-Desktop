<template>
  <transition name="global-loader-fade">
    <div v-if="visible" class="global-loader-overlay" :class="{ 'is-dark': isDark }">
      <div class="loader-content">
        <!-- 极简创意几何动画区 -->
        <div class="minimal-spinner">
          <div class="cube cube-1"></div>
          <div class="cube cube-2"></div>
          <div class="cube cube-3"></div>
          <div class="cube cube-4"></div>
        </div>
        
        <!-- 品牌文字与加载状态 -->
        <div class="loader-text-container">
          <h2 class="brand-title">PezMax Workspace</h2>
          <p class="loading-status">
            {{ text }}
          </p>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: 'Initializing'
  }
})

// 简单判断深色模式
const isDark = computed(() => {
  // 触发 computed 依赖，这样每次组件渲染时都能获取到最新状态
  return props.visible && document.documentElement.classList.contains('dark')
})
</script>

<style scoped lang="scss">
.global-loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  
  &.is-dark {
    background-color: rgba(15, 23, 42, 0.2);
  }
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  transform: translateY(-5vh);
}

/* 极简折叠几何体动画 */
.minimal-spinner {
  width: 40px;
  height: 40px;
  position: relative;
  transform: rotateZ(45deg);
}

.cube {
  float: left;
  width: 50%;
  height: 50%;
  position: relative;
  transform: scale(1.1);
}

.cube::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--ide-accent, #3b82f6);
  animation: minimal-fold 2.4s infinite linear both;
  transform-origin: 100% 100%;
  border-radius: 2px;
}

.cube-2 { transform: scale(1.1) rotateZ(90deg); }
.cube-3 { transform: scale(1.1) rotateZ(180deg); }
.cube-4 { transform: scale(1.1) rotateZ(270deg); }

.cube-2::before { animation-delay: 0.3s; background-color: rgba(59, 130, 246, 0.8); }
.cube-3::before { animation-delay: 0.6s; background-color: rgba(59, 130, 246, 0.6); }
.cube-4::before { animation-delay: 0.9s; background-color: rgba(59, 130, 246, 0.4); }

@keyframes minimal-fold {
  0%, 10% {
    transform: perspective(140px) rotateX(-180deg);
    opacity: 0;
  }
  25%, 75% {
    transform: perspective(140px) rotateX(0deg);
    opacity: 1;
  }
  90%, 100% {
    transform: perspective(140px) rotateY(180deg);
    opacity: 0;
  }
}

/* 文字区域 */
.loader-text-container {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.brand-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 2px;
  margin: 0;
  color: var(--ide-text-active, #1e293b);
  text-transform: uppercase;
}

.loading-status {
  font-size: 12px;
  color: var(--ide-text-light, #64748b);
  margin: 0;
  font-weight: 400;
  letter-spacing: 0.5px;
  opacity: 0.8;
  animation: pulse-text 2s infinite ease-in-out;
}

.is-dark {
  .brand-title {
    color: #e2e8f0;
  }
  .loading-status {
    color: #94a3b8;
  }
}

@keyframes pulse-text {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* 丝滑消失过渡 */
.global-loader-fade-enter-active,
.global-loader-fade-leave-active {
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  .loader-content {
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
  }
}

.global-loader-fade-enter-from,
.global-loader-fade-leave-to {
  opacity: 0;
  
  .loader-content {
    transform: translateY(-2vh) scale(0.98);
    opacity: 0;
  }
}
</style>
