// server/api/youtube-liveid.get.js
export default defineEventHandler(async (event) => {
  const { handle } = getQuery(event)
  const config = useRuntimeConfig()

  if (!handle) return { error: 'Missing handle' }

  // Normalize user input
  let query = handle.trim()
  let channelId = null
  let liveVideoId = null

  try {
    // 1️⃣ Handle full YouTube URLs or channel IDs gracefully
    if (query.startsWith('http')) {
      // Extract handle or ID from URL
      const url = new URL(query)
      const path = url.pathname.replace(/^\/+|\/+$/g, '') // remove leading/trailing slashes

      if (path.startsWith('@')) {
        query = path // @handle
      } else if (path.startsWith('channel/')) {
        channelId = path.replace('channel/', '')
      } else if (path.startsWith('c/') || path.startsWith('user/')) {
        query = path.split('/')[1]
      }
    }

    // 2️⃣ If not a channel ID, resolve it
    if (!channelId) {
      // If user typed without '@', add it for API
      const fixedHandle = query.startsWith('@') ? query : '@' + query

      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${fixedHandle}&key=${config.youtubeApiKey}`
      )

      const channelData = await channelRes.json()
      channelId = channelData?.items?.[0]?.id
    }

    if (!channelId) return { error: `Channel not found for ${handle}` }

    // 3️⃣ Get current live broadcast
    const liveRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&eventType=live&type=video&key=${config.youtubeApiKey}`
    )
    const liveData = await liveRes.json()

    liveVideoId = liveData?.items?.[0]?.id?.videoId || null

    return { channelId, liveVideoId }
  } catch (err) {
    console.error('YouTube API error:', err)
    return { error: 'Failed to fetch liveId' }
  }
})
