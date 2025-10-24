import { WebcastPushConnection } from 'tiktok-live-connector'

// 🧠 Global connection pool (username → { connection, clients, ... })
const connectionPool = new Map()

// 🧠 Global dedupe cache (username → Set of message IDs)
const recentCache = new Map()

// 🧹 Dev hot reload cleanup
if (process.env.NODE_ENV === 'development') {
  connectionPool.clear()
  recentCache.clear()
  console.log('🧹 Dev mode: cleared old TikTok connections and caches')
}

export default defineEventHandler(async (event) => {
  const { username } = event.context.params
  if (!username) return new Response('Missing username', { status: 400 })

  const cleanUsername = username.replace(/^@/, '')

  const accountId = process.env.EULERSTREAM_ACCOUNT_ID || process.env.VITE_EULERSTREAM_ACCOUNT_ID
  const secret =
    process.env.EULERSTREAM_WEBHOOK_SECRET || process.env.VITE_EULERSTREAM_WEBHOOK_SECRET

  if (!accountId || !secret) {
    console.error('❌ Missing EulerStream credentials in .env')
    return new Response('Server misconfigured: missing API key', { status: 500 })
  }

  const signServer = { endpoint: 'https://sign.eulerstream.com', accountId, secret }

  // Get or create shared connection for this username
  let shared = connectionPool.get(cleanUsername)
  if (!shared) {
    console.log(`⚡ Creating new TikTok connection for @${cleanUsername}`)

    const connection = new WebcastPushConnection(cleanUsername, { signServer })
    const clients = new Set()

    connection._listenersRegistered = false

    shared = {
      connection,
      clients,
      timeout: null,
      backoff: 0,
      connecting: false,
      lastConnect: 0,
    }

    connectionPool.set(cleanUsername, shared)

    // ---- Helper: try to connect ----
    async function tryConnect() {
      if (shared.connecting || connection.isConnected) {
        console.log(`⏸ Already connecting/connected for @${cleanUsername}`)
        return
      }

      const now = Date.now()
      if (now - shared.lastConnect < 5000) {
        console.log(`🕐 Skipping reconnect for @${cleanUsername} (too soon)`)
        return
      }

      shared.connecting = true
      shared.lastConnect = now

      try {
        console.log(`🔌 Connecting to @${cleanUsername}...`)
        await connection.connect()
        console.log(`✅ Connected to @${cleanUsername}`)
        shared.backoff = 0
      } catch (err) {
        const reason = err?.reason || err?.message || 'Unknown error'
        console.error(`❌ TikTok connect failed for @${cleanUsername}:`, reason)

        if (reason.toLowerCase().includes('rate_limit')) {
          shared.backoff = Math.min((shared.backoff || 10) * 2, 3600)
          console.warn(`⏳ Rate-limited, next retry in ${shared.backoff}s`)
        } else {
          shared.backoff = Math.min((shared.backoff || 5) * 2, 120)
        }

        setTimeout(tryConnect, shared.backoff * 1000)
      } finally {
        shared.connecting = false
      }
    }

    // ---- Bind events (only once per username) ----
    if (!connection._listenersRegistered) {
      connection._listenersRegistered = true

      // 🧠 Deduplication cache for recent message IDs
      const recentMsgIds = recentCache.get(cleanUsername) || new Set()
      recentCache.set(cleanUsername, recentMsgIds)
      const MAX_CACHE_SIZE = 300

      connection.on('chat', (msg) => {
        const msgId = msg.msgId || `${msg.uniqueId}-${msg.comment}-${Math.floor(Date.now() / 1000)}`
        if (recentMsgIds.has(msgId)) return
        recentMsgIds.add(msgId)

        // 🧹 Keep cache small (FIFO)
        if (recentMsgIds.size > MAX_CACHE_SIZE) {
          const first = recentMsgIds.values().next()
          if (!first.done) recentMsgIds.delete(first.value)
        }

        const payload = {
          user: msg.uniqueId,
          message: msg.comment,
          color: '#00f2ea',
          timestamp: Date.now(),
        }

        const data = `data: ${JSON.stringify(payload)}\n\n`
        for (const client of shared.clients) {
          try {
            client.enqueue(data)
          } catch {}
        }
      })

      connection.on('disconnected', () => {
        console.log(`🛑 Disconnected from @${cleanUsername}`)
        if (shared.clients.size > 0) {
          console.log(`🔁 Reconnecting in 15s for @${cleanUsername}`)
          setTimeout(tryConnect, 15000)
        } else {
          console.log(`💤 No clients left, cleaning up @${cleanUsername}`)
          connectionPool.delete(cleanUsername)
          recentCache.delete(cleanUsername)
        }
      })

      connection.on('error', (err) => {
        console.error(`⚠️ TikTok chat error for @${cleanUsername}:`, err)
      })
    }

    // Initial connect
    tryConnect()
  }

  // ---- SSE stream for new client ----
  const stream = new ReadableStream({
    start(controller) {
      shared.clients.add(controller)
      console.log(`👤 Client connected to @${cleanUsername} (${shared.clients.size} active)`)

      // cancel cleanup timeout
      if (shared.timeout) {
        clearTimeout(shared.timeout)
        shared.timeout = null
      }

      // Detect when client disconnects (page refresh, close, etc.)
      event.node.res.on('close', () => {
        shared.clients.delete(controller)
        console.log(`👋 Client left @${cleanUsername} (${shared.clients.size} left)`)

        // No active viewers? disconnect in 60s
        if (shared.clients.size === 0) {
          shared.timeout = setTimeout(() => {
            console.log(`🕐 No clients for @${cleanUsername}, disconnecting after 60s idle`)
            shared.connection.disconnect()
            connectionPool.delete(cleanUsername)
          }, 60000)
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
})
