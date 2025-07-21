<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { ref, watch, onMounted } from 'vue';
import { useSessionStore } from './stores/session';
import UserStudyForm from '@/views/UserStudyForm/index.vue';



const sessionStore = useSessionStore();
// const showQuestionnaireDialog = ref(false);

const showSurveyBanner = ref(false); 

const router = useRouter();

/*function goToQuestionnaire() {
  router.push('/questionnaire'); 
  showQuestionnaireDialog.value = false; 
}*/

function goToSurveyPage() {
  router.push('/questionnaire');
  showSurveyBanner.value = false; // 关闭 banner
}

function handleCloseBanner() {
  showSurveyBanner.value = false;
}

// 1. 在 App 组件挂载时，启动会话计时
onMounted(() => {
  sessionStore.startSession();
});

// 2. 侦听 actionCount 的变化，来决定是否触发问卷
watch(
  () => sessionStore.actionCount,
  (newCount) => {
    // 如果已经弹出过，或者会话还未开始，则直接返回
    if (sessionStore.hasBeenPrompted || !sessionStore.startTime) return;

    const timeElapsed = (Date.now() - sessionStore.startTime) / 1000; // 单位：秒
    
    // 触发规则
    const timeThreshold = 180; // 3分钟
    const actionThreshold = 5; // 5次操作

    console.log(`Checking trigger conditions: Time elapsed=${Math.round(timeElapsed)}s, Actions=${newCount}`);

    if ((timeElapsed > timeThreshold && newCount > 2) || newCount >= actionThreshold) {
      console.log('Trigger conditions met! Popping up questionnaire.');
      // showQuestionnaireDialog.value = true;
      showSurveyBanner.value = true;
      sessionStore.setPrompted(); // 立即设置状态，防止重复触发
    }
  }
);

// function handleQuestionnaireClose() {
//   showQuestionnaireDialog.value = false;
// }
</script>

<template>
  
  <div class="survey-banner-container">
    <el-alert
      v-if="showSurveyBanner"
      
      type="info"
      :closable="false"
      center
      
    >
    <div class="alert-flex-content">
      <p>We are conducting a user study to improve your experience. Would you be willing to spend a few minutes to share your feedback?</p>
      <div class="banner-actions">
        <el-button  type="success"  @click="goToSurveyPage">Take the Survey</el-button>
        <el-button  @click="handleCloseBanner">Maybe Later</el-button>
      </div>
    </div>
    </el-alert>
  </div>

  <RouterView />


  <!-- <el-dialog
    v-model="showQuestionnaireDialog"
    title="User Experience Questionnaire"
    width="800px"
    :before-close="handleQuestionnaireClose"
  >
    <p style="text-align: center; padding: 40px; font-weight: 600; font-size: 16px;">
      We are conducting a user study to improve your experience.<br> 
      Would you be willing to spend a few minutes to share your feedback?
      <br><br>
      <el-button type="primary" @click="goToQuestionnaire">
          Take the Survey
        </el-button>
      <el-button @click="handleQuestionnaireClose">Maybe Later</el-button>
    </p>
  </el-dialog> -->
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}

.survey-banner-container {
  position: sticky;
  top: 60px; 
  z-index: 1000;
  
}
.survey-banner-container p {
  margin: 8px 0 16px;
  font-weight:bold;
  color:#feffff;
}
.banner-actions .el-button {
  margin: 0 8px;
}

.survey-alert :deep(.el-alert__content) {
  flex-grow: 1; 
}

.alert-flex-content {
  display: flex;
  justify-content: space-between; 
  align-items: center;
  width: 100%;
  
}

.alert-text {
  text-align: left; /* 确保文字是左对齐的 */
}

.alert-description {
  display: block;
  font-size: bold;
  margin-top: 4px;
  color: #606266;
}

.banner-actions {
  flex-shrink: 0; /* 防止按钮换行 */
  padding-left: 24px; /* 在文字和按钮间增加一些间距 */
}

.banner-actions .el-button + .el-button {
  margin-left: 24px;
}

/* 【最终、最强力的修正方案】 */
:deep(.el-alert--info) {
  --el-alert-bg-color: #467cf9; /* 这是一个非常柔和的淡绿色 */
}


</style>
