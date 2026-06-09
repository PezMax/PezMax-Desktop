<template>
  <Teleport to="body">
    <Transition name="settings-overlay">
      <div v-if="modelValue" class="settings-overlay" @click.self="closeSettings">

        <!-- 居中设置浮岛 -->
        <Transition name="settings-island">
          <div v-if="modelValue" class="settings-island">
            <!-- 顶部关闭按钮 -->
            <div class="close-btn" @click="closeSettings">
              <el-icon><Close /></el-icon>
            </div>

            <!-- 左侧导航栏 -->
            <div class="settings-sidebar">
              <h2 class="sidebar-title">设置</h2>
              <div class="nav-list" ref="navRef">
                <!-- 魔法背景滑块 -->
                <div class="nav-slider" :style="sliderStyle"></div>

                <div
                  v-for="(item, index) in navItems"
                  :key="item.id"
                  class="nav-item"
                  :class="{ active: activeTab === item.id }"
                  @click="switchTab(item.id, index, $event)"
                >
                  <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
                  <span>{{ item.label }}</span>
                </div>
              </div>
            </div>

            <!-- 右侧内容区 -->
            <div class="settings-content-wrapper">
              <Transition name="fade-slide" mode="out-in">
                <div :key="activeTab" class="settings-content">

                  <!-- 常规设置 -->
                  <div v-if="activeTab === 'general'" class="settings-section">
                    <h3 class="section-header">常规</h3>

                    <div class="setting-card-group">
                      <div class="setting-item">
                        <div class="setting-info">
                          <span class="setting-label">开机时自动启动</span>
                          <span class="setting-desc">跟随系统启动，第一时间获取最新试卷更新</span>
                        </div>
                        <el-switch v-model="settingsData.autoStart" class="modern-switch" />
                      </div>
                    </div>
                  </div>

                  <!-- 上传与下载设置 -->
                  <div v-else-if="activeTab === 'transfer'" class="settings-section">
                    <h3 class="section-header">上传与下载</h3>

                    <div class="setting-card-group">
                      <!-- 默认下载路径 -->
                      <div class="setting-item">
                        <div class="setting-info">
                          <span class="setting-label">默认下载路径</span>
                          <span class="setting-desc" :title="settingsData.downloadPath">{{ settingsData.downloadPath || '使用系统默认下载路径' }}</span>
                        </div>
                        <el-button class="action-btn" @click="handleSelectDownloadPath">更改</el-button>
                      </div>

                      <div class="divider"></div>

                      <!-- 静默下载 -->
                      <div class="setting-item">
                        <div class="setting-info">
                          <span class="setting-label">静默下载</span>
                          <span class="setting-desc">开启后，下载文件时不弹窗询问，直接保存到默认路径</span>
                        </div>
                        <el-switch v-model="settingsData.silentDownload" class="modern-switch" />
                      </div>

                      <div class="divider"></div>

                      <!-- 上传偏好 -->
                      <div class="setting-item">
                        <div class="setting-info">
                          <span class="setting-label">上传完成后自动跳转到资源管理器</span>
                          <span class="setting-desc">开启后，文件上传成功将自动切换至对应的文件列表</span>
                        </div>
                        <el-switch v-model="settingsData.autoJumpAfterUpload" class="modern-switch" />
                      </div>

                      <div class="divider"></div>

                      <!-- 默认学科 -->
                      <div class="setting-item input-item">
                        <div class="setting-info">
                          <span class="setting-label">默认学科 (可选)</span>
                          <span class="setting-desc">设置后，每次打开上传表单时自动填好</span>
                        </div>
                        <el-input
                          v-model="settingsData.defaultSubject"
                          placeholder="例如: 高等数学"
                          class="modern-input"
                          clearable
                        />
                      </div>

                      <div class="divider"></div>

                      <!-- 默认年份 -->
                      <div class="setting-item input-item">
                        <div class="setting-info">
                          <span class="setting-label">默认年份 (可选)</span>
                          <span class="setting-desc">设置后，每次打开上传表单时自动填好</span>
                        </div>
                        <el-date-picker
                          v-model="settingsData.defaultYear"
                          type="year"
                          placeholder="选择年份"
                          class="modern-input"
                          style="width: 160px;"
                          value-format="YYYY"
                          :teleported="false"
                          clearable
                        />
                      </div>
                    </div>
                  </div>

                  <!-- 外观设置 -->
                  <div v-else-if="activeTab === 'appearance'" class="settings-section">
                    <h3 class="section-header">外观</h3>

                    <div class="setting-card-group">
                      <div class="setting-item theme-item">
                        <div class="setting-info">
                          <span class="setting-label">主题模式</span>
                          <span class="setting-desc">选择适合您的界面风格</span>
                        </div>
                        <div class="theme-selector">
                          <div
                            class="theme-option"
                            :class="{ active: settingsData.theme === 'light' }"
                            @click="setTheme('light')"
                          >
                            <div class="theme-preview light">
                              <div class="preview-header"></div>
                              <div class="preview-body">
                                <div class="preview-sidebar"></div>
                                <div class="preview-content"></div>
                              </div>
                            </div>
                            <span class="theme-name">浅色</span>
                          </div>

                          <div
                            class="theme-option"
                            :class="{ active: settingsData.theme === 'dark' }"
                            @click="setTheme('dark')"
                          >
                            <div class="theme-preview dark">
                              <div class="preview-header"></div>
                              <div class="preview-body">
                                <div class="preview-sidebar"></div>
                                <div class="preview-content"></div>
                              </div>
                            </div>
                            <span class="theme-name">深色</span>
                          </div>

                          <div
                            class="theme-option"
                            :class="{ active: settingsData.theme === 'auto' }"
                            @click="setTheme('auto')"
                          >
                            <div class="theme-preview auto">
                              <div class="half light-half">
                                <div class="preview-header"></div>
                                <div class="preview-body">
                                  <div class="preview-sidebar"></div>
                                </div>
                              </div>
                              <div class="half dark-half">
                                <div class="preview-header"></div>
                                <div class="preview-body">
                                  <div class="preview-content"></div>
                                </div>
                              </div>
                            </div>
                            <span class="theme-name">跟随系统</span>
                          </div>
                        </div>
                      </div>

                      <div class="divider"></div>

                      <div class="setting-item">
                        <div class="setting-info">
                          <span class="setting-label">主题强调色</span>
                          <span class="setting-desc">更改应用内高亮元素的颜色</span>
                        </div>
                        <div class="color-picker-group">
                          <div
                            v-for="color in themeColors"
                            :key="color"
                            class="color-dot"
                            :style="{ backgroundColor: color }"
                            :class="{ active: settingsData.accentColor === color }"
                            @click="setAccentColor(color)"
                          >
                            <el-icon
                              v-if="settingsData.accentColor === color"
                              class="color-dot-check"
                              :style="getColorDotCheckStyle(color)"
                            >
                              <Check />
                            </el-icon>
                          </div>

                          <!-- 自定义主题颜色选择器 -->
                          <div class="color-dot custom-color-dot" :class="{ active: isCustomColorActive }">
                            <el-color-picker
                              v-model="customAccentColor"
                              show-alpha
                              :predefine="themeColors"
                              @active-change="handleCustomColorChange"
                              @change="handleCustomColorChange"
                              popper-class="custom-color-picker-popper"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <h3 class="section-header" style="margin-top: 24px;">工作区背景</h3>

                    <div class="setting-card-group">
                      <div class="setting-item flex-col-item">
                        <div class="setting-info">
                          <span class="setting-label">自定义壁纸</span>
                          <span class="setting-desc">上传一张背景图，为您的应用增添氛围感</span>
                        </div>

                        <div class="bg-gallery">
                          <!-- 无背景选项 -->
                          <div
                            class="bg-item none-bg"
                            :class="{ active: !settingsData.backgroundImage }"
                            @click="setBackgroundImage('')"
                          >
                            <el-icon><Close /></el-icon>
                            <span>无背景</span>
                          </div>

                          <!-- 当前上传的背景图 (如果有且不是内置预设的话，简化逻辑，直接展示当前图片) -->
                          <div
                            v-if="settingsData.backgroundImage"
                            class="bg-item user-bg"
                            :class="{ active: settingsData.backgroundImage }"
                            :style="{ backgroundImage: `url(${settingsData.backgroundImage})` }"
                          >
                            <div class="bg-overlay">
                              <el-icon><Check /></el-icon>
                            </div>
                          </div>

                          <!-- 上传按钮 -->
                          <div class="bg-item upload-bg" @click="handleSelectBackgroundImage">
                            <el-icon><Plus /></el-icon>
                            <span>上传图片</span>
                          </div>
                        </div>
                      </div>

                      <template v-if="settingsData.backgroundImage">
                        <div class="divider"></div>

                        <div class="setting-item slider-item">
                          <div class="setting-info">
                            <span class="setting-label">智能遮罩浓度</span>
                            <span class="setting-desc">调节深色/浅色叠加层的透明度，保证代码文本阅读清晰度</span>
                          </div>
                          <div class="slider-wrapper">
                            <el-slider
                              v-model="settingsData.backgroundOpacity"
                              :min="0" :max="100"
                              :format-tooltip="(val) => `${val}%`"
                              class="modern-slider"
                            />
                            <span class="slider-val">{{ settingsData.backgroundOpacity }}%</span>
                          </div>
                        </div>

                        <div class="divider"></div>

                        <div class="setting-item slider-item">
                          <div class="setting-info">
                            <span class="setting-label">高斯模糊</span>
                            <span class="setting-desc">增加壁纸的模糊度，打造高级抽象的毛玻璃质感</span>
                          </div>
                          <div class="slider-wrapper">
                            <el-slider
                              v-model="settingsData.backgroundBlur"
                              :min="0" :max="40"
                              :format-tooltip="(val) => `${val}px`"
                              class="modern-slider"
                            />
                            <span class="slider-val">{{ settingsData.backgroundBlur }}px</span>
                          </div>
                        </div>

                        <div class="divider"></div>

                        <div class="setting-item slider-item">
                          <div class="setting-info">
                            <span class="setting-label">主编辑区背景可见度</span>
                            <span class="setting-desc">数值越高，主编辑区越透明、背景越清晰；数值越低，玻璃感越强</span>
                          </div>
                          <div class="slider-wrapper">
                            <el-slider
                              v-model="settingsData.editorVisibility"
                              :min="0" :max="100"
                              :format-tooltip="(val) => `${val}%`"
                              class="modern-slider"
                            />
                            <span class="slider-val">{{ settingsData.editorVisibility }}%</span>
                          </div>
                        </div>

                        <div class="divider"></div>

                        <div class="setting-item toggle-item">
                          <div class="setting-info">
                            <span class="setting-label">显示主编辑区空状态提示</span>
                            <span class="setting-desc">关闭后，当没有打开任何标签页时，右侧主编辑区将完全透明</span>
                          </div>
                          <el-switch
                            v-model="settingsData.showEmptyEditorTip"
                            class="modern-switch"
                          />
                        </div>
                      </template>
                    </div>
                  </div>

                  <!-- 快捷键设置 -->
                  <div v-else-if="activeTab === 'shortcuts'" class="settings-section">
                    <h3 class="section-header">快捷键</h3>

                    <div class="setting-card-group">
                      <div class="setting-item">
                        <div class="setting-info">
                          <span class="setting-label">全局唤醒 / 隐藏</span>
                          <span class="setting-desc">在任何界面快速呼出 PTMJ (全局生效)</span>
                        </div>
                        <div
                          class="shortcut-recorder"
                          :class="{ recording: activeShortcutKey === 'globalWake' }"
                          @click.stop="startRecordingShortcut('globalWake')"
                          @keydown="handleShortcutKeydown"
                          tabindex="0"
                        >
                          <span v-if="activeShortcutKey === 'globalWake'" class="recording-text">请按键...</span>
                          <template v-else>
                            <kbd v-for="(key, i) in formatShortcutForDisplay(settingsData.shortcuts.globalWake)" :key="i">{{ key }}</kbd>
                          </template>
                        </div>
                      </div>

                      <div class="divider"></div>

                      <div class="setting-item">
                        <div class="setting-info">
                          <span class="setting-label">快速上传文件</span>
                          <span class="setting-desc">应用激活状态下，一键跳转到上传面板</span>
                        </div>
                        <div
                          class="shortcut-recorder"
                          :class="{ recording: activeShortcutKey === 'upload' }"
                          @click.stop="startRecordingShortcut('upload')"
                          @keydown="handleShortcutKeydown"
                          tabindex="0"
                        >
                          <span v-if="activeShortcutKey === 'upload'" class="recording-text">请按键...</span>
                          <template v-else>
                            <kbd v-for="(key, i) in formatShortcutForDisplay(settingsData.shortcuts.upload)" :key="i">{{ key }}</kbd>
                          </template>
                        </div>
                      </div>

                      <div class="divider"></div>

                      <div class="setting-item">
                        <div class="setting-info">
                          <span class="setting-label">打开设置</span>
                          <span class="setting-desc">呼出本设置面板</span>
                        </div>
                        <div
                          class="shortcut-recorder"
                          :class="{ recording: activeShortcutKey === 'settings' }"
                          @click.stop="startRecordingShortcut('settings')"
                          @keydown="handleShortcutKeydown"
                          tabindex="0"
                        >
                          <span v-if="activeShortcutKey === 'settings'" class="recording-text">请按键...</span>
                          <template v-else>
                            <kbd v-for="(key, i) in formatShortcutForDisplay(settingsData.shortcuts.settings)" :key="i">{{ key }}</kbd>
                          </template>
                        </div>
                      </div>

                      <div class="divider"></div>

                      <div class="setting-item">
                        <div class="setting-info">
                          <span class="setting-label">关闭当前标签</span>
                          <span class="setting-desc">快速关闭主编辑器中正在浏览的标签页</span>
                        </div>
                        <div
                          class="shortcut-recorder"
                          :class="{ recording: activeShortcutKey === 'closeTab' }"
                          @click.stop="startRecordingShortcut('closeTab')"
                          @keydown="handleShortcutKeydown"
                          tabindex="0"
                        >
                          <span v-if="activeShortcutKey === 'closeTab'" class="recording-text">请按键...</span>
                          <template v-else>
                            <kbd v-for="(key, i) in formatShortcutForDisplay(settingsData.shortcuts.closeTab)" :key="i">{{ key }}</kbd>
                          </template>
                        </div>
                      </div>
                    </div>

                    <div class="shortcut-tip">
                      <el-icon><InfoFilled /></el-icon>
                      <span>点击对应的快捷键区域，按下你想要绑定的组合键。支持 Ctrl、Shift、Alt 与普通按键的组合。</span>
                    </div>
                  </div>

                  <!-- 更新设置 -->
                  <div v-else-if="activeTab === 'updates'" class="settings-section">
                    <h3 class="section-header">软件更新</h3>

                    <div class="setting-card-group">
                      <!-- 更新源选择 -->
                      <div class="setting-item flex-col-item">
                        <div class="setting-info" style="width: 100%;">
                          <span class="setting-label">更新源</span>
                          <span class="setting-desc">当前使用 GitHub Releases 作为更新源，支持差分增量更新 (.blockmap)</span>
                          <span class="setting-desc">校园网环境可能会出现下载卡顿，请切换网络后重试</span>
                        </div>

                        <div class="update-source-list">
                          <div
                            v-for="preset in presetUpdateSources"
                            :key="preset.key"
                            class="update-source-card"
                            :class="{
                              active: updateSourceConfig.presetKey === preset.key,
                              disabled: isApplyingUpdateSource
                            }"
                            @click="selectPresetUpdateSource(preset)"
                          >
                            <div class="usc-header">
                              <div class="usc-radio">
                                <span class="radio-dot" v-if="updateSourceConfig.presetKey === preset.key"></span>
                              </div>
                              <span class="usc-label">{{ preset.label }}</span>
                            </div>
                            <div class="usc-url" :title="preset.url || `${preset.owner}/${preset.repo}`">
                              <el-icon><Link /></el-icon>
                              <span>{{ preset.url || `${preset.owner}/${preset.repo}` }}</span>
                            </div>
                            <div class="usc-features">
                              <span class="feature-badge diff-badge">差分更新就绪</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 当前更新状态卡片 -->
                    <div class="about-update-card" style="margin-top: 24px;">
                      <UpdateCard />
                    </div>
                  </div>

                  <!-- 隐私与缓存 -->
                  <div v-else-if="activeTab === 'privacy'" class="settings-section">
                    <h3 class="section-header">隐私与缓存</h3>

                    <div class="setting-card-group">
                      <div class="setting-item">
                        <div class="setting-info">
                          <span class="setting-label">清除本地缓存</span>
                          <span class="setting-desc">释放磁盘空间，清理 HTTP 缓存、Cookies 与临时数据</span>
                        </div>
                        <el-button
                          type="danger"
                          plain
                          class="action-btn"
                          @click="handleClearCache"
                          :loading="isClearingCache"
                        >
                          {{ isClearingCache ? '清理中...' : '清理' }}
                        </el-button>
                      </div>
                    </div>
                  </div>

                  <!-- 关于 -->
                  <div v-else-if="activeTab === 'about'" class="settings-section about-section">
                    <div class="about-logo">
                      <img :src="logo" class="huge-logo" />
                    </div>
                    <h2 class="app-name">PezMax - 拼图满绩</h2>
                    <p class="app-version">Version {{ appVersion }} (Desktop)</p>
                    <div class="app-community">
                      <span>QQ交流群：1077605719</span>
                    </div>
                    <div class="about-links">
                      <a href="#" @click.prevent="scrollToUpdateCard">检查更新</a>
                      <span class="dot">·</span>
                      <a href="#" @click.prevent="showLicense = true">MIT 开源协议</a>
                    </div>
                    <div ref="updateCardRef" class="about-update-card">
                      <UpdateCard />
                    </div>

                    <!-- 宇宙级免责声明 -->
                    <div class="disclaimer-card">
                      <div class="disclaimer-header">
                        <el-icon><WarningFilled /></el-icon>
                        <span>宇宙级免责声明 (Disclaimer)</span>
                      </div>
                      <div class="disclaimer-content">
                        <p><strong>1. 资料真实性与合规性：</strong>本平台所有试卷、文件均由用户自发上传分享。作为中立的工具提供商，平台不对任何上传内容的绝对准确性、完整性或合规性提供担保。用户需自行甄别资料质量，上传者应确保其发布内容的合法合规性。</p>
                        <p><strong>2. 版权与侵权处理：</strong>平台尊重并严格保护知识产权，所有资料的版权归原作者所有。内容仅供学习与研究使用。如发现平台内存在侵犯您合法权益的内容，请及时联系我们，我们将依据“避风港原则”第一时间核实并下架处理。</p>
                        <p><strong>3. 非免费文件与商用限制：</strong>平台内分享的资料若原本属于非免费性质，或附带商业使用限制，用户在未经原权利人明确授权前，严禁将其用于任何商业化变现行为。因不当使用产生的版权纠纷，由侵权方全权承担，平台概不负责。</p>
                        <p><strong>4. 风险自担：</strong>使用本平台服务即代表您完全理解并自愿同意接受本声明的全部内容。因不可抗力或网络故障导致的服务中断或资料丢失，平台不承担相关法律责任。</p>
                      </div>
                    </div>
                  </div>

                </div>
              </Transition>
            </div>

            <!-- MIT 协议专属内嵌弹窗 -->
            <Transition name="license-zoom">
              <div v-if="showLicense" class="license-overlay-inner" @click.self="showLicense = false">
                <div class="license-card">
                  <div class="license-header">
                    <h3>MIT License</h3>
                    <div class="close-action" @click="showLicense = false">
                      <el-icon><Close /></el-icon>
                    </div>
                  </div>
                  <div class="license-content">
                    <p>Copyright (c) 2026 PezMax</p>
                    <p>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:</p>
                    <p>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</p>
                    <p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>
                  </div>
                </div>
              </div>
            </Transition>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch, nextTick, onMounted, onUnmounted, toRaw, computed } from 'vue'
