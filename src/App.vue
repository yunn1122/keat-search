<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { ref, watch, onMounted } from 'vue';
import { useSessionStore } from './stores/session';
import UserStudyForm from '@/views/UserStudyForm/index.vue';



const sessionStore = useSessionStore();
const showQuestionnaireDialog = ref(false);

const router = useRouter();

function goToQuestionnaire() {
  router.push('/questionnaire'); // 
  showQuestionnaireDialog.value = false; // 关闭对话框
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
      showQuestionnaireDialog.value = true;
      sessionStore.setPrompted(); // 立即设置状态，防止重复触发
    }
  }
);

// 3. 关闭对话框的处理函数
function handleQuestionnaireClose() {
  showQuestionnaireDialog.value = false;
  // 注意：记录“已弹出”的逻辑已移至 watch 中，确保只触发一次
}
</script>

<template>
  

  <RouterView />


  <el-dialog
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
  </el-dialog>
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
</style>
