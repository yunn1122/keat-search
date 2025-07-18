<script setup>
// =======================================================================
// 1. IMPORTS & SETUP
// =======================================================================
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  Search, 
  VideoCamera, 
  Picture, 
  VideoPlay, 
  View as ViewIcon, 
  Download, 
  Close,
  CircleCheckFilled 
} from '@element-plus/icons-vue';

// =======================================================================
// 2. CONSTANTS & API CONFIG
// =======================================================================
const KEATS_API_BASE_URL = '/api';

// =======================================================================
// 3. STATE MANAGEMENT (REFS)
// =======================================================================
const courseData = ref(null);
const isLoading = ref(true);
const error = ref(null);
const curriculum = ref([]);
const resources = ref({});
const completedLessons = ref([]);
const currentLessonId = ref(null);
const activeCollapse = ref([]);
const activeSlideUrl = ref(null);
const slideViewerRef = ref(null);
const autocompleteRef = ref(null);
let ytPlayer = null;


// --- Search State ---
const floatingSearchQuery = ref('');

// --- Vue Router ---
const router = useRouter();
const route = useRoute();

// =======================================================================
// 4. COMPUTED PROPERTIES
// =======================================================================
const courseTitle = computed(() => courseData.value?.course_title || 'Loading...');
const activeResources = computed(() => resources.value[currentLessonId.value]?.filter(r => r.type === 'slide') || []);
const activeVideoId = computed(() => {
  if (!curriculum.value || !currentLessonId.value) return null;
  const lesson = curriculum.value.flatMap(sec => sec.lessons).find(l => l.id === currentLessonId.value);
  return lesson ? lesson.videoId : null;
});
const totalLessonsCount = computed(() => {
  if (!curriculum.value) return 0;
  return curriculum.value.flatMap(sec => sec.lessons).length;
});
const currentLessonIndex = computed(() => {
  if (!currentLessonId.value || !curriculum.value || totalLessonsCount.value === 0) return 0;
  const allLessons = curriculum.value.flatMap(sec => sec.lessons);
  const index = allLessons.findIndex(l => l.id === currentLessonId.value);
  return index !== -1 ? index + 1 : 0;
});
const currentLessonTitle = computed(() => {
  if (!currentLessonId.value || !curriculum.value || curriculum.value.length === 0) {
    return '选择一节课开始学习';
  }
  const allLessons = curriculum.value.flatMap(sec => sec.lessons);
  const currentLesson = allLessons.find(l => l.id === currentLessonId.value);
  return currentLesson ? currentLesson.title : '';
});


// =======================================================================
// 5. HELPER FUNCTIONS
// =======================================================================
const timeStringToSeconds = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
};

function getYouTubeID(url) {
  if (!url) return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function getPdfThumbnailUrl(url) {
  if (!url || url.startsWith('http')) { return url; }
  return `http://46.101.49.168/${url}`;
}

function highlight(text, query) {
  if (!query || !text) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, `<span class="highlight">$1</span>`);
}

function createCenteredSnippet(fullText, keyword, targetLength = 110) {
    // 如果没有关键词或文本本身很短，则从头截断或返回原文
    if (!keyword || !fullText || fullText.length <= targetLength) {
        return fullText.substring(0, targetLength);
    }

    const keywordLower = keyword.toLowerCase();
    const textLower = fullText.toLowerCase();
    const keywordIndex = textLower.indexOf(keywordLower);

    // 如果找不到关键词，也从头开始截断
    if (keywordIndex === -1) {
        return fullText.substring(0, targetLength) + '...';
    }

    // --- 核心修正逻辑 ---

    // 1. 计算理想的起始点
    const desiredStart = Math.max(0, keywordIndex - Math.floor(targetLength / 2));
    
    // 2. 为了不从单词中间切开，将实际起始点向前移动到最近的空格
    const startIndex = fullText.lastIndexOf(' ', desiredStart);
    const finalStartIndex = (startIndex === -1 || desiredStart === 0) ? 0 : startIndex;

    // 3. 截取期望长度的文本
    const snippet = fullText.substr(finalStartIndex, targetLength);

    // 4. 添加前后的省略号
    const prefix = finalStartIndex > 0 ? '... ' : '';
    const suffix = (finalStartIndex + targetLength) < fullText.length ? ' ...' : '';
    
    return prefix + snippet + suffix;
}

