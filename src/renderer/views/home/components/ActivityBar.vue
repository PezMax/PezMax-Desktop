<template>
  <div class="activity-bar">
    <div class="activity-items">
      <div :class="['activity-item', { active: activeView === 'explorer' }]" @click="$emit('change-view', 'explorer')" title="资源管理">
        <svg-icon icon-class="tree" />
      </div>
      <div :class="['activity-item', { active: activeView === 'bookmark' }]" @click="$emit('change-view', 'bookmark')" title="外部书签">
        <svg-icon icon-class="link" />
      </div>
      <div :class="['activity-item', { active: activeView === 'rank' }]" @click="$emit('change-view', 'rank')" title="用户排行">
        <svg-icon icon-class="chart" />
      </div>
      <div :class="['activity-item', { active: activeView === 'upload' }]" @click="$emit('change-view', 'upload')" title="贡献文件">
        <svg-icon icon-class="upload" />
      </div>
      <div :class="['activity-item', { active: activeView === 'reportUser' }]" @click="$emit('change-view', 'reportUser')" title="举报用户">
        <svg-icon icon-class="bug" />
      </div>
    </div>
    <div class="activity-items-bottom">
      <div class="activity-item" title="捐赠" @click="$emit('open-donate')">
        <svg-icon icon-class="money" />
      </div>
      <div class="activity-item" title="设置" @click="$emit('open-settings')">
        <svg-icon icon-class="system" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  activeView: {
    type: String,
    required: true
  }
})
defineEmits(['change-view', 'open-donate', 'open-settings'])
</script>

<style scoped lang="scss">
.activity-bar {
  width: 56px;
  background-color: var(--ide-activity-bg);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px 0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--ide-border);
}
.activity-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}
.activity-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--ide-text-light);
  font-size: 22px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border-radius: 8px;

  &:hover {
    color: var(--ide-accent);
    background-color: var(--ide-bg);
    transform: translateY(-2px);
  }

  &.active {
    color: var(--ide-accent-contrast, #fff);
    background-color: var(--ide-accent);
    box-shadow: 0 10px 20px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.3);

    :deep(.svg-icon) {
      color: inherit;
      fill: currentColor;
    }

    &::before {
      content: '';
      position: absolute;
      left: -8px; /* 调整到边框外侧 */
      top: 50%;
      transform: translateY(-50%);
      height: 20px;
      width: 4px;
      background-color: var(--ide-accent);
      border-radius: 0 4px 4px 0;
    }
  }
}

.activity-items-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
