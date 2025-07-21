<script setup>
// =======================================================================
// 1. IMPORTS & SETUP
// =======================================================================
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// 【新增】为 el-dropdown 引入 ArrowDown 图标
import { Search, VideoCamera, Picture, VideoPlay, ArrowDown } from '@element-plus/icons-vue';

import { useSessionStore } from '@/stores/session';

// =======================================================================
// 2. STATE MANAGEMENT (REFS) - 逻辑保持不变
// =======================================================================
const allCourses = ref([]);
const selectedCourseId = ref(null);
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

// 用于防抖的计时器变量
let debounceTimer = null;
const hasSearched = ref(false); // 追踪是否已执行过搜索

const courseSpecificSuggestions = {
  // 示例：计算思维与数据科学导论
  '6.0002': [
    'optimization problem',
    'dynamic programming',
    'final exam review',
    'Monte Carlo simulation',
    'k-means',
    'Machine Learning'
  ],
  // 算法导论
  '6.006': [
    'Dijkstra algorithm',
    'Binary Tree',
    'Hash Funtion',
    'Time Complexity',
    'Machine Learning',
    'graph problems',
    'DFS'
  ],
  //计算论
  '18.404J':[
    'Machine Learning',
    'graph problems',
    'Time Complexity',
    'P and NP',
    'Turing machine',
    'automaton',
  ],
  // 默认推荐词，当没有匹配的课程时显示
  'default': [
    'final exam review',
    'lecture notes',
    'assignment help',
    'past papers'
  ]
};

const suggestedTerms = computed(() => {
  const courseId = selectedCourseId.value; // 获取当前选择的课程ID

  // 如果当前课程ID在我们的数据源中有对应的列表，则返回该列表
  if (courseId && courseSpecificSuggestions[courseId]) {
    return courseSpecificSuggestions[courseId];
  }
  
  // 否则，返回默认的推荐词列表
  return courseSpecificSuggestions['default'];
});

// =======================================================================
// 3. HELPER FUNCTIONS & DEFINITIONS - 逻辑保持不变
// =======================================================================
const KEATS_API_BASE_URL = '/api';

// function getPdfThumbnailUrl(url) {
//   if (!url || url.startsWith('http')) { return url; }
//   return `http://46.101.49.168/${url}`;
// }

function getPdfThumbnailUrl(url) {
  // 如果 url 为空，或者它已经是一个完整的 http/https 链接，则直接返回
  if (!url || url.startsWith('http')) { 
    return url; 
  }

  // 将原始的图片路径作为 'url' 查询参数传递
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function createCenteredSnippet(fullText, keyword, targetLength = 130) {
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

  const searchWords = query.trim().split(/\s+/).filter(word => word.length > 0);
  if (searchWords.length === 0) {
    return text;
  }

  const escapedWords = searchWords.map(word =>
    word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );

  const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
  
  // 步骤1: 先像之前一样，高亮所有独立的单词
  let highlightedText = text.replace(regex, `<span class="highlight">$1</span>`);

  // 步骤2: 【新增】执行一个“合并”操作，把相邻的高亮块连接起来
  // 这个正则表达式会查找 "</span>(空格)<span class="highlight">" 这样的模式
  // 并用中间的空格替换掉它，从而实现无缝合并
  const mergeRegex = /<\/span>(\s+)<span class="highlight">/g;
  highlightedText = highlightedText.replace(mergeRegex, '$1');

  return highlightedText;
}

const typeIcons = {
  Video: VideoCamera,
  Resource: Picture,
};

// =======================================================================
// 4. API & DATA FETCHING - 逻辑保持不变
// =======================================================================
async function executeSearch() {
  const sessionStore = useSessionStore();
  sessionStore.recordSearch(searchQuery.value); 

  const courseId = selectedCourseId.value;
  const query = searchQuery.value;

  if (!query || !courseId) {
    searchResults.value = [];
    return;
  }

  hasSearched.value = true; // 在执行搜索时，将状态标记为 true
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
  const initialCourseId = route.query.courseId;
  
  try {
    const coursesResponse = await fetch(`${KEATS_API_BASE_URL}/courses`);
    if (!coursesResponse.ok) throw new Error('Failed to fetch courses.');
    allCourses.value = await coursesResponse.json();

    if (initialCourseId && allCourses.value.some(c => c.course_id === initialCourseId)) {
      selectedCourseId.value = initialCourseId;
    } else if (allCourses.value.length > 0) {
      selectedCourseId.value = allCourses.value[0].course_id;
    } else {
      throw new Error("No courses available.");
    }
  } catch(e) {
    error.value = e.message;
  }
  
  // await executeSearch();

  // 只有当 URL 中已经存在搜索词时，才在页面加载时自动执行搜索
  if (searchQuery.value) {
    await executeSearch();
  } else {
    // 如果没有搜索词，则不执行搜索，并确保 loading 状态为 false
    isLoading.value = false;
  }

});

