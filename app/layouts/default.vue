<template>
  <v-layout class="rounded rounded-md border">
    <v-app-bar title="Streamdoctors Multichat"></v-app-bar>
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
        <v-list-item prepend-icon="mdi-folder" title="My Files" value="myfiles"></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-multiple"
          title="Shared with me"
          value="shared"
        ></v-list-item>
        <v-list-item prepend-icon="mdi-star" title="Starred" value="starred"></v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main class="d-flex align-center justify-center"></v-main>
  </v-layout>
</template>

<script lang="ts" setup></script>

<style></style>
