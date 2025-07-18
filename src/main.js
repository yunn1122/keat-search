import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'

const app = createApp(App)

const pinia = createPinia() // 将 createPinia() 赋值给一个变量

pinia.use(piniaPluginPersistedstate) // 使用插件

app.use(createPinia())
app.use(router)

app.mount('#app')
