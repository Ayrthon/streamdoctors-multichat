<template>
  <div class="pa-6" v-if="project">
    <!-- HEADER -->
    <v-card class="pa-4 d-flex align-center">
      <v-text-field
        v-model="editableProject.name"
        label="Project Name"
        variant="outlined"
        hide-details
        @keyup.enter="saveProject"
      />
      <v-spacer />
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-content-save"
        @click="saveProject"
        :loading="saving"
        class="mr-2"
      >
        Save
      </v-btn>
    </v-card>

    <v-divider class="my-4" />

    <!-- PLATFORMS -->
    <div class="d-flex align-center justify-space-between mb-3">
      <h3 class="text-h6 font-weight-medium">Platforms</h3>
      <v-btn color="primary" prepend-icon="mdi-plus" size="small" @click="openAddDialog">
        Add Platform
      </v-btn>
    </div>

    <v-row dense>
      <v-col v-for="(p, index) in editableProject.platforms" :key="index">
        <v-card variant="tonal" class="h-100 d-flex flex-column justify-space-between">
          <v-card-title class="d-flex align-center">
            <div class="d-flex align-center mr-2">
              <template v-if="iconFor(p.type) === 'tiktok-svg'">
                <span class="svg-icon tiktok-icon" />
              </template>
              <template v-else>
                <v-icon :color="iconColor(p.type)">
                  {{ iconFor(p.type) }}
                </v-icon>
              </template>
            </div>
            <span class="text-subtitle-1 font-weight-medium">{{ p.type.toUpperCase() }}</span>
          </v-card-title>

          <v-card-text>
            <div><strong>Channel:</strong> {{ p.username || 'N/A' }}</div>
            <div><strong>Location:</strong> {{ p.country || 'N/A' }}</div>
          </v-card-text>

          <v-card-actions class="justify-end">
            <v-btn
              size="small"
              color="error"
              prepend-icon="mdi-delete"
              text="Remove"
              @click.stop="removePlatform(index)"
            />
            <v-btn
              size="small"
              prepend-icon="mdi-pencil"
              color="primary"
              text="Edit"
              @click="editPlatform(index)"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- CHAT URL -->
    <v-divider class="my-4" />
    <h3 class="text-h6 font-weight-medium mb-2">Chat Overlay URL</h3>
    <v-text-field
      v-model="chatUrl"
      readonly
      density="comfortable"
      variant="outlined"
      append-inner-icon="mdi-content-copy"
      @click:append-inner="copyChatUrl"
      hint="Copy and paste this link into your OBS browser source"
      persistent-hint
    />

    <v-divider class="my-4" />

    <!-- ✅ Chat Logging Toggle -->
    <div class="d-flex align-center justify-space-between mb-2">
      <h3 class="text-h6 font-weight-medium">Moderator Chat URL</h3>
      <v-switch
        v-model="enableChatLogging"
        color="primary"
        label="Controls"
        hide-details
        density="compact"
      />
    </div>

    <v-text-field
      v-model="chatUrlModerator"
      readonly
      density="comfortable"
      variant="outlined"
      append-inner-icon="mdi-content-copy"
      @click:append-inner="copyChatUrlModerator"
      hint="Chat url for Monitoring, Scrolling, Chatlogging and Character counting"
      persistent-hint
    />

    <div class="d-flex mt-5 justify-end">
      <v-btn color="error" variant="tonal" prepend-icon="mdi-delete" @click="removeProject"
        >delete project</v-btn
      >
    </div>

    <!-- PLATFORM DIALOG -->
    <v-dialog v-model="dialog" max-width="420">
      <v-card>
        <v-card-title class="font-weight-medium">
          {{ editingIndex !== null ? 'Edit Platform' : 'Add Platform' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="platformForm">
            <v-select
              label="Platform"
              v-model="dialogPlatform.type"
              :items="['twitch', 'youtube', 'tiktok', 'instagram']"
              :rules="[rules.required]"
            />
            <v-select
              label="Country (optional)"
              v-model="dialogPlatform.country"
              :items="['', 'NL', 'BE', 'DE', 'FR', 'US', 'UK']"
            />
            <v-text-field
              label="Channel Name"
              v-model="dialogPlatform.username"
              :rules="[rules.required]"
            />
          </v-form>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn text="Cancel" @click="closeDialog" />
          <v-btn color="primary" text="Done" @click="validateAndSavePlatform" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { useSnackbar } from '~/composables/useSnackbar'
import { useProjectsStore } from '~/stores/projectsStore'

const { showSnackbar } = useSnackbar()

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()

const project = computed(() => projectsStore.currentProject)
const editableProject = ref({ name: '', platforms: [] })
const saving = ref(false)

const dialog = ref(false)
const editingIndex = ref(null)
const dialogPlatform = ref({ type: '', country: '', username: '' })

const platformForm = ref(null)

// ✅ Chat logging toggle
const enableChatLogging = ref(true)

const rules = {
  required: (v) => !!v || 'This field is required',
}

const chatUrl = computed(() =>
  project.value?.publicToken
    ? `${window.location.origin}/chatview?token=${project.value.publicToken}&scrollable=false`
    : ''
)

// ✅ Moderator URL with conditional controls parameter
const chatUrlModerator = computed(() => {
  if (!project.value?.publicToken) return ''
  const baseUrl = `${window.location.origin}/chatview?token=${project.value.publicToken}`
  return enableChatLogging.value ? `${baseUrl}&controls=true` : baseUrl
})

const iconFor = (type) =>
  ({
    twitch: 'mdi-twitch',
    youtube: 'mdi-youtube',
    tiktok: 'tiktok-svg',
    instagram: 'mdi-instagram',
  })[type] || 'mdi-earth'

const iconColor = (type) =>
  ({
    youtube: 'red',
    twitch: 'purple',
    tiktok: 'white',
    instagram: 'orange',
  })[type] || 'grey'

onMounted(async () => {
  await projectsStore.loadProject(route.params.id)
  watch(
    () => project.value,
    (val) => {
      if (val) editableProject.value = JSON.parse(JSON.stringify(val))
    },
    { immediate: true }
  )
})

onBeforeUnmount(() => projectsStore.stop())

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

const validateAndSavePlatform = async () => {
  const result = await platformForm.value?.validate()
  if (!result?.valid) return
  savePlatform()
}

const savePlatform = async () => {
  const updated = [...(editableProject.value.platforms || [])]
  if (editingIndex.value !== null) {
    updated.splice(editingIndex.value, 1, { ...dialogPlatform.value })
  } else {
    updated.push({ ...dialogPlatform.value, connected: false })
  }

  editableProject.value.platforms = updated
  closeDialog()
}

const closeDialog = () => {
  dialog.value = false
  editingIndex.value = null
  platformForm.value?.resetValidation()
}

const removePlatform = (index) => editableProject.value.platforms.splice(index, 1)

const saveProject = async () => {
  try {
    saving.value = true
    await projectsStore.saveProject(route.params.id, editableProject.value)
    showSnackbar('Project saved!', 'success')
  } catch (e) {
    showSnackbar('Failed to save project.', 'error')
  } finally {
    saving.value = false
  }
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
  showSnackbar('Copied chat overlay URL!', 'info')
}

const copyChatUrlModerator = () => {
  if (!chatUrlModerator.value) return
  navigator.clipboard.writeText(chatUrlModerator.value)
  showSnackbar('Copied moderator chat URL!', 'info')
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
