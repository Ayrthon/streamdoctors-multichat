import { defineNuxtConfig } from 'nuxt/config'

import vuetify from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  srcDir: 'app/',
  scanDirs: ['app/server'],
  compatibilityDate: '2025-10-16',
  build: {
    transpile: ['vuetify'],
  },
  nitro: {
    preset: 'node',
    serverDir: 'app/server', // ✅ tell Nitro where to find your API handlers
    prerender: {
      crawlLinks: false,
      routes: ['/', '/200.html', '/404.html'],
      ignore: ['/login', '/dashboard', '/auth'],
    },
  },
  vite: {
    ssr: {
      noExternal: ['vuetify'],
    },
    plugins: [vuetify()],
  },
  imports: {
    dirs: ['app/composables', 'app/middleware'],
  },
  modules: ['@pinia/nuxt'],
  pinia: {
    autoImports: ['defineStore', 'storeToRefs'],
  },
})
