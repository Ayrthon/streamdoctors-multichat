import { defineNuxtConfig } from 'nuxt/config'

import vuetify from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  build: {
    transpile: ['vuetify'],
  },

  nitro: {
    preset: 'static',

    // 🔒 Prevent Nuxt from prerendering Firebase-dependent routes
    prerender: {
      crawlLinks: true,
      // Add the routes you want to statically render
      routes: ['/'],
      // Skip anything using Firebase client code
      ignore: ['/login', '/dashboard'],
    },
  },

  vite: {
    ssr: {
      noExternal: ['vuetify'],
    },
    plugins: [vuetify()],
  },
})
