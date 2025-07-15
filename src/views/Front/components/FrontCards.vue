<script setup>
import { ref } from 'vue'

// 1. 在 <script> 中定义课程数据
// 这样做可以让你轻松地通过 v-for 来渲染任意数量的卡片
const courses = ref([
  {
    id: 1,
    title: 'Python for Everybody',
    meta: 'Beginners · Specialization',
    // --- 更新后的图片链接 ---
    image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=1974&auto=format&fit=crop'
  },
  {
    id: 2,
    title: 'Modern Web Development',
    meta: 'Intermediate · Career Path',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 3,
    title: 'Data Science A-Z',
    meta: 'All Levels · Certificate',
    // --- 更新后的图片链接 ---
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop'
  }
])
</script>

<template>
  <div class="featured-courses-section">
    <el-row :gutter="40" align="middle">
      <!-- 左侧的介绍文案和按钮 -->
      <el-col :span="6">
        <div class="intro-text">
          <h2 class="intro-title">Ignite Every Interest</h2>
          <p class="intro-description">
            Learning isn't just for a job—it's about discovering a wider world and a richer version of yourself.
          </p>
          <el-button class="explore-button" type="primary" size="large" round>
            Explore More
          </el-button>
        </div>
      </el-col>

      <!-- 右侧的课程卡片组 -->
      <el-col :span="18">
        <el-row :gutter="20">
          <!-- 2. 使用 v-for 循环渲染课程卡片 -->
          <el-col v-for="course in courses" :key="course.id" :span="8">
            <!-- <RouterLink :to="`/course/${course.id}`" class="card-link"> -->
              <el-card class="course-card" :body-style="{ padding: '0px' }">
                <div class="image-container">
                  <img :src="course.image" class="card-image" />
                </div>
                <div class="content-container">
                  <div class="title">{{ course.title }}</div>
                  <div class="meta">{{ course.meta }}</div>
                </div>
              </el-card>
            <!-- </RouterLink> -->
          </el-col>
        </el-row>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.featured-courses-section {
  padding: 80px 80px;
  background-color: #e1eaf7;
}

/* 左侧介绍区域的样式 */
.intro-text {
  padding-right: 20px; /* 给右侧一些空间，避免文字贴太近 */
}
.intro-title {
  font-size: 30px;
  font-weight: bold;
  margin-bottom: 20px;
}
.intro-description {
  font-size: 16px;
  line-height: 1.7;
  color: #606266;
  margin-bottom: 28px;
}
.explore-button:hover {
  background-color: #79bbff;
  border-color: #79bbff;
}

/* --- 这里是所有从旧组件移动过来的样式 --- */

.card-link {
  text-decoration: none;
}

.course-card {
  width: 100%; /* 让卡片宽度自适应列宽 */
  border-radius: 8px;
  transition: all 0.3s ease;
}
.course-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.image-container {
  width: 100%;
  overflow: hidden;
  aspect-ratio: 16 / 9;
}
.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.content-container {
  padding: 16px;
}
.title {
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #303133;
}
.meta {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}
</style>