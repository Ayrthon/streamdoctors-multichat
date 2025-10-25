<template>
  <v-app>
    <v-main class="d-flex flex-column align-center justify-center" style="height: 100vh">
      <img class="pb-5" src="/images/cropped-streamdoctors-logo_wit.png" />
      <span class="mb-15">Multichat (beta)</span>
      <v-container class="text-center">
        <v-btn
          color="white"
          class="font-weight-black"
          prepend-icon="mdi-google"
          @click="loginWithGoogle"
          >Login with Google</v-btn
        >
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { signInWithPopup } from 'firebase/auth'

export default {
  setup() {
    definePageMeta({ layout: 'login' })

    const { $auth, $provider } = useNuxtApp()
    const router = useRouter()
    const { user } = useAuthState()

    const loginWithGoogle = async () => {
      try {
        const result = await signInWithPopup($auth, $provider)
        const loggedInUser = result.user
        console.log('Logged in:', loggedInUser.displayName)

        // Immediately update our state
        user.value = loggedInUser

        // Redirect to projects
        router.push('/projects')
      } catch (err) {
        console.error('Google login failed:', err)
        alert('Login failed, please try again.')
      }
    }

    // If already logged in, skip login page
    watchEffect(() => {
      if (user.value) {
        router.push('/projects')
      }
    })

    return { loginWithGoogle }
  },
}
</script>
