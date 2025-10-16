<template>
  <div class="chat-overlay">
    <h2 v-if="error" class="error">{{ error }}</h2>

    <div v-else-if="projectId">
      <!-- <p>Authenticated for project: {{ projectId }}</p>
      <p v-if="platforms.length">Platforms: {{ platforms.map((p) => p.type).join(', ') }}</p> -->

      <div class="chat-messages">
        <div v-for="(msg, i) in messages" :key="i" class="chat-line d-flex align-center ga-2">
          <!-- Platform icon -->
          <v-icon
            v-if="msg.platform"
            :icon="platformIcons[msg.platform]"
            :class="platformColor(msg.platform)"
            size="20"
          />

          <!-- Country flag -->
          <span v-if="msg.country" class="flag">{{ countryFlag(msg.country) }}</span>

          <!-- Username -->
          <strong :style="{ color: msg.color }">{{ msg.user }}</strong
          >:

          <!-- Message -->
          <span v-html="msg.html"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

import tmi from 'tmi.js'

// --- ICON + FLAG helpers ---
const platformIcons = {
  twitch: 'mdi-twitch',
  youtube: 'mdi-youtube',
  instagram: 'mdi-instagram',
}

const platformColor = (platform) => {
  switch (platform) {
    case 'twitch':
      return 'text-purple'
    case 'youtube':
      return 'text-red'
    case 'instagram':
      return 'text-pink'
    default:
      return ''
  }
}

function countryFlag(code) {
  if (!code) return ''
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

definePageMeta({
  layout: false,
})

const route = useRoute()
const projectId = ref(null)
const platforms = ref([])
const error = ref(null)
const messages = ref([])

onMounted(async () => {
  try {
    const res = await $fetch('/api/verify', { params: { token: route.query.token } })
    projectId.value = res.projectId
    platforms.value = res.platforms || []
  } catch (err) {
    error.value = err.data?.message || 'Access denied'
  }
})

// ✅ reactively connect to Twitch once platforms are loaded
watch(
  platforms,
  (list) => {
    if (import.meta.server) return

    const twitchAccounts = list
      ?.filter((p) => p.type === 'twitch')
      ?.map((p) => p.username.toLowerCase())

    if (!twitchAccounts?.length) return

    const client = new tmi.Client({
      options: { debug: true },
      connection: { reconnect: true },
      channels: twitchAccounts,
    })

    client.connect()

    function parseTwitchEmotes(message, emotes) {
      if (!emotes) return escapeHtml(message)

      // Collect all replacements as { start, end, id, code }
      const replacements = []
      Object.entries(emotes).forEach(([id, positions]) => {
        positions.forEach((pos) => {
          const [start, end] = pos.split('-').map(Number)
          const code = message.substring(start, end + 1)
          replacements.push({ start, end, id, code })
        })
      })

      // Sort by start index DESC so we replace from the end of the string
      replacements.sort((a, b) => b.start - a.start)

      let result = message
      for (const { start, end, id, code } of replacements) {
        const img = `<img
      src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0"
      alt="${code}"
      class="emote"
    />`
        result = result.slice(0, start) + img + result.slice(end + 1)
      }

      return result
    }

    // basic HTML escape for plain text safety
    function escapeHtml(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    }

    client.on('message', (channel, tags, message, self) => {
      if (self) return

      const html = parseTwitchEmotes(message, tags.emotes)
      const platform = 'twitch'
      const platformData = platforms.value.find(
        (p) =>
          p.type === platform && p.username.toLowerCase() === channel.replace('#', '').toLowerCase()
      )
      const country = platformData?.country || ''

      messages.value.push({
        platform,
        country,
        channel,
        user: tags['display-name'] || tags.username,
        color: tags.color || '#ffffff', // ✅ default white if none
        html,
      })

      if (messages.value.length > 15) messages.value.shift()
    })

    onBeforeUnmount(() => client.disconnect())
  },
  { immediate: true } // ✅ run right away once platforms are set
)
</script>

<style scoped>
.chat-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end; /* ✅ pushes messages to bottom */
  align-items: flex-start;
  background: transparent;
  color: white;
  padding: 1rem;
  font-family: sans-serif;
  height: 100vh;
  pointer-events: none;
}
.chat-messages {
  display: flex;
  flex-direction: column; /* ✅ normal order */
  justify-content: flex-end; /* ✅ keeps messages anchored bottom */
  gap: 0.25rem;
  max-height: 90vh;
  width: 100%;
  overflow: hidden;
}
.chat-line {
  text-shadow: 0 0 4px black;
  font-size: 2rem;
  line-height: 1.3;
  opacity: 0.9;
  animation: fade-in 0.3s ease;
}
.emote {
  vertical-align: middle;
  height: 1.5em;
  margin: 0 0.1em;
}
.flag {
  font-size: 1.1rem;
  line-height: 1;
}
.chat-line strong {
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
}
.text-purple {
  color: #9146ff !important; /* Twitch purple */
}
.text-red {
  color: #ff0000 !important; /* YouTube red */
}
.text-pink {
  color: #ff009d !important; /* Kick green */
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 0.9;
    transform: translateY(0);
  }
}
.error {
  color: red;
}
</style>
