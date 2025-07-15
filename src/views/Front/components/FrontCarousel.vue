<!-- 首页轮播图 -->
<script setup>
import { ref } from 'vue';

// 数据驱动的方式是最佳实践，我们保留它
const slides = ref([
  {
    key: 'slide1',
    image: 'https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=2070&auto=format&fit=crop',
    alt: 'A person working on a creative project',
    title: 'Unlock Your Potential',
    description: 'Discover thousands of courses to fuel your curiosity and advance your career.',
    buttonText: 'Explore Courses'
  },
  {
    key: 'slide2',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop',
    alt: 'A group of people collaborating',
    title: 'Learn from Industry Experts',
    description: 'Our instructors are from world-class companies and universities, bringing you practical, real-world knowledge.',
    buttonText: 'Meet Our Instructors'
  }
]);
</script>

<template>
  <el-carousel height="630px" arrow="always">
    <el-carousel-item v-for="slide in slides" :key="slide.key">
      <!-- 1. 在 el-carousel-item 内部创建一个包装器 -->
      <div class="slide-wrapper">
        <!-- 2. 将图片和文字内容都移到这个包装器内部 -->
        <img class="carousel-image" :src="slide.image" :alt="slide.alt"/>
        <div class="carousel-content">
          <h1 class="carousel-title">{{ slide.title }}</h1>
          <p class="carousel-description">{{ slide.description }}</p>
          <!-- <el-button type="primary" size="large" round>{{ slide.buttonText }}</el-button> -->
        </div>
      </div>
    </el-carousel-item>
  </el-carousel>
</template>

<style scoped>
/* 3. 新的 slide-wrapper 负责所有定位和布局 */
.slide-wrapper {
  position: relative; /* 相对定位的上下文现在是这个 wrapper */
  width: 100%;
  height: 100%;
}

/* el-carousel-item 本身不再需要任何样式 */
/* .carousel-item { } */

/* 背景图片和文字叠加层的样式保持不变，因为它们的定位是相对于 .slide-wrapper */
.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.carousel-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: #ffffff;
}

.carousel-title {
  font-size: 58px;
  font-weight: bold;
  margin-bottom: 16px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.carousel-description {
  font-size: 20px;
  max-width: 600px;
  margin-bottom: 24px;
  line-height: 1.6;
}
</style>