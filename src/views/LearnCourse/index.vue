<script setup>
import CourseView from './components/CourseView.vue';
import FrontHeader from '@/views/Front/components/FrontHeader.vue';
import FrontFooter from '../Front/components/FrontFooter.vue';
</script>

<template>
    <div class="app-layout-container">
    <FrontHeader/>

    <main class="main-content-wrapper">
        <CourseView />
    </main>
    
    
    <FrontFooter />
    </div>
</template>

<style scoped>
.app-layout-container {
  display: flex;
  flex-direction: column; 
  min-height: 100vh; 

}

.main-content-wrapper {
  flex-grow: 1; 
}

</style>

