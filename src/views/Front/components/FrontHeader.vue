<template>
  <div class="layout">
    <!-- 顶部导航 -->
    <header class="navbar">

    <img src="@/assets/lion.png" alt="logo icon" class="logo-img" /> 

    <router-link to="/" class="logo"> K </router-link>

    <div class="search">
  <el-input
    v-model="searchQuery"  
    style="max-width: 600px; padding-left: 40px; height: 40px; width: 330px;"
    placeholder="What do you want to learn?"
    class="input-with-select"
    @keyup.enter="handleSearch"
  >
    <template #append>
      <el-button :icon="Search" @click="handleSearch" />
    </template>
  </el-input>
</div>

      <nav class="nav">
        <router-link to="/courses" class="nav-item" href="#">My Courses</router-link>
        <router-link to="/courses" class="nav-item" href="#">Find a Course</router-link>
        <a class="nav-item" href="#">Services</a>
        <a class="nav-item" href="#">Help</a>，
      </nav>

      <div class="auth-buttons">
        <!-- 登录前状态 -->
        <a href="#" class="auth-link">Login</a>
       
      </div>
    </header>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
const searchQuery = ref('') 

// 3. 获取 router 实例
const router = useRouter()

// 4. 创建处理搜索和跳转的函数
const handleSearch = () => {
  // 如果搜索内容为空，则不执行任何操作
  if (!searchQuery.value.trim()) {
    return
  }

  // 使用 router.push 进行跳转
  router.push({
    path: '/courses', // 目标路径
    query: {
      q: searchQuery.value // 将搜索词作为查询参数'q'附加到URL上
    }
  })
}
</script>

<style scoped>
.layout {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: #333;
}

/* 顶部导航栏样式 */
.navbar {
  position: fixed; /* 固定在页面最上 */
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;

  width: 100%;  /* 撑满整个屏幕 */
  height: 64px;
  display: flex;
  align-items: center;
  /* justify-content: space-between; */
  padding: 0 40px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.logo {
  font-size: 35px;
  font-weight: bold;
  color: #ff4833;
  padding-left: 40px;
}

.logo-img {
  height: 64px;
  width: auto;
  margin-left: 40px;
}

.nav {
  display: flex;
  gap: 30px;
  margin-left: 80px;
}

.nav-item {
  text-decoration: none;
  color: #333;
  font-size: 18px;
  position: relative;
  transition: color 0.3s;

  height: 64px; /* 与 .navbar 高度一致 */
  line-height: 64px; /* 垂直居中 */
  padding: 0 12px; /* 加一点左右内边距，美观 */
}

.nav-item:hover {
  color: #66809c;
  background-color: #e6f0fa;
}

.auth-buttons {
  margin-left: auto;
  padding-right: 40px;
  gap: 16px;
}

.auth-link {
  color: #26425e;
  text-decoration: none;
  font-size: 18px;
  font-weight: bold;

  /* 关键设置 ↓ */
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 16px;

  transition: background-color 0.3s;
}

.auth-link:hover {
  background-color: #ecf5ff;
  color: #66809c;
}

.register {
  border: 1px solid #409EFF;
}

</style>
