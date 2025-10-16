export default defineNuxtRouteMiddleware((to) => {
  const { user } = useAuthState()

  // Redirect logged-out users trying to access protected page
  if (!user.value && to.path === '/projects') {
    return navigateTo('/')
  }

  // Redirect logged-in users away from login page
  if (user.value && to.path === '/') {
    return navigateTo('/projects')
  }
})
