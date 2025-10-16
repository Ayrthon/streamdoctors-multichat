export default defineNuxtRouteMiddleware((to) => {
  // ✅ Skip middleware entirely for server and API routes
  if (process.server || to.path.startsWith('/api')) return

  const { user, role } = useAuthState()

  const publicPaths = ['/', '/no-access']
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
