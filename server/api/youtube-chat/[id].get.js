// /server/api/youtube-chat/[id].get.js
import { LiveChat } from 'youtube-chat'

export default defineEventHandler(async (event) => {
  const { id } = event.context.params // YouTube liveVideoId

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      try {
        const chat = new LiveChat({ liveId: id })

        chat.on('start', () => {
          console.log(`✅ Connected to YouTube chat ${id}`)
          controller.enqueue(encoder.encode(`event: start\ndata: "connected"\n\n`))
        })

        chat.on('chat', (item) => {
          const payload = JSON.stringify({
            user: item.author.name,
            message: item.message.map((m) => m.text || '').join(' '),
            timestamp: item.timestamp,
          })
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
        })

        chat.on('error', (err) => {
          console.error('YouTube chat error:', err)
          controller.enqueue(encoder.encode(`event: error\ndata: "error"\n\n`))
        })

        chat.on('end', () => {
          controller.enqueue(encoder.encode(`event: end\ndata: "stopped"\n\n`))
          controller.close()
        })

        chat.start()
      } catch (err) {
        controller.enqueue(encoder.encode(`event: error\ndata: "failed to start YouTube chat"\n\n`))
        controller.close()
      }
    },
    cancel() {
      console.log(`🛑 SSE connection closed for ${id}`)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
})