import { Close, Setting, Monitor, Lock, InfoFilled, Check, WarningFilled, Download, Plus, Aim, UploadFilled, Refresh, Link, Folder } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { applyIdeAccentColor, applyIdeThemeState, applyWorkspaceBackgroundSettings, resolveEditorVisibilityValue } from '@/utils/ideAppearance'
import { getToken } from '@/utils/auth'
import logo from '@/assets/logo/logo.png'
import UpdateCard from './UpdateCard.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const closeSettings = () => {
  emit('update:modelValue', false)
}

// 导航数据
const navItems = [
  { id: 'general', label: '常规', icon: 'Setting' },
  { id: 'transfer', label: '上传与下载', icon: 'Download' },
  { id: 'appearance', label: '外观', icon: 'Monitor' },
  { id: 'shortcuts', label: '快捷键', icon: 'Aim' },
  { id: 'updates', label: '更新', icon: 'UploadFilled' },
  { id: 'privacy', label: '隐私', icon: 'Lock' },
  { id: 'about', label: '关于', icon: 'InfoFilled' }
]

const activeTab = ref('general')
const showLicense = ref(false)
const updateCardRef = ref(null)
const appVersion = ref('1.0.0')

// ========== 更新源配置逻辑 ==========
const presetUpdateSources = ref([])
const isApplyingUpdateSource = ref(false)

