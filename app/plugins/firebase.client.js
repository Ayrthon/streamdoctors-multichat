// app/plugins/firebase.client.js
import { getApp, getApps, initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export default defineNuxtPlugin((nuxtApp) => {
  // 🔒 Load public runtime config (safe for client use)
  const config = useRuntimeConfig()
  const firebaseConfig = config.public.firebase

  if (!firebaseConfig?.apiKey) {
    console.error('❌ Firebase config missing in runtimeConfig.public.firebase')
    return
  }

  // ✅ Prevent duplicate initialization
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

  const auth = getAuth(app)
  const firestore = getFirestore(app)
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  console.log('✅ Firebase initialized in Nuxt', firebaseConfig.projectId)

  nuxtApp.provide('firebase', app)
  nuxtApp.provide('auth', auth)
  nuxtApp.provide('firestore', firestore)
  nuxtApp.provide('provider', provider)
})
