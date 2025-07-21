import { defineStore } from 'pinia'

export const useSessionStore = defineStore('session', {
  // state: 定义需要全局管理的数据
  state: () => ({
    startTime: null,        // 会话开始时间
    //actionCount: 0,         // 用户操作（如搜索）的次数
    searchCount: 0,
    searches: [], // 这个数组将记录每一次搜索的关键词和时间
    hasBeenPrompted: false, // 是否已经弹出过问卷
  }),

  // getters: 算出总互动时长
  getters: {
    interactionSeconds: (state) => {
      if (!state.startTime) {
        return 0;
      }
      // 返回从会话开始到现在的总秒数
      return Math.round((Date.now() - state.startTime) / 1000);
    },
  },

  // actions: 定义修改 state 的方法
  actions: {
    startSession() {
      if (!this.startTime) {
        this.startTime = Date.now();
        console.log('Pinia session started at:', this.startTime);
      }
    },
    recordSearch(keyword) {
      if (!keyword) return; // 如果搜索词为空则不记录

      this.searchCount++;
      this.searches.push({
        term: keyword,
        timestamp: new Date().toISOString(), // 记录搜索发生的精确时间
      });
      console.log('Pinia search recorded:', this.searches);
    },
    setPrompted() {
      this.hasBeenPrompted = true;
      console.log('Pinia hasBeenPrompted set to true.');
    },
  },

  // persist: 开启数据持久化，这样刷新页面后数据依然存在
  persist: true,
})