const updateSourceConfig = reactive({
  presetKey: 'gh-proxy-latest'  // 默认选中 GitHub Releases 源
})

// 获取预设更新源
const fetchPresetSources = async () => {
  if (window.electronAPI?.getPresetUpdateSources) {
    presetUpdateSources.value = await window.electronAPI.getPresetUpdateSources()
  }
}

// 从已保存的设置中恢复更新源状态
const restoreUpdateSourceFromSettings = (savedSettings) => {
  const source = savedSettings?.updateSource
  if (!source || !source.provider) {
    // 无已保存配置，使用默认源
    const defaultPreset = presetUpdateSources.value.find(p => p.key === 'gh-proxy-latest')
    if (defaultPreset) {
      updateSourceConfig.presetKey = defaultPreset.key
    }
    return
  }

  // 检查是否匹配某个预设
  const matchedPreset = presetUpdateSources.value.find((p) => {
    if (p.provider !== source.provider) return false
    if (source.provider === 'generic') return p.url === source.url
    if (source.provider === 'github') return p.owner === source.owner && p.repo === source.repo
    return false
  })

  updateSourceConfig.presetKey = matchedPreset ? matchedPreset.key : 'gh-proxy-latest'
}

const selectPresetUpdateSource = async (preset) => {
  if (isApplyingUpdateSource.value) return
  updateSourceConfig.presetKey = preset.key

  isApplyingUpdateSource.value = true
  try {
    const config = {
      provider: preset.provider,
      url: preset.url || '',
      owner: preset.owner || '',
      repo: preset.repo || ''
    }

    if (window.electronAPI?.configureUpdateSource) {
      await window.electronAPI.configureUpdateSource(config)
    }

    // 同步到 settings
    settingsData.updateSource = config
  } finally {
    isApplyingUpdateSource.value = false
  }
}

