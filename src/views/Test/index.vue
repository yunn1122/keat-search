<script setup>
import { ref, onMounted, computed } from 'vue'

let player = null
const pdfPage = ref(1)
// 新增一个 ref 作为 iframe 的 key
const iframeKey = ref(0) 

// 修改页码 → 重新生成 PDF URL
const pdfUrlBase = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
const pdfFullUrl = computed(() => {
  const url = `${pdfUrlBase}#page=${pdfPage.value}`;
  console.log('PDF URL 更新为:', url);
  return url;
});

function jumpTo10Minutes() {
  if (player) {
    player.seekTo(600, true) // 跳转到第 600 秒（10 分钟）
  }
}

function jumpToPage4() {
  console.log('jumpToPage4 函数被调用了！');
  pdfPage.value = 4 // 1. 改变页码，让 computed URL 更新

  // 2. 改变 key 的值，强制 Vue 重新渲染 iframe
  //    每次点击都使其自增，确保 key 是变化的
  iframeKey.value++ 
}

onMounted(() => {
  // ... YouTube 播放器的代码保持不变
  const tag = document.createElement('script')
  tag.src = 'https://www.youtube.com/iframe_api'
  const firstScriptTag = document.getElementsByTagName('script')[0]
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

  window.onYouTubeIframeAPIReady = () => {
    player = new window.YT.Player('player', {
      height: '315',
      width: '560',
      videoId: 'iEcr07-aOmg',
      events: {
        onReady: () => {
          console.log('YouTube player is ready')
        },
      },
    })
  }
})
</script>

<template>
  <div class="youtube-jump-page">
    <h1>多媒体跳转测试页面</h1>

    <div class="video-container">
      <div id="player"></div>
    </div>
    <button @click="jumpTo10Minutes" class="jump-button">
      ▶️ 跳转到第 10 分钟（600秒）
    </button>

    <hr style="margin: 40px 0;" />

    <div class="pdf-container">
      <iframe
        :key="iframeKey"
        :src="pdfFullUrl"
        width="100%"
        height="600px"
        style="border: 1px solid #ccc; border-radius: 8px;"
      ></iframe>
    </div>
    <button @click="jumpToPage4" class="jump-button">
      📄 跳转到 PDF 第 4 页
    </button>
  </div>
</template>

<style scoped>
/* 样式部分保持不变 */
.youtube-jump-page {
  text-align: center;
  font-family: Arial, sans-serif;
  padding: 40px;
}
.video-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}
.pdf-container {
  max-width: 800px;
  margin: 0 auto 20px;
}
.jump-button {
  background-color: #3498db;
  color: white;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
}
.jump-button:hover {
  background-color: #2980b9;
}
</style>