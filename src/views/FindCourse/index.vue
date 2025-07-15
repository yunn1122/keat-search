<script setup>
import CoursesList from './CoursesList.vue'
import FrontHeader from '@/views/Front/components/FrontHeader.vue';
import FrontFooter from '../Front/components/FrontFooter.vue';
</script>

<template>
  <div class="app-layout-container">
    <FrontHeader/>

    <main class="main-content-wrapper">
      <CoursesList />
    </main>

    <FrontFooter />
  </div>
</template>

<style scoped>
/* 注意：这里的 scoped 样式只应用于此组件的根元素和直接子元素 */

.app-layout-container {
  display: flex;
  flex-direction: column; /* 垂直方向排列子元素 */
  min-height: 100vh; /* 最小高度为视口高度，确保即使内容少也能撑满 */
  /* 如果 body 没有 100% height，这里可能无法完全撑开。
     这是 scoped 样式无法触及的全局问题，需要外部或全局 CSS 解决。 */
}

.main-content-wrapper {
  flex-grow: 1; /* 让主内容区域弹性伸展，占据所有可用空间，将页脚推到底部 */
  /* 如果 CoursesList 内部有自己的 padding 或 margin，这里不需要额外设置 */
  /* 如果 CoursesList 的内容少于视口高度，flex-grow: 1 会使其背景色区域扩大 */
}

/* FrontHeader 和 FrontFooter 通常不需要额外的 scoped 样式来参与这个 flex 布局，
   但要确保它们没有阻止 flex 行为的固定定位或其他布局。
   它们会默认拥有 flex-shrink: 0; 的行为。 */
</style>