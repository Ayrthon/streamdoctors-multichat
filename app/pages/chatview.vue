<template>
  <div class="chat-overlay">
    <h2 v-if="error" class="error">{{ error }}</h2>
    <div v-else-if="projectId">
      <p>Authenticated for project: {{ projectId }}</p>
      <!-- your chat rendering goes here -->
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const projectId = ref(null)
const error = ref(null)

onMounted(async () => {
  try {
    const res = await $fetch('/api/verify', { params: { token: route.query.token } })
    projectId.value = res.projectId
  } catch (err) {
    error.value = err.data?.message || 'Access denied'
  }
})
</script>

<style scoped>
.chat-overlay {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem;
  font-family: sans-serif;
  height: 100vh;
}
.error {
  color: red;
}
</style>
