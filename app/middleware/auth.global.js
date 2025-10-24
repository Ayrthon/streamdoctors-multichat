// app/middleware/auth.global.js
export default defineNuxtRouteMiddleware((to) => {
  // Skip SSR or API routes
  if (import.meta.server || to.path.startsWith('/api')) return

  // 👇 Skip middleware completely for chatview (static token-based page)
  if (to.path.startsWith('/chatview')) return

  // Access auth state
  const { user, role } = useAuthState()

  const publicPaths = ['/', '/no-access']
  const isPublic = publicPaths.includes(to.path)

  // ⚠️ Prevent early redirects during hydration (Firebase static mode)
  if (process.client && user.value === undefined) {
    console.debug('[auth.global] Skipping redirect until auth hydrates')
    return
  }

  // 🚫 Not logged in → redirect to /
  if (!user.value && !isPublic) {
    return navigateTo('/')
  }

  // 🚫 Logged in but pending → redirect to no-access
  if (user.value && role.value === 'pending' && to.path !== '/no-access') {
    return navigateTo('/no-access')
  }

  // 🚫 Logged in → visiting login page → redirect to /projects
  if (user.value && to.path === '/') {
    return navigateTo('/projects')
  }
})
