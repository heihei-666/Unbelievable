<template>
  <div class="settings-view">
    <!-- 基本设置 -->
    <div class="settings-card card">
      <h3>基本设置</h3>
      
      <div class="form-group">
        <label class="form-label">开始时间 (小时)</label>
        <input
          type="number"
          class="form-input"
          v-model.number="localSettings.startHour"
          min="0"
          max="23"
          @change="saveSettings"
        />
      </div>
      
      <div class="form-group">
        <label class="form-label">结束时间 (小时)</label>
        <input
          type="number"
          class="form-input"
          v-model.number="localSettings.endHour"
          min="1"
          max="24"
          @change="saveSettings"
        />
      </div>
      
      <div class="form-group">
        <label class="form-label">每枚金币时长 (分钟)</label>
        <input
          type="number"
          class="form-input"
          v-model.number="localSettings.coinDuration"
          min="15"
          max="60"
          step="5"
          @change="saveSettings"
        />
      </div>
      
      <div class="form-group">
        <label class="form-label">
          <input
            type="checkbox"
            v-model="localSettings.reminderEnabled"
            @change="saveSettings"
          />
          启用时间提醒
        </label>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="settings-card card">
      <h3>数据管理</h3>
      
      <div class="action-buttons">
        <button class="btn btn-primary full-width" @click="exportData">
          📥 导出数据
        </button>
        
        <label class="btn btn-secondary full-width file-input-label">
          📤 导入数据
          <input
            type="file"
            accept=".json"
            class="file-input"
            @change="handleFileImport"
          />
        </label>
        
        <button class="btn btn-danger full-width" @click="confirmClearData">
          ⚠️ 清空所有数据
        </button>
      </div>
      
      <div v-if="message" class="message" :class="messageType">
        {{ message }}
      </div>
    </div>

    <!-- 关于 -->
    <div class="settings-card card">
      <h3>关于</h3>
      
      <div class="about-info">
        <p><strong>34金币时间管理系统</strong></p>
        <p class="version">版本 1.0.0</p>
        
        <div class="about-description">
          <p>基于努尔艾力·阿不利孜的《你一年的8760小时》中的时间管理方法。</p>
          <p>将每天从早上7点到晚上12点的17个清醒小时，按半小时为单位划分为34个"时间金币"。</p>
        </div>
        
        <div class="time-types">
          <h4>时间类型说明：</h4>
          <ul class="type-list">
            <li v-for="type in coinTypesArray" :key="type.key" class="type-item">
              <span class="type-color" :style="{ backgroundColor: type.color }"></span>
              <span class="type-name">{{ type.name }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 安装提示 -->
    <div v-if="showInstallPrompt" class="install-prompt card">
      <h4>📱 添加到主屏幕</h4>
      <p>将此应用添加到您的手机主屏幕，获得接近原生应用的体验！</p>
      <button class="btn btn-primary" @click="installApp">立即安装</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useTimeManagerStore } from '../stores/timeManager'

const store = useTimeManagerStore()
const localSettings = ref({})
const message = ref('')
const messageType = ref('success')
const showInstallPrompt = ref(false)
let deferredPrompt = null

// 计算属性
const coinTypesArray = computed(() => Object.values(store.coinTypes))

// 方法
const saveSettings = () => {
  store.updateSettings(localSettings.value)
  showMessage('设置已保存', 'success')
}

const exportData = () => {
  store.exportData()
  showMessage('数据导出成功', 'success')
}

const handleFileImport = async (event) => {
  const file = event.target.files[0]
  if (file) {
    try {
      await store.importData(file)
      showMessage('数据导入成功', 'success')
      // 清空文件输入，允许重复导入相同文件
      event.target.value = ''
    } catch (error) {
      showMessage(error, 'error')
    }
  }
}

const confirmClearData = () => {
  if (store.clearAllData()) {
    showMessage('所有数据已清空', 'success')
  }
}

const showMessage = (text, type = 'success') => {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

const handleBeforeInstallPrompt = (e) => {
  // 阻止Chrome 67及更早版本自动显示安装提示
  e.preventDefault()
  // 存储事件以便稍后触发
  deferredPrompt = e
  // 显示自定义安装按钮
  showInstallPrompt.value = true
}

const installApp = async () => {
  if (!deferredPrompt) return
  
  // 显示安装提示
  deferredPrompt.prompt()
  
  // 等待用户响应
  const { outcome } = await deferredPrompt.userChoice
  console.log(`用户选择: ${outcome}`)
  
  // 无论结果如何，我们都不能再次使用该提示
  deferredPrompt = null
  showInstallPrompt.value = false
}

const checkIfStandalone = () => {
  // 检查是否已安装为PWA
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                     window.navigator.standalone
  
  if (isStandalone) {
    showInstallPrompt.value = false
  }
}

// 生命周期
onMounted(() => {
  // 加载设置
  localSettings.value = { ...store.settings }
  
  // 监听安装事件
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  
  // 检查是否已安装
  checkIfStandalone()
  window.addEventListener('change', checkIfStandalone)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('change', checkIfStandalone)
})
</script>

<style scoped>
.settings-view {
  padding-bottom: 80px;
}

.settings-card {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.full-width {
  width: 100%;
}

.file-input-label {
  display: inline-block;
  cursor: pointer;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.btn-danger {
  background-color: var(--color-red);
  color: white;
}

.btn-danger:hover {
  background-color: #d32f2f;
}

.message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  text-align: center;
  font-weight: 500;
}

.message.success {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.message.error {
  background-color: #ffebee;
  color: #c62828;
}

.about-info {
  line-height: 1.8;
}

.version {
  color: var(--color-dark-gray);
  margin-bottom: 1.5rem;
}

.about-description {
  background: var(--color-gray);
  padding: 1rem;
  border-radius: var(--border-radius);
  margin-bottom: 1.5rem;
}

.about-description p {
  margin-bottom: 0.5rem;
}

.time-types h4 {
  margin-bottom: 1rem;
}

.type-list {
  list-style: none;
  padding: 0;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-gray);
  border-radius: var(--border-radius);
  margin-bottom: 0.75rem;
}

.type-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.type-name {
  font-weight: 500;
}

.install-prompt {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.install-prompt h4 {
  margin-bottom: 0.5rem;
}

.install-prompt p {
  margin-bottom: 1.5rem;
  opacity: 0.9;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .settings-view {
    padding-bottom: 100px;
  }
}
</style>