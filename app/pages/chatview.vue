<template>
  <div class="chat-container">
    <div
      ref="scrollContainer"
      class="chat-scroll"
      :class="{ 'scroll-disabled': !scrollable }"
      @scroll="onScroll"
    >
      <div class="chat-inner">
        <div v-for="(msg, i) in messages" :key="i" class="chat-line d-flex align-center ga-2">
          <v-icon
            v-if="msg.platform && platformIcons[msg.platform]"
            :icon="platformIcons[msg.platform]"
            :class="platformColor(msg.platform)"
            size="20"
          />
          <img
            v-else-if="msg.platform === 'tiktok'"
            src="assets/icons/tiktok.svg"
            alt="TikTok"
            class="icon-svg"
          />
          <span v-if="msg.country" class="flag">{{ countryFlag(msg.country) }}</span>
          <div class="chat-msg">
            <strong :style="{ color: msg.color }">{{ msg.user }}</strong>
            <span class="colon">: </span>
            <span class="text" v-html="msg.html"></span>
          </div>
        </div>
      </div>
    </div>

    <transition name="fade">
      <v-btn
        v-if="isPaused && scrollPauseEnabled"
        class="paused-button"
        color="primary"
        @click="resumeChat"
      >
        Chat paused — click to resume
      </v-btn>
    </transition>

    <!-- Logging Controls Panel -->
    <div v-if="showControls" class="controls-panel">
      <div class="controls-header">
        <span class="controls-title">📝 Chat Logging</span>
      </div>

      <div class="controls-body">
        <div v-if="!isLogging" class="controls-section">
          <v-btn color="success" block prepend-icon="mdi-record-circle" @click="startLogging">
            Start Logging
          </v-btn>
        </div>

        <div v-else class="controls-section">
          <div class="stat-row">
            <span class="stat-label">Status:</span>
            <span class="stat-value recording">🔴 Recording</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Messages:</span>
            <span class="stat-value">{{ loggingMessages.length }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Duration:</span>
            <span class="stat-value">{{ sessionDuration }}</span>
          </div>

          <v-btn
            color="error"
            block
            prepend-icon="mdi-stop-circle"
            @click="showStopDialog = true"
            class="mt-2"
          >
            Stop Logging
          </v-btn>

          <div class="download-buttons mt-3">
            <v-btn
              size="small"
              variant="tonal"
              prepend-icon="mdi-download"
              @click="downloadJSON"
              :disabled="loggingMessages.length === 0"
            >
              JSON
            </v-btn>
            <v-btn
              size="small"
              variant="tonal"
              prepend-icon="mdi-download"
              @click="downloadCSV"
              :disabled="loggingMessages.length === 0"
            >
              CSV
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Stop Logging Confirmation Dialog -->
    <div v-if="showStopDialog" class="confirmation-overlay" @click="showStopDialog = false">
      <div class="confirmation-dialog" @click.stop>
        <div class="confirmation-header">
          <span>⚠️ Stop Logging?</span>
        </div>
        <div class="confirmation-body">
          <p>
            You have <strong>{{ loggingMessages.length }} messages</strong> logged.
          </p>
          <p>Download your data before stopping, or it will be lost.</p>

          <div class="dialog-download-buttons">
            <v-btn
              color="primary"
              block
              prepend-icon="mdi-download"
              @click="downloadJSON"
              class="mb-2"
            >
              Download JSON
            </v-btn>
            <v-btn
              color="primary"
              block
              prepend-icon="mdi-download"
              @click="downloadCSV"
              class="mb-3"
            >
              Download CSV
            </v-btn>
          </div>

          <div class="dialog-actions">
            <v-btn variant="text" @click="showStopDialog = false"> Cancel </v-btn>
            <v-btn color="error" variant="flat" @click="confirmStopLogging">
              Stop Without Saving
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Character Counter Panel -->
    <div v-if="showControls" class="counter-panel">
      <div class="controls-header">
        <span class="controls-title">🔢 Character Counter</span>
      </div>

      <div class="controls-body">
        <div v-if="!isCounting" class="controls-section">
          <div class="character-inputs">
            <div
              v-for="(charItem, index) in charactersToCount"
              :key="charItem.id"
              class="input-group"
            >
              <label>Character {{ index + 1 }}:</label>
              <div class="input-with-emoji">
                <input
                  v-model="charItem.char"
                  type="text"
                  maxlength="1"
                  class="char-input"
                  :placeholder="(index + 1).toString()"
                />
                <v-btn
                  icon="mdi-emoticon-happy"
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  @click="openEmojiPicker(charItem.id)"
                  title="Pick an emoji"
                />
              </div>
              <v-btn
                v-if="charactersToCount.length > 1"
                icon="mdi-minus-circle"
                size="x-small"
                color="error"
                variant="text"
                @click="removeCharacter(charItem.id)"
              />
            </div>
          </div>

          <v-btn
            color="secondary"
            size="small"
            variant="tonal"
            prepend-icon="mdi-plus-circle"
            @click="addCharacter"
            class="mb-2"
          >
            Add Character
          </v-btn>
          <v-btn color="primary" block prepend-icon="mdi-counter" @click="startCounting">
            Start Counting
          </v-btn>
        </div>

        <div v-else class="controls-section">
          <div class="stat-row">
            <span class="stat-label">Status:</span>
            <span class="stat-value counting">🟢 Counting</span>
          </div>

          <div class="character-counts">
            <div
              v-for="(charItem, index) in charactersToCount"
              :key="charItem.id"
              class="count-item"
            >
              <span class="char-label">Character '{{ charItem.char }}':</span>
              <span class="char-value">{{ charItem.count }}</span>
            </div>
          </div>

          <div class="button-group mt-2">
            <v-btn color="warning" size="small" prepend-icon="mdi-refresh" @click="resetCounter">
              Reset
            </v-btn>
            <v-btn color="error" size="small" prepend-icon="mdi-stop-circle" @click="stopCounting">
              Stop
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Emoji Picker Dialog (Global Overlay) -->
    <div v-if="showEmojiPicker" class="emoji-picker-overlay" @click="closeEmojiPicker">
      <div class="emoji-picker" @click.stop>
        <div class="emoji-picker-header">
          <span>Select an Emoji</span>
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="closeEmojiPicker" />
        </div>
        <div class="emoji-grid">
          <button
            v-for="emoji in popularEmojis"
            :key="emoji"
            class="emoji-button"
            @click="selectEmoji(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

import tmi from 'tmi.js'

definePageMeta({ layout: false })

/* === Routing / token === */
const route = useRoute()
const token = computed(() => route.query.token)
const scrollable = computed(() => route.query.scrollable !== 'false')
const showControls = computed(() => route.query.controls === 'true')

/* === Data === */
const projectId = ref(null)
const platforms = ref([])
const messages = ref([])

/* === Logging State === */
const isLogging = ref(false)
const loggingMessages = ref([])
const sessionStartTime = ref(null)
const sessionDuration = ref('00:00:00')
const showStopDialog = ref(false)
let durationInterval = null

/* === Character Counter State === */
const isCounting = ref(false)
const charactersToCount = ref([
  { id: 1, char: '1', count: 0 },
  { id: 2, char: '2', count: 0 },
])
let nextCharId = 3

const showEmojiPicker = ref(false)
const selectedCharId = ref(null)

// Popular emojis for quick selection
const popularEmojis = [
  '😀',
  '😃',
  '😄',
  '😁',
  '😅',
  '😂',
  '🤣',
  '😊',
  '😇',
  '🙂',
  '🙃',
  '😉',
  '😌',
  '😍',
  '🥰',
  '😘',
  '😗',
  '😙',
  '😚',
  '😋',
  '😛',
  '😝',
  '😜',
  '🤪',
  '🤨',
  '🧐',
  '🤓',
  '😎',
  '🤩',
  '🥳',
  '😏',
  '😒',
  '😞',
  '😔',
  '😟',
  '😕',
  '🙁',
  '😣',
  '😖',
  '😫',
  '😩',
  '🥺',
  '😢',
  '😭',
  '😤',
  '😠',
  '😡',
  '🤬',
  '🤯',
  '😳',
  '🥵',
  '🥶',
  '😱',
  '😨',
  '😰',
  '😥',
  '😓',
  '🤗',
  '🤔',
  '🤭',
  '🤫',
  '🤥',
  '😶',
  '😐',
  '😑',
  '😬',
  '🙄',
  '😯',
  '😦',
  '😧',
  '😮',
  '😲',
  '🥱',
  '😴',
  '🤤',
  '😪',
  '😵',
  '🤐',
  '🥴',
  '🤢',
  '🤮',
  '🤧',
  '😷',
  '🤒',
  '🤕',
  '🤑',
  '🤠',
  '😈',
  '👿',
  '👹',
  '👺',
  '🤡',
  '💩',
  '👻',
  '💀',
  '👽',
  '👾',
  '🤖',
  '🎃',
  '😺',
  '😸',
  '😹',
  '😻',
  '😼',
  '😽',
  '🙀',
  '😿',
  '😾',
  '❤️',
  '🧡',
  '💛',
  '💚',
  '💙',
  '💜',
  '🖤',
  '🤍',
  '🤎',
  '💔',
  '❣️',
  '💕',
  '💞',
  '💓',
  '💗',
  '💖',
  '💘',
  '💝',
  '💟',
  '☮️',
  '✝️',
  '☪️',
  '🕉️',
  '☸️',
  '✡️',
  '🔯',
  '🕎',
  '☯️',
  '☦️',
  '🛐',
  '⛎',
  '♈',
  '♉',
  '♊',
  '♋',
  '♌',
  '♍',
  '♎',
  '♏',
  '♐',
  '♑',
  '♒',
  '♓',
  '🆔',
  '⚛️',
  '🉑',
  '☢️',
  '☣️',
  '📴',
  '📳',
  '🈶',
  '🈚',
  '🈸',
  '🈺',
  '🈷️',
  '✴️',
  '🆚',
  '💮',
  '🉐',
  '㊙️',
  '㊗️',
  '🈴',
  '🈵',
  '🈹',
  '🈲',
  '🅰️',
  '🅱️',
  '🆎',
  '🆑',
  '🅾️',
  '🆘',
  '❌',
  '⭕',
  '🛑',
  '⛔',
  '📛',
  '🚫',
  '💯',
  '💢',
  '♨️',
  '🚷',
  '🚯',
  '🚳',
  '🚱',
  '🔞',
  '📵',
  '🚭',
  '❗',
  '❕',
  '❓',
  '❔',
  '‼️',
  '⁉️',
  '🔅',
  '🔆',
  '〽️',
  '⚠️',
  '🚸',
  '🔱',
  '⚜️',
  '🔰',
  '♻️',
  '✅',
  '🈯',
  '💹',
  '❇️',
  '✳️',
  '❎',
  '🌐',
  '💠',
  '🔰',
  '✔️',
  '🔥',
  '💧',
  '🌊',
  '🎵',
  '🎶',
  '⚡',
  '☀️',
  '⭐',
  '🌟',
  '✨',
  '🎉',
  '🎊',
  '🎈',
  '🎁',
  '🏆',
  '🥇',
  '🥈',
  '🥉',
  '⚽',
  '🏀',
  '🏈',
  '⚾',
  '🥎',
  '🎾',
  '🏐',
  '🏉',
  '🥏',
  '🎱',
  '🪀',
  '🏓',
  '👍',
  '👎',
  '👊',
  '✊',
  '🤛',
  '🤜',
  '🤞',
  '✌️',
  '🤟',
  '🤘',
  '👌',
  '🤌',
  '🤏',
  '👈',
  '👉',
  '👆',
  '👇',
  '☝️',
  '✋',
  '🤚',
  '🖐️',
  '🖖',
  '👋',
  '🤙',
  '💪',
  '🦾',
  '🖕',
  '✍️',
  '🙏',
  '🦶',
]

const totalCharacterCount = computed(() => {
  return charactersToCount.value.reduce((sum, item) => sum + item.count, 0)
})

/* === Scroll state === */
const scrollContainer = ref(null)
const isPaused = ref(false)
const autoScroll = ref(true)
const userInteracted = ref(false)
let lastScrollTop = 0
let userIntentTimeout = null
let scrollCheckTimeout = null

/* Check if scrolled to bottom */
function isAtBottom(el, threshold = 10) {
  if (!el) return false
  const scrollBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  return scrollBottom <= threshold
}

/* Scroll to bottom */
async function scrollToBottom(smooth = false) {
  await nextTick()
  const el = scrollContainer.value
  if (!el) return
  if (smooth) {
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  } else {
    el.scrollTop = el.scrollHeight
  }
}

/* Mark real user interaction */
function markUserIntent() {
  userInteracted.value = true
  clearTimeout(userIntentTimeout)
  userIntentTimeout = setTimeout(() => {
    userInteracted.value = false
  }, 800)
}

/* Scroll handler */
function onScroll() {
  const el = scrollContainer.value
  if (!el) return

  const currentTop = el.scrollTop
  const atBottom = isAtBottom(el)
  const scrollingUp = currentTop < lastScrollTop - 2

  lastScrollTop = currentTop

  if (!scrollPauseEnabled.value) return
  if (!userInteracted.value) return

  if (scrollingUp && !atBottom) {
    isPaused.value = true
    autoScroll.value = false
  }

  if (atBottom && isPaused.value) {
    isPaused.value = false
    autoScroll.value = true
  }
}

/* Resume button handler */
async function resumeChat() {
  isPaused.value = false
  autoScroll.value = true
  await scrollToBottom(true)
}

/* Lifecycle */
onMounted(async () => {
  await scrollToBottom(false)
  const el = scrollContainer.value
  if (!el) return

  lastScrollTop = el.scrollTop

  el.addEventListener('wheel', markUserIntent, { passive: true })
  el.addEventListener('touchstart', markUserIntent, { passive: true })
  el.addEventListener('touchmove', markUserIntent, { passive: true })
  el.addEventListener('mousedown', markUserIntent, { passive: true })
})

onBeforeUnmount(() => {
  clearTimeout(userIntentTimeout)
  clearTimeout(scrollCheckTimeout)
  if (durationInterval) clearInterval(durationInterval)
})

/* Auto-scroll new messages - ONLY when not paused */
watch(
  () => messages.value.length,
  async (newLength, oldLength) => {
    const el = scrollContainer.value
    if (!el) return

    if (oldLength === 0) {
      await scrollToBottom(false)
      return
    }

    if (!scrollPauseEnabled.value) {
      await scrollToBottom(false)
      return
    }

    if (isPaused.value && !autoScroll.value) {
      return
    }

    if (autoScroll.value && !isPaused.value) {
      await scrollToBottom(false)
    }
  }
)

/* === Fetch project data === */
const { data } = await useFetch(
  () => (token.value ? `/api/chatview?token=${encodeURIComponent(token.value)}` : null),
  { key: () => `chatview:${token.value || 'none'}` }
)
if (!token.value) console.warn('[chatview] Missing ?token=')

const scrollPauseEnabled = computed(() => data.value?.enableScrollPause !== false)

/* === Logging Controls === */
function startLogging() {
  isLogging.value = true
  loggingMessages.value = []
  sessionStartTime.value = Date.now()

  durationInterval = setInterval(() => {
    const elapsed = Date.now() - sessionStartTime.value
    const hours = Math.floor(elapsed / 3600000)
    const minutes = Math.floor((elapsed % 3600000) / 60000)
    const seconds = Math.floor((elapsed % 60000) / 1000)
    sessionDuration.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }, 1000)
}

function stopLogging() {
  isLogging.value = false
  if (durationInterval) {
    clearInterval(durationInterval)
    durationInterval = null
  }
}

function confirmStopLogging() {
  showStopDialog.value = false
  stopLogging()
}

function logMessage(msg) {
  if (!isLogging.value) return

  loggingMessages.value.push({
    timestamp: new Date().toISOString(),
    platform: msg.platform,
    user: msg.user,
    message: msg.html?.replace(/<[^>]*>/g, '') || '',
    country: msg.country || '',
    color: msg.color || '',
  })
}

/* === Character Counter Controls === */
function addCharacter() {
  charactersToCount.value.push({
    id: nextCharId++,
    char: '',
    count: 0,
  })
}

function removeCharacter(id) {
  if (charactersToCount.value.length > 1) {
    charactersToCount.value = charactersToCount.value.filter((item) => item.id !== id)
  }
}

function openEmojiPicker(charId) {
  selectedCharId.value = charId
  showEmojiPicker.value = true
}

function closeEmojiPicker() {
  showEmojiPicker.value = false
  selectedCharId.value = null
}

function selectEmoji(emoji) {
  const charItem = charactersToCount.value.find((item) => item.id === selectedCharId.value)
  if (charItem) {
    charItem.char = emoji
  }
  closeEmojiPicker()
}

function startCounting() {
  isCounting.value = true
  // Reset all counts to 0 when starting
  charactersToCount.value.forEach((item) => {
    item.count = 0
  })
}

function stopCounting() {
  isCounting.value = false
}

function resetCounter() {
  charactersToCount.value.forEach((item) => {
    item.count = 0
  })
}

function countCharactersInMessage(text) {
  if (!isCounting.value) return

  // Strip HTML tags to count only actual text content
  const cleanText = text.replace(/<[^>]*>/g, '')

  // Iterate through each character to count
  for (let item of charactersToCount.value) {
    if (!item.char) continue // Skip empty characters

    // Try multiple matching strategies for emoji compatibility
    const searchChar = item.char

    // Count occurrences using different methods
    // Method 1: Direct string search (works for most emojis)
    const directMatches = (cleanText.match(new RegExp(escapeRegex(searchChar), 'g')) || []).length

    // Method 2: Normalize and compare
    const normalizedSearch = searchChar.normalize('NFC')
    const normalizedMatches = (
      cleanText.normalize('NFC').match(new RegExp(escapeRegex(normalizedSearch), 'g')) || []
    ).length

    // Method 3: Check without variation selectors
    const withoutVariation = searchChar.replace(/\uFE0F/g, '')
    const withoutVariationMatches = (
      cleanText.replace(/\uFE0F/g, '').match(new RegExp(escapeRegex(withoutVariation), 'g')) || []
    ).length

    // Use the maximum count found
    const maxCount = Math.max(directMatches, normalizedMatches, withoutVariationMatches)
    item.count += maxCount
  }
}

// Helper function to escape special regex characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function downloadJSON() {
  const data = {
    sessionStart: new Date(sessionStartTime.value).toISOString(),
    sessionDuration: sessionDuration.value,
    messageCount: loggingMessages.value.length,
    messages: loggingMessages.value,
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chat-log-${new Date(sessionStartTime.value).toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function downloadCSV() {
  const headers = ['Timestamp', 'Platform', 'User', 'Message', 'Country']
  const rows = loggingMessages.value.map((m) => [
    m.timestamp,
    m.platform,
    m.user,
    `"${m.message.replace(/"/g, '""')}"`,
    m.country,
  ])

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chat-log-${new Date(sessionStartTime.value).toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* === User color / icon helpers === */
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
const platformIcons = { twitch: 'mdi-twitch', youtube: 'mdi-youtube', instagram: 'mdi-instagram' }
const platformColor = (p) =>
  p === 'twitch'
    ? 'text-purple'
    : p === 'youtube'
      ? 'text-red'
      : p === 'instagram'
        ? 'text-pink'
        : p === 'tiktok'
          ? 'text-cyan'
          : ''

function countryFlag(code) {
  if (!code) return ''
  return code.toUpperCase().replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
}

/* === YouTube === */
async function getLiveId(handle) {
  try {
    const res = await $fetch('/api/youtube-liveid', { params: { handle } })
    return res?.liveVideoId || null
  } catch (e) {
    console.warn('Could not fetch liveId for', handle, e)
    return null
  }
}
function connectYouTubeSSE(liveVideoId, account) {
  const src = new EventSource(`/api/youtube-chat/${liveVideoId}`)
  src.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    const cleanUser = msg.user?.replace(/^@/, '') || msg.user
    const message = {
      platform: 'youtube',
      country: account.country || '',
      user: cleanUser,
      html: msg.message,
      color: '#ff0000',
      timestamp: msg.timestamp || Date.now(),
    }
    messages.value.push(message)
    logMessage(message)
    countCharactersInMessage(message.html)
  }
  src.onerror = (e) => console.warn('YouTube SSE error', e)
  src.addEventListener('end', () => src.close())
  onBeforeUnmount(() => src.close())
}

/* === Connect platforms === */
watchEffect(async () => {
  if (import.meta.server) return
  if (!data.value?.platforms?.length) return

  platforms.value = data.value.platforms
  const sources = []

  /* Twitch */
  const twitchAccounts = platforms.value
    .filter((p) => p.type === 'twitch')
    .map((p) => p.username.toLowerCase())
  if (twitchAccounts.length) {
    const client = new tmi.Client({ connection: { reconnect: true }, channels: twitchAccounts })
    client.connect()
    const escapeHtml = (s) =>
      s.replace(
        /[&<>\"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]
      )
    const parseEmotes = (msg, emotes) => {
      if (!emotes) return escapeHtml(msg)
      const reps = []
      Object.entries(emotes).forEach(([id, positions]) =>
        positions.forEach((p) => {
          const [a, b] = p.split('-').map(Number)
          const code = msg.substring(a, b + 1)
          reps.push({ a, b, id, code })
        })
      )
      reps.sort((a, b) => b.a - a.a)
      let res = msg
      for (const { a, b, id, code } of reps)
        res =
          res.slice(0, a) +
          `<img src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0" alt="${code}" class="emote"/>` +
          res.slice(b + 1)
      return res
    }
    client.on('message', (channel, tags, message, self) => {
      if (self) return
      const html = parseEmotes(message, tags.emotes)
      const platformData = platforms.value.find(
        (p) =>
          p.type === 'twitch' && p.username.toLowerCase() === channel.replace('#', '').toLowerCase()
      )
      const country = platformData?.country || ''
      const color = tags.color || getUserColor(tags.username)
      const msg = {
        platform: 'twitch',
        country,
        channel,
        user: tags['display-name'] || tags.username,
        color,
        html,
        timestamp: Date.now(),
      }
      messages.value.push(msg)
      logMessage(msg)
      countCharactersInMessage(msg.html)
    })
    onBeforeUnmount(() => client.disconnect())
  }

  /* YouTube */
  const youtubeAccounts = platforms.value.filter((p) => p.type === 'youtube')
  for (const account of youtubeAccounts) {
    const liveId = await getLiveId(account.username)
    if (liveId) connectYouTubeSSE(liveId, account)
  }

  /* TikTok */
  const tiktokAccounts = platforms.value.filter((p) => p.type === 'tiktok')
  for (const account of tiktokAccounts) {
    const username = account.username.toLowerCase()
    let src = new EventSource(`https://tiktok-relay.onrender.com/tiktok/${username}/sse`)
    const setup = () => {
      const recent = new Set()
      src.onmessage = (e) => {
        const msg = JSON.parse(e.data)
        const key = `${msg.user}-${msg.message}`
        if (recent.has(key)) return
        recent.add(key)
        if (recent.size > 200) recent.delete(recent.values().next().value)
        const message = {
          platform: 'tiktok',
          country: account.country || '',
          user: msg.user,
          html: msg.message,
          color: msg.color,
          timestamp: msg.timestamp,
        }
        messages.value.push(message)
        logMessage(message)
        countCharactersInMessage(message.html)
      }
      src.onerror = () => {
        src.close()
        setTimeout(() => {
          src = new EventSource(`https://tiktok-relay.onrender.com/tiktok/${username}/sse`)
          setup()
        }, 5000)
      }
    }
    setup()
    sources.push(src)
  }

  onBeforeUnmount(() => sources.forEach((s) => s.close()))
})
</script>

<style scoped>
.chat-container {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: transparent;
  color: white;
  font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  pointer-events: none;
}

.chat-scroll {
  flex: 1;
  overflow-y: auto;
  pointer-events: auto;
  padding: 1rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.chat-scroll.scroll-disabled {
  overflow-y: hidden;
}

.chat-inner {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  justify-content: flex-end;
}

/* Pause button */
.paused-button {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: auto;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* === Chat line styling === */
.chat-line {
  display: flex;
  align-items: flex-start;
  gap: 0.32rem;
  font-size: 1.9rem;
  line-height: 1.35;
  letter-spacing: -0.01em;
  opacity: 0.95;
  animation: fade-in 0.25s ease forwards;
  margin-bottom: 0.1rem;
}

.chat-line strong {
  white-space: nowrap;
  display: inline-block;
  margin-right: 0.25rem;
  font-weight: 600;
}

.chat-line span[v-html] {
  display: inline;
  word-break: break-word;
  overflow-wrap: anywhere;
}
.chat-line > * {
  align-self: flex-start;
}

.chat-line :deep(.v-icon),
.chat-line .icon-svg,
.chat-line .flag {
  flex-shrink: 0;
  display: inline-block;
  width: 0.95em;
  height: 0.95em;
  vertical-align: baseline;
  transform: translateY(0.15em);
}

.chat-line :deep(.v-icon) {
  font-size: 0.95em !important;
  line-height: 1;
}
.chat-line :deep(.v-icon svg) {
  width: 1em;
  height: 1em;
}

.chat-line .icon-svg {
  filter: brightness(0) invert(1);
}

.chat-line .flag {
  font-size: 0.95em;
  line-height: 1;
  margin-right: 0.05rem;
}

.emote {
  vertical-align: middle;
  height: 1.5em;
  margin: 0 0.1em;
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

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 0.95;
    transform: translateY(0);
  }
}

:global(html),
:global(body) {
  overflow: hidden;
  height: 100%;
  /* Prevent text size adjustments on mobile */
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
}

/* Ensure proper mobile viewport */
@media (max-width: 768px) {
  :global(html),
  :global(body) {
    position: fixed;
    width: 100%;
  }
}

/* === Logging Controls Panel === */
.controls-panel {
  position: fixed;
  top: 1rem;
  right: 1rem;
  width: 280px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  pointer-events: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

/* === Character Counter Panel === */
.counter-panel {
  position: fixed;
  top: 1rem;
  left: 1rem;
  width: 280px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  pointer-events: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .controls-panel {
    top: 0.5rem;
    right: 0.5rem;
    left: auto;
    width: auto;
    max-width: 320px;
  }

  .counter-panel {
    top: auto;
    bottom: 0.5rem;
    left: 0.5rem;
    right: 0.5rem;
    width: auto;
    max-width: 320px;
    margin: 0 auto;
  }

  .chat-scroll {
    padding: 0.5rem;
  }

  .chat-line {
    font-size: 1.3rem;
  }

  .paused-button {
    bottom: 0.5rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .controls-panel,
  .counter-panel {
    width: calc(100vw - 1rem);
    max-width: none;
  }

  .chat-line {
    font-size: 1.1rem;
    gap: 0.2rem;
  }

  .chat-line strong {
    font-size: 0.9em;
  }

  .chat-scroll {
    padding: 0.25rem;
  }
}

/* Extra small devices (iPhone SE, etc - 375px and below) */
@media (max-width: 400px) {
  .chat-line {
    font-size: 1rem;
    gap: 0.15rem;
    line-height: 1.3;
  }

  .chat-line strong {
    font-size: 0.85em;
    margin-right: 0.15rem;
  }

  .chat-scroll {
    padding: 0.25rem;
  }

  .chat-line :deep(.v-icon),
  .chat-line .icon-svg,
  .chat-line .flag {
    width: 0.85em;
    height: 0.85em;
  }

  .emote {
    height: 1.3em;
  }
}

/* Landscape mobile */
@media (max-height: 500px) and (orientation: landscape) {
  .controls-panel,
  .counter-panel {
    top: 0.25rem;
    width: 240px;
    font-size: 0.85rem;
  }

  .counter-panel {
    left: 0.25rem;
  }

  .controls-header {
    padding: 0.5rem 0.75rem;
  }

  .controls-body {
    padding: 0.75rem;
  }

  .stat-row {
    font-size: 0.75rem;
  }
}

.controls-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 600;
  font-size: 0.9rem;
}

.controls-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.controls-body {
  padding: 1rem;
}

.controls-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  font-size: 0.85rem;
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
}

.stat-value {
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.stat-value.recording {
  color: #ff4444;
  animation: pulse 2s ease-in-out infinite;
}

.stat-value.counting {
  color: #44ff44;
  animation: pulse 2s ease-in-out infinite;
}

.download-buttons {
  display: flex;
  gap: 0.5rem;
}

.download-buttons .v-btn {
  flex: 1;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.button-group .v-btn {
  flex: 1;
}

/* Character counter specific styles */
.character-inputs {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  min-width: 90px;
  flex-shrink: 0;
}

.input-with-emoji {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.char-input {
  width: 50px;
  height: 35px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  text-align: center;
  font-size: 1.2rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  transition: all 0.2s ease;
}

.char-input:focus {
  outline: none;
  border-color: #4fc3f7;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 2px rgba(79, 195, 247, 0.2);
}

.char-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

/* Emoji Picker Styles */
.emoji-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
  pointer-events: auto;
}

/* Confirmation Dialog Styles */
.confirmation-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  backdrop-filter: blur(6px);
  pointer-events: auto;
}

.confirmation-dialog {
  background: rgba(20, 20, 20, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

.confirmation-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 600;
  font-size: 1.1rem;
  color: #ffcc00;
}

.confirmation-body {
  padding: 1.5rem;
}

.confirmation-body p {
  margin: 0 0 1rem 0;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
}

.confirmation-body p:last-of-type {
  margin-bottom: 1.5rem;
}

.confirmation-body strong {
  color: #4fc3f7;
  font-weight: 600;
}

.dialog-download-buttons {
  margin-bottom: 1rem;
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.emoji-picker {
  background: rgba(20, 20, 20, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.emoji-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 600;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
  gap: 0.25rem;
  padding: 1rem;
  overflow-y: auto;
}

.emoji-button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
}

.emoji-button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #4fc3f7;
  transform: scale(1.1);
}

.emoji-button:active {
  transform: scale(0.95);
}

.character-counts {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0.75rem 0;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.count-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
  font-size: 0.9rem;
}

.count-item.total {
  margin-top: 0.25rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-weight: 700;
}

.char-label {
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

.char-value {
  font-weight: 700;
  font-family: 'Courier New', monospace;
  font-size: 1.1em;
  color: #4fc3f7;
}

.count-item.total .char-value {
  color: #ffd700;
  font-size: 1.2em;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
