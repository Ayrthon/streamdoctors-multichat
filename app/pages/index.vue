<template>
  <v-app>
    <v-main class="d-flex align-center justify-center" style="height: 100vh">
      <v-container class="text-center">
        <!-- <img class="pb-5" src="/images/cropped-streamdoctors-logo_wit.png" /> -->
        <v-btn color="primary" @click="loginWithGoogle">Sign in with Google</v-btn>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { signInWithPopup } from 'firebase/auth'

definePageMeta({ layout: 'login' })

const { $auth, $provider } = useNuxtApp()

const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup($auth, $provider)
    const user = result.user
    console.log('Logged in:', user.displayName, user.email)
    alert(`Welcome, ${user.displayName}!`)
  } catch (err) {
    console.error('Google login failed:', err)
    alert('Login failed, please try again.')
  }
}
</script>
