<script setup>
import { ref, watch, computed, nextTick, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  VideoPlay,
  CircleCheckFilled,
  Search,
  Picture,
  VideoCamera,
  Download,
  View as ViewIcon,
  Close
} from '@element-plus/icons-vue';

// --- Keats API 基础 URL ---
const KEATS_API_BASE_URL = '/api';

// --- 状态定义 ---
const courseData = ref(null);
const isLoading = ref(true);
const error = ref(null);
const curriculum = ref([]);
const resources = ref({});
const completedLessons = ref([]);

const currentLessonId = ref(null);
const activeSlideUrl = ref(null);
const slideViewerRef = ref(null);
let ytPlayer = null;
const activeCollapse = ref([]);
const highlightQuery = ref('');

const router = useRouter();
const route = useRoute();

// --- 计算属性 ---
const courseTitle = computed(() => courseData.value?.course_title || 'Loading...');
const courseProgress = computed(() => 0);
const activeResources = computed(() => resources.value[currentLessonId.value]?.filter(r => r.type === 'slide') || []);
const activeVideoId = computed(() => {
  if (!curriculum.value || !currentLessonId.value) return null;
  const lesson = curriculum.value.flatMap(sec => sec.lessons).find(l => l.id === currentLessonId.value);
  return lesson ? lesson.videoId : null;
});

// n: 总课程数量
const totalLessonsCount = computed(() => {
  if (!curriculum.value) return 0;
  return curriculum.value.flatMap(sec => sec.lessons).length;
});

// m: 当前课程的序号 (1-based index)
const currentLessonIndex = computed(() => {
  if (!currentLessonId.value || !curriculum.value || totalLessonsCount.value === 0) return 0;
  const allLessons = curriculum.value.flatMap(sec => sec.lessons);
  const index = allLessons.findIndex(l => l.id === currentLessonId.value);
  return index !== -1 ? index + 1 : 0;
});

const currentLessonTitle = computed(() => {
  if (!currentLessonId.value || !curriculum.value || curriculum.value.length === 0) {
    return '选择一节课开始学习'; // 初始或未选中时的默认文本
  }
  const allLessons = curriculum.value.flatMap(sec => sec.lessons);
  const currentLesson = allLessons.find(l => l.id === currentLessonId.value);
  return currentLesson ? currentLesson.title : '';
});

// --- 时间戳转换辅助函数 ---
const timeStringToSeconds = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
};

// --- 按需加载资源逻辑 ---
async function fetchResourcesForLesson(lessonId) {
  if (!lessonId || !courseData.value) return;
  if (resources.value[lessonId]) return;

  try {
    const courseId = route.params.id;
    resources.value[lessonId] = [];
    const filesResponse = await fetch(`${KEATS_API_BASE_URL}/files?course=${courseId}&lecture=${lessonId}`);
    if (!filesResponse.ok) throw new Error(`Failed to get file for lecture  ${lessonId} `);
    const filesData = await filesResponse.json();
    const lectureFiles = filesData[0]?.files || [];

    resources.value[lessonId] = lectureFiles.map(file => {
      const isSlide = file.doc_type === 'pdf';
      return {
        id: file.doc_id,
        name: isSlide
          ? `${courseData.value.course_title} slide ${lessonId}`
          : file.doc_id,
        type: isSlide ? 'slide' : file.doc_type,
        downloadUrl: file.url,
        previewImage: isSlide ? getPdfThumbnailUrl(file.thumbnail_url) : file.thumbnail_url
      };
    });

    const videoFile = lectureFiles.find(file => file.doc_type === 'mp4');
    if (videoFile) {
      const lessonInCurriculum = curriculum.value.flatMap(sec => sec.lessons).find(l => l.id === lessonId);
      if (lessonInCurriculum) {
        lessonInCurriculum.videoId = getYouTubeID(videoFile.url);
      }
    }
  } catch (e) {
    console.error("Error loading resources on demand:", e);
    resources.value[lessonId] = [];
  }
}

