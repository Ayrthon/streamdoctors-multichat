<template>
  <v-app>
    <v-main class="d-flex align-center justify-center" style="height: 100vh">
      <v-container class="d-flex flex-column justify-center" width="400">
        <img class="pb-5" src="/images/cropped-streamdoctors-logo_wit.png" />
        <v-btn color="primary" to="/projects">Login</v-btn>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'login',
})
</script>

<style></style>