// 获取应用版本（合并到下方主 onMounted 中以避免竞态）



// 设置状态 (模拟数据)
const settingsData = reactive({
  autoStart: false,
  downloadPath: '',
  theme: 'light',
  accentColor: '#409EFF',
  backgroundImage: '',
  backgroundOpacity: 20, // 降低默认智能遮罩浓度，让壁纸透出来
  backgroundBlur: 0,     // 默认无额外高斯模糊，依靠面板的毛玻璃即可
  editorVisibility: 72,  // 主编辑区背景可见度，数值越高越透明
  showEmptyEditorTip: true, // 默认显示空状态提示
  autoJumpAfterUpload: true,
  defaultSubject: '',
  defaultYear: '',
  silentDownload: false,
  shortcuts: {
    globalWake: 'CommandOrControl+Shift+Space',
    upload: 'CommandOrControl+U',
    settings: 'CommandOrControl+,',
    closeTab: 'CommandOrControl+W'
  },
  updateSource: null  // { provider, url?, owner?, repo? }
})

const isInitializing = ref(true)
// 主题预设色
const themeColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#8A2BE2', '#5A67D8']

// 自定义强调色状态
const customAccentColor = ref('#5A67D8') // 初始化给个好看的紫色

const isCustomColorActive = computed(() => {
  return !themeColors.includes(settingsData.accentColor)
})

const handleCustomColorChange = (val) => {
  if (val) {
    customAccentColor.value = val
    setAccentColor(val)
  }
}

const parseColorToRgb = (color) => {
  if (!color || typeof color !== 'string') return null
  const value = color.trim()

  if (value.startsWith('#')) {
    const hex = value.slice(1)
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16)
      }
    }
    if (hex.length === 6 || hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      }
    }
  }

  const match = value.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (!match) return null
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3])
  }
}

const getColorDotCheckStyle = (color) => {
  const rgb = parseColorToRgb(color)
  if (!rgb) {
    return {
      color: '#ffffff',
      backgroundColor: 'rgba(15, 23, 42, 0.72)'
    }
  }

  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
  const isLightBg = brightness >= 160

  return {
    color: isLightBg ? '#0f172a' : '#ffffff',
    backgroundColor: isLightBg ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.72)'
  }
}

// 背景图片逻辑
const setBackgroundImage = (base64Str) => {
  settingsData.backgroundImage = base64Str
}

const handleSelectBackgroundImage = async () => {
  if (window.electronAPI && window.electronAPI.selectBackgroundImage) {
    const result = await window.electronAPI.selectBackgroundImage()
    if (result) {
      settingsData.backgroundImage = result
    }
  }
}

// 解决组件初始化时同步自定义颜色的问题
watch(() => settingsData.accentColor, (newColor) => {
  if (!themeColors.includes(newColor)) {
    customAccentColor.value = newColor
  }
}, { immediate: true })

// 应用工作区背景
const applyWorkspaceBackground = () => {
  applyWorkspaceBackgroundSettings(settingsData, !!getToken())
}

