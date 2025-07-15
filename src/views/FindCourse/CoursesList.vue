<template>
  <div class="courses-page">
    <!-- <h1 class="page-title">Explore Courses</h1> -->

    <div v-if="isLoading" class="loading-state">
      <p>Loading courses...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>Failed to load courses</p>
      <p class="error-message">{{ error }}</p>
    </div>

    <div v-else>
      <div class="hero-section">
      <div class="page-header">
        <h1 class="page-title">Explore Our Courses</h1>
        <p class="page-description">Find your next learning adventure.</p>
      </div>

      <div class="search-bar-container">
        <el-input
          v-model="searchQuery"
          placeholder="Search courses by name or ID..."
          clearable
          @keyup.enter="filterCourses"  
          size="large"
          :prefix-icon="Search"
          class="input-with-button"
        >
          <template #append>
            <el-button :icon="Search" @click="filterCourses">Search</el-button>
          </template>
        </el-input>
      </div>

      </div>

      <div v-if="filteredCourses.length === 0" class="no-results-state">
        <p>No courses found matching your criteria.</p>
      </div>
      
      <div v-else class="course-grid">
        <el-card
          v-for="course in filteredCourses"
          :key="course.course_id"
          class="course-card"
          shadow="hover"
          @click="goToCourseDetail(course.course_id)"
        >
          <div class="course-image-container">
            <img v-if="course.thumbnail_url" :src="course.thumbnail_url" class="course-thumbnail" alt="Course thumbnail"/>
            <div v-else class="course-image-placeholder">
              <el-icon :size="60" color="#409EFF"><Collection /></el-icon>
            </div>
          </div>
          <div class="card-content">
            <div class="course-title">{{ course.course_title }}</div>
            <div class="course-id">{{ course.course_id }}</div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';


// --- API Configuration ---
const API_BASE_URL = '/api'; 

// --- State Management ---
const courses = ref([]);
const filteredCourses = ref([]);
const searchQuery = ref('');
const isLoading = ref(true);
const error = ref(null);
const router = useRouter();

// --- API Calls ---

/**
 * Fetches the thumbnail URL for lecture_id=1 of a given course.
 * @param {string} courseId - The ID of the course.
 * @returns {Promise<string|null>} The thumbnail URL or null if not found.
 */
const fetchLecture1Thumbnail = async (courseId) => {
  try {
    // --- ✅ MODIFIED LOGIC ---
    // Directly get files for lecture "1", without fetching all lectures first.
    const filesResponse = await fetch(`${API_BASE_URL}/files?course=${courseId}&lecture=1`);
    
    // If lecture "1" doesn't exist for this course, API will likely return 404.
    // The 'ok' check handles this gracefully.
    if (!filesResponse.ok) return null;
    const filesData = await filesResponse.json();

    const lectureFiles = filesData[0]?.files;
    if (!lectureFiles || lectureFiles.length === 0) return null;

    // Find the first file with a thumbnail URL
    const fileWithThumbnail = lectureFiles.find(file => file.thumbnail_url);
    if (!fileWithThumbnail || !fileWithThumbnail.thumbnail_url) {
        return null;
    }

    // Handle relative vs absolute URLs
    let finalUrl = fileWithThumbnail.thumbnail_url;
    if (!finalUrl.startsWith('http')) {
      finalUrl = `${API_BASE_URL}/${finalUrl}`;
    }
    
    return finalUrl;

  } catch (e) {
    // This will catch network errors or JSON parsing errors.
    console.error(`Failed to fetch thumbnail for course ${courseId}, lecture 1:`, e);
    return null;
  }
};


/**
 * Fetches all courses and then enriches them with thumbnail URLs from lecture 1.
 */
const fetchCoursesAndThumbnails = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    // 1. Fetch the initial list of courses
    const response = await fetch(`${API_BASE_URL}/courses`);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const coursesData = await response.json();

    // 2. Fetch thumbnails for all courses in parallel
    const coursesWithThumbnails = await Promise.all(
      coursesData.map(async (course) => {
        // Use the new, more direct function
        const thumbnailUrl = await fetchLecture1Thumbnail(course.course_id);
        return {
          ...course,
          thumbnail_url: thumbnailUrl,
        };
      })
    );
    
    courses.value = coursesWithThumbnails;
    filterCourses();

  } catch (e) {
    console.error('Failed to fetch courses:', e);
    error.value = e.message;
  } finally {
    isLoading.value = false;
  }
};


// --- Local Logic ---
const filterCourses = () => {
  if (!searchQuery.value) {
    filteredCourses.value = courses.value;
  } else {
    const query = searchQuery.value.toLowerCase();
    filteredCourses.value = courses.value.filter(course =>
      course.course_title.toLowerCase().includes(query) ||
      course.course_id.toLowerCase().includes(query)
    );
  }
};

// --- Navigation ---
const goToCourseDetail = (courseId) => {
  router.push({ name: 'CourseDetail', params: { id: courseId } });
};

// --- Lifecycle Hook ---
onMounted(() => {
  const route = useRoute(); 
  const queryFromUrl = route.query.q;

  if (queryFromUrl) {
    searchQuery.value = queryFromUrl;
  }

  fetchCoursesAndThumbnails();
});
</script>

<style scoped>
/* Styles remain the same */
.courses-page {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: sans-serif;
}

.page-title {
  text-align: center;
  font-size: 32px;
  color: #303133;
  margin-bottom: 30px;
}

.search-bar-container {
  max-width: 600px;
  margin: 10px auto 0 auto;
}

.loading-state, .error-state, .no-results-state {
  text-align: center;
  font-size: 18px;
  color: #909399;
  padding: 50px 0;
}

.error-state .error-message {
  color: #F56C6C;
  font-size: 14px;
  margin-top: 5px;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
}

.course-card {
  width: 100%;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.course-image-container {
  width: 100%;
  height: 160px;
  background-color: #f0f2f5;
  border-bottom: 1px solid #ebeef5;
}

.course-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.course-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-content {
  padding: 15px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.course-title {
  font-size: 17px;
  font-weight: bold;
  color: #1f2c49;
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 8px;
}

.course-id {
  font-size: 14px;
  color: #657eb3;
  font-weight:700;
}

.page-header {
  text-align: center; 
  padding: 20px 20px 5px; 
}
.page-title {
  font-size: 36px; /* 更大的主标题字体 */
  font-weight: bold;
  color: #1c2d4e;
  margin-bottom: 12px;
}
.page-description {
  font-size: 16px;
  color: #7b869e;
  max-width: 500px;
  margin: 0 auto; 
  font-weight: 500;
  
}

.hero-section {
  padding: 60px 0;
  text-align: center;
  width: 100%;
  background: linear-gradient(to bottom, #d6e8fb, #fff);
}
</style>