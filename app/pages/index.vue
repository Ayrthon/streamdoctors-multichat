<template>
  <v-app>
    <v-main class="d-flex align-center justify-center" style="height: 100vh">
      <v-container class="d-flex flex-column justify-center" width="400">
        <img class="pb-5" src="/images/cropped-streamdoctors-logo_wit.png" />
        <v-btn color="primary" to="/projects">Login</v-btn>
      </v-container>

      <div class="flex min-h-screen flex-col items-center justify-center">
        <h1 class="mb-4 text-xl">Login</h1>
        <input v-model="email" placeholder="Email" class="mb-2 border p-2" />
        <input v-model="password" placeholder="Password" type="password" class="mb-2 border p-2" />
        <button @click="login" class="rounded bg-blue-500 px-4 py-2 text-white">Login</button>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { onMounted, ref } from 'vue'

import { signInWithEmailAndPassword } from 'firebase/auth'

// ✅ Page meta (layout)
definePageMeta({
  layout: 'login',
})

const email = ref('')
const password = ref('')
let auth = null

// ✅ Wait until client is ready before using Firebase
onMounted(() => {
  const nuxtApp = useNuxtApp()
  auth = nuxtApp.$auth
})

async function login() {
  if (!auth) return alert('Firebase not ready yet.')
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    alert('Logged in!')
  } catch (error) {
    console.error(error)
    alert('Login failed!')
  }
}
</script>

<style></style>
