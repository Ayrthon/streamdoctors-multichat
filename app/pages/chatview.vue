<template>
  <div class="chat-overlay">
    <div v-for="(msg, i) in messages" :key="i" class="chat-line d-flex align-center ga-2">
      <!-- Generic platform icon -->
      <v-icon
        v-if="msg.platform && platformIcons[msg.platform]"
        :icon="platformIcons[msg.platform]"
        :class="platformColor(msg.platform)"
        size="20"
      />

      <!-- TikTok custom icon (fallback) -->
      <img
        v-else-if="msg.platform === 'tiktok'"
        src="assets/icons/tiktok.svg"
        alt="TikTok"
        class="icon-svg"
      />

      <!-- Country flag -->
      <span v-if="msg.country" class="flag">{{ countryFlag(msg.country) }}</span>

      <!-- Username + message -->
      <strong :style="{ color: msg.color }">{{ msg.user }}</strong
      >:
      <span v-html="msg.html"></span>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

import tmi from 'tmi.js'

definePageMeta({
  layout: false,
  middleware: [],
})
console.log(import.meta.env.VITE_FIREBASE_API_KEY)
const route = useRoute()

// 🔑 Token from URL
const token = computed(() => route.query.token)

// 🧠 Fetch project data
const {
  data,
  pending,
  error: fetchError,
} = await useFetch(
  () => (token.value ? `/api/chatview?token=${encodeURIComponent(token.value)}` : null),
  { key: () => `chatview:${token.value || 'none'}` }
)

if (!token.value) console.warn('[chatview] Missing ?token=')

const projectId = ref(null)
const platforms = ref([])
const messages = ref([])

// 🎨 Username color generator
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

// --- ICON + FLAG helpers ---
const platformIcons = {
  twitch: 'mdi-twitch',
  youtube: 'mdi-youtube',
  instagram: 'mdi-instagram',
  tiktok: 'mdi-alpha-t',
}

const platformColor = (platform) => {
  switch (platform) {
    case 'twitch':
      return 'text-purple'
    case 'youtube':
      return 'text-red'
    case 'instagram':
      return 'text-pink'
    case 'tiktok':
      return 'text-cyan'
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

// 🧩 YouTube live helper
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

// 🧩 Connect YouTube SSE
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
    if (messages.value.length > 100) messages.value.shift()
  }

  source.addEventListener('end', () => {
    console.log('YouTube chat stream ended for', account.username)
    source.close()
  })

  source.onerror = (e) => console.warn('YouTube SSE error', e)

  onBeforeUnmount(() => source.close())
}

// 🔥 Connect all platforms
watchEffect(async () => {
  if (import.meta.server) return
  if (!data.value?.platforms?.length) return

  platforms.value = data.value.platforms
  const sources = [] // store all EventSources for cleanup

  // 🟣 Twitch
  const twitchAccounts = platforms.value
    .filter((p) => p.type === 'twitch')
    .map((p) => p.username.toLowerCase())

  if (twitchAccounts.length) {
    const client = new tmi.Client({
      options: { debug: false },
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
          p.type === 'twitch' && p.username.toLowerCase() === channel.replace('#', '').toLowerCase()
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

      if (messages.value.length > 100) messages.value.shift()
    })

    onBeforeUnmount(() => client.disconnect())
  }

  // 🔴 YouTube
  const youtubeAccounts = platforms.value.filter((p) => p.type === 'youtube')
  for (const account of youtubeAccounts) {
    const liveId = await getLiveId(account.username)
    if (!liveId) continue
    console.log(`✅ Connecting YouTube SSE for ${account.username}`)
    connectYouTubeSSE(liveId, account)
  }

  // 🖤 TikTok
  const tiktokAccounts = platforms.value.filter((p) => p.type === 'tiktok')
  for (const account of tiktokAccounts) {
    const username = account.username.toLowerCase()
    let source = new EventSource(`/api/tiktok-chat/${username}/sse`)

    const setupTikTokSource = () => {
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
        if (messages.value.length > 100) messages.value.shift()
      }

      source.onerror = () => {
        console.warn(`TikTok SSE error for ${username}, retrying in 5s...`)
        source.close()
        setTimeout(() => {
          source = new EventSource(`/api/tiktok-chat/${username}/sse`)
          setupTikTokSource()
        }, 5000)
      }

      source.addEventListener('end', () => {
        console.log(`TikTok chat stream ended for ${username}`)
        source.close()
      })
    }

    setupTikTokSource()
    sources.push(source)
  }

  onBeforeUnmount(() => {
    sources.forEach((s) => s.close())
  })
})
</script>

<style scoped>
.chat-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: transparent;
  color: white;
  padding: 1rem;
  font-family: sans-serif;
  height: 100vh;
  pointer-events: none;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
}

.chat-line {
  font-size: 2rem;
  line-height: 1.3;
  opacity: 0.9;
  animation: fade-in 0.3s ease forwards;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
.text-purple {
  color: #9146ff !important;
}
.text-red {
  color: #ff0000 !important;
}
.text-pink {
  color: #ff009d !important;
}
.text-cyan {
  color: #00f2ea !important;
}

.icon-svg {
  width: 0.5em;
  height: 0.5em;
  vertical-align: middle;
  filter: brightness(0) invert(1);
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

:global(html),
:global(body) {
  overflow: hidden;
  height: 100%;
}
</style>