// --- 初始加载逻辑 (`onMounted`) ---
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
      title: `${currentCourse.course_title} `,
      lessons: lectures.map(l => ({ id: l.lecture_id, title: l.lecture_title, videoId: null }))
    }];

    if (curriculum.value?.[0]) {
      activeCollapse.value = [curriculum.value[0].id];
    }
    
    // 步骤 2: 确定初始课程，但先不初始化播放器
    initialLessonId = route.query.lessonId || curriculum.value?.[0]?.lessons?.[0]?.id;
    initialTimestamp = route.query.timestamp;

  } catch (e) {
    console.error("error in loading course data", e);
    error.value = e.message;
  } finally {
    // 步骤 3: 设置 loading 为 false，这将触发 Vue 渲染主页面 DOM
    isLoading.value = false;
    
    // 步骤 4: 使用 await nextTick() 确保 DOM 更新已完成
    await nextTick();
    
    // 步骤 5: 在 DOM 准备就绪后，才执行初始化课程的逻辑
    if (initialLessonId) {
      await initializeLesson(initialLessonId, initialTimestamp);
    } else if (!error.value) { // 避免覆盖在 try 中可能已设置的错误信息
      error.value = "No video for this course";
    }
  }
});

// --- YouTube Player 核心逻辑 ---
function initializeYouTubePlayer(videoId, startSeconds = 0) {
  if (!videoId) return;

  if (window.YT && window.YT.Player) {
    createPlayer(videoId, startSeconds);
  } else {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api"; // Using official URL
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    window.onYouTubeIframeAPIReady = () => createPlayer(videoId, startSeconds);
  }
}

function createPlayer(videoId, startSeconds) {
  if (ytPlayer && typeof ytPlayer.destroy === 'function') {
    ytPlayer.destroy();
    ytPlayer = null;
  }
  ytPlayer = new window.YT.Player('youtube-player-container', {
    height: '100%',
    width: '100%',
    videoId: videoId,
    playerVars: {
      'playsinline': 1,
      'rel': 0,
      'start': startSeconds
    },
    events: {
      'onReady': () => console.log("YouTube Player is ready.")
    }
  });
}

// --- 路由与页面交互逻辑 ---