// =======================================================================
// 6. CORE LOGIC & API CALLS
// =======================================================================
async function fetchResourcesForLesson(lessonId) {
    if (!lessonId || !courseData.value) return null; // Return null to pass up
    if (resources.value[lessonId]) {
        const lesson = curriculum.value.flatMap(sec => sec.lessons).find(l => l.id === lessonId);
        return lesson ? lesson.videoId : null;
    }

    try {
        const courseId = route.params.id;
        resources.value[lessonId] = [];
        const filesResponse = await fetch(`${KEATS_API_BASE_URL}/files?course=${courseId}&lecture=${lessonId}`);
        if (!filesResponse.ok) throw new Error(`Failed to get file for lecture ${lessonId}`);
        const filesData = await filesResponse.json();
        const lectureFiles = filesData[0]?.files || [];

        resources.value[lessonId] = lectureFiles.map(file => {
            const isSlide = file.doc_type === 'pdf';
            return {
                id: file.doc_id,
                name: isSlide ? `${courseData.value.course_title} slide ${lessonId}` : file.doc_id,
                type: isSlide ? 'slide' : file.doc_type,
                downloadUrl: file.url,
                previewImage: isSlide ? getPdfThumbnailUrl(file.thumbnail_url) : file.thumbnail_url
            };
        });

        const videoFile = lectureFiles.find(file => file.doc_type === 'mp4');
        if (videoFile) {
            const videoId = getYouTubeID(videoFile.url);
            const lessonInCurriculum = curriculum.value.flatMap(sec => sec.lessons).find(l => l.id === lessonId);
            if (lessonInCurriculum) {
                lessonInCurriculum.videoId = videoId;
            }
            return videoId;
        }
        return null;
    } catch (e) {
        console.error("Error loading resources on demand:", e);
        resources.value[lessonId] = [];
        return null;
    }
}

async function initializeLesson(lessonId, timestamp) {
  if (!lessonId) return;
  currentLessonId.value = lessonId;
  const videoId = await fetchResourcesForLesson(lessonId);
  const startSeconds = timeStringToSeconds(timestamp);

  if (videoId) {
    initializeYouTubePlayer(videoId, startSeconds);
  } else {
    if (ytPlayer && typeof ytPlayer.destroy === 'function') {
      ytPlayer.destroy();
      ytPlayer = null;
    }
    const container = document.getElementById('youtube-player-container');
    if (container) {
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:white;background:black;">本课程无视频内容</div>';
    }
  }
}

function createPlayer(videoId, startSeconds) {
  if (ytPlayer && typeof ytPlayer.destroy === 'function') ytPlayer.destroy();
  ytPlayer = new window.YT.Player('youtube-player-container', {
    height: '100%', width: '100%', videoId: videoId,
    playerVars: { 'playsinline': 1, 'rel': 0, 'start': startSeconds },
    events: { 'onReady': () => console.log("YouTube Player is ready.") }
  });
}

