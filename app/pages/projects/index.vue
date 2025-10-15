<template>
  <div class="pa-4">
    <div class="pb-4">
      <v-toolbar>
        <v-toolbar-title text="Projects"></v-toolbar-title>
        <template v-slot:append>
          <v-btn icon="mdi-plus"></v-btn>
        </template>
      </v-toolbar>
    </div>

    <div class="d-flex ga-4">
      <v-card
        elevation="16"
        variant="tonal"
        width="350"
        class="d-flex flex-column justify-space-between"
      >
        <v-card-title>Samsung Hangout</v-card-title>
        <v-card-text>
          <v-icon color="red">mdi-youtube</v-icon> SamsungNederland
          <v-chip color="success">connected <span class="status-dot"></span></v-chip><br />
          <v-icon color="red">mdi-youtube</v-icon> SamsungBelgium
          <v-chip color="success">connected <span class="status-dot"></span></v-chip><br />
          <v-icon>mdi-alpha-t</v-icon> SamsungNederland <v-chip color="error">disconnected</v-chip
          ><br />
          <v-icon>mdi-alpha-t</v-icon> SamsungBelgium
          <v-chip color="error">disconnected</v-chip>
        </v-card-text>
        <v-card-actions class="mt-auto">
          <v-btn
            append-icon="mdi-chevron-right"
            color="primary"
            text="Open project"
            variant="outlined"
            block
          ></v-btn>
        </v-card-actions>
      </v-card>

      <v-card
        elevation="16"
        variant="tonal"
        width="350"
        class="d-flex flex-column justify-space-between"
      >
        <v-card-title>HEMA</v-card-title>
        <v-card-text>
          <v-icon color="red">mdi-youtube</v-icon> Hema
          <v-chip color="success">connected <span class="status-dot"></span></v-chip><br />
          <v-icon>mdi-alpha-t</v-icon> Hema
          <v-chip color="success">connected <span class="status-dot"></span></v-chip><br />
          <v-icon color="purple">mdi-instagram</v-icon> Hema
          <v-chip color="error">disconnected</v-chip>
        </v-card-text>
        <v-card-actions class="mt-auto">
          <v-btn
            append-icon="mdi-chevron-right"
            color="primary"
            text="Open project"
            variant="outlined"
            block
          ></v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts" setup></script>

<style scoped>
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #22c55e;
  margin-left: 8px;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.9);
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
  }
  100% {
    transform: scale(0.9);
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}
</style>
