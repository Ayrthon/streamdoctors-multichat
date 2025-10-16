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

// 🎨 Username color fallback
const userColorCache = new Map()
function getUserColor(username) {
  if (userColorCache.has(username)) return userColorCache.get(username)
  const colors = [
    '#FF4500',
    '#2E8B57',
    '#1E90FF',
    '#DAA520',
    '#D2691E',
    '#5F9EA0',
    '#FF69B4',
    '#8A2BE2',
    '#00FF7F',
    '#9ACD32',
  ]
  const hash = username.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const color = colors[hash % colors.length]
  userColorCache.set(username, color)
  return color
}

// 🧩 Helper: Get YouTube live video ID
async function getLiveId(channelHandle) {
  try {
    const res = await $fetch('/api/youtube-liveid', { params: { handle: channelHandle } })
    if (res?.liveVideoId) return res.liveVideoId
    console.warn('YouTube: No live stream for', channelHandle)
    return null
  } catch (e) {
    console.warn('Could not fetch liveId for', channelHandle, e)
    return null
  }
}

// 🧩 Helper: Connect to YouTube chat via backend SSE
function connectYouTubeSSE(liveVideoId, account) {
  const source = new EventSource(`/api/youtube-chat/${liveVideoId}`)

  source.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    messages.value.push({
      platform: 'youtube',
      country: account.country || '',
      user: msg.user,
      html: msg.message,
      color: '#ff0000',
      timestamp: msg.timestamp || Date.now(),
    })
    if (messages.value.length > 15) messages.value.shift()
  }

  source.addEventListener('end', () => {
    console.log('YouTube chat stream ended for', account.username)
    source.close()
  })

  source.addEventListener('error', (e) => {
    console.warn('YouTube SSE error', e)
  })

  onBeforeUnmount(() => source.close())
}

// 🔥 Reactive watcher: connect platforms once loaded
watch(
  platforms,
  async (list) => {
    if (import.meta.server) return
    if (!list?.length) return

    // 🟣 Twitch
    const twitchAccounts = list
      .filter((p) => p.type === 'twitch')
      .map((p) => p.username.toLowerCase())

    if (twitchAccounts.length) {
      const client = new tmi.Client({
        options: { debug: true },
        connection: { reconnect: true },
        channels: twitchAccounts,
      })

      client.connect()

      function parseTwitchEmotes(message, emotes) {
        if (!emotes) return escapeHtml(message)
        const replacements = []
        Object.entries(emotes).forEach(([id, positions]) => {
          positions.forEach((pos) => {
            const [start, end] = pos.split('-').map(Number)
            const code = message.substring(start, end + 1)
            replacements.push({ start, end, id, code })
          })
        })
        replacements.sort((a, b) => b.start - a.start)
        let result = message
        for (const { start, end, id, code } of replacements) {
          const img = `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0" alt="${code}" class="emote" />`
          result = result.slice(0, start) + img + result.slice(end + 1)
        }
        return result
      }

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
        const platformData = platforms.value.find(
          (p) =>
            p.type === 'twitch' &&
            p.username.toLowerCase() === channel.replace('#', '').toLowerCase()
        )
        const country = platformData?.country || ''
        const color = tags.color || getUserColor(tags.username)

        messages.value.push({
          platform: 'twitch',
          country,
          channel,
          user: tags['display-name'] || tags.username,
          color,
          html,
          timestamp: Date.now(),
        })

        if (messages.value.length > 15) messages.value.shift()
      })

      onBeforeUnmount(() => client.disconnect())
    }

    // 🔴 YouTube
    const youtubeAccounts = list.filter((p) => p.type === 'youtube')
    for (const account of youtubeAccounts) {
      const liveId = await getLiveId(account.username)
      if (!liveId) continue
      console.log(`✅ Connecting YouTube SSE for ${account.username}`)
      connectYouTubeSSE(liveId, account)
    }

    // 🖤 TikTok setup
    const tiktokAccounts = list.filter((p) => p.type === 'tiktok')
    if (tiktokAccounts.length) {
      for (const account of tiktokAccounts) {
        const username = account.username.toLowerCase()
        const source = new EventSource(`/api/tiktok-chat/${username}/sse`)

        source.onmessage = (e) => {
          const msg = JSON.parse(e.data)
          messages.value.push({
            platform: 'tiktok',
            country: account.country || '',
            user: msg.user,
            html: msg.message,
            color: msg.color,
            timestamp: msg.timestamp,
          })
          if (messages.value.length > 15) messages.value.shift()
        }

        source.onerror = (err) => {
          console.warn('TikTok SSE error:', err)
          source.close()
          // 🔁 Auto-reconnect after 5 seconds
          setTimeout(() => {
            const newSource = new EventSource(`/api/tiktok-chat/${username}/sse`)
          }, 5000)
        }

        source.addEventListener('end', () => {
          console.log(`TikTok chat stream ended for ${username}`)
          source.close()
        })

        onBeforeUnmount(() => source.close())
      }
    }
  },
  { immediate: true }
)

// 🔐 Verify token → load project platforms
onMounted(async () => {
  try {
    const res = await $fetch('/api/verify', { params: { token: route.query.token } })
    projectId.value = res.projectId
    platforms.value = res.platforms || []
  } catch (err) {
    error.value = err.data?.message || 'Access denied'
  }
})
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
