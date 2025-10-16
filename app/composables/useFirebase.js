export const useFirebase = async () => {
  let app, auth, firestore, provider
  let retries = 0

  // Retry until plugin injects (up to ~2s)
  while (retries < 20) {
    const nuxtApp = useNuxtApp()
    app = nuxtApp.$firebase || nuxtApp.firebase
    auth = nuxtApp.$auth || nuxtApp.auth
    firestore = nuxtApp.$firestore || nuxtApp.firestore
    provider = nuxtApp.$provider || nuxtApp.provider

    if (firestore) break

    await new Promise((resolve) => setTimeout(resolve, 100))
    retries++
  }

  if (!firestore) {
    console.error('[useFirebase] Firestore still not available after waiting.')
  } else {
    console.log('[useFirebase] Ready ✅')
  }

  return { app, auth, firestore, provider }
}
