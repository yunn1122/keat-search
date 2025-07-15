import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

//ElemetnPlus按需导入配置
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      // 当请求以 /api 开头时，代理到目标地址
      '/api': {
        target: 'http://46.101.49.168', //  Keats API 真实地址
        changeOrigin: true, // 改变源，让目标服务器认为请求来自它自己
        rewrite: (path) => path.replace(/^\/api/, ''), // 重写路径，去除 /api 前缀
      },
    },
  },
})
