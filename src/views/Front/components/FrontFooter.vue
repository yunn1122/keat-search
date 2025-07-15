<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-left">
        <p>© 2025 My Learning Platform. All rights reserved.</p>
      </div>
      <div class="footer-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Contact Us</a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* 这段是全新的、强力的 footer 样式 */
.footer {
  /* --- 核心样式 --- */
  width: 100% !important;         /* 强制宽度为100% */
  max-width: none !important;      /* 强制解除任何可能的最大宽度限制 */
  margin: 0 !important;            /* 强制清除所有外边距 */
  padding: 20px 0 !important;      /* 强制设置正确的内边距 (上下20, 左右0) */
  box-sizing: border-box !important; /* 强制让 padding 不会撑大盒子 */

  /* --- 保留的背景和边框样式 --- */
  background-color: #f8f8f8;
  border-top: 1px solid #ddd;
}

/* 内部内容的样式 (用来居中内容) */
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px; /* 内容左右的边距 */
  width: 100%;

  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: center;
}

/* 链接样式 (保持不变) */
.footer-links {
  display: flex;
  gap: 24px;
}
.footer-links a {
  color: #26425e;
  text-decoration: none;
}
.footer-links a:hover {
  color: #409EFF;
}
</style>

<!-- <style scoped>
/* footer 元素本身只负责背景颜色和垂直方向的间距 */
.footer {
  background-color: #f8f8f8;
  border-top: 1px solid #ddd;
  padding: 20px 0; /* 垂直内边距20px, 水平内边距为0 */
  width: 100%;     /* 宽度交给父容器决定 */
}

/* footer-inner (你代码里叫这个名) 负责内容区域的宽度和居中 */
.footer-inner {
  max-width: 1200px; /* 限制内容的最大宽度 */
  margin: 0 auto;    /* 让内容块水平居中 */
  padding: 0 40px;   /* 在内容块内部留出左右边距，防止文字贴边 */

  /* 以下是你的原有样式，保持不变 */
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: center;
}

.footer-links {
  display: flex;
  gap: 24px;
}

.footer-links a {
  color: #26425e;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: #409EFF;
}
</style> -->

