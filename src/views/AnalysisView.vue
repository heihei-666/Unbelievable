<template>
  <div class="analysis-view">
    <!-- 时间范围选择 -->
    <div class="time-range-selector">
      <button
        v-for="range in timeRanges"
        :key="range.value"
        class="range-button"
        :class="{ active: selectedRange === range.value }"
        @click="selectTimeRange(range.value)"
      >
        {{ range.label }}
      </button>
    </div>

    <!-- 总体统计卡片 -->
    <div class="overview-card card">
      <h3>总体统计</h3>
      <div class="overview-stats">
        <div class="overview-item">
          <span class="overview-label">记录天数</span>
          <span class="overview-value">{{ analysisData.totalDays }}</span>
        </div>
        <div class="overview-item">
          <span class="overview-label">总金币数</span>
          <span class="overview-value">{{ analysisData.totalCoins }}</span>
        </div>
        <div class="overview-item">
          <span class="overview-label">平均完成率</span>
          <span class="overview-value">{{ analysisData.averageCompletion }}%</span>
        </div>
      </div>
    </div>

    <!-- 饼图：时间分布 -->
    <div class="chart-card card">
      <h3>时间类型分布</h3>
      <div class="chart-container">
        <canvas ref="pieChartRef"></canvas>
      </div>
    </div>

    <!-- 柱状图：每日完成情况 -->
    <div class="chart-card card">
      <h3>每日完成情况</h3>
      <div class="chart-container">
        <canvas ref="barChartRef"></canvas>
      </div>
    </div>

    <!-- 趋势分析 -->
    <div class="chart-card card">
      <h3>核心价值时间趋势</h3>
      <div class="chart-container">
        <canvas ref="lineChartRef"></canvas>
      </div>
    </div>

    <!-- 时间管理建议 -->
    <div class="advice-card card">
      <h3>时间管理建议</h3>
      <ul class="advice-list">
        <li v-for="(advice, index) in getAdvice()" :key="index" class="advice-item">
          {{ advice }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useTimeManagerStore } from '../stores/timeManager'

// 注册 Chart.js 组件
Chart.register(...registerables)

const store = useTimeManagerStore()
const selectedRange = ref('week') // week, month, all
const pieChartRef = ref(null)
const barChartRef = ref(null)
const lineChartRef = ref(null)
let pieChart = null
let barChart = null
let lineChart = null

// 时间范围选项
const timeRanges = [
  { label: '近7天', value: 'week' },
  { label: '近30天', value: 'month' },
  { label: '全部', value: 'all' }
]

// 计算分析数据
const analysisData = computed(() => {
  const allCoins = store.allCoins
  const coinTypes = store.coinTypes
  const totalCoinsPerDay = store.totalCoins
  
  let days = Object.keys(allCoins)
  
  // 根据选择的时间范围过滤天数
  if (selectedRange.value === 'week') {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    days = days.filter(day => new Date(day) >= weekAgo)
  } else if (selectedRange.value === 'month') {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    days = days.filter(day => new Date(day) >= monthAgo)
  }
  
  // 初始化统计数据
  const stats = {
    totalDays: days.length,
    totalCoins: 0,
    totalRecorded: 0,
    byType: {},
    dailyCompletion: [],
    yellowTrend: []
  }
  
  // 初始化类型统计
  Object.keys(coinTypes).forEach(key => {
    stats.byType[coinTypes[key].key] = 0
  })
  
  // 统计数据
  days.sort().forEach(day => {
    const coins = allCoins[day]
    if (coins && coins.length > 0) {
      const recordedCoins = coins.filter(c => c.type)
      const dayStats = {
        date: day,
        total: coins.length,
        recorded: recordedCoins.length,
        completion: coins.length > 0 ? (recordedCoins.length / coins.length * 100) : 0,
        yellowCount: 0
      }
      
      recordedCoins.forEach(coin => {
        if (coin.type) {
          stats.byType[coin.type] = (stats.byType[coin.type] || 0) + 1
          if (coin.type === 'yellow') {
            dayStats.yellowCount++
          }
        }
      })
      
      stats.totalCoins += coins.length
      stats.totalRecorded += recordedCoins.length
      stats.dailyCompletion.push(dayStats)
      stats.yellowTrend.push(dayStats)
    }
  })
  
  // 计算平均完成率
  stats.averageCompletion = stats.dailyCompletion.length > 0 
    ? (stats.dailyCompletion.reduce((sum, day) => sum + day.completion, 0) / stats.dailyCompletion.length).toFixed(1)
    : '0.0'
  
  return stats
})

// 方法
const selectTimeRange = (range) => {
  selectedRange.value = range
  updateCharts()
}