watch(() => [settingsData.backgroundImage, settingsData.backgroundOpacity, settingsData.backgroundBlur, settingsData.editorVisibility], () => {
  applyWorkspaceBackground()
}, { immediate: true })

// 防抖/节流逻辑
let saveTimeout = null
let lastDispatchTime = 0
const DISPATCH_THROTTLE = 16 // 约 60fps 的同步频率

watch(settingsData, (newVal) => {
  if (!getToken()) return

  if (isInitializing.value) return

  // 节流处理同步事件，避免高频触发导致卡顿
  const now = Date.now()
  if (now - lastDispatchTime >= DISPATCH_THROTTLE) {
    window.dispatchEvent(new CustomEvent('settings-updated', { detail: toRaw(newVal) }))
    lastDispatchTime = now
  }

  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    if (window.electronAPI && window.electronAPI.saveSettings) {
      window.electronAPI.saveSettings(toRaw(newVal))
    }
    // 确保最后一次变更一定会被同步（防止节流导致最后一次状态丢失）
    window.dispatchEvent(new CustomEvent('settings-updated', { detail: toRaw(newVal) }))
  }, 500)
}, { deep: true })



// 魔法滑动背景逻辑
const navRef = ref(null)
const sliderStyle = reactive({
  transform: 'translateY(0)',
  height: '36px',
  opacity: 0
})

// 更改下载路径逻辑
const handleSelectDownloadPath = async () => {
  if (window.electronAPI && window.electronAPI.selectDownloadPath) {
    const newPath = await window.electronAPI.selectDownloadPath()
    if (newPath) {
      settingsData.downloadPath = newPath
      // watch 会自动防抖触发 saveSettings
    }
  }
}

// 外观设置逻辑
let mediaQueryList = null

const applyTheme = (isDark) => {
  applyIdeThemeState(isDark)
  applyIdeAccentColor(settingsData.accentColor || '#409EFF')
}

const handleSystemThemeChange = (e) => {
  if (settingsData.theme === 'auto') {
    applyTheme(e.matches)
  }
}

const setTheme = (theme) => {
  settingsData.theme = theme

  if (theme === 'dark') {
    applyTheme(true)
  } else if (theme === 'light') {
    applyTheme(false)
  } else {
    // 跟随系统
    if (!mediaQueryList) {
      mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQueryList.addEventListener('change', handleSystemThemeChange)
    }
    applyTheme(mediaQueryList.matches)
  }
}

const setAccentColor = (color) => {
  settingsData.accentColor = color
  applyIdeAccentColor(color)
  // 动态设置 CSS 变量
  document.documentElement.style.setProperty('--ide-accent', color)

  // 覆盖 Element Plus 全局色
  document.documentElement.style.setProperty('--el-color-primary', color)

  // 计算对应的 hover 颜色 (简单加深或提亮)
  // 这里用一个近似的十六进制透明度作为 hover 状态
  document.documentElement.style.setProperty('--ide-accent-hover', color + 'CC')

  // 计算对应的 RGB 值供 rgba() 使用
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  document.documentElement.style.setProperty('--ide-accent-rgb', `${r}, ${g}, ${b}`)

  // 给 Element Plus 设置 RGB 变量
  document.documentElement.style.setProperty('--el-color-primary-rgb', `${r}, ${g}, ${b}`)
}

// 快捷键录入逻辑
const activeShortcutKey = ref(null) // 当前正在录入的快捷键 key

const formatShortcutForDisplay = (shortcut) => {
  if (!shortcut) return []
  return shortcut.split('+').map(key => {
    if (key === 'CommandOrControl') {
      return navigator.userAgent.indexOf('Mac') > -1 ? '⌘' : 'Ctrl'
    }
    return key
  })
}

const startRecordingShortcut = (key) => {
  activeShortcutKey.value = key
}

const handleShortcutKeydown = (e) => {
  if (!activeShortcutKey.value) return

  e.preventDefault()
  e.stopPropagation()

  const keys = []

  // 处理修饰键
  if (e.ctrlKey || e.metaKey) keys.push('CommandOrControl')
  if (e.altKey) keys.push('Alt')
  if (e.shiftKey) keys.push('Shift')

  // 获取主键
  const mainKey = e.key

  // 忽略单独按下修饰键的情况
  if (['Control', 'Alt', 'Shift', 'Meta', 'Process'].includes(mainKey)) {
    return
  }

  // 格式化主键，比如空格、字母大写等
  let formattedKey = mainKey.toUpperCase()
  if (mainKey === ' ') formattedKey = 'Space'
  if (mainKey === 'Escape') formattedKey = 'Esc'

  keys.push(formattedKey)

  const newShortcut = keys.join('+')
  settingsData.shortcuts[activeShortcutKey.value] = newShortcut

  // 录入完成后取消激活状态
  activeShortcutKey.value = null
}

// 点击其他地方取消快捷键录入
const handleClickOutsideShortcut = () => {
  activeShortcutKey.value = null
}

onMounted(async () => {
  window.addEventListener('click', handleClickOutsideShortcut)

  // 并行加载预设更新源和应用版本
  await Promise.all([
    fetchPresetSources(),
    (async () => {
      if (window.electronAPI?.getAppVersion) {
        appVersion.value = await window.electronAPI.getAppVersion()
      }
    })()
  ])

  // 从主进程获取真实配置（仅在登录状态下应用壁纸和各种偏好设置，否则保持默认的干净白板状态）
  if (window.electronAPI && window.electronAPI.getSettings && !!getToken()) {
    const savedSettings = await window.electronAPI.getSettings()
    Object.assign(settingsData, savedSettings)
    settingsData.editorVisibility = resolveEditorVisibilityValue(savedSettings)

    // 恢复更新源配置（此时 presetUpdateSources 已加载完毕）
    restoreUpdateSourceFromSettings(savedSettings)

    // 确保从后端加载的年份数据是字符串格式以适配 date-picker
    if (settingsData.defaultYear !== undefined && settingsData.defaultYear !== null && settingsData.defaultYear !== 0 && settingsData.defaultYear !== '0') {
      settingsData.defaultYear = String(settingsData.defaultYear)
    } else {
      settingsData.defaultYear = null
    }
  }

  // 初始化系统主题监听器
  mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQueryList.addEventListener('change', handleSystemThemeChange)
  isInitializing.value = false
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutsideShortcut)
  if (mediaQueryList) {
    mediaQueryList.removeEventListener('change', handleSystemThemeChange)
  }
})

const updateSlider = (index, targetEl) => {
  if (!targetEl) return
  sliderStyle.transform = `translateY(${index * 44}px)` // 44px = 36px height + 8px gap
  sliderStyle.opacity = 1
}