function initializeYouTubePlayer(videoId, startSeconds = 0) {
  if (!videoId) return;

  // 检查 YT 和 YT.Player 是否已存在
  if (window.YT && window.YT.Player) {
    // 如果已经存在，说明 API 已加载，直接创建播放器
    createPlayer(videoId, startSeconds);
  } else {
    // 如果不存在，才走加载脚本和设置回调的流程
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api"; // 使用官方推荐的 https 地址
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // 将回调函数的创建也放在这里，确保逻辑的原子性
    window.onYouTubeIframeAPIReady = () => {
      createPlayer(videoId, startSeconds);
    };
  }
}
// =======================================================================
// 7. SEARCH LOGIC (AUTOCOMPLETE IMPLEMENTATION)
// =======================================================================
// =======================================================================
// 7. SEARCH LOGIC (AUTOCOMPLETE IMPLEMENTATION)
// =======================================================================
const queryAutocompleteAsync = async (queryString, cb) => {
  if (queryString && queryString.length > 2) {
    try {
      const response = await fetch(`${KEATS_API_BASE_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: { question: queryString },
          top_k: 10,
          filters: { courses_ids: [route.params.id] }
        })
      });
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();

      // --- 重点修改区域 ---
      const formattedResults = data.map(item => {
        const doc = item.document;
        const isVideo = doc.doc_type === 'mp4';
        
        // 查找对应的 lecture 标题
        const lesson = curriculum.value.flatMap(sec => sec.lessons).find(l => l.id === doc.lecture_id);
        const lectureTitle = lesson ? lesson.title : '未知章节';

        const metaType = isVideo ? 'Video' : 'Slide';
    const metaContext = isVideo 
      ? `[${doc.timestamp?.start}]` 
      : `Page ${doc.page_number}`;

        // 创建摘要
        const snippet = createCenteredSnippet(doc.content, queryString);

        return {
          value: lectureTitle, // value 保持不变
      display: {
        mainTitle: lectureTitle, // 主标题现在就是讲座标题
        // 新增：拆分后的 meta 信息
        metaType: metaType,
        metaContext: metaContext,
        snippet: snippet,
      },
      originalData: doc,
      isVideo: isVideo,
    };
      });
      // --- 修改结束 ---

      cb(formattedResults);
    } catch (e) {
      console.error("Autocomplete search error:", e);
      cb([]);
    }
  } else {
    cb([]);
  }
};

const handleAutocompleteSelect = async (item) => {
  const doc = item.originalData;
  const newLessonId = doc.lecture_id;

  // --- 幻灯片逻辑 ---
  if (!item.isVideo) {
    // 1. 如果点击的幻灯片不在当前课程，先切换并等待课程初始化完成
    if (newLessonId !== currentLessonId.value) {
      await initializeLesson(newLessonId); // initializeLesson 内部会获取资源
    }

    // 2. 确保资源已加载 (即使是当前课程，也可能未加载)
    if (!resources.value[newLessonId]) {
      await fetchResourcesForLesson(newLessonId);
    }

    // 3. 从已加载的资源中查找幻灯片
    const slideResource = resources.value[newLessonId]?.find(r => r.id === doc.doc_id);

    if (slideResource) {
      // 4. 调用 viewSlide 显示并定位
      await viewSlide(slideResource, doc.page_number || 1);
    }
  }

  // --- 更新 URL ---
  // 无论点击的是视频还是幻灯片，最后统一更新路由
  const newQuery = { ...route.query };
  newQuery.lessonId = newLessonId;
  newQuery.highlight = floatingSearchQuery.value;

  if (item.isVideo) {
    newQuery.timestamp = doc.timestamp.start;
    delete newQuery.viewSlideId;
    delete newQuery.page;
  } else {
    newQuery.viewSlideId = doc.doc_id;
    newQuery.page = doc.page_number;
    delete newQuery.timestamp;
  }

  router.push({ query: newQuery });
  floatingSearchQuery.value = '';
};

const handleFloatingSearch = () => {
  if (!floatingSearchQuery.value.trim()) return;
  router.push({
    name: 'SearchView',
    query: { courseId: route.params.id, q: floatingSearchQuery.value }
  });
};

// =======================================================================
// 8. NAVIGATION & UI HELPERS
// =======================================================================
function selectLesson(lesson) {
  const newQuery = { lessonId: lesson.id };
  router.push({ query: newQuery });
}

async function viewSlide(resource, page = 1) {
  const finalUrl = `${resource.downloadUrl}#page=${page}`;
  activeSlideUrl.value = finalUrl;

  // 等待 v-if="activeSlideUrl" 完成DOM渲染
  await nextTick();

  // DOM渲染完毕后，slideViewerRef 才可用
  if (slideViewerRef.value) {
    slideViewerRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function closeSlideViewer() {
  activeSlideUrl.value = null;
  const newQuery = { ...route.query };
  delete newQuery.viewSlideId;
  delete newQuery.page;
  router.push({ query: newQuery });
}

// =======================================================================
// 9. LIFECYCLE HOOKS & WATCHERS
// =======================================================================
// --- 初始加载逻辑 (`onMounted`) ---
onMounted(async () => {
  const courseIdFromRoute = route.params.id;
  if (!courseIdFromRoute) {
    error.value = "The course ID is not provided in the routing parameters.";
    isLoading.value = false;
    return;
  }

  let initialLessonId;
  let initialTimestamp;

  try {
    isLoading.value = true;
    
    // 步骤 1: 获取所有必需的元数据 (课程、讲座列表)
    const coursesResponse = await fetch(`${KEATS_API_BASE_URL}/courses`);
    if (!coursesResponse.ok) throw new Error(`Failed to get the course: ${coursesResponse.status}`);
    const courses = await coursesResponse.json();
    const currentCourse = courses.find(c => c.course_id === courseIdFromRoute);
    if (!currentCourse) throw new Error(`Course with ID ${courseIdFromRoute} not found.`);
    courseData.value = { course_id: currentCourse.course_id, course_title: currentCourse.course_title };
    
    const lecturesResponse = await fetch(`${KEATS_API_BASE_URL}/lectures?course=${courseIdFromRoute}`);
    if (!lecturesResponse.ok) throw new Error(`Failed to get the lecture: ${lecturesResponse.status}`);
    const lectures = await lecturesResponse.json();
    
    curriculum.value = [{
      id: `section-${courseIdFromRoute}`,
      title: `${currentCourse.course_title}`,
      lessons: lectures.map(l => ({ id: l.lecture_id, title: l.lecture_title, videoId: null }))
    }];

    if (curriculum.value?.[0]) {
      activeCollapse.value = [curriculum.value[0].id];
    }
    
    // 确定初始课程和时间戳
    initialLessonId = route.query.lessonId || curriculum.value?.[0]?.lessons?.[0]?.id;
    initialTimestamp = route.query.timestamp;

  } catch (e) {
    console.error("error in loading course data", e);
    error.value = e.message;
  } finally {
    // 步骤 2: **立即将 isLoading 设为 false**
    // 这会触发Vue去渲染主页面的DOM
    isLoading.value = false;
    
    // 步骤 3: **使用 await nextTick() 确保DOM更新已完成**
    await nextTick();
    
    // 步骤 4: 在DOM准备就绪后，才执行初始化课程的逻辑
    if (initialLessonId) {
      await initializeLesson(initialLessonId, initialTimestamp);
    } else if (!error.value) { 
      error.value = "No playable content for this course.";
    }
  }
});



watch(floatingSearchQuery, async (newValue) => {
  // 当有新的搜索词时
  if (newValue && newValue.length > 2) {
    // 等待下拉框出现
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 50)); // 等待动画

    // 找到下拉框的滚动区域
    const scrollWrapper = document.querySelector('.el-autocomplete-suggestion__wrap');
    
    if (scrollWrapper) {
      // 强行修改最大高度
      scrollWrapper.style.maxHeight = '600px'; 
      scrollWrapper.parentElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      scrollWrapper.parentElement.style.borderRadius = '4px'; // 顺便加个圆角更好看
    }
  }
});

watch(() => [route.query.lessonId, route.query.timestamp],
  ([newLessonId, newTimestamp], [oldLessonId, oldTimestamp]) => {
    if (isLoading.value || !newLessonId || !newLessonId) return;

    // Do not re-initialize if it's the same lesson and timestamp
    if (newLessonId === oldLessonId && newTimestamp === oldTimestamp) return;

    const lessonChanged = newLessonId !== oldLessonId;

    if (lessonChanged) {
      initializeLesson(newLessonId, newTimestamp);
    } else { // Timestamp changed
      const startSeconds = timeStringToSeconds(newTimestamp);
      if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
        ytPlayer.seekTo(startSeconds, true);
        ytPlayer.playVideo();
      }
    }
  }, { deep: true }
);
watch(() => [route.query.viewSlideId, route.query.page],
  async ([newSlideId, newPage]) => {
    // 页面加载完成后再响应
    if (isLoading.value) return;

    // 如果URL中的slideId消失了，则关闭查看器
    if (!newSlideId) {
      if (activeSlideUrl.value) {
        closeSlideViewer();
      }
      return;
    }

    // 确保资源已加载
    if (currentLessonId.value && !resources.value[currentLessonId.value]) {
      await fetchResourcesForLesson(currentLessonId.value);
    }
    
    // 查找并显示幻灯片
    const allResources = Object.values(resources.value).flat();
    const resource = allResources.find(r => r.id === newSlideId);

    if (resource) {
      // 避免在URL未变时重复调用
      const existingUrl = `${resource.downloadUrl}#page=${newPage || 1}`;
      if (activeSlideUrl.value !== existingUrl) {
        await viewSlide(resource, newPage || 1);
      }
    }
  }
  // 注意：不再有 { immediate: true }
);

watch(currentLessonId, (newId) => {
  if (!newId) return;
  nextTick(() => {
    const activeLessonElement = document.getElementById(`lesson-item-${newId}`);
    if (activeLessonElement) {
      activeLessonElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
});

</script>

<template>
  <div v-if="isLoading" class="loading-state"
  v-loading.fullscreen.lock="true"
  element-loading-background="rgba(255, 255, 255, 0.7)">
    <!-- <p>Loading...</p> -->
     
  </div>
  <div v-else-if="error" class="error-state">
    <p>ERROR: {{ error }}</p>
  </div>

  <div v-else class="course-page">
    <div class="floating-search-bar" :style="{ width: '450px' }">
      <el-autocomplete
  ref="autocompleteRef"
  v-model="floatingSearchQuery"
  :fetch-suggestions="queryAutocompleteAsync"
  placeholder="Search in Course"
  size="large"
  clearable
  fit-input-width 
  @select="handleAutocompleteSelect"
  @keyup.enter="handleFloatingSearch"
  class="floating-autocomplete"
  popper-class="course-autocomplete-popper"
  
>
  <template #default="{ item }">
  <div class="autocomplete-item-container">
    <el-icon class="autocomplete-item-icon">
      <VideoCamera v-if="item.isVideo" />
      <Picture v-else />
    </el-icon>
    <div class="autocomplete-item-text">
      <div class="autocomplete-item-title">{{ item.display.mainTitle }}</div>
      
      <div class="autocomplete-item-meta">
        <span class="meta-type">{{ item.display.metaType }}</span>
        <span class="meta-context">{{ item.display.metaContext }}</span>
      </div>
      
      <div class="autocomplete-item-snippet" v-html="highlight(item.display.snippet, floatingSearchQuery)"></div>
    </div>
  </div>
</template>
  <template #append>
    <el-button :icon="Search" @click="handleFloatingSearch" />
  </template>
</el-autocomplete>
    </div>

    <div class="top-area">
      <div class="title-group">
        <h1 class="course-title">{{ courseTitle }}</h1>
        <h2 class="lecture-title">{{ currentLessonTitle }}</h2>
      </div>
    </div>

    <el-row :gutter="30">
      <el-col :span="16">
        <div class="video-player-container">
          <div id="youtube-player-container"></div>
        </div>
        
        <div class="info-card">
          <div class="tab-content resources-tab">
            <h3>Resources</h3>
            <ul v-if="activeResources.length > 0" class="resource-list">
              <li v-for="resource in activeResources" :key="resource.id" class="resource-item">
                <el-icon><Picture /></el-icon> 
                <span class="resource-name">{{ resource.name }}</span>
                <el-button type="primary" link :icon="ViewIcon" @click="viewSlide(resource)">view</el-button>
                <el-button
                  tag="a" type="primary" link
                  :icon="Download" :href="resource.downloadUrl"
                  :download="resource.name + '.pdf'" target="_blank" 
                >download</el-button>
              </li>
            </ul>
            <p v-else>No Slide for this Lecture.</p>
          </div>

          <div 
            v-if="activeSlideUrl" 
            id="slide-viewer-container" 
            ref="slideViewerRef" 
            class="slide-viewer-container"
          >
            <div class="slide-viewer-header">
              <h4>Preview</h4>
              <el-button :icon="Close" circle @click="closeSlideViewer" />
            </div>
            <iframe :key="activeSlideUrl" :src="activeSlideUrl" frameborder="0" width="100%" height="600px" title="Preview"></iframe>
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="sidebar" ref="sidebarRef">
          <el-collapse v-if="curriculum.length > 0" class="curriculum-list" v-model="activeCollapse">
            <el-collapse-item v-for="section in curriculum" :key="section.id" :name="section.id">
              <template #title>
                <div class="custom-collapse-header">
                  <!-- <span class="title-text">{{ section.title }}</span> -->
                   <span class="title-text">Lectures Collection</span>
                  <span class="title-counter" v-if="totalLessonsCount > 0">
                    ({{ currentLessonIndex }}/{{ totalLessonsCount }})
                  </span>
                </div>
              </template>
              <ul>
                <li
                  v-for="lesson in section.lessons"
                  :key="lesson.id"
                  :id="`lesson-item-${lesson.id}`"
                  class="lesson-item"
                  :class="{ 'is-current': lesson.id === currentLessonId }"
                  @click="selectLesson(lesson)"
                >
                  <div class="lesson-status-icon">
                    <el-icon v-if="completedLessons.includes(lesson.id)" color="#67C23A"><CircleCheckFilled /></el-icon>
                    <el-icon v-else><VideoPlay /></el-icon>
                  </div>
                  <div class="lesson-info">
                    <el-text class="lesson-title" truncated>
                      {{ lesson.title }}
                    </el-text>
                  </div>
                </li>
              </ul>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
/* --- 基础布局和容器 --- */
.video-player-container {
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

#youtube-player-container {
  width: 100%;
  height: 100%;
}

.info-card {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 4px 0 rgba(0,0,0,.12), 0 0 6px 0 rgba(0,0,0,.04);
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 80vh;
  font-size: 20px;
  color: #909399;
}

.error-state p:first-child {
  color: #F56C6C;
  font-weight: bold;
}

.course-page {
  padding: 84px 60px 20px;
}


/* --- 顶部标题区 --- */
.top-area {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-group {
  flex-grow: 1;
}

.course-title {
  font-size: 28px;
  font-weight: bold;
}

.lecture-title {
  font-size: 18px;
  font-weight: 500;
  color: #606266;
  margin-top: 8px;
  margin-bottom: 0;
}



.floating-search-bar {
 position:fixed;
 top: 84px;
 right:60px;
 z-index: 1000;
 width:350px;
 box-shadow:  0 4px 12px rgba(0, 0, 0, 0.15);
 border-radius:6px;
}

.floating-search-button .el-button {
  /* 这里只放按钮本身的美化样式 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 16px;
}


/* --- 右侧边栏 (已修正) --- */
.sidebar {
  position: sticky;
  top: 84px;
}

.curriculum-list {
  max-height: calc(100vh - 120px); 
  overflow-y: auto; /* 只保留这两个功能性样式 */
}

.curriculum-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.lesson-item {
  display: flex;
  align-items: center;
  padding: 12px 10px;
  cursor: pointer;
  transition: background-color 0.3s;
  border-bottom: 1px solid #EBEEF5;

}

.lesson-item:last-child {
  border-bottom: none;
}

.lesson-item:hover {
  background-color: #f5f7fa;
}

.lesson-item.is-current {
  background-color: #ecf5ff;
  font-weight: bold;
  color: #409EFF;
}

.lesson-status-icon {
  margin-right: 12px;
  display: flex;
  align-items: center;
}

.lesson-info {
    overflow: hidden;
    
}
.lesson-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    font-size:16px;
    font-weight:550;
    color:#737984;
}
.long-title-tooltip {
    max-width: 400px; /* 限制提示框的最大宽度 */
}

:deep(.el-collapse-item__header) {
  font-size: 18px;
  font-weight: 1000;

}

:deep(.el-collapse-item__content) {
  padding-bottom: 0;
  font-weight: bold;
  font-size: 18px;
  color:#606266;
}


/* --- 其他组件和内容区域 --- */
.slide-viewer-container {
  margin-top: 20px;
  padding: 15px;
  border-top: 1px solid #e4e7ed;
}

.slide-viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.slide-viewer-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.tab-content {
  padding: 20px;
}

.tab-content h3 {
  font-size: 18px;
  font-weight: bold;
  margin-top: 0;
  margin-bottom: 20px;
}

.resource-item {
  display: flex;
  align-items: center;
  padding: 10px 5px;
  border-bottom: 1px solid #EBEEF5;
}

/* ... 您其他的样式规则保持不变 ... */
.resource-item:last-child {
  border-bottom: none;
}

.resource-item .el-icon {
  margin-right: 10px;
  color: #909399;
}

.resource-name {
  flex-grow: 1;
  color: #606266;
}

.search-drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.quick-results-area {
  flex-grow: 1;
  margin-top: 20px;
  overflow-y: auto;
  padding-right: 10px;
}

.quick-results-summary {
  font-size: 14px;
  color: #606266;
  padding: 0 5px 10px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 10px;
}

.quick-result-group-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 15px;
  overflow: hidden;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: box-shadow 0.2s;
}

.quick-result-group-card:hover {
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

.quick-result-group-header {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e4e7ed;
}

.quick-result-icon-container {
  display: flex;
  align-items: center;
  margin-right: 15px;
  flex-shrink: 0;
}

.quick-result-icon {
  color: #409EFF;
  font-size: 24px;
}

.quick-result-slide-preview {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
  margin-left: 10px;
}

.quick-result-details {
  flex-grow: 1;
  overflow: hidden;
}

.quick-result-title {
  font-weight: 600;
  color: #303133;
  margin: 0;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quick-result-meta {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.quick-result-group-children {
  padding: 5px 15px;
  max-height: 200px;
  overflow-y: auto;
}

.quick-result-child-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 5px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.quick-result-child-item:hover {
  background-color: #f0f2f5;
}

.quick-result-context {
  font-weight: 500;
  color: #409EFF;
  margin-right: 10px;
  flex-shrink: 0;
  font-family: monospace;
  font-size: 12px;
}

.quick-result-snippet {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  flex-grow: 1;

  /* 启用 Flexbox 布局的旧版本，这是 line-clamp 生效的前提 */
  display: -webkit-box; 
  
  /* 设置伸缩盒对象的子元素的排列方式为垂直 */
  -webkit-box-orient: vertical;
  
  /* 关键属性：限制文本最多显示 3 行。您可以改成 2 或 4 */
  -webkit-line-clamp: 2; 

  /* 隐藏超出3行的文本 */
  overflow: hidden; 
}

.no-quick-results {
  color: #909399;
  text-align: center;
  padding-top: 40px;
}

.deep-search-link {
  margin-top: auto;
  padding: 15px 0;
  text-align: center;
}

:deep(.highlight) {
  background-color: #fdf6ec;
  color: #e6a23c;
  font-weight: bold;
}

:deep(.el-collapse-item__header) {
  position: sticky;
  top: 0;
  background-color: #fff; /* 或您侧边栏的背景色 */
  z-index: 1; /* 确保它能覆盖在下方的列表项之上 */
}

.curriculum-list::-webkit-scrollbar {
  width: 6px; /* 滚动条宽度 */
}

.curriculum-list::-webkit-scrollbar-track {
  background: transparent; /* 轨道背景设为透明 */
}

.curriculum-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;    /* 滚动条滑块的颜色 */
  border-radius: 3px;     /* 滑块的圆角 */
  transition: background 0.3s; /* 添加一个颜色过渡效果 */
}

.curriculum-list::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc; /* 鼠标悬停时滑块的颜色 */
}

/* --- Autocomplete 样式 --- */
.autocomplete-item-container {
  display: flex;
  align-items: flex-start; /* 图标和文字顶部对齐 */
  padding: 10px 12px;
}

.autocomplete-item-icon {
  margin-right: 12px;
  margin-top: 10px; /* 微调图标，使其与主标题垂直对齐 */
  font-size: 18px;
  color: #888;
  flex-shrink: 0; /* 防止图标被压缩 */
}

.autocomplete-item-text {
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
}

.autocomplete-item-title {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 5px; /* 在主标题和meta信息间增加一点间距 */
}



/* 核心修改：meta 信息的 Flex 布局 */
.autocomplete-item-meta {
  display: flex;
  align-items: baseline; /* 基线对齐，让 'Video' 和 '[...]' 在文字底部对齐 */
  font-size: 13px;
  width: 100%;
}

.meta-type {
  /* 这是 "Video" 或 "Slide" */
  color: #606266; /* 普通灰色 */
  font-weight: 500;
  width: 50px; /* 给一个固定宽度，确保第二列对齐 */
  flex-shrink: 0;
}

.meta-context {
  /* 这是 "[00:15:57]" 或 "Page 23" */
  color: #6a9bfe; /* 颜色更浅一些 */
  font-family: monospace; /* 使用等宽字体让时间戳更好看 */
  font-weight: 900;
}

.autocomplete-item-snippet {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin-top: 8px; /* 摘要与meta信息间的间距 *
  
  /* 多行文本省略（可选，但推荐） */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2; /* 最多显示2行 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal; /* 覆盖可能存在的 nowrap */
}

:deep(.highlight) {
  background-color: #fdf6ec;
  color: #e6a23c;
  font-weight: normal;
}

/* --- 搜索按钮悬浮变色效果 (区域修正版) --- */

/* 1. 设置外层容器的默认样式和过渡效果 */
:deep(.floating-search-bar .el-input-group__append) {
  background-color: #f5f7fa; /* 默认的浅灰色背景 */
  transition: background-color 0.2s ease-in-out;
  /* 移除可能存在的右侧边框，让它和输入框融为一体 */
  box-shadow: none; 
}

/* 2. 重置内部按钮的样式，让它变得“隐形” */
:deep(.floating-search-bar .el-input-group__append .el-button) {
  background-color: transparent; /* 背景透明 */
  border: none;                 /* 无边框 */
  color: #909399;               /* 设置一个默认的图标颜色 */
  transition: color 0.2s ease-in-out; /* 为图标颜色也加上过渡 */
}

/* 3. 当鼠标悬停在“外层容器”上时，改变容器背景色 */
:deep(.floating-search-bar .el-input-group__append:hover) {
  background-color: #74b9ff; /* 将容器背景变为蓝色 */
}

/* 4. 同时，当鼠标悬停在“外层容器”上时，改变“内部按钮”里图标的颜色 */
:deep(.floating-search-bar .el-input-group__append:hover .el-button) {
  color: #ffffff; /* 将图标变为白色 */
}

</style>

