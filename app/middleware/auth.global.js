// app/middleware/auth.global.js
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server || to.path.startsWith('/api')) return

  const { user, role } = useAuthState()

  // 👇 Make sure we allow querystring variants like /chatview?token=...
  const publicPaths = ['/', '/no-access', '/chatview']
  const isPublic = publicPaths.some((p) => to.path.startsWith(p))

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
