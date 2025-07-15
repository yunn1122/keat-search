<script setup>
// =======================================================================
// 1. IMPORTS & SETUP
// =======================================================================
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Search, VideoCamera, Picture, VideoPlay } from '@element-plus/icons-vue';

// =======================================================================
// 2. STATE MANAGEMENT (REFS)
// =======================================================================
const courseData = ref(null);
const searchResults = ref([]);
const isLoading = ref(true);
const error = ref(null);
const route = useRoute();
const router = useRouter();

const searchQuery = ref('');
const activeTab = ref('all');
const sortBy = ref('relevance');
const currentPage = ref(1);
const pageSize = ref(6);
const expandedGroups = ref(new Set());

// =======================================================================
// 3. HELPER FUNCTIONS & DEFINITIONS
// =======================================================================
const KEATS_API_BASE_URL = '/api';

function getPdfThumbnailUrl(url) {
  if (!url || url.startsWith('http')) { return url; }
  return `http://46.101.49.168/${url}`;
}

function createCenteredSnippet(fullText, keyword, targetLength = 280) {
  if (!keyword || !fullText || fullText.length < targetLength) {
    return fullText;
  }
  const keywordLower = keyword.toLowerCase();
  const textLower = fullText.toLowerCase();
  const keywordIndex = textLower.indexOf(keywordLower);
  if (keywordIndex === -1 || keywordIndex < targetLength * 0.4) {
    return fullText;
  }
  const desiredStart = keywordIndex - Math.floor(targetLength / 2);
  const startIndex = Math.max(0, fullText.lastIndexOf(' ', desiredStart));
  const snippet = fullText.substring(startIndex);
  return (startIndex > 0 ? '... ' : '') + snippet;
}

function highlight(text, query) {
  if (!query || !text) { return text; }
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, `<span class="highlight">$1</span>`);
}

const typeIcons = {
  Video: VideoCamera,
  Resource: Picture,
};

// =======================================================================
// 4. API & DATA FETCHING
// =======================================================================
async function executeSearch() {
  const courseId = route.query.courseId;
  const query = searchQuery.value;

  if (!query || !courseId) {
    searchResults.value = [];
    return;
  }

  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch(`${KEATS_API_BASE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: { question: query },
        top_k: 50,
        filters: { courses_ids: [courseId] }
      })
    });
    if (!response.ok) throw new Error(`Search API request failed: ${response.status}`);
    const data = await response.json();
    searchResults.value = data;
    currentPage.value = 1;
  } catch (e) {
    console.error("Error during search execution:", e);
    error.value = e.message;
    searchResults.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  searchQuery.value = route.query.q || '';
  const courseId = route.query.courseId;

  if (!courseId) {
    error.value = "Error: courseId parameter is missing from the URL.";
    isLoading.value = false;
    return;
  }

  try {
    const coursesResponse = await fetch(`${KEATS_API_BASE_URL}/courses`);
    const courses = await coursesResponse.json();
    const currentCourse = courses.find(c => c.course_id === courseId);
    if (currentCourse) {
      courseData.value = { title: currentCourse.course_title, id: currentCourse.course_id };
    } else {
      throw new Error(`Course with ID ${courseId} not found.`);
    }
  } catch(e) {
    error.value = e.message;
  }
  
  await executeSearch();
});

// =======================================================================
// 5. COMPUTED PROPERTIES
// =======================================================================
const courseTitle = computed(() => courseData.value?.title || 'Loading Course...');

const groupedResults = computed(() => {
  const grouped = new Map();

  const filteredApiResults = searchResults.value.filter(item => {
    if (activeTab.value === 'all') return true;
    const itemType = item.document.doc_type === 'mp4' ? 'video' : 'resource';
    return itemType === activeTab.value;
  });

  filteredApiResults.forEach(item => {
    const doc = item.document;
    let key, groupTitle, groupSource, type, previewImage, lessonId, downloadUrl;

    if (doc.doc_type === 'mp4') {
      lessonId = doc.lecture_id;
      key = `video-group-${lessonId}`;
      groupTitle = doc.lecture_title;
      groupSource = `Video`;
      type = 'Video';
      previewImage = doc.thumbnail_url;
    } else if (doc.doc_type === 'pdf') {
      lessonId = doc.lecture_id;
      key = `resource-group-${doc.doc_id}`;
      groupTitle = doc.lecture_title;
      groupSource = `Slide`;
      type = 'Resource';
      previewImage = getPdfThumbnailUrl(doc.thumbnail_url);
      downloadUrl = doc.url; // 【新增】获取幻灯片的下载链接
    } else {
      return;
    }

    if (!grouped.has(key)) {
      grouped.set(key, {
        key: key,
        type: type,
        icon: typeIcons[type],
        title: groupTitle,
        source: groupSource,
        lessonId: lessonId,
        courseId: doc.course_id,
        previewImage: previewImage,
        downloadUrl: downloadUrl, // 【新增】将下载链接存入分组
        children: []
      });
    }

    const groupItem = grouped.get(key);
    groupItem.children.push({
      id: doc.id,
      snippet: createCenteredSnippet(doc.content, searchQuery.value),
      timestamp: doc.timestamp?.start,
      page: doc.page_number,
      doc_id: doc.doc_id
    });
  });
  
  let results = Array.from(grouped.values());

  if (sortBy.value === 'chronological') {
      const getLessonNum = (id) => parseInt(String(id).match(/\d+/)?.[0] || '0');
      results.sort((a, b) => getLessonNum(a.lessonId) - getLessonNum(b.lessonId));
  }
  
  return results;
});

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return groupedResults.value.slice(start, end);
});

// =======================================================================
// 6. NAVIGATION & EVENT HANDLING
// =======================================================================
function navigateToCourseDetail(group, child) {
  const queryParams = {
    lessonId: group.lessonId,
    highlight: searchQuery.value,
  };

  if (group.type === 'Video') {
    queryParams.timestamp = child.timestamp;
  } else if (group.type === 'Resource') {
    // queryParams.viewSlideId = child.doc_id;
    // queryParams.page = child.page;
    if (group.downloadUrl) {
      // 构建带页码的URL，如果child.page不存在则默认为1
      const finalUrl = `${group.downloadUrl}#page=${child.page || 1}`;
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    }
    return;
  }
  
  router.push({
    name: 'CourseDetail', 
    params: { id: group.courseId },
    query: queryParams,
  });
}