const formatDateLabel = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const updatePieChart = () => {
  if (pieChart) {
    pieChart.destroy()
  }
  
  const ctx = pieChartRef.value.getContext('2d')
  const data = analysisData.value
  const labels = []
  const values = []
  const colors = []
  
  Object.entries(data.byType).forEach(([type, count]) => {
    if (count > 0) {
      const coinType = store.coinTypesArray.find(t => t.key === type)
      if (coinType) {
        labels.push(coinType.name)
        values.push(count)
        colors.push(coinType.color)
      }
    }
  })
  
  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = ((context.parsed / total) * 100).toFixed(1)
              return `${context.label}: ${context.parsed}枚 (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

const updateBarChart = () => {
  if (barChart) {
    barChart.destroy()
  }
  
  const ctx = barChartRef.value.getContext('2d')
  const dailyData = analysisData.value.dailyCompletion.slice(-7) // 只显示最近7天
  
  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dailyData.map(d => formatDateLabel(d.date)),
      datasets: [{
        label: '完成率',
        data: dailyData.map(d => d.completion),
        backgroundColor: '#4CAF50',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%'
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `完成率: ${context.parsed.y.toFixed(1)}%`
            }
          }
        }
      }
    }
  })
}

const updateLineChart = () => {
  if (lineChart) {
    lineChart.destroy()
  }
  
  const ctx = lineChartRef.value.getContext('2d')
  const trendData = analysisData.value.yellowTrend.slice(-7)
  
  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trendData.map(d => formatDateLabel(d.date)),
      datasets: [{
        label: '创造价值金币数',
        data: trendData.map(d => d.yellowCount),
        borderColor: '#FFC107',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#FFC107',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  })
}

const updateCharts = async () => {
  await nextTick()
  updatePieChart()
  updateBarChart()
  updateLineChart()
}

const getAdvice = () => {
  const data = analysisData.value
  const advice = []
  
  // 基于统计数据生成建议
  if (data.totalDays > 0) {
    const yellowPercent = data.byType.yellow ? (data.byType.yellow / data.totalRecorded * 100) : 0
    const redPercent = data.byType.red ? (data.byType.red / data.totalRecorded * 100) : 0
    const orangePercent = data.byType.orange ? (data.byType.orange / data.totalRecorded * 100) : 0
    
    if (yellowPercent < 25) {
      advice.push('创造价值的时间占比较低，建议增加专注工作和学习的时间。')
    }
    
    if (redPercent > 20) {
      advice.push('无效时间较多，建议减少无目的的浏览和拖延行为。')
    }
    
    if (orangePercent > 35) {
      advice.push('被动消耗时间占比较高，建议减少不必要的会议和干扰。')
    }
    
    if (parseFloat(data.averageCompletion) < 70) {
      advice.push('记录完成率有待提高，坚持记录才能更好地管理时间。')
    }
    
    if (advice.length === 0) {
      advice.push('时间管理状态良好，继续保持！')
      advice.push('尝试设定更有挑战性的目标，进一步提升时间利用效率。')
    }
  } else {
    advice.push('开始记录您的时间金币，让我们一起提升时间管理效率！')
  }
  
  return advice
}

// 生命周期
onMounted(() => {
  store.loadFromStorage()
  updateCharts()
})

watch(() => analysisData.value, () => {
  updateCharts()
}, { deep: true })
</script>

<style scoped>
.analysis-view {
  padding-bottom: 80px;
}

.time-range-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  padding: 0.5rem 0;
}

.range-button {
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: var(--color-white);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.range-button.active {
  background: var(--color-green);
  color: white;
  border-color: var(--color-green);
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.overview-item {
  text-align: center;
  padding: 1rem;
  background: var(--color-gray);
  border-radius: var(--border-radius);
}

.overview-label {
  display: block;
  font-size: 0.9rem;
  color: var(--color-dark-gray);
  margin-bottom: 0.5rem;
}

.overview-value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-green);
}

.chart-card {
  margin-bottom: 1.5rem;
}

.chart-container {
  position: relative;
  height: 300px;
  margin-top: 1rem;
}

.advice-card {
  margin-bottom: 1.5rem;
}

.advice-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}

.advice-item {
  padding: 1rem;
  background: var(--color-gray);
  border-radius: var(--border-radius);
  margin-bottom: 0.75rem;
  position: relative;
  padding-left: 2.5rem;
}

.advice-item::before {
  content: "💡";
  position: absolute;
  left: 1rem;
  top: 1rem;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .overview-stats {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .time-range-selector {
    justify-content: center;
  }
}
</style>