function scrollToPlayer() {
  nextTick(() => {
    const container = document.getElementById('youtube-player-container');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}


/**
 * 新的、统一的课程初始化函数
 * @param {string} lessonId - 要加载的课程ID
 * @param {string} [timestamp] - 初始播放时间戳
 */
async function initializeLesson(lessonId, timestamp) {
  if (!lessonId) {
    console.error("Failed to initialize course, lessenId is invaild");
    return;
  }
  
  currentLessonId.value = lessonId;
  await fetchResourcesForLesson(lessonId);

  const videoId = activeVideoId.value;
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
  scrollToPlayer();
}


// 

/**
 * 创建以关键词为中心的文本片段
 * @param {string} fullText - 完整的原始文本
 * @param {string} keyword - 要居中显示的关键词
 * @param {number} [targetLength=280] - 希望截取的文本片段的大致长度（字符数）
 * @returns {string} - 处理后的、以关键词为中心的文本片段
 */
function createCenteredSnippet(fullText, keyword, targetLength = 280) {
  if (!keyword || !fullText || fullText.length < targetLength) {
    return fullText; // 如果文本本身很短或没有关键词，则无需处理
  }

  const keywordLower = keyword.toLowerCase();
  const textLower = fullText.toLowerCase();
  const keywordIndex = textLower.indexOf(keywordLower);

  // 如果找不到关键词，或者关键词本身就在文本的开头部分，则直接从头开始截断
  if (keywordIndex === -1 || keywordIndex < targetLength * 0.4) {
    return fullText;
  }

  // 计算理想的起始点，让关键词尽量处于中间
  const desiredStart = keywordIndex - Math.floor(targetLength / 2);
  
  // 为了不从单词中间切开，我们从理想起始点往前找到第一个空格
  const startIndex = Math.max(0, fullText.lastIndexOf(' ', desiredStart));

  // 截取文本片段，并在前面加上省略号
  const snippet = fullText.substring(startIndex);

  // 如果不是从头开始截取的，就在前面加上 "..."
  return (startIndex > 0 ? '... ' : '') + snippet;
}

// 监听核心播放参数的变化
watch(
  () => [route.query.lessonId, route.query.timestamp],
  ([newLessonId, newTimestamp], [oldLessonId, oldTimestamp]) => {
    if (isLoading.value || !newLessonId) return;

    const lessonChanged = newLessonId !== oldLessonId;

    if (lessonChanged) {
      initializeLesson(newLessonId, newTimestamp);
    } else if (newTimestamp !== oldTimestamp) {
      const startSeconds = timeStringToSeconds(newTimestamp);
      if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
        ytPlayer.seekTo(startSeconds, true);
      }
    }
  },
  { deep: true }
);

// 专门监听幻灯片相关的参数
watch(
  () => [route.query.viewSlideId, route.query.page],
  ([newSlideId, newPage]) => {
    if (isLoading.value) return;

    if (newSlideId) {
      const resource = activeResources.value.find(r => r.id === newSlideId);
      if (resource) {
        viewSlide(resource, newPage || 1);
      }
    } else {
      closeSlideViewer();
    }
  }
);

// 专门监听高亮参数
watch(
  () => route.query.highlight,
  (newHighlight) => {
    highlightQuery.value = newHighlight || '';
  }
);

watch(currentLessonId, (newId) => {
  if (!newId) return;

  // 使用 nextTick 确保 DOM 已经更新完毕
  nextTick(() => {
    const activeLessonElement = document.getElementById(`lesson-item-${newId}`);
    if (activeLessonElement) {
      // scrollIntoView 是一个浏览器原生API，非常方便
      activeLessonElement.scrollIntoView({
        behavior: 'smooth', // 平滑滚动
        block: 'center'    // 将元素滚动到容器的中间位置
      });
    }
  });
});

function selectLesson(lesson) {
  router.push({ query: { lessonId: lesson.id } });
}

async function handleQuickSearchResultClick(groupItem, childItem) {
  isSearchDrawerVisible.value = false; // 先关闭抽屉

  const resultType = groupItem.type;
  const lessonId = groupItem.lessonId;
  const queryParams = {
    lessonId: lessonId,
    highlight: quickSearchQuery.value,
  };
  let hash = ''; // 初始化 hash 为空

  // 如果课程发生变化，先等待新课程初始化完成
  // (我们使用的是已经没有滚动功能的 initializeLesson)
  if (lessonId !== currentLessonId.value) {
    await initializeLesson(lessonId, resultType === 'Video' ? childItem.timestamp : undefined);
  }

  // 处理幻灯片资源
  if (resultType === 'Resource') {
    queryParams.viewSlideId = childItem.doc_id;
    queryParams.page = childItem.page;
    hash = '#slide-viewer-container'; // 幻灯片的 hash 行为保持不变

    const lessonResources = resources.value[lessonId] || [];
    const resource = lessonResources.find(r => r.id === childItem.doc_id);
    
    if (resource) {
      viewSlide(resource, childItem.page);
    } else {
      console.error("Failed to find a resource in the click processing, which shouldn't happen.");
    }
  } 
  // 处理视频资源
  else if (resultType === 'Video') {
    queryParams.timestamp = childItem.timestamp;
    
    // 【核心修改】对于视频点击，我们不再给 hash 赋值
    // hash = '#youtube-player-container'; // <--- 删除或注释此行

    // 如果课程没变，只是时间戳变了，手动 seek
    if (lessonId === currentLessonId.value && ytPlayer) {
      const startSeconds = timeStringToSeconds(childItem.timestamp);
      ytPlayer.seekTo(startSeconds, true);
    }
    
    // 这段手动的滚动逻辑现在将是唯一的滚动来源，可以正常工作
    nextTick(() => {
      const videoPlayerElement = document.getElementById('youtube-player-container');
      if (videoPlayerElement) {
        videoPlayerElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  }

  // 最后更新 URL。因为视频点击时 hash 为空，所以不会触发路由滚动
  router.push({ query: queryParams, hash: hash });
}

function viewSlide(resource, page = 1) {
  activeSlideUrl.value = `${resource.downloadUrl}?page=${page}`;
  
  nextTick(() => {
    // 再等一轮，确保组件已挂载
    requestAnimationFrame(() => {
      const viewerEl = slideViewerRef.value;
      if (viewerEl && viewerEl.scrollIntoView) {
        viewerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

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

function closeSlideViewer() {
  activeSlideUrl.value = null;
}

// --- 搜索相关逻辑 (保持不变) ---
const isSearchDrawerVisible = ref(false);
const quickSearchQuery = ref('');
const quickSearchResults = ref([]);
const isSearching = ref(false);
const quickSearchIcons = {
  Video: VideoCamera,
  Resource: Picture
};

function highlightText(text, query) {
  if (!query || !text) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, `<span class="highlight">$1</span>`);
}

watch(quickSearchQuery, async (newQuery) => {
  if (newQuery.length > 2) {
    isSearching.value = true;
    try {
      const courseId = route.params.id;
      const response = await fetch(`${KEATS_API_BASE_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: { question: newQuery },
          top_k: 20,
          filters: { courses_ids: [courseId] }
        })
      });
      if (!response.ok) throw new Error(`API request failed: ${response.status}`);
      const data = await response.json();
      quickSearchResults.value = data;
    } catch (e) {
      console.error("error in quick search", e);
      quickSearchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  } else {
    quickSearchResults.value = [];
  }
});

const groupedQuickSearchResults = computed(() => {
  const grouped = new Map();
  quickSearchResults.value.forEach(item => {
    const doc = item.document;
    let key, groupTitle, groupSource;
    let commonPreviewImage = doc.doc_type === 'pdf'
      ? getPdfThumbnailUrl(doc.thumbnail_url)
      : doc.thumbnail_url;

    if (doc.doc_type === 'mp4') {
      key = `video-group-${doc.lecture_id}`;
      groupTitle = doc.lecture_title;
      groupSource = `Video `;
    } else if (doc.doc_type === 'pdf') {
      key = `resource-group-${doc.doc_id}`;
      groupTitle = doc.lecture_title;
      groupSource = `Slide `;
    } else {
      return;
    }

    if (!grouped.has(key)) {
      grouped.set(key, {
        isGroup: true, type: doc.doc_type === 'mp4' ? 'Video' : 'Resource',
        icon: doc.doc_type === 'mp4' ? quickSearchIcons.Video : quickSearchIcons.Resource,
        source: groupSource, title: groupTitle, lessonId: doc.lecture_id,
        courseId: doc.course_id, previewImage: commonPreviewImage, children: []
      });
    }

    const groupItem = grouped.get(key);
    groupItem.children.push({
      id: doc.id, snippet: doc.content, timestamp: doc.timestamp?.start,
      page: doc.page_number,
      
      highlightedSnippet: highlightText(
        createCenteredSnippet(doc.content, quickSearchQuery.value), // 先调用新函数
        quickSearchQuery.value
      ),
      doc_id: doc.doc_id,
    });
  });
  return Array.from(grouped.values());
});

function goToDeepSearch() {
  if (!quickSearchQuery.value) return;
  const courseId = route.params.id;
  router.push({ name: 'SearchView', query: { courseId: courseId, q: quickSearchQuery.value } });
}

</script>

<template>
  <div v-if="isLoading" class="loading-state">
    <p>Loading...</p>
  </div>
  <div v-else-if="error" class="error-state">
    <p>ERROR: {{ error }}</p>
    <p>Make sure that your keats search api is running in `{{ KEATS_API_BASE_URL }}`  and the course ID is correct</p>
  </div>

  <div v-else class="course-page">

    <div class="floating-search-button">
    <el-button :icon="Search" type="primary" plain @click="isSearchDrawerVisible = true">
      Search in Course
    </el-button>
  </div>

    <div class="top-area">
  <div class="title-group">
    <h1 class="course-title">{{ courseTitle }}</h1>
    <h2 class="lecture-title">{{ currentLessonTitle }}</h2>
  </div>
  <div class="top-controls">
    <!-- <el-button :icon="Search" type="primary" plain @click="isSearchDrawerVisible = true">
      Search in Course
    </el-button> -->
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
                  tag="a"
                  type="primary"
                  link
                  :icon="Download"
                  :href="resource.downloadUrl"
                  :download="resource.name + '.pdf'"
                  target="_blank" 
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
        <div class="sidebar">
          <el-collapse v-if="curriculum.length > 0" class="curriculum-list" v-model="activeCollapse">
            <el-collapse-item
              v-for="section in curriculum"
              :key="section.id"
              :title="totalLessonsCount > 0 ? `Lecture Collection (${currentLessonIndex}/${totalLessonsCount})` : section.title"
              :name="section.id"
              
            >
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

    <el-drawer
      v-model="isSearchDrawerVisible"
      title="Search in Course"
      direction="rtl"
      size="40%"
    >
      <div class="search-drawer-content">
        <el-input
          v-model="quickSearchQuery"
          placeholder="Input Keyword"
          size="large"
          :prefix-icon="Search"
          clearable
          @keyup.enter="goToDeepSearch"
        />
        <div class="quick-results-area" v-loading="isSearching">
          <div v-if="quickSearchQuery.length > 2 && !isSearching && groupedQuickSearchResults.length > 0" class="quick-results-summary">
            Find {{ groupedQuickSearchResults.length }} results
          </div>

          <div v-if="groupedQuickSearchResults.length > 0" class="quick-results-list">
            <div v-for="group in groupedQuickSearchResults" :key="group.type + '-' + group.lessonId + '-' + group.courseId + '-' + group.title" class="quick-result-wrapper">
              <div class="quick-result-group-card">
                <div class="quick-result-group-header">
                  <div class="quick-result-icon-container">
                    <el-icon class="quick-result-icon"><component :is="group.icon" /></el-icon>
                    <!-- <img v-if="group.type === 'Resource' && group.previewImage" :src="group.previewImage" alt="Preview" class="quick-result-slide-preview"> -->
                  </div>
                  <div class="quick-result-details">
                    <p class="quick-result-title">{{ group.title }}</p>
                    <div class="quick-result-meta">
                      <span class="quick-result-source">{{ group.source }}</span>
                    </div>
                  </div>
                </div>
                <div class="quick-result-group-children">
                  <div
                    v-for="child in group.children"
                    :key="child.id"
                    class="quick-result-child-item"
                    @click="handleQuickSearchResultClick(group, child)"
                  >
                    <span v-if="group.type === 'Video'" class="quick-result-context">[ {{ child.timestamp }} ]</span>
                    <span v-else-if="group.type === 'Resource'" class="quick-result-context">[ Page {{ child.page }}  ]</span>
                    <p class="quick-result-snippet" v-html="child.highlightedSnippet"></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p v-else-if="quickSearchQuery.length > 2 && !isSearching" class="no-quick-results">
            No relevant results found
          </p>
        </div>
        <el-button
          type="primary"
          link
          class="deep-search-link"
          @click="goToDeepSearch"
        >
          View all results in dedicated page...
        </el-button>
      </div>
    </el-drawer>
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


/* --- 悬浮搜索按钮 (已修正) --- */
.floating-search-button {
  position: fixed; /* 定位样式应在这里 */
  top: 84px;
  right: 60px;
  z-index: 1000;
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
    font-weight:450;
}
.long-title-tooltip {
    max-width: 400px; /* 限制提示框的最大宽度 */
}

:deep(.el-collapse-item__header) {
  font-size: 18px;
  font-weight: 900;

}

:deep(.el-collapse-item__content) {
  padding-bottom: 0;
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
</style>