const switchTab = (id, index, event) => {
  activeTab.value = id
  updateSlider(index, event.currentTarget)
}

// 清除缓存逻辑
const isClearingCache = ref(false)
const handleClearCache = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除本地缓存吗？这会清理 HTTP 缓存、Cookies 等临时数据，但会保留您的个性化设置。',
      '提示',
      {
        confirmButtonText: '确定清理',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    isClearingCache.value = true

    if (window.electronAPI && window.electronAPI.clearAppCache) {
      const res = await window.electronAPI.clearAppCache()
      if (res.success) {
        ElMessage.success('本地缓存已成功清理')
      } else {
        ElMessage.error('清理失败: ' + (res.msg || '未知错误'))
      }
    } else {
      // 浏览器环境下的降级处理
      localStorage.removeItem('processedNotifications')
      // 注意：Web 环境下无法像 Electron 那样彻底清除缓存
      ElMessage.success('本地临时数据已清理')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清除缓存异常:', error)
      ElMessage.error('操作异常')
    }
  } finally {
    isClearingCache.value = false
  }
  const scrollToUpdateCard = () => {
    updateCardRef.value?.scrollIntoView({behavior: 'smooth', block: 'nearest'})
  }

// 监听弹窗打开，初始化滑块位置
  watch(() => props.modelValue, (newVal) => {
    if (newVal) {
      nextTick(() => {
        // 找到 active 的 item 并初始化滑块
        const activeIndex = navItems.findIndex(item => item.id === activeTab.value)
        if (activeIndex !== -1 && navRef.value) {
          const targetEls = navRef.value.querySelectorAll('.nav-item')
          if (targetEls[activeIndex]) {
            updateSlider(activeIndex, targetEls[activeIndex])
          }
        }
      })
    } else {
      // 弹窗关闭时隐藏滑块避免闪烁
      sliderStyle.opacity = 0
    }
  })
}
</script>

<style scoped lang="scss">
/* ======== 全屏遮罩 ======== */
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 遮罩动画 */
.settings-overlay-enter-active,
.settings-overlay-leave-active {
  transition: opacity 0.4s ease;

  .settings-island {
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease;
  }
}
.settings-overlay-enter-from,
.settings-overlay-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
  -webkit-backdrop-filter: blur(0px);

  .settings-island {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
}

/* ======== 居中浮岛 ======== */
.settings-island {
  width: 800px;
  height: 560px;
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border-radius: 20px;
  box-shadow:
    var(--ide-shadow-2),
    0 0 0 1px rgba(255, 255, 255, 0.2) inset;
  display: flex;
  position: relative;
  overflow: hidden;

  html.dark & {
    background: rgba(30, 30, 30, 0.85) !important;
    box-shadow:
      0 24px 64px rgba(0, 0, 0, 0.4),
      0 0 0 1px inset rgba(255, 255, 255, 0.05);
  }
}

/* 浮岛动画 (Spring 缩放) */
.settings-island-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.settings-island-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.settings-island-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
.settings-island-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--ide-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  color: var(--ide-text-light);
  transition: all 0.2s ease;

  &:hover {
    background: var(--ide-border);
    color: var(--ide-text-active);
    transform: rotate(90deg);
  }
}

/* ======== 左侧导航栏 ======== */
.settings-sidebar {
  width: 240px;
  background: rgba(245, 245, 247, 0.5) !important;
  border-right: 1px solid var(--ide-border);
  padding: 32px 20px;
  display: flex;
  flex-direction: column;

  html.dark & {
    background: rgba(20, 20, 20, 0.5) !important;
  }
}

.sidebar-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--ide-text-active);
  margin: 0 0 32px 12px;
  letter-spacing: 0.5px;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative; /* 为魔法滑块定位 */
}

.nav-slider {
  position: absolute;
  left: 0;
  width: 100%;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
  pointer-events: none; /* 滑块不响应点击 */
  z-index: 0;

  html.dark & {
    background: rgba(255, 255, 255, 0.1);
  }
}

.nav-item {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  cursor: pointer;
  color: var(--ide-text);
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s ease;

  .nav-icon {
    font-size: 18px;
    opacity: 0.7;
    transition: all 0.2s ease;
  }

  &:hover:not(.active) {
    color: var(--ide-text-active);
    .nav-icon { opacity: 1; }
  }

  &.active {
    color: var(--ide-accent);
    .nav-icon {
      opacity: 1;
      color: var(--ide-accent);
    }
  }
}

/* ======== 右侧内容区 ======== */
.settings-content-wrapper {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  background: transparent !important;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;

    html.dark & {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.settings-content {
  max-width: 480px;
  margin: 0 auto;
}

.section-header {
  font-size: 20px;
  font-weight: 600;
  color: var(--ide-text-active);
  margin: 0 0 24px 0;
}

/* 卡片组 */
.setting-card-group {
  background: rgba(255, 255, 255, 0.6) !important;
  border-radius: 16px;
  border: 1px solid var(--ide-border);
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

  html.dark & {
    background: rgba(45, 45, 45, 0.6) !important;
  }
}

/* 设置项与卡片动画 */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  min-height: 72px;

  &.theme-item {
    align-items: flex-start; /* 让主题选择卡片能有足够的空间 */
  }

  &.input-item {
    padding: 12px 20px;

    .modern-input {
      width: 160px;
    }
  }
}

.divider {
  height: 1px;
  background: var(--ide-border);
  margin: 0 20px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 24px;
}

.setting-label {
  font-size: 15px;
  font-weight: 500;
  color: var(--ide-text-active);
}

.setting-desc {
    font-size: 12px;
    color: var(--ide-text-light);
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
  }

/* 控件定制 */
.action-btn {
  border-radius: 8px;
  font-weight: 500;
}

.color-picker-group {
  display: flex;
  gap: 12px;
}

/* 主题预览卡片设计 */
.flex-col-item {
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.bg-gallery {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  width: 100%;
}

.bg-item {
  width: 120px;
  height: 80px;
  border-radius: 8px;
  border: 2px solid var(--ide-border);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--ide-text-light);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  background-size: cover;
  background-position: center;

  &:hover {
    border-color: var(--ide-border-hover);
    color: var(--ide-text-active);
  }

  &.active {
    border-color: var(--ide-accent);
    color: var(--ide-accent);
  }

  .bg-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &.active .bg-overlay {
    opacity: 1;
  }
}

.none-bg {
  background: var(--ide-bg);
}

.upload-bg {
  border-style: dashed;
  background: transparent;

  &:hover {
    background: var(--ide-hover);
  }
}

.slider-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;

  .slider-wrapper {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 16px;
    padding: 0 8px;
  }

  .modern-slider {
    flex: 1;
  }

  .slider-val {
    width: 40px;
    text-align: right;
    font-size: 13px;
    color: var(--ide-text-light);
    font-family: monospace;
  }
}

