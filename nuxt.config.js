import { defineNuxtConfig } from 'nuxt/config'

import vuetify from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  srcDir: 'app/',
  compatibilityDate: '2025-10-16',
  build: {
    transpile: ['vuetify'],
  },

  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: false, // 🔒 stops Nuxt from auto-visiting pages that might import Firebase
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
