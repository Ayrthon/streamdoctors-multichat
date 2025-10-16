import { WebcastPushConnection } from 'tiktok-live-connector'

export default defineEventHandler(async (event) => {
  const { username } = event.context.params
  if (!username) {
    return new Response('Missing username', { status: 400 })
  }

  // Create a new ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const cleanUsername = username.replace(/^@/, '')
      const connection = new WebcastPushConnection(cleanUsername)

      console.log(`🎥 Connecting to TikTok chat for @${cleanUsername}`)

      connection
        .connect()
        .then((state) => {
          console.log(`✅ Connected to roomId ${state.roomId}`)
        })
        .catch((err) => {
          console.error('❌ TikTok connect failed:', err)
          controller.enqueue(`data: ${JSON.stringify({ error: 'TikTok connect failed' })}\n\n`)
          controller.close()
        })

      // Handle incoming chat messages
      connection.on('chat', (msg) => {
        const payload = {
          user: msg.uniqueId,
          message: msg.comment,
          color: '#00f2ea',
          timestamp: Date.now(),
        }
        controller.enqueue(`data: ${JSON.stringify(payload)}\n\n`)
      })

      // Handle disconnects or errors
      connection.on('disconnected', () => {
        console.log(`🛑 Disconnected from @${cleanUsername}`)
        controller.close()
      })

      connection.on('error', (err) => {
        console.error('⚠️ TikTok chat error:', err)
      })
    },
  })

  // ✅ Proper SSE response headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable buffering on proxies like Nginx
    },
  })
})