// 【新增】处理预览区域点击事件的函数
function handlePreviewClick(group) {
  if (group.type === 'Video') {
    // 对于视频，跳转到课程详情页，并从头开始播放
    navigateToCourseDetail(group, { timestamp: '00:00:00' });
  } else if (group.type === 'Resource' && group.downloadUrl) {
    // 对于幻灯片，在新标签页打开PDF链接
    window.open(group.downloadUrl, '_blank', 'noopener,noreferrer');
  }
}
</script>

<template>
  <div class="search-page-container">
    <div v-if="isLoading && !searchResults.length" class="state-feedback">
      <h2>Loading Results...</h2>
    </div>
    <div v-else-if="error" class="state-feedback error">
      <h2>An Error Occurred</h2>
      <p>{{ error }}</p>
    </div>

    <div v-else>
      <div class="sticky-search-header">
        <div class="course-context-header">
          <h2 style="font-weight: bold; color: #303133">Search in {{ courseTitle }}</h2>
        </div>
        <div class="search-input-area">
          <el-input
            v-model="searchQuery"
            placeholder="Search content in this course..."
            size="large"
            :prefix-icon="Search"
            clearable
            @keyup.enter="executeSearch"
          class="input-with-button" 
          >
            <template #append>
              <el-button  @click="executeSearch">Search</el-button>
            </template>
          </el-input>
        </div>
        <div class="toolbar">
          <div class="results-count">
            Found {{ groupedResults.length }} groups of results
          </div>
          <el-select v-model="sortBy" placeholder="Sort by" size="small" style="width: 180px;">
            <el-option label="Sort by Relevance" value="relevance"></el-option>
            <el-option label="Sort by Course Order" value="chronological"></el-option>
          </el-select>
        </div>
        <div class="filter-tabs-area">
          <el-tabs v-model="activeTab" class="search-tabs">
            <el-tab-pane label="All" name="all"></el-tab-pane>
            <el-tab-pane label="Videos" name="video"></el-tab-pane>
            <el-tab-pane label="Slides" name="resource"></el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <div class="results-display-area" v-loading="isLoading">
        <div v-if="paginatedResults.length > 0" class="results-list">
          <div v-for="group in paginatedResults" :key="group.type + '-' + group.lessonId" class="result-group-wrapper">
            <div class="search-result-card">
  <div class="card-inner-content">
    
    <div class="clickable-preview" @click="handlePreviewClick(group)">
      <div class="media-preview-area">
        <img v-if="group.previewImage" :src="group.previewImage" alt="Preview" class="preview-thumbnail">
        <div v-else class="preview-placeholder">
          <el-icon><Picture /></el-icon>
        </div>
        <el-icon v-if="group.type === 'Video'" class="play-icon-overlay"><VideoPlay /></el-icon>
      </div>
    </div>

    <div class="info-details-area">
      <p class="result-group-title">{{ group.title }}</p>
      <p class="result-group-source">{{ group.source }}</p>
      
      <div class="matching-segments-list">
        <template v-for="(child, index) in group.children" :key="child.id">
          <a
            v-if="expandedGroups.has(group.key) || index < 1"
            @click="navigateToCourseDetail(group, child)"
            class="segment-link"
          >
            <span class="segment-context">[ {{ group.type === 'Video' ? child.timestamp : `Page ${child.page}` }} ]</span>
            <div class="snippet-wrapper">
              <span class="segment-snippet" v-html="highlight(child.snippet, searchQuery)"></span>
            </div>
          </a>
        </template>
        <div
          v-if="!expandedGroups.has(group.key) && group.children.length > 1"
          class="show-more-button"
          @click="expandedGroups.add(group.key)"
        >
          Showing {{ group.children.length - 1 }} more results
        </div>
      </div>
    </div>

  </div>
