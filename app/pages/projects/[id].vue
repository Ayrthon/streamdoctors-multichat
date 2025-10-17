<template>
  <div class="pa-6" v-if="project">
    <v-toolbar flat>
      <v-text-field
        v-model="editableProject.name"
        label="Project Name"
        variant="plain"
        hide-details
        class="text-h6 flex-grow-1"
      />
      <template #append>
        <v-btn color="primary" text="Save Changes" @click="saveProject" class="mr-2" />
        <v-btn color="error" text="Delete Project" @click="removeProject" />
      </template>
    </v-toolbar>

    <v-divider class="my-4"></v-divider>

    <h3 class="mb-3">Platforms</h3>

    <div class="d-flex ga-4 flex-wrap">
      <v-card
        v-for="(p, index) in editableProject.platforms"
        :key="index"
        width="300"
        variant="tonal"
        class="cursor-pointer"
        @click="editPlatform(index)"
      >
        <v-card-title class="d-flex align-center ga-2">
          <span
            v-if="p.type === 'tiktok'"
            class="svg-icon"
            :style="{ color: iconColor('tiktok') }"
          ></span>

          <v-icon v-else :color="iconColor(p.type)" class="mr-2">
            {{ iconFor(p.type) }}
          </v-icon>

          {{ p.type.toUpperCase() }}
        </v-card-title>

        <v-card-text>
          <strong>Country:</strong> {{ p.country || 'N/A' }} <br />
          <strong>Username:</strong> {{ p.username || 'N/A' }} <br />
          <v-chip :color="p.connected ? 'success' : 'error'">
            {{ p.connected ? 'connected' : 'disconnected' }}
          </v-chip>
        </v-card-text>

        <v-card-actions>
          <v-btn color="error" text="Remove" @click.stop="removePlatform(index)" />
        </v-card-actions>
      </v-card>

      <v-card
        width="300"
        variant="outlined"
        class="d-flex flex-column align-center pa-6 justify-center"
      >
        <v-btn icon="mdi-plus" @click="openAddDialog" />
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

    <!-- Add/Edit Platform Dialog -->
    <v-dialog v-model="dialog" max-width="400">
      <v-card>
        <v-card-title>{{ editingIndex !== null ? 'Edit Platform' : 'Add Platform' }}</v-card-title>
        <v-card-text>
          <v-select
            label="Platform"
            v-model="dialogPlatform.type"
            :items="['twitch', 'youtube', 'tiktok', 'instagram']"
          />
          <v-select
            label="Country"
            v-model="dialogPlatform.country"
            :items="['NL', 'BE', 'DE', 'FR', 'UK']"
          />
          <v-text-field label="Username / ID" v-model="dialogPlatform.username" />
        </v-card-text>
        <v-card-actions>
          <v-btn text="Cancel" @click="closeDialog" />
          <v-btn color="primary" text="Save" @click="savePlatform" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { useAuthState } from '~/composables/useAuthState'
import { useProjectsStore } from '~/stores/projectsStore'

const route = useRoute()
const router = useRouter()
const { user } = useAuthState()
const projectsStore = useProjectsStore()

const project = computed(() => projectsStore.currentProject)
const editableProject = ref({ name: '', platforms: [] })

const dialog = ref(false)
const editingIndex = ref(null)
const dialogPlatform = ref({ type: '', country: '', username: '' })

// ✅ Computed Chat URL — always reactive
const chatUrl = computed(() => {
  if (!project.value?.publicToken) return ''
  return `${window.location.origin}/chatview?token=${project.value.publicToken}`
})

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

const iconColor = (type) => {
  switch (type) {
    case 'youtube':
      return 'red'
    case 'twitch':
      return 'purple'
    case 'tiktok':
      return 'white'
    case 'instagram':
      return 'orange'
    default:
      return 'grey'
  }
}

onMounted(async () => {
  await projectsStore.loadProject(route.params.id)

  // Ensure editable copy updates when Firestore data arrives
  watch(
    () => project.value,
    (val) => {
      if (val) editableProject.value = JSON.parse(JSON.stringify(val))
    },
    { immediate: true }
  )
})

onBeforeUnmount(() => {
  projectsStore.stop()
})

const openAddDialog = () => {
  editingIndex.value = null
  dialogPlatform.value = { type: '', country: '', username: '' }
  dialog.value = true
}

const editPlatform = (index) => {
  editingIndex.value = index
  dialogPlatform.value = { ...editableProject.value.platforms[index] }
  dialog.value = true
}

const savePlatform = async () => {
  const updated = [...(editableProject.value.platforms || [])]

  if (editingIndex.value !== null) {
    updated.splice(editingIndex.value, 1, { ...dialogPlatform.value })
  } else {
    updated.push({ ...dialogPlatform.value, connected: false })
  }

  editableProject.value.platforms = updated
  dialog.value = false
  editingIndex.value = null
}

const closeDialog = () => {
  dialog.value = false
  editingIndex.value = null
}

const removePlatform = async (index) => {
  editableProject.value.platforms.splice(index, 1)
}

const saveProject = async () => {
  await projectsStore.saveProject(route.params.id, editableProject.value)
  alert('Project saved!')
}

const removeProject = async () => {
  if (confirm('Delete this project?')) {
    await projectsStore.deleteProject(route.params.id)
    router.push('/projects')
  }
}

const copyChatUrl = () => {
  if (!chatUrl.value) return
  navigator.clipboard.writeText(chatUrl.value)
  alert('Copied to clipboard!')
}
</script>

<style scoped>
.svg-icon {
  width: 24px;
  height: 24px;
  display: inline-block;
  background-color: currentColor;
  -webkit-mask: url('assets/icons/tiktok.svg') no-repeat center / contain;
  mask: url('assets/icons/tiktok.svg') no-repeat center / contain;
  vertical-align: middle;
}
</style>