watch(searchQuery, (newValue) => {
  // 清除上一个计时器，以重新开始计时
  clearTimeout(debounceTimer);
  
  // 设置一个新的计时器
  debounceTimer = setTimeout(() => {
    // 500毫秒后，如果用户没有再输入，则执行这里的代码
    console.log(`Updating URL query 'q' to: ${newValue}`);
    router.replace({ 
      query: { 
        ...route.query, // 保留URL中已有的其他参数（如courseId）
        q: newValue    // 更新或添加q参数
      } 
    });
  }, 500); // 设置500毫秒的防抖延迟
});

watch(sortBy, () => { console.log(`Sort order changed to: ${sortBy.value}`); });
watch(selectedCourseId, (newCourseId, oldCourseId) => {
    if (oldCourseId && newCourseId !== oldCourseId) {
        if (searchQuery.value) { executeSearch(); }
    }
});

watch(selectedCourseId, (newCourseId, oldCourseId) => {
    if (oldCourseId && newCourseId !== oldCourseId) {
        if (searchQuery.value) {
            executeSearch();
        }
    }
});

// =======================================================================
// 5. COMPUTED PROPERTIES - 逻辑保持不变
// =======================================================================
const sortByLabel = computed(() => {
  const options = {
    relevance: 'Sort by Relevance',
    chronological: 'Sort by Course Order'
  };
  return options[sortBy.value];
});

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
      lessonId = doc.lecture_id; key = `video-group-${lessonId}`; groupTitle = doc.lecture_title; groupSource = `Video`; type = 'Video'; previewImage = doc.thumbnail_url;
    } else if (doc.doc_type === 'pdf') {
      lessonId = doc.lecture_id; key = `resource-group-${doc.doc_id}`; groupTitle = doc.lecture_title; groupSource = `Slide`; type = 'Resource'; previewImage = getPdfThumbnailUrl(doc.thumbnail_url); downloadUrl = doc.url;
    } else { return; }
    if (!grouped.has(key)) {
      grouped.set(key, { key: key, type: type, icon: typeIcons[type], title: groupTitle, source: groupSource, lessonId: lessonId, courseId: doc.course_id, previewImage: previewImage, downloadUrl: downloadUrl, children: [] });
    }
    const groupItem = grouped.get(key);
    groupItem.children.push({ id: doc.id, snippet: createCenteredSnippet(doc.content, searchQuery.value), timestamp: doc.timestamp?.start, page: doc.page_number, doc_id: doc.doc_id });
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
// 6. NAVIGATION & EVENT HANDLING - 逻辑保持不变
// =======================================================================
function handleSortCommand(command) {
  sortBy.value = command;
}

function navigateToCourseDetail(group, child) {
  const queryParams = { lessonId: group.lessonId, highlight: searchQuery.value };
  if (group.type === 'Video') {
    queryParams.timestamp = child.timestamp;
  } else if (group.type === 'Resource') {
    if (group.downloadUrl) {
      const finalUrl = `${group.downloadUrl}#page=${child.page || 1}`;
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    }
    return;
  }
  router.push({ name: 'CourseDetail', params: { id: group.courseId }, query: queryParams });
}

