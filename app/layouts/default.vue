<template>
  <v-layout class="rounded rounded-md border">
    <v-app-bar elevation="0">
      <img class="pa-5" src="/images/cropped-streamdoctors-logo_wit.png" width="240" />
      <div class="mt-2">MultiChat v0.2</div>
    </v-app-bar>
    <v-navigation-drawer expand-on-hover permanent rail>
      <v-list>
        <v-list-item
          prepend-avatar="https://randomuser.me/api/portraits/men/13.jpg"
          subtitle="ayrthon@streamdoctors.com"
          title="Ayrthon"
        ></v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          prepend-icon="mdi-folder"
          title="Projects"
          value="projects"
          to="/projects"
        ></v-list-item>
        <v-list-item prepend-icon="mdi-account-multiple" title="Users" value="shared"></v-list-item>
        <v-list-item prepend-icon="mdi-cog" title="Settings" value="starred"></v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <NuxtPage />
    </v-main>
    <v-main class="d-flex align-center justify-center"></v-main>
  </v-layout>
</template>

<script lang="ts" setup></script>

<style></style>