.theme-selector {
  display: flex;
  gap: 16px;
  padding-top: 8px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  .theme-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--ide-text-light);
    transition: color 0.3s ease !important;
  }

  &.active {
    .theme-preview {
      border-color: var(--ide-accent);
      box-shadow: 0 0 0 2px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.3);
    }
    .theme-name {
      color: var(--ide-text-active);
      font-weight: 600;
    }
  }

  &:hover:not(.active) .theme-preview {
    border-color: var(--ide-border);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.theme-preview {
  width: 80px;
  height: 56px;
  border-radius: 8px;
  border: 2px solid transparent;
  background: var(--ide-panel-bg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), border-color 0.3s ease, box-shadow 0.3s ease !important;

  .preview-header {
    height: 12px;
    width: 100%;
  }

  .preview-body {
    flex: 1;
    display: flex;
  }

  .preview-sidebar {
    width: 20px;
    height: 100%;
  }

  .preview-content {
    flex: 1;
    height: 100%;
  }

  /* 浅色主题骨架 */
  &.light {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    .preview-header { background: #ffffff; border-bottom: 1px solid #f1f5f9; }
    .preview-sidebar { background: #f1f5f9; }
    .preview-content { background: #ffffff; }
  }

  /* 深色主题骨架 */
  &.dark {
    background: #0f172a;
    border: 2px solid #1e293b;
    .preview-header { background: #1e293b; border-bottom: 1px solid #334155; }
    .preview-sidebar { background: #1e293b; }
    .preview-content { background: #0f172a; }
  }

  /* 跟随系统 (对半分割) */
  &.auto {
    flex-direction: row;
    border: 2px solid #cbd5e1;
    padding: 0;

    .half {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .light-half {
      background: #f8fafc;
      border-right: 1px solid #cbd5e1;
      .preview-header { background: #ffffff; }
      .preview-sidebar { background: #f1f5f9; width: 100%; }
    }

    .dark-half {
      background: #0f172a;
      .preview-header { background: #1e293b; }
      .preview-content { background: #0f172a; width: 100%; }
    }
  }
}

.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: scale(1.15);
  }

  &.active {
    transform: scale(1.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.color-dot-check {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 11px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.2);
}

/* 自定义颜色选择器按钮重构 */
.custom-color-dot {
  position: relative;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  width: 24px;
  height: 24px;

  :deep(.el-color-picker) {
    width: 100%;
    height: 100%;
  }

  :deep(.el-color-picker__trigger) {
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
  }

  :deep(.el-color-picker__color) {
    border: none;
  }

  :deep(.el-color-picker__color-inner) {
    border-radius: 50%;
  }

  &.active {
    transform: scale(1.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

    &::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 2px solid var(--ide-accent, #409EFF);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9);
      pointer-events: none;
    }
  }

  &:hover {
    transform: scale(1.15);
  }
}

/* ======== 更新源选择卡片 ======== */
.update-source-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.update-source-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1.5px solid var(--ide-border);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: rgba(255, 255, 255, 0.5);

  html.dark & {
    background: rgba(15, 23, 42, 0.2);
  }

  &:hover {
    border-color: var(--ide-border-hover);
    background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.04);
  }

  &.active {
    border-color: var(--ide-accent);
    background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.08);
    box-shadow: 0 0 0 3px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.1);
  }

  &.disabled {
    opacity: 0.55;
    pointer-events: none;
  }
}

.usc-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.usc-radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--ide-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.2s ease;

  .update-source-card.active & {
    border-color: var(--ide-accent);
  }

  .radio-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ide-accent);
  }
}

.usc-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ide-text-active);
  flex: 1;
}

.usc-url {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--ide-text-light);
  font-family: 'JetBrains Mono', monospace;
  padding-left: 28px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .el-icon {
    font-size: 12px;
    flex-shrink: 0;
  }
}

.usc-features {
  display: flex;
  gap: 6px;
  padding-left: 28px;
}

.feature-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.1);
  color: var(--ide-accent);

  &.diff-badge {
    background: rgba(103, 194, 58, 0.12);
    color: #67c23a;
  }
}

/* 关于页面特殊布局 */
.about-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-top: 40px;

  .about-logo {
    width: 96px;
    height: 96px;
    background: linear-gradient(135deg, #f0f5ff 0%, #e1ebff 100%);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);

    .huge-logo {
      width: 48px;
      height: 48px;
      object-fit: contain;
    }
  }

  .app-name {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: var(--ide-text-active);
  }

  .app-version {
    font-size: 14px;
    color: var(--ide-text-light);
    margin: 0 0 16px 0;
    font-family: 'JetBrains Mono', monospace;
  }

  .app-community {
    font-size: 13px;
    color: var(--ide-text-active);
    margin: 0 0 24px 0;
    background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.08);
    padding: 6px 16px;
    border-radius: 99px;
    font-weight: 600;
    border: 1px solid rgba(var(--ide-accent-rgb, 64, 158, 255), 0.15);
  }

  .about-links {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;

    a {
      color: var(--ide-accent);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;

      &:hover { text-decoration: underline; }
    }

    .dot {
      color: var(--ide-text-light);
    }
  }

  .about-update-card {
    width: 100%;
  }

  .disclaimer-card {
    width: 100%;
    background: var(--ide-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 12px;
    border: 1px solid var(--ide-border);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
    overflow: hidden;
    text-align: left;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

    &:hover {
      background: var(--ide-panel-bg);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        var(--ide-shadow-1);
      transform: translateY(-2px);
    }

    .disclaimer-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--ide-bg);
      border-bottom: 1px solid var(--ide-border);
      color: var(--ide-text-active);
      font-weight: 600;
      font-size: 13px;

      .el-icon {
        color: #eab308;
        font-size: 16px;
      }
    }

    .disclaimer-content {
      padding: 16px;
      font-size: 12px;
      color: var(--ide-text-light);
      line-height: 1.6;
      max-height: 160px;
      overflow-y: auto;

      /* 美化滚动条 */
      &::-webkit-scrollbar {
        width: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 2px;
      }
      &::-webkit-scrollbar-track {
        background: transparent;
      }

      p {
        margin: 0 0 12px 0;
        &:last-child { margin: 0; }

        strong {
          color: var(--ide-text);
          font-weight: 600;
        }
      }
    }
  }
}

