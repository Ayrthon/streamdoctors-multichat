<template>
  <div class="pa-6" v-if="project">
    <v-toolbar flat>
      <v-toolbar-title>{{ project.name }}</v-toolbar-title>
      <template #append>
        <v-btn color="error" text="Delete Project" @click="removeProject" />
      </template>
    </v-toolbar>

    <v-divider class="my-4"></v-divider>

    <h3 class="mb-3">Platforms</h3>

    <div class="d-flex ga-4 flex-wrap">
      <v-card v-for="(p, index) in project.platforms" :key="index" width="300" variant="tonal">
        <v-card-title>
          <v-icon class="mr-2">
            {{ iconFor(p.type) }}
          </v-icon>
          {{ p.type.toUpperCase() }}
        </v-card-title>

        <v-card-text>
          <strong>Country:</strong> {{ p.country }} <br />
          <strong>Username:</strong> {{ p.username }} <br />
          <v-chip :color="p.connected ? 'success' : 'error'">
            {{ p.connected ? 'connected' : 'disconnected' }}
          </v-chip>
        </v-card-text>

        <v-card-actions>
          <v-btn color="error" text="Remove" @click="removePlatform(index)" />
        </v-card-actions>
      </v-card>

      <v-card
        width="300"
        variant="outlined"
        class="d-flex flex-column align-center pa-6 justify-center"
      >
        <v-btn icon="mdi-plus" @click="dialog = true" />
        <span class="mt-2">Add platform</span>
      </v-card>
    </div>

    <v-divider class="my-4"></v-divider>

    <h3>Chat URL</h3>
    <v-text-field
      v-model="chatUrl"
      readonly
      append-inner-icon="mdi-content-copy"
      @click:append-inner="copyChatUrl"
    />

    <v-dialog v-model="dialog" max-width="400">
      <v-card>
        <v-card-title>Add Platform</v-card-title>
        <v-card-text>
          <v-select
            label="Platform"
            v-model="newPlatform.type"
            :items="['twitch', 'youtube', 'tiktok', 'instagram']"
          />
          <v-select
            label="Country"
            v-model="newPlatform.country"
            :items="['NL', 'BE', 'DE', 'FR', 'UK']"
          />
          <v-text-field label="Username / ID" v-model="newPlatform.username" />
        </v-card-text>
        <v-card-actions>
          <v-btn text="Cancel" @click="dialog = false" />
          <v-btn color="primary" text="Add" @click="addPlatform" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { useProjectsStore } from '~/stores/projectsStore'

export default {
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { user } = useAuthState()
    const projectsStore = useProjectsStore()
    const project = computed(() => projectsStore.currentProject)
    const dialog = ref(false)
    const newPlatform = ref({ type: '', country: '', username: '' })

    const chatUrl = ref('')
    const iconFor = (type) => {
      switch (type) {
        case 'twitch':
          return 'mdi-twitch'
        case 'youtube':
          return 'mdi-youtube'
        case 'tiktok':
          return 'mdi-alpha-t'
        case 'instagram':
          return 'mdi-instagram'
        default:
          return 'mdi-earth'
      }
    }

    onMounted(async () => {
      await projectsStore.loadProject(route.params.id)

      // ✅ Wait for the realtime snapshot to populate currentProject
      await new Promise((resolve) => {
        const stop = watch(
          () => project.value,
          (val) => {
            if (val && val.platforms) {
              stop()
              resolve()
            }
          },
          { immediate: true }
        )
      })

      // ✅ Now platforms are guaranteed to exist
      const res = await $fetch('/api/token', {
        method: 'POST',
        body: {
          projectId: route.params.id,
          uid: user.value.uid,
          platforms: project.value.platforms,
        },
      })

      chatUrl.value = `${window.location.origin}/chatview?token=${res.token}`
    })

    onBeforeUnmount(() => {
      projectsStore.stop()
    })

    const addPlatform = async () => {
      if (!newPlatform.value.type || !newPlatform.value.username) return
      await projectsStore.addPlatform(route.params.id, {
        ...newPlatform.value,
        connected: false,
      })
      dialog.value = false
      newPlatform.value = { type: '', country: '', username: '' }
    }

    const removePlatform = async (index) => {
      await projectsStore.removePlatform(route.params.id, index)
    }

    const removeProject = async () => {
      if (confirm('Delete this project?')) {
        await projectsStore.deleteProject(route.params.id)
        router.push('/projects')
      }
    }

    const copyChatUrl = () => {
      navigator.clipboard.writeText(chatUrl.value)
      alert('Copied to clipboard!')
    }

    return {
      project,
      dialog,
      newPlatform,
      iconFor,
      chatUrl,
      addPlatform,
      removePlatform,
      removeProject,
      copyChatUrl,
    }
  },
}
</script>
