import { defineStore } from 'pinia'

// 金币类型定义
const COIN_TYPES = {
  BLUE: { key: 'blue', name: '高质量休闲', color: '#2196F3' },
  GREEN: { key: 'green', name: '基础生理需求', color: '#4CAF50' },
  YELLOW: { key: 'yellow', name: '创造价值', color: '#FFC107' },
  ORANGE: { key: 'orange', name: '被动消耗', color: '#FF9800' },
  RED: { key: 'red', name: '无效时间', color: '#F44336' }
}

// 本地存储键名
const STORAGE_KEY = 'gold_coin_time_manager'

export const useTimeManagerStore = defineStore('timeManager', {
  state: () => ({
    // 当前日期
    currentDate: new Date(),
    // 所有金币数据
    allCoins: {},
    // 金币类型
    coinTypes: COIN_TYPES,
    // 设置
    settings: {
      startHour: 7,       // 开始时间（小时）
      endHour: 24,        // 结束时间（小时）
      coinDuration: 30,   // 每枚金币时长（分钟）
      reminderEnabled: true,  // 是否启用提醒
      customLabels: {}
    }
  }),

  getters: {
    // 获取今日日期字符串 YYYY-MM-DD
    todayString() {
      const d = this.currentDate
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    },

    // 获取今日金币数据
    todayCoins() {
      return this.allCoins[this.todayString] || this.initializeDailyCoins()
    },

    // 获取金币总数
    totalCoins() {
      const duration = (this.settings.endHour - this.settings.startHour) * 60 // 总分钟数
      return Math.floor(duration / this.settings.coinDuration)
    },

    // 获取统计数据
    statistics() {
      const stats = {
        total: 0,
        byType: {},
        percentages: {}
      }

      // 初始化类型统计
      Object.keys(this.coinTypes).forEach(key => {
        stats.byType[this.coinTypes[key].key] = 0
      })

      // 统计今日金币
      const coins = this.todayCoins
      stats.total = coins.length

      coins.forEach(coin => {
        if (coin.type) {
          stats.byType[coin.type] = (stats.byType[coin.type] || 0) + 1
        }
      })

      // 计算百分比
      if (stats.total > 0) {
        Object.keys(stats.byType).forEach(type => {
          stats.percentages[type] = ((stats.byType[type] / stats.total) * 100).toFixed(1)
        })
      }

      return stats
    },

    // 获取时间金币陷阱提醒
    traps() {
      const traps = []
      const coins = this.todayCoins
      
      // 连续红色金币检测
      let redCount = 0
      let maxRedCount = 0
      
      coins.forEach(coin => {
        if (coin.type === 'red') {
          redCount++
          maxRedCount = Math.max(maxRedCount, redCount)
        } else {
          redCount = 0
        }
      })
      
      if (maxRedCount >= 3) {
        traps.push(`发现连续${maxRedCount}个无效时间金币，建议及时调整！`)
      }
      
      // 黄色金币不足检测
      const yellowCount = this.statistics.byType.yellow || 0
      if (yellowCount < this.totalCoins * 0.3) {
        traps.push('创造价值的时间不足，建议增加黄色金币占比！')
      }
      
      // 橙色金币过多检测
      const orangeCount = this.statistics.byType.orange || 0
      if (orangeCount > this.totalCoins * 0.4) {
        traps.push('被动消耗时间过多，建议减少不必要的会议和社交媒体使用！')
      }
      
      return traps
    }
  },

  actions: {
    // 初始化每日金币数据
    initializeDailyCoins() {
      const dateStr = this.todayString
      const coins = []
      const startHour = this.settings.startHour
      const coinDuration = this.settings.coinDuration
      const totalCoins = this.totalCoins

      // 生成34枚金币
      for (let i = 0; i < totalCoins; i++) {
        const coinTime = new Date(this.currentDate)
        coinTime.setHours(startHour)
        coinTime.setMinutes(i * coinDuration)
        
        coins.push({
          id: `${dateStr}-${i}`,
          index: i,
          startTime: coinTime.toISOString(),
          endTime: new Date(coinTime.getTime() + coinDuration * 60000).toISOString(),
          type: null,
          description: '',
          createdAt: new Date().toISOString()
        })
      }

      // 保存到本地存储
      if (!this.allCoins[dateStr]) {
        this.allCoins[dateStr] = coins
        this.saveToStorage()
      }

      return coins
    },

    // 更新金币类型
    updateCoinType(coinId, type, description = '') {
      const coins = this.todayCoins
      const coin = coins.find(c => c.id === coinId)
      
      if (coin) {
        coin.type = type
        coin.description = description
        coin.updatedAt = new Date().toISOString()
        
        this.allCoins[this.todayString] = coins
        this.saveToStorage()
      }
    },

    // 删除金币记录
    resetCoin(coinId) {
      const coins = this.todayCoins
      const coin = coins.find(c => c.id === coinId)
      
      if (coin) {
        coin.type = null
        coin.description = ''
        
        this.allCoins[this.todayString] = coins
        this.saveToStorage()
      }
    },

    // 切换到指定日期
    setDate(date) {
      this.currentDate = new Date(date)
      // 确保该日期的金币数据已初始化
      this.initializeDailyCoins()
    },

    // 更新设置
    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings }
      // 如果时间设置改变，重新初始化金币
      if (newSettings.startHour !== undefined || newSettings.endHour !== undefined || newSettings.coinDuration !== undefined) {
        this.initializeDailyCoins()
      }
      this.saveToStorage()
    },

    // 保存数据到本地存储
    saveToStorage() {
      const data = {
        allCoins: this.allCoins,
        settings: this.settings
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    },

    // 从本地存储加载数据
    loadFromStorage() {
      try {
        const data = localStorage.getItem(STORAGE_KEY)
        if (data) {
          const parsed = JSON.parse(data)
          this.allCoins = parsed.allCoins || {}
          this.settings = parsed.settings || this.settings
        }
      } catch (error) {
        console.error('加载数据失败:', error)
      }
      // 确保今日数据已初始化
      this.initializeDailyCoins()
    },

    // 导出数据
    exportData() {
      const data = {
        version: '1.0',
        exportTime: new Date().toISOString(),
        data: {
          allCoins: this.allCoins,
          settings: this.settings
        }
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gold_coin_export_${this.todayString}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },

    // 导入数据
    importData(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result)
            if (data.data) {
              this.allCoins = data.data.allCoins || this.allCoins
              this.settings = data.data.settings || this.settings
              this.saveToStorage()
              resolve('导入成功')
            } else {
              reject('无效的数据格式')
            }
          } catch (error) {
            reject('导入失败: ' + error.message)
          }
        }
        reader.onerror = () => reject('文件读取失败')
        reader.readAsText(file)
      })
    },

    // 清空所有数据
    clearAllData() {
      if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        this.allCoins = {}
        this.initializeDailyCoins() // 重新初始化今日数据
        this.saveToStorage()
        return true
      }
      return false
    }
  }
})