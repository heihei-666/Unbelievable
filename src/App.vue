<template>
  <div class="app-container">
    <header class="app-header">
      <h1>34金币时间管理系统</h1>
      <p>源自《你一年的8760小时》- 努尔艾力·阿不利孜</p>
    </header>
    
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <nav class="app-nav">
      <router-link to="/" class="nav-item" active-class="active">
        <span class="nav-icon">📅</span>
        <span class="nav-text">今日金币</span>
      </router-link>
      <router-link to="/analysis" class="nav-item" active-class="active">
        <span class="nav-icon">📊</span>
        <span class="nav-text">统计分析</span>
      </router-link>
      <router-link to="/settings" class="nav-item" active-class="active">
        <span class="nav-icon">⚙️</span>
        <span class="nav-text">设置</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
// App组件的逻辑将在各子组件中实现
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.app-header {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
}

.app-header p {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.app-main {
  flex: 1;
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.app-nav {
  display: flex;
  justify-content: space-around;
  background: white;
  padding: 0.5rem 0;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 1rem;
  color: #666;
  text-decoration: none;
  transition: all 0.3s ease;
  flex: 1;
}

.nav-item.active {
  color: #4CAF50;
}

.nav-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.nav-text {
  font-size: 0.75rem;
}

/* 过渡动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (min-width: 768px) {
  .app-nav {
    position: static;
    margin-top: 2rem;
  }
  
  .app-main {
    margin-bottom: 2rem;
  }
}
</style>