</div>
          </div>
        </div>
        <div v-else-if="!isLoading" class="no-results state-feedback">
          <h2>No results found</h2>
          <p>Try using different or more general keywords.</p>
        </div>
      </div>

      <div v-if="groupedResults.length > pageSize" class="pagination-area">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="groupedResults.length"
          :page-size="pageSize"
          v-model:current-page="currentPage"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* State Feedback Styles */
.state-feedback { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 50vh; text-align: center; }
.state-feedback h2 { margin-bottom: 8px; color: #303133; }
.state-feedback p { color: #606266; }
.state-feedback.error h2 { color: #f56c6c; }

/* Main Layout Styles */
.search-page-container { max-width: 900px; margin: 0 auto; padding: 20px; font-family: sans-serif; display: flex; flex-direction: column; min-height: calc(100vh - 80px); }
.sticky-search-header { position: sticky; top: 0; background-color: white; z-index: 10; padding-top: 20px; margin-bottom: 20px; }
.course-context-header { padding-bottom: 12px; margin-bottom: 6px; padding-top: 40px;}
.course-context-header h2 { margin: 0; font-size: 24px; color: #303133; }
.search-input-area { margin-bottom: 20px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 0 5px; }
.results-count { font-size: 14px; color: #606266; }
.filter-tabs-area { border-bottom: 1px solid #e4e7ed; }
:deep(.el-tabs__header) { margin: 0; }
.results-display-area { min-height: 400px; }

/* Result Card Styles */
.search-result-card { border: 1px solid #e4e7ed; border-radius: 8px; margin-bottom: 20px; overflow: hidden; background-color: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.06); transition: box-shadow 0.2s, transform 0.2s; }
.search-result-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-2px); }
.card-inner-content { display: flex; align-items: flex-start; width: 100%; padding: 20px; box-sizing: border-box; }

/* 【CSS修改】为预览区添加点击手势 */
.clickable-preview {
  cursor: pointer;
}

.media-preview-area { position: relative; flex-shrink: 0; width: 200px; height: 112px; background-color: #f0f2f5; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-right: 20px; border-radius: 4px; box-shadow: 0 4px 12px rgba(3, 3, 3, 0.1); /* 添加柔和的阴影 */
  transition: box-shadow 0.2s; /* 让阴影变化更平滑 */ }
.preview-thumbnail { width: 100%; height: 100%; object-fit: cover; }
.preview-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: #f5f7fa; color: #c0c4cc; font-size: 40px; }
.play-icon-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: rgba(255, 255, 255, 0.8); font-size: 50px; text-shadow: 0 0 8px rgba(0,0,0,0.5); pointer-events: none; }

.info-details-area { flex-grow: 1; overflow: hidden; }
.result-group-title { font-size: 18px; font-weight: 600; margin: 0 0 5px 0; color: #303133; }
.result-group-source { font-size: 13px; color: #909399; margin: 0 0 15px 0; }

/* 1. 修改列表容器的样式，去掉它的上边框，因为我们将给每个项目加边框 */
.matching-segments-list {
  max-height: none; /* 取消固定高度，让列表自然展开 */
  overflow-y: visible; /* 取消内部滚动条 */
  border-top: none; /* 去掉顶部分隔线 */
  padding-top: 0;
  margin-top: 10px;
}

/* 2. 修改每个链接项的样式 */
.segment-link { 
  display: flex; 
  align-items: flex-start; /* 顶部对齐 */
  padding: 8px 5px; 
  line-height: 1.6; /* 增加行高，改善可读性 */
  border-radius: 4px; 
  cursor: pointer; 
  transition: background-color 0.2s; 
}

/* 3. 优化鼠标悬浮效果 */
.segment-link:hover {
  background-color: #f5f7fa; /* 使用一个更柔和的悬浮背景色 */
}

/* 4. （可选）让时间戳的宽度固定，使文字部分能更好地对齐 */
.segment-context {
  font-weight: 500;
  color: #409EFF;
  margin-right: 12px; /* 稍微增加间距 */
  font-family: monospace;
  white-space: nowrap; /* 关键：强制不换行 */
  flex-shrink: 0; /* 不允许它被压缩 */
}

.snippet-wrapper { flex-grow: 1; min-width: 0; }
.segment-snippet { color: #606266; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }

:deep(.highlight) { background-color: #fdf6ec; color: #e6a23c; font-weight: bold; }

/* Pagination */
.pagination-area { display: flex; justify-content: center; margin-top: 30px; }

.show-more-button {
  color: #409EFF;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 8px 4px; /* 调整间距 */
  border-top: 1px solid #f0f2f5;
  margin-top: -4px; /* 抵消一点边距 */
  transition: background-color 0.2s;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}
.show-more-button:hover {
  background-color: #f5f7fa;
}
</style>