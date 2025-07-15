<script setup>
import { ref } from 'vue'
import { Monitor, Brush, DataAnalysis, MagicStick, ChatLineSquare, Sunrise } from '@element-plus/icons-vue'

// 1. Define an array containing all category data in English
const categories = ref([
  { name: 'Development', icon: Monitor, link: '/categories/development' },
  { name: 'Design', icon: Brush, link: '/categories/design' },
  { name: 'Business', icon: DataAnalysis, link: '/categories/business' },
  { name: 'Marketing', icon: MagicStick, link: '/categories/marketing' },
  { name: 'Language', icon: ChatLineSquare, link: '/categories/language' },
  { name: 'Personal Growth', icon: Sunrise, link: '/categories/growth' }
])
</script>

<template>
  <div class="category-section">
    <!-- Updated the section title to English -->
    <h2 class="section-title">Explore  Courses</h2>
    
    <!-- 2. Use el-row and v-for to generate the category cards -->
    <el-row :gutter="20">
      <el-col
        v-for="category in categories"
        :key="category.name"
        :xs="12" :sm="8" :md="4"
      >
        <!-- 3. Each card is a clickable link -->
        <!-- <RouterLink :to="category.link" class="category-card-link"> -->
          <div class="category-card">
            <el-icon :size="40" class="category-icon">
              <component :is="category.icon" />
            </el-icon>
            <span class="category-name">{{ category.name }}</span>
          </div>
        <!-- </RouterLink> -->
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.category-section {
  padding: 64px 80px; /* Add some padding to the entire section */
  background-color: #ffffff;
}

.section-title {
  text-align: center;
  font-size: 30px;
  font-weight: bold;
  margin-bottom: 30px;
  color: #1d3569;
}

.category-card-link {
  text-decoration: none; /* Remove underline from links */
}

.category-card {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 30px 20px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;

  /* Use Flexbox to vertically align the icon and text */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 150px; /* Give the card a fixed height */
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background-color: #e6f0fa; /* Change background color on hover */
}

.category-icon {
  color: #409EFF; /* Set the icon color to the primary theme color */
  margin-bottom: 15px;
}

.category-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}
</style>
