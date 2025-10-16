// app/middleware/auth.global.js
export default defineNuxtRouteMiddleware((to) => {
  const { user, role } = useAuthState()

  // Public routes — always allow
  const publicPaths = ['/', '/no-access']
  const isPublic = publicPaths.includes(to.path)

  // 🧭 Not logged in → redirect away from protected pages
  if (!user.value && !isPublic) {
    return navigateTo('/')
  }

  // ⚠️ Logged in but pending → redirect to no-access
  // if (user.value && role.value === 'pending' && to.path !== '/no-access') {
  //   return navigateTo('/no-access')
  // }

  // ✅ Logged in and visiting login page → redirect to projects
  if (user.value && to.path === '/') {
    return navigateTo('/projects')
  }
})
