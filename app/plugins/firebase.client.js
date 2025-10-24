// app/plugins/firebase.client.js
import { getApp, getApps, initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export default defineNuxtPlugin((nuxtApp) => {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }

  // ✅ Prevent duplicate initialization
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

  const auth = getAuth(app)
  const firestore = getFirestore(app)
  const provider = new GoogleAuthProvider()

  // 👇 Force account chooser every time
  provider.setCustomParameters({ prompt: 'select_account' })

  console.log('✅ Firebase plugin initialized in Nuxt:', { app, auth, firestore })

  // ✅ Provide globally to all composables/stores
  nuxtApp.provide('firebase', app)
  nuxtApp.provide('auth', auth)
  console.log('[useNuxtApp() contents]', Object.keys(useNuxtApp()))
  console.log('[firestore]', firestore)
  nuxtApp.provide('firestore', firestore)

  nuxtApp.provide('provider', provider)
})
