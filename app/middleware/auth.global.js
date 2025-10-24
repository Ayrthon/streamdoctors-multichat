// app/middleware/auth.global.js
export default defineNuxtRouteMiddleware((to) => {
  // SSR & API: skip
  if (import.meta.server || to.path.startsWith('/api')) return

  // ✅ HARD BYPASS for /chatview even if Nuxt hasn't hydrated the route yet
  if (process.client) {
    const rawPath = window.location.pathname || ''
    if (rawPath.startsWith('/chatview')) return
  }
  // Also bypass once Nuxt router catches up
  if (to.path.startsWith('/chatview')) return

  // Now safe to read auth
  const { user, role } = useAuthState()

  // On static hosting, user can be undefined for a tick — don't redirect yet
  if (process.client && typeof user.value === 'undefined') return

  const isPublic = to.path === '/' || to.path === '/no-access'

  if (!user.value && !isPublic) {
    return navigateTo('/')
  }

  if (user.value && role.value === 'pending' && to.path !== '/no-access') {
    return navigateTo('/no-access')
  }

  if (user.value && to.path === '/') {
    return navigateTo('/projects')
  }
})
