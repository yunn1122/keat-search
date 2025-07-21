<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="instruction-page-container">
    <div class="instruction-card">
      
      <div class="card-header">
        <h1 class="title">User Study Instructions</h1>
        <!-- <p class="subtitle">Thank you for helping us improve our academic search tool!</p> -->
      </div>

      <div class="card-content">
        <p class="intro-text">
          The goal of this study is to evaluate a new search system designed to help you find information within your course materials more effectively. Thank you for helping us improve our academic search tool!
        </p>

        <h2 class="steps-title">Your Task</h2>
        <ol class="steps-list">
          <li>
            Click the <strong>'Start'</strong> button below to enter the search environment for courses.
          </li>
          <li>
            Please spend at least <strong>3-5 minutes</strong> actively exploring the system. Try searching for different concepts or topics that you might look for in different courses.
          </li>
          <li>
            After you have used the system for a sufficient amount of time and performed several searches, a banner will appear at the top of the page inviting you to a short questionnaire.
          </li>
          <li>
            Please click the invitation to navigate to the survey page and share your valuable feedback.
          </li>
        </ol>
      </div>

      <div class="card-footer">
        <!-- 这个 RouterLink 会将用户导航到您指定的、搜索框为空的搜索页面 -->
        <RouterLink to="/search?courseId=6.0002&q=" class="start-button">
          Start
        </RouterLink>
      </div>

    </div>
  </div>
</template>

<style scoped>
.instruction-page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa; /* 一个柔和的页面背景色 */
  padding: 40px 20px;
  box-sizing: border-box;
}

.instruction-card {
  max-width: 800px;
  width: 100%;
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 32px 0 rgba(59, 130, 246, 0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.card-header {
  text-align: center;
  padding: 32px 24px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%);
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #212529;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 16px;
  color: #495057;
  margin: 0;
}

.card-content {
  padding: 32px;
}

.intro-text {
  font-size: 16px;
  line-height: 1.7;
  color: #495057;
  margin-bottom: 32px;
  /* text-align: center; */
}

.steps-title {
  font-size: 20px;
  font-weight: 600;
  color: #343a40;
  margin-bottom: 20px;
  border-bottom: 2px solid #3b82f6; /* 主题蓝色下划线 */
  padding-bottom: 8px;
  display: inline-block;
}

.steps-list {
  list-style: none;
  padding-left: 0;
  counter-reset: step-counter;
}

.steps-list li {
  font-size: 16px;
  line-height: 1.8;
  color: #495057;
  margin-bottom: 16px;
  position: relative;
  padding-left: 40px;
}

/* 自定义数字列表样式 */
.steps-list li::before {
  counter-increment: step-counter;
  content: counter(step-counter);
  position: absolute;
  left: 0;
  top: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #3b82f6;
  color: white;
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
}

.card-footer {
  text-align: center;
  padding: 24px 32px;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.start-button {
  display: inline-block;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background-color: #3b82f6;
  border: none;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.start-button:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
}
</style>
