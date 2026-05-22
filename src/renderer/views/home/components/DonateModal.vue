<template>
  <Teleport to="body">
    <Transition name="donate-fade">
      <div v-if="visible" class="donate-overlay" @click.self="visible = false">
        <div class="donate-card">
          <button type="button" class="donate-close" @click="visible = false" aria-label="关闭捐赠弹窗">
            <el-icon><Close /></el-icon>
          </button>

          <div class="donate-header">
            <div class="donate-icon">
              <svg-icon icon-class="money" />
            </div>
            <div>
              <h3>支持项目继续更新</h3>
              <p>如果这个项目对你有帮助，欢迎请作者喝杯咖啡q(≧▽≦q)</p>
            </div>
          </div>

          <div class="donate-body">
            <!-- 支付方式选择器 -->
            <Transition name="fade-slide" mode="out-in">
              <div v-if="!currentPayType" class="pay-selector-container" key="selector">
                <div class="pay-grid">
                  <div class="pay-card alipay" @click="currentPayType = 'alipay'">
                    <div class="pay-card-icon">
                      <svg-icon icon-class="alipay" />
                    </div>
                    <span>支付宝</span>
                  </div>
                  <div class="pay-card wechat" @click="currentPayType = 'wechat'">
                    <div class="pay-card-icon">
                      <svg-icon icon-class="wechat" />
                    </div>
                    <span>微信支付</span>
                  </div>
                </div>
                <p class="donate-tip">您的支持是项目持续更新的最大动力</p>
              </div>

              <!-- 二维码展示层 -->
              <div v-else class="qr-display-container" key="qr">
                <div class="qr-header">
                  <el-button link @click="currentPayType = null" class="back-btn">
                    <el-icon><ArrowLeft /></el-icon> 返回选择
                  </el-button>
                  <span class="pay-title">
                    {{ currentPayType === 'alipay' ? '支付宝扫码' : '微信扫码' }}
                  </span>
                </div>
                
                <div class="donate-qr-wrapper">
                  <img 
                    :src="currentPayType === 'alipay' ? alipayImage : wechatImage" 
                    alt="赞助二维码" 
                    class="donate-qr" 
                  />
                  <div class="qr-glow" :class="currentPayType"></div>
                </div>
                
                <p class="donate-tip">扫码即可支持，感谢你的认可与陪伴。</p>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Close, ArrowLeft } from '@element-plus/icons-vue'
import alipayImage from '@/assets/images/alipay/alipay.jpg'
import wechatImage from '@/assets/images/wechat/wechat.jpeg'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const currentPayType = ref(null) // 'alipay' | 'wechat' | null

// 当弹窗关闭时，重置支付方式
watch(visible, (newVal) => {
  if (!newVal) {
    setTimeout(() => {
      currentPayType.value = null
    }, 300)
  }
})
</script>

<style scoped lang="scss">
.donate-overlay {
  position: fixed;
  inset: 0;
  z-index: 12000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.donate-card {
  position: relative;
  width: min(420px, 100%);
  border-radius: 24px;
  padding: 32px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  border: 1px solid rgba(var(--ide-accent-rgb, 64, 158, 255), 0.2);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.25);
  transform: translateY(0);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  html.dark & {
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.94));
  }
}

.donate-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--ide-text-light);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.12);
    color: var(--ide-text-active);
    transform: rotate(90deg) scale(1.1);
  }
}

.donate-header {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 28px;

  h3 {
    margin: 0 0 6px;
    font-size: 22px;
    font-weight: 800;
    color: var(--ide-text-active);
  }

  p {
    margin: 0;
    font-size: 13px;
    color: var(--ide-text-light);
    line-height: 1.6;
  }
}

.donate-icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--ide-accent), var(--ide-accent-hover));
  color: white;
  font-size: 28px;
  flex-shrink: 0;
  box-shadow: 0 8px 16px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.3);
}

.donate-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 280px;
  justify-content: center;
}

.pay-selector-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.pay-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  width: 100%;
}

.pay-card {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-radius: 20px;
  cursor: pointer;
  background: var(--ide-bg);
  border: 1px solid var(--ide-border);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, var(--ide-accent), transparent);
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  &:hover {
    transform: translateY(-8px);
    border-color: var(--ide-accent);
    box-shadow: 0 12px 24px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.15);

    &::before {
      opacity: 0.05;
    }

    .pay-card-icon {
      transform: scale(1.15);
    }
  }

  .pay-card-icon {
    font-size: 42px;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 1;
  }

  span {
    font-size: 15px;
    font-weight: 600;
    color: var(--ide-text-active);
    z-index: 1;
  }

  &.alipay {
    color: #1677ff;
    &:hover { border-color: #1677ff; box-shadow: 0 12px 24px rgba(22, 119, 255, 0.2); }
  }
  &.wechat {
    color: #07c160;
    &:hover { border-color: #07c160; box-shadow: 0 12px 24px rgba(7, 193, 96, 0.2); }
  }
}

.qr-display-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.qr-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;

  .back-btn {
    font-size: 14px;
    color: var(--ide-text-light);
    &:hover { color: var(--ide-accent); }
  }

  .pay-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--ide-text-active);
  }
}

.donate-qr-wrapper {
  position: relative;
  width: 220px;
  height: 220px;
  padding: 12px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);

  .donate-qr {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 12px;
    position: relative;
    z-index: 2;
  }

  .qr-glow {
    position: absolute;
    inset: -20px;
    filter: blur(40px);
    opacity: 0.15;
    z-index: 1;
    border-radius: 50%;

    &.alipay { background: #1677ff; }
    &.wechat { background: #07c160; }
  }
}

.donate-tip {
  margin: 0;
  font-size: 13px;
  color: var(--ide-text-light);
  text-align: center;
  line-height: 1.6;
}

/* 动画效果 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.donate-fade-enter-active,
.donate-fade-leave-active {
  transition: opacity 0.4s ease;
  .donate-card { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
}

.donate-fade-enter-from,
.donate-fade-leave-to {
  opacity: 0;
  .donate-card { transform: scale(0.9) translateY(20px); opacity: 0; }
}
</style>
