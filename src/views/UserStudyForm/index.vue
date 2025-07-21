<script setup>
import { ref , computed} from 'vue';
import { useSessionStore } from '@/stores/session';

// SUS (System Usability Scale) 标准的10个问题
const susQuestions = [
  'I think that I would like to use this system frequently.',
  'I found the system unnecessarily complex.',
  'I thought the system was easy to use.',
  'I think that I would need the support of a technical person to be able to use this system.',
  'I found the various functions in this system were well integrated.',
  'I thought there was too much inconsistency in this system.',
  'I would imagine that most people would learn to use this system very quickly.',
  'I found the system very cumbersome to use.',
  'I felt very confident using the system.',
  'I needed to learn a lot of things before I could get going with this system.'
];

// 使用 ref 来存储用户的答案和评论
const susAnswers = ref({}); // 存储1-10题的评分
const generalComments = ref(''); // 存储通用评论

// 初始化评分，默认都为0或null
susQuestions.forEach((_, index) => {
  susAnswers.value[`q${index + 1}`] = null;
});


const sessionStore = useSessionStore();

//自动将所有要记录的数据打包成一个JSON字符串
const userStudyData = computed(() => {
  const data = {
    interactionSeconds: sessionStore.interactionSeconds,
    searchCount: sessionStore.searchCount,
    searches: sessionStore.searches,
  };
  
  // 将对象转换成JSON字符串，以便在表单中提交
  return JSON.stringify(data, null, 2);
});

</script>

<template>
  <div class="questionnaire-container">
    
    <div class="questionnaire-header">
      <h2>User Experience Questionnaire</h2>
      <p>Your feedback is valuable for us to improve the system. <br>
        Please rate the following statements. <br>
       </p>
      <!-- <div class="privacy-statement">
    <p>All your responses will be strictly confidential and the data will only be used for academic research purposes.</p>
  </div> -->
    </div>

    <form action="https://formspree.io/f/xyzpzpvv" method="POST">

      <div class="sus-questions-area">
        <div v-for="(question, index) in susQuestions" :key="index" class="sus-question-row">
          <label :for="`sus_q${index + 1}`" class="question-text">
            {{ index + 1 }}. {{ question }}
          </label>
          
          <div class="rating-scale">
            <span class="scale-label-left">Strongly Disagree</span>
            <div class="rating-buttons">
              <label v-for="n in 5" :key="n" class="rating-button-label">
                <input 
                  type="radio" 
                  :name="`sus_question_${index + 1}`"
                  :value="n"
                  v-model="susAnswers[`q${index + 1}`]"
                  class="rating-radio-input"
                  required
                >
                <span class="rating-display-circle">{{ n }}</span>
              </label>
            </div>
            <span class="scale-label-right">Strongly Agree</span>
          </div>
        </div>
      </div>
      
      <div class="general-comments-area">
        <label for="general_comments" class="comments-label">
          Do you have any other general comments about your experience using the system?
        </label>
        <el-input
          id="general_comments"
          name="general_comments"
          v-model="generalComments"
          type="textarea"
          :rows="5"
          placeholder="Please share any thoughts, suggestions, or issues you encountered..."
          class="comments-textarea"
        />
      </div>

      <input type="hidden" name="user_study_data" :value="userStudyData">

      <div class="submit-area">
        <el-button type="primary" native-type="submit" class="submit-button">Submit Feedback</el-button>
      </div>

    </form>
  </div>
</template>

<style scoped>
/* 问卷总容器样式 */
.questionnaire-container {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%);
  padding: 32px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  margin-top: 40px;
  margin-bottom: 40px;
  box-shadow: 0 8px 32px 0 rgba(59, 130, 246, 0.1);
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

/* 问卷头部样式 */
.questionnaire-header {
  text-align: center;
  margin-bottom: 32px;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 24px;
}
.questionnaire-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}
.questionnaire-header p {
  font-size: 16px;
  color: #606266;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* 单个SUS问题行样式 */
.sus-question-row {
  margin-bottom: 28px;
}

.question-text {
  display: block;
  font-size: 16px;
  color: #303133;
  margin-bottom: 16px;
  line-height: 1.5;
  font-weight: 500;
}

/* 评分条容器 */
.rating-scale {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

/* 评分条两端的文字标签 */
.scale-label-left, .scale-label-right {
  font-size: 13px;
  color: #909399;
  flex-shrink: 0;
  width: 100px; /* 固定宽度以对齐 */
}
.scale-label-right {
  text-align: right;
}

/* 评分按钮组 */
.rating-buttons {
  display: flex;
  justify-content: center;
  gap: 10px; /* 按钮之间的间距 */
  flex-grow: 1;
}

.rating-button-label {
  position: relative;
  cursor: pointer;
}

/* 隐藏原生的radio input */
.rating-radio-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

/* 自定义展示的圆圈 */
.rating-display-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f4f4f5;
  color: #606266;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

/* 鼠标悬浮时的样式 */
.rating-button-label:hover .rating-display-circle {
  border-color: #c0c4cc;
}

/* radio input被选中时的样式 */
.rating-radio-input:checked + .rating-display-circle {
  background-color: #3b82f6; /* 主题蓝色 */
  color: white;
  border-color: #3b82f6;
  transform: scale(1.1);
}

/* 通用评论区样式 */
.general-comments-area {
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid #e4e7ed;
}

.comments-label {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.comments-textarea :deep(.el-textarea__inner) {
  font-size: 15px;
  padding: 12px;
  border-radius: 8px !important;
}
.comments-textarea :deep(.el-textarea__inner:focus) {
  border-color: #3b82f6;
}

/* 提交按钮区域 */
.submit-area {
  text-align: center;
  margin-top: 32px;
}
.submit-button {
  min-width: 200px;
  height: 44px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  background-color: #3b82f6;
  border-color: #3b82f6;
}
.submit-button:hover {
  background-color: #2563eb;
  border-color: #2563eb;
}

.privacy-statement {
  margin-top: 20px;
  padding: 12px 16px;
  background-color: rgba(59, 130, 246, 0.08); 
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.15);
}

.privacy-statement p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #3b82f6; 
  line-height: 1.6;
}
</style>