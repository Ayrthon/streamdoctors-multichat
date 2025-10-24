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
    preset: 'netlify',
    // prerender: {
    //   crawlLinks: false,
    //   routes: ['/', '/200.html', '/404.html'],
    //   ignore: ['/chatview', '/login', '/dashboard', '/auth'], ok
    // },
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
    // ❌ server-only secrets
    jwtSecret: process.env.JWT_SECRET,
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,

    // ✅ public, safe for client bundle
    public: {
      firebase: {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID,
      },
      youtubeApiKey: process.env.YOUTUBE_API_KEY,
    },
  },
})
