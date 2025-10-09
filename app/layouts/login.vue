<template>
  <v-app>
    <v-main class="login-layout">
      <slot />
    </v-main>
  </v-app>
</template>

<style scoped>
.login-layout {
  background: linear-gradient(135deg, #1e1e1e, #121212);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
