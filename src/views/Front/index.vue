<script setup>
import FrontFooterVue from "./components/FrontFooter.vue";
import FrontHeaderVue from "./components/FrontHeader.vue";
import FrontCarousel from "./components/FrontCarousel.vue";
import FrontCategory from "./components/FrontCategory.vue";
import FrontCards from "./components/FrontCards.vue";
import FrontValue from "./components/FrontValue.vue";
</script>

<template>
  <div class="page-container">
    <FrontHeaderVue />

    
        <!-- 轮播图 -->
        <FrontCarousel />

    <main class="main-content">

        <FrontCategory />

        <!-- 卡片 -->
         <FrontCards />

         <FrontValue />
        
        
        
    </main>

    <FrontFooterVue />
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* .main-content {
  flex-grow: 1; */
  /* padding-top: 10px; Header 高度 */
  /* padding-left: 80px;
  padding-right: 80px; */
  /* font-size: 18px;
  color: #555;
} */


</style>
