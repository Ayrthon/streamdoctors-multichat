import { defineNuxtConfig } from 'nuxt/config'

import vuetify from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  compatibilityDate: '2025-10-16',
  srcDir: 'app/',
  devtools: { enabled: false },
  build: {
    transpile: ['vuetify'],
  },
  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: false,
      routes: ['/', '/200.html', '/404.html'],
      ignore: ['/login', '/dashboard', '/auth'],
    },
  },
  serveStaticFallback: true,
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
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET,
    youtubeApiKey: process.env.YOUTUBE_API_KEY,
  },
})
