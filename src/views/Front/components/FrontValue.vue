<script setup>
import { ref } from 'vue'
// 按需引入你需要的 Element Plus 图标
import { Trophy, Clock, Files } from '@element-plus/icons-vue'

// 1. 在 <script> 中定义一个包含所有优势点的数组
const propositions = ref([
  {
    icon: Trophy,
    title: 'Expert Instructors',
    description: 'Learn from industry leaders and top-tier university professors who bring real-world experience to every course.'
  },
  {
    icon: Clock,
    title: 'Flexible Learning',
    description: 'Learn at your own pace, on your own schedule. Access all materials anytime, anywhere, on any device.'
  },
  {
    icon: Files,
    title: 'Project-Based Curriculum',
    description: 'Apply what you learn with hands-on projects and case studies that help you build a portfolio and master skills.'
  }
])
</script>

<template>
  <div class="propositions-section">
    <!-- 我们可以加一个可选的标题 -->
    <h2 class="section-title">Why Learn With Us?</h2>
    
    <el-row :gutter="40">
      <!-- 2. 使用 v-for 循环生成每一个优势项 -->
      <el-col
        v-for="item in propositions"
        :key="item.title"
        :span="8"
      >
        <div class="proposition-item">
          <el-icon class="proposition-icon" :size="50">
            <component :is="item.icon" />
          </el-icon>
          <h3 class="proposition-title">{{ item.title }}</h3>
          <p class="proposition-description">{{ item.description }}</p>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.propositions-section {
  /* 你可以在这里调整模块的上下内边距 */
  padding: 64px 86px;
  background-color: #ffffff; /* 或者你想要的任何背景色 */
}

/* 如果需要，可以取消下面这行注释来添加一个标题 */

.section-title {
  text-align: center;
  font-size: 30px;
  font-weight: bold;
  margin-bottom: 60px;
  /* margin-left: 26px; */
  color: #222d3f;
}


.proposition-item {
  text-align: center;
  padding: 0 10px;
}

.proposition-icon {
  color: #409EFF; /* 使用 Element Plus 的主色调 */
}

.proposition-title {
  font-size: 20px;
  font-weight: bold;
  margin: 20px 0 10px 0;
  color: #303133;
}

.proposition-description {
  font-size: 16px;
  line-height: 1.7;
  color: #606266;
}
</style>