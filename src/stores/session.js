import { defineStore } from 'pinia'

export const useSessionStore = defineStore('session', {
  // state: 定义需要全局管理的数据
  state: () => ({
    startTime: null,        // 会话开始时间
    actionCount: 0,         // 用户操作（如搜索）的次数
    hasBeenPrompted: false, // 是否已经弹出过问卷
  }),

  // actions: 定义修改 state 的方法
  actions: {
    startSession() {
      if (!this.startTime) {
        this.startTime = Date.now();
        console.log('Pinia session started at:', this.startTime);
      }
    },
    incrementActionCount() {
      this.actionCount++;
      console.log('Pinia action count:', this.actionCount);
    },
    setPrompted() {
      this.hasBeenPrompted = true;
      console.log('Pinia hasBeenPrompted set to true.');
    },
  },

  // persist: 开启数据持久化，这样刷新页面后数据依然存在
  persist: true,
})