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
definePageMeta({
  layout: 'login',
})
</script>

<script>
import { signInWithEmailAndPassword } from 'firebase/auth'

const { $auth } = useNuxtApp()
await signInWithEmailAndPassword($auth, email.value, password.value)

async function login() {
  try {
    await signInWithEmailAndPassword($auth, email.value, password.value)
    alert('Logged in!')
  } catch (e) {
    console.error(e)
    alert('Login failed!')
  }
}
</script>

<style></style>