/* 切换动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ======== 快捷键录入组件 ======== */
.shortcut-recorder {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 100px;
  height: 32px;
  padding: 0 12px;
  background: var(--ide-bg);
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;

  &:hover {
    border-color: var(--ide-border-hover, #c0c4cc);
    background: var(--ide-hover, rgba(0, 0, 0, 0.02));
  }

  &.recording {
    border-color: var(--ide-accent);
    box-shadow: 0 0 0 2px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.2);
    background: #ffffff;
  }

  kbd {
    display: inline-block;
    padding: 2px 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
    font-weight: 600;
    line-height: 14px;
    color: var(--ide-text-active);
    background-color: var(--ide-panel-bg, #ffffff);
    border: 1px solid var(--ide-border);
    border-radius: 4px;
    box-shadow: inset 0 -1px 0 var(--ide-border);
  }

  .recording-text {
    font-size: 12px;
    color: var(--ide-accent);
    animation: pulse 1.5s infinite;
  }
}

@keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

.shortcut-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(var(--ide-accent-rgb, 64, 158, 255), 0.05);
  border-radius: 8px;
  color: var(--ide-text-light);
  font-size: 12px;
  line-height: 1.5;

  .el-icon {
    color: var(--ide-accent);
    font-size: 14px;
    margin-top: 2px;
  }
}

/* 覆盖 Element Plus 样式 */
:deep(.modern-radio-group) {
  .el-radio-button__inner {
    border: 1px solid #edf2f7;
    background: #ffffff;
    box-shadow: none !important;
  }
  .el-radio-button__original-radio:checked + .el-radio-button__inner {
    background-color: var(--ide-accent);
    border-color: var(--ide-accent);
    color: white;
  }
}

:deep(.modern-input) {
  .el-input__wrapper {
    border-radius: 8px;
    box-shadow: 0 0 0 1px #edf2f7 inset;
    background: #ffffff;
    padding: 0 12px;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 0 0 1px var(--ide-accent-hover, #66b1ff) inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px var(--ide-accent) inset, 0 0 0 2px rgba(var(--ide-accent-rgb, 64, 158, 255), 0.2);
    }
  }

  .el-input__inner {
    font-size: 13px;
    color: var(--ide-text-active);
    height: 32px;
    line-height: 32px;

    &::placeholder {
      color: var(--ide-text-light);
      opacity: 0.6;
    }
  }
}

/* 协议专属内嵌弹窗 (完全自定义，替代原生的 el-dialog) */
.license-overlay-inner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 使用 CSS 变量来控制透明度，这样就可以在浅色/深色下有不同的表现 */
  background-color: rgba(var(--ide-bg-rgb, 248, 250, 252), 0.7);
  /* 让背景色也能随着主题丝滑切换 */
  transition: background-color 0.4s ease;
}

.license-card {
  width: 560px;
  max-height: 80%;
  background: rgba(255, 255, 255, 0.95) !important;
  border-radius: 16px;
  box-shadow: var(--ide-shadow-2), 0 0 0 1px var(--ide-border) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: background-color 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;

  html.dark & {
    background: rgba(30, 30, 30, 0.95) !important;
  }
}

.license-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(245, 245, 247, 0.8) !important;
  border-bottom: 1px solid var(--ide-border);

  html.dark & {
    background: rgba(20, 20, 20, 0.8) !important;
  }

  h3 {
    margin: 0;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    color: var(--ide-text-active);
    font-size: 16px;
  }

  .close-action {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--ide-text-light);
    transition: all 0.2s ease;
    background: transparent;

    &:hover {
      background: var(--ide-border);
      color: var(--ide-text-active);
      transform: rotate(90deg);
    }
  }
}

.license-content {
  padding: 24px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ide-text);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }

  p {
    margin: 0 0 16px 0;
    text-align: justify;

    &:last-child {
      margin: 0;
    }
  }
}

/* 内嵌弹窗动画 */
.license-zoom-enter-active,
.license-zoom-leave-active {
  transition: opacity 0.5s ease;

  .license-card {
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease;
  }
}

.license-zoom-enter-from,
.license-zoom-leave-to {
  opacity: 0;

  .license-card {
    opacity: 0;
    transform: scale(0.85) translateY(20px);
  }
  .el-color-picker__trigger {
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
  }
}
</style>

<style lang="scss">
/* 修复取色器弹窗层级过低被 Modal 遮挡的问题 */
.custom-color-picker-popper {
  z-index: 10000 !important;
}

/* 深色模式下的输入框适配 (提取为全局，防止 Teleport 导致作用域失效) */
html.dark {
  .modern-input {
    .el-input__wrapper {
      background-color: var(--ide-bg) !important;
      box-shadow: 0 0 0 1px var(--ide-border) inset !important;

      &:hover {
        box-shadow: 0 0 0 1px var(--ide-border-hover) inset !important;
      }

      &.is-focus {
        box-shadow: 0 0 0 1px var(--ide-accent) inset !important;
      }
    }

    .el-input__inner {
      color: var(--ide-text-active) !important;
      -webkit-text-fill-color: var(--ide-text-active) !important; /* 修复部分浏览器下输入框文字颜色 */
      &::placeholder {
        color: var(--ide-text-light) !important;
        -webkit-text-fill-color: var(--ide-text-light) !important;
      }
    }

    /* 修复时间选择器前置图标的颜色 */
    .el-input__prefix,
    .el-input__prefix-inner {
      color: var(--ide-text-light) !important;
      .el-icon {
        color: var(--ide-text-light) !important;
      }
    }

    /* 修复清除按钮等后置图标的颜色 */
    .el-input__suffix,
    .el-input__suffix-inner {
      color: var(--ide-text-light) !important;
      .el-icon {
        color: var(--ide-text-light) !important;
      }
    }
  }

  .custom-color-dot.active::after {
    box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.78);
  }

  /* 适配 el-date-picker 弹出的年份面板 */
  .el-picker-panel {
    background-color: var(--ide-panel-bg) !important;
    border-color: var(--ide-border) !important;
    color: var(--ide-text) !important;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset !important;

    .el-date-picker__header-label,
    .el-picker-panel__icon-btn {
      color: var(--ide-text-active) !important;
      &:hover { color: var(--ide-accent) !important; }
    }

    .el-year-table td .cell {
      color: var(--ide-text) !important;
      &:hover { color: var(--ide-accent) !important; }
    }
    .el-year-table td.current:not(.disabled) .cell {
      color: #ffffff !important;
      background-color: var(--ide-accent) !important;
    }

    /* 弹出层小箭头 */
    .el-popper__arrow::before {
      background-color: var(--ide-panel-bg) !important;
      border-color: var(--ide-border) !important;
    }
  }
}
</style>
