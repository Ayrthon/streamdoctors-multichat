<template>
  <div class="pa-4">
    <!-- Pending users -->
    <v-chip v-if="role === 'pending'" color="warning">
      Waiting for Admin to give you access.
    </v-chip>

    <!-- Only visible for admin or client -->
    <div v-else-if="role === 'admin' || role === 'client'">
      <div class="pb-4">
        <v-toolbar>
          <v-toolbar-title>Projects</v-toolbar-title>
          <template #append>
            <v-btn icon="mdi-plus" @click="dialog = true" />
          </template>
        </v-toolbar>
      </div>

      <!-- Loading indicator -->
      <v-progress-linear v-if="projectsStore.loading" indeterminate color="primary" class="mb-4" />

      <!-- Projects grid -->
      <div class="d-flex ga-4 flex-wrap">
        <v-card
          v-for="project in projectsStore.projects"
          :key="project.id"
          elevation="12"
          variant="tonal"
          width="350"
          class="d-flex flex-column justify-space-between"
        >
          <v-card-title>{{ project.name }}</v-card-title>

          <v-card-text>
            <div v-if="!project.platforms || project.platforms.length === 0">
              <v-chip color="error">No platforms yet</v-chip>
            </div>

            <div v-else>
              <div v-for="(platform, index) in project.platforms" :key="index" class="mb-1">
                <v-icon :color="iconColor(platform.type)" class="mr-1">{{
                  iconFor(platform.type)
                }}</v-icon>
                {{ platform.username }}
                <v-chip size="small" :color="platform.connected ? 'success' : 'error'" class="ml-1">
                  {{ platform.connected ? 'connected' : 'disconnected' }}
                </v-chip>
              </div>
            </div>
          </v-card-text>

          <v-card-actions class="mt-auto">
            <v-btn
              append-icon="mdi-chevron-right"
              color="primary"
              text="Open project"
              variant="outlined"
              block
              :to="`/projects/${project.id}`"
            />
          </v-card-actions>
        </v-card>

        <!-- Empty state -->
        <v-card
          v-if="!projectsStore.loading && projectsStore.projects.length === 0"
          width="350"
          elevation="0"
          variant="text"
          class="d-flex flex-column align-center pa-6 justify-center text-center"
        >
          <v-icon size="40" class="mb-2">mdi-folder-plus</v-icon>
          <div>No projects yet. Click + to create one.</div>
        </v-card>
      </div>
    </div>

    <!-- Add Project Dialog -->
    <v-dialog v-model="dialog" max-width="400">
      <v-card>
        <v-card-title>Add New Project</v-card-title>
        <v-card-text>
          <v-text-field label="Project name" v-model="newProjectName" autofocus />
        </v-card-text>
        <v-card-actions>
          <v-btn text="Cancel" @click="dialog = false" />
          <v-btn color="primary" text="Create" @click="createProject" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { useProjectsStore } from '~/stores/projectsStore'

export default {
  setup() {
    const { role } = useAuthState()
    const projectsStore = useProjectsStore()

    const dialog = ref(false)
    const newProjectName = ref('')

    // Load projects when mounted
    onMounted(() => {
      let stopWatch // declare first

      stopWatch = watch(
        () => role.value,
        (r) => {
          if (r && (r === 'admin' || r === 'client')) {
            projectsStore.init()
            if (stopWatch) stopWatch() // stop safely
          }
        },
        { immediate: true }
      )
    })

    onBeforeUnmount(() => {
      projectsStore.stop()
    })

    const createProject = async () => {
      if (!newProjectName.value.trim()) return
      console.log('[UI] Creating project:', newProjectName.value)
      await projectsStore.addProject(newProjectName.value)
      console.log('[UI] Done creating project')
      newProjectName.value = ''
      dialog.value = false
    }

    const iconFor = (type) => {
      switch (type) {
        case 'youtube':
          return 'mdi-youtube'
        case 'twitch':
          return 'mdi-twitch'
        case 'tiktok':
          return 'mdi-alpha-t'
        case 'instagram':
          return 'mdi-instagram'
        default:
          return 'mdi-earth'
      }
    }

    const iconColor = (type) => {
      switch (type) {
        case 'youtube':
          return 'red'
        case 'twitch':
          return 'purple'
        case 'tiktok':
          return 'black'
        case 'instagram':
          return 'orange'
        default:
          return 'grey'
      }
    }

    return {
      role,
      dialog,
      newProjectName,
      projectsStore,
      createProject,
      iconFor,
      iconColor,
    }
  },
}
</script>

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
