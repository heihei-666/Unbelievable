<template>
  <div class="home-view">
    <!-- 日期选择器 -->
    <div class="date-selector">
      <button class="btn-date" @click="changeDate(-1)">←</button>
      <h2 class="current-date">{{ formatDate(currentDate) }}</h2>
      <button class="btn-date" @click="changeDate(1)">→</button>
    </div>

    <!-- 今日统计概览 -->
    <div class="today-summary card">
      <h3>今日统计</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">已记录</span>
          <span class="stat-value">{{ completedCount }}/{{ totalCoins }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">创造价值</span>
          <span class="stat-value">{{ statistics.byType.yellow || 0 }}枚</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">无效时间</span>
          <span class="stat-value">{{ statistics.byType.red || 0 }}枚</span>
        </div>
      </div>
    </div>

    <!-- 时间陷阱提醒 -->
    <div v-if="traps.length > 0" class="traps-alert card">
      <h4>⚠️ 时间陷阱提醒</h4>
      <ul class="traps-list">
        <li v-for="(trap, index) in traps" :key="index" class="trap-item">{{ trap }}</li>
      </ul>
    </div>

    <!-- 金币网格 -->
    <div class="coins-grid">
      <div
        v-for="coin in todayCoins"
        :key="coin.id"
        class="coin-item"
        :class="{ 'coin-filled': coin.type }"
        :style="{ borderColor: coin.type ? getCoinColor(coin.type) : '#ddd' }"
        @click="selectCoin(coin)"
      >
        <div class="coin-time">{{ formatCoinTime(coin.startTime) }}</div>
        <div
          v-if="coin.type"
          class="coin-color"
          :style="{ backgroundColor: getCoinColor(coin.type) }"
        ></div>
        <div v-else class="coin-placeholder">点击记录</div>
        <div v-if="coin.description" class="coin-desc">{{ coin.description }}</div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="selectedCoin" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>编辑时间金币</h3>
        <p class="modal-time">{{ formatCoinTime(selectedCoin.startTime) }} - {{ formatCoinTime(selectedCoin.endTime) }}</p>
        
        <div class="coin-types">
          <button
            v-for="type in coinTypesArray"
            :key="type.key"
            class="type-button"
            :class="{ active: selectedCoin.type === type.key }"
            :style="{ backgroundColor: selectedCoin.type === type.key ? type.color : 'transparent', borderColor: type.color, color: selectedCoin.type === type.key ? 'white' : type.color }"
            @click="setCoinType(type.key)"
          >
            {{ type.name }}
          </button>
        </div>

        <div class="form-group">
          <label class="form-label">描述（可选）</label>
          <input
            type="text"
            class="form-input"
            v-model="coinDescription"
            placeholder="输入活动描述"
            maxlength="50"
          />
          <small class="char-count">{{ coinDescription.length }}/50</small>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="resetCoin">清除</button>
          <button class="btn btn-primary" @click="saveCoin">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTimeManagerStore } from '../stores/timeManager'

const store = useTimeManagerStore()
const selectedCoin = ref(null)
const coinDescription = ref('')

// 计算属性
const todayCoins = computed(() => store.todayCoins)
const totalCoins = computed(() => store.totalCoins)
const currentDate = computed(() => store.currentDate)
const statistics = computed(() => store.statistics)
const traps = computed(() => store.traps)
const coinTypesArray = computed(() => Object.values(store.coinTypes))

const completedCount = computed(() => {
  return todayCoins.value.filter(coin => coin.type).length
})

// 方法
const formatDate = (date) => {
  const d = new Date(date)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
}

const formatCoinTime = (isoString) => {
  const date = new Date(isoString)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getCoinColor = (type) => {
  const coinType = store.coinTypesArray.find(t => t.key === type)
  return coinType ? coinType.color : '#ddd'
}

const changeDate = (days) => {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() + days)
  store.setDate(newDate)
}

const selectCoin = (coin) => {
  selectedCoin.value = coin
  coinDescription.value = coin.description || ''
}

const closeModal = () => {
  selectedCoin.value = null
  coinDescription.value = ''
}

const setCoinType = (type) => {
  if (selectedCoin.value) {
    selectedCoin.value.type = type
  }
}

const saveCoin = () => {
  if (selectedCoin.value) {
    store.updateCoinType(selectedCoin.value.id, selectedCoin.value.type, coinDescription.value)
    closeModal()
  }
}

const resetCoin = () => {
  if (selectedCoin.value) {
    store.resetCoin(selectedCoin.value.id)
    closeModal()
  }
}

// 生命周期
onMounted(() => {
  store.loadFromStorage()
})
</script>

<style scoped>
.home-view {
  padding-bottom: 80px;
}

.date-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.btn-date {
  background: var(--color-white);
  border: 1px solid #ddd;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-date:hover {
  background: var(--color-green);
  color: white;
  border-color: var(--color-green);
}

.current-date {
  margin: 0 1.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-black);
}

.today-summary {
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.stat-item {
  text-align: center;
  padding: 0.5rem;
  background: var(--color-gray);
  border-radius: var(--border-radius);
}

.stat-label {
  display: block;
  font-size: 0.9rem;
  color: var(--color-dark-gray);
  margin-bottom: 0.25rem;
}

.stat-value {
  display: block;
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--color-black);
}

.traps-alert {
  background: #FFF3CD;
  border: 1px solid #FFEAA7;
  margin-bottom: 1.5rem;
}

.traps-list {
  margin-top: 0.5rem;
  padding-left: 1.5rem;
}

.trap-item {
  color: #856404;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.coins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.coin-item {
  background: var(--color-white);
  border: 2px solid #ddd;
  border-radius: var(--border-radius);
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
  position: relative;
  overflow: hidden;
}

.coin-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.coin-item.coin-filled {
  border-width: 3px;
}

.coin-time {
  font-weight: 600;
  color: var(--color-black);
  margin-bottom: 0.5rem;
}

.coin-color {
  width: 100%;
  height: 10px;
  border-radius: 5px;
  margin-bottom: 0.5rem;
}

.coin-placeholder {
  color: var(--color-dark-gray);
  font-size: 0.9rem;
  opacity: 0.6;
}

.coin-desc {
  font-size: 0.85rem;
  color: var(--color-dark-gray);
  margin-top: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-white);
  border-radius: var(--border-radius);
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-time {
  color: var(--color-dark-gray);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.coin-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.type-button {
  padding: 0.75rem;
  border: 2px solid;
  border-radius: var(--border-radius);
  background: transparent;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.type-button.active {
  color: white !important;
}

.char-count {
  display: block;
  text-align: right;
  margin-top: 0.25rem;
  color: var(--color-dark-gray);
  font-size: 0.8rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.modal-actions .btn {
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .coins-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
  }
  
  .coin-item {
    min-height: 100px;
    padding: 0.75rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .coin-types {
    grid-template-columns: 1fr;
  }
}
</style>