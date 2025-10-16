// app/middleware/auth.global.js
export default defineNuxtRouteMiddleware((to) => {
  // ✅ Skip during SSR rendering or when navigating to API-like paths
  if (import.meta.server || to.path.startsWith('/api')) return

  const { user, role } = useAuthState()

  // 👇 include chatview here
  const publicPaths = ['/', '/no-access', '/chatview']
  const isPublic = publicPaths.includes(to.path)

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