function handlePreviewClick(group) {
  if (group.type === 'Video') {
    navigateToCourseDetail(group, { timestamp: '00:00:00' });
  } else if (group.type === 'Resource' && group.downloadUrl) {
    window.open(group.downloadUrl, '_blank', 'noopener,noreferrer');
  }
}

function searchWithSuggestedTerm(term) {
    searchQuery.value = term;
    executeSearch();
}
</script>

<template>
  <div class="search-page-container">
    <div 
  v-if="isLoading && !searchResults.length && !error" 
  v-loading.fullscreen.lock="true"
  element-loading-background="rgba(255, 255, 255, 0.7)"
>
  </div>
    <div v-else-if="error" class="state-feedback error">
      <h2>An Error Occurred</h2>
      <p>{{ error }}</p>
    </div>

    <div v-else>
      <div class="search-module-container">
        <div class="search-bar-group">
          <el-input
            v-model="searchQuery"
            placeholder="Search for concepts, lectures or keywords..."
            size="large"
            clearable
            @keyup.enter="executeSearch"
            class="main-search-input"
          />
          <el-button 
            type="primary" 
            @click="executeSearch" 
            class="search-icon-button"
            :icon="Search"
          />
          <el-select
            v-model="selectedCourseId"
            filterable
            size="large"
            class="course-selector-dropdown"
          >
            <el-option
              v-for="course in allCourses"
              :key="course.course_id"
              :label="course.course_title"
              :value="course.course_id"
            />
          </el-select>
        </div>
        <div class="suggested-tags-container">
          <p class="suggestions-title">Try searching for<br></p> 
          <button
            v-for="term in suggestedTerms"
            :key="term"
            class="suggestion-pill-button"
            @click="searchWithSuggestedTerm(term)"
          >
            {{ term }}
          </button>
        </div>
      </div>

      <div v-if="hasSearched" class="search-controls-toolbar">
        <div class="results-count">
          Found {{ groupedResults.length }} groups of results
        </div>
        <div class="right-controls">
          <el-tabs v-model="activeTab" class="search-tabs">
            <el-tab-pane label="All" name="all"></el-tab-pane>
            <el-tab-pane label="Videos" name="video"></el-tab-pane>
            <el-tab-pane label="Slides" name="resource"></el-tab-pane>
          </el-tabs>
          
          <el-dropdown @command="handleSortCommand" trigger="click" class="sort-by-dropdown">
            <span class="el-dropdown-link">
              {{ sortByLabel }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="relevance">Sort by Relevance</el-dropdown-item>
                <el-dropdown-item command="chronological">Sort by Course Order</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

        </div>
      </div>

      <div v-if="hasSearched" class="results-display-area" v-loading="isLoading">
        <div v-if="paginatedResults.length > 0" class="results-list">
            <div v-for="group in paginatedResults" :key="group.key" class="result-group-wrapper">
                <div class="search-result-card">
                  <div class="card-inner-content">
                    <div class="clickable-preview" @click="handlePreviewClick(group)">
                      <div class="media-preview-area">
                        <img v-if="group.previewImage" :src="group.previewImage" alt="Preview" class="preview-thumbnail">
                        <div v-else class="preview-placeholder"><el-icon><Picture /></el-icon></div>
                        <el-icon v-if="group.type === 'Video'" class="play-icon-overlay"><VideoPlay /></el-icon>
                      </div>
                    </div>
                    <div class="info-details-area">
                      <p class="result-group-title">{{ group.title }}</p>
                      <p class="result-group-source">{{ group.source }}</p>
                      <div class="matching-segments-list">
                        <template v-for="(child, index) in group.children" :key="child.id">
                          <a v-if="expandedGroups.has(group.key) || index < 1" @click="navigateToCourseDetail(group, child)" class="segment-link">
                            <span class="segment-context">[ {{ group.type === 'Video' ? child.timestamp : `Page ${String(child.page).padStart(2, '0')}` }} ]</span>
                            <div class="snippet-wrapper">
                              <span class="segment-snippet" v-html="highlight(child.snippet, searchQuery)"></span>
                            </div>
                          </a>
                        </template>
                        <div v-if="!expandedGroups.has(group.key) && group.children.length > 1" class="show-more-button" @click="expandedGroups.add(group.key)">
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

      <div v-if="!hasSearched" class="welcome-area animated-welcome">
  <h2>Knowledge Exploration Starts Now</h2>
  <p>Find any concept instantly within your courses</p>
</div>

      <div v-if="hasSearched && groupedResults.length > pageSize" class="pagination-area">
        <el-pagination background layout="prev, pager, next" :total="groupedResults.length" :page-size="pageSize" v-model:current-page="currentPage"/>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ======================================================================= */
/* 整体页面和原有样式 */
/* ======================================================================= */
.search-page-container {
  max-width: 900px; margin: 0 auto; padding: 20px; font-family: sans-serif;
}
.state-feedback { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 50vh; text-align: center; }
.state-feedback h2 { margin-bottom: 8px; color: #303133; }
.state-feedback p { color: #606266; }
.state-feedback.error h2 { color: #f56c6c; }
.results-display-area { min-height: 400px; }
.results-count { font-size: 14px; color: #606266; }
.pagination-area { display: flex; justify-content: center; margin-top: 30px; }

/* 搜索结果卡片样式 - 保持不变 */
.search-result-card { border: 1px solid #e4e7ed; border-radius: 12px; margin-bottom: 20px; overflow: hidden; background-color: #fff; box-shadow: 0 4px 16px rgba(0,0,0,0.05); transition: box-shadow 0.2s, transform 0.2s; }
.search-result-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); transform: translateY(-4px); }
.card-inner-content { display: flex; align-items: flex-start; width: 100%; padding: 20px; box-sizing: border-box; }
.clickable-preview { cursor: pointer; }
.media-preview-area { position: relative; flex-shrink: 0; width: 200px; height: 112px; background-color: #f0f2f5; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-right: 20px; border-radius: 8px; }
.preview-thumbnail { width: 100%; height: 100%; object-fit: cover; }
.preview-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: #f5f7fa; color: #c0c4cc; font-size: 40px; }
.play-icon-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: rgba(255, 255, 255, 0.8); font-size: 50px; text-shadow: 0 0 8px rgba(0,0,0,0.5); pointer-events: none; }
.info-details-area { flex-grow: 1; overflow: hidden; }
.result-group-title { font-size: 18px; font-weight: 600; margin: 0 0 5px 0; color: #303133; }
.result-group-source { font-size: 13px; color: #909399; margin: 0 0 15px 0; }
.matching-segments-list { max-height: none; overflow-y: visible; border-top: none; padding-top: 0; margin-top: 10px; }
.segment-link { display: flex; align-items: flex-start; padding: 8px 5px; line-height: 1.6; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; }
.segment-link:hover { background-color: #f5f7fa; }
.segment-context { font-weight: 500; color: #3b82f6; margin-right: 12px; font-family: monospace; white-space: nowrap; flex-shrink: 0; }
.snippet-wrapper { flex-grow: 1; min-width: 0; }
.segment-snippet { color: #606266; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
:deep(.highlight) { background-color: #dbeafe; color: #1e40af; font-weight: bold; padding: 2px 0; border-radius: 2px; }
.show-more-button { color: #3b82f6; font-size: 13px; font-weight: 500; cursor: pointer; padding: 8px 8px 4px; border-top: 1px solid #f0f2f5; margin-top: -4px; transition: background-color 0.2s; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; }
.show-more-button:hover { background-color: #f5f7fa; }

/* ======================================================================= */
/* ↓↓↓ 蓝色主题与新布局样式 ↓↓↓                 */
/* ======================================================================= */

/* 1. 搜索模块总容器 */
.search-module-container {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
  padding: 24px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 40px; margin-bottom: 32px;
  box-shadow: 0 8px 32px 0 rgba(59, 130, 246, 0.1);
}

/* 2. 搜索行容器 */
.search-bar-group { display: flex; gap: 12px; margin-bottom: 16px; }

/* 3. 主搜索框样式 */
.main-search-input { flex-grow: 1; }
.main-search-input :deep(.el-input__wrapper) {
  border-radius: 12px !important; box-shadow: none !important; border: 1px solid #dcdfe6; height: 40px;
}
.main-search-input :deep(.el-input__wrapper.is-focus) { border-color: #3b82f6; }

/* 4. 搜索图标按钮样式 */
.search-icon-button {
  width: 40px; height: 40px; border-radius: 12px !important;
  background-color: #3b82f6; border-color: #3b82f6;
  font-size: 20px; flex-shrink: 0;
}
.search-icon-button:hover { background-color: #2563eb; border-color: #2563eb; }

/* 5. 课程选择器下拉框样式 */
.course-selector-dropdown { width: 280px; flex-shrink: 0; }
.course-selector-dropdown :deep(.el-input__wrapper) {
  border-radius: 12px !important; box-shadow: none !important; border: 1px solid #dcdfe6; height: 40px;
}
.course-selector-dropdown :deep(.el-input__wrapper.is-focus) { border-color: #3b82f6; }

/* 6. 建议词标签容器 */
.suggested-tags-container { display: flex; flex-wrap: wrap; gap: 12px; }

/* 7. 胶囊按钮样式 */
.suggestion-pill-button {
  border: none; border-radius: 999px; padding: 8px 18px; font-size: 14px; font-weight: 500;
  color: white; background-color: rgba(59, 130, 246, 0.8);
  cursor: pointer; transition: background-color 0.2s ease;
}
.suggestion-pill-button:hover { background-color: #3b82f6; }

/* 8. 下方工具栏样式 */
.search-controls-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; padding: 0 8px;
}
.right-controls { display: flex; align-items: center; }

/* 9. Tabs样式 */
.search-controls-toolbar :deep(.el-tabs__header) { margin: 0; }
.search-controls-toolbar :deep(.el-tabs__nav-wrap::after) { display: none; }
.search-controls-toolbar :deep(.el-tabs__item) { font-size: 14px; color: #606266; }
.search-controls-toolbar :deep(.el-tabs__item.is-active) { color: #3b82f6; }
.search-controls-toolbar :deep(.el-tabs__active-bar) { background-color: #3b82f6; }

/* 10. Dropdown 下拉菜单样式 */
.sort-by-dropdown {
  margin-left: 24px;
  cursor: pointer;
}
.el-dropdown-link {
  display: flex;
  align-items: center;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}
.el-dropdown-link:hover {
  color: #3b82f6;
}

.suggestions-title {
  color: #606266; /* 使用柔和的文字颜色 */
  font-size: 13px;
  font-weight: 500;
  margin: 0;
  /* 让标题和第一个标签在垂直方向上对齐 */
  display: flex;
  align-items: center;
}

/* 欢迎 */
.welcome-area {
  text-align: center;
  padding: 80px 20px;
  color: #606266;
}
.welcome-area h2 {
  font-size: 28px;
  font-weight: 600;
  color: #0a2e78;
  margin-bottom: 16px;
}
.welcome-area p {
  font-size: 16px;
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.6;
}

/* 动画 */
.animated-welcome h2,
.animated-welcome p {
  /* 动画开始前，元素是透明的 */
  opacity: 0;
  /* 应用动画：动画名 持续时间 动画结束时保持最后状态 缓动函数 */
  animation: fadeInSlideUp 0.7s forwards ease-out;
}

/* 让第二句话的动画延迟一点出现，更有层次感 */
.animated-welcome p {
  animation-delay: 0.2s;
}

/* 定义动画的关键帧 */
@keyframes fadeInSlideUp {
  from {
    opacity: 0;
    transform: translateY(15px); /* 从下方15px处开始 */
  }
  to {
    opacity: 1;
    transform: translateY(0); /* 移动到原始位置 */
  }
}
</style>