// server/api/youtube-liveid.get.js
export default defineEventHandler(async (event) => {
  const { handle } = getQuery(event)
  const config = useRuntimeConfig()

  if (!handle) return { error: 'Missing handle' }

  try {
    const fixedHandle = handle.startsWith('@') ? handle : '@' + handle

    // Step 1: Get channel ID
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${fixedHandle}&key=${config.youtubeApiKey}`
    )
    const channelData = await channelRes.json()

    const channelId = channelData?.items?.[0]?.id
    if (!channelId) return { error: 'Channel not found' }

    // Step 2: Find live broadcast
    const liveRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&eventType=live&type=video&key=${config.youtubeApiKey}`
    )
    const liveData = await liveRes.json()
    const liveVideoId = liveData?.items?.[0]?.id?.videoId || null

    return { channelId, liveVideoId }
  } catch (err) {
    console.error('YouTube API error:', err)
    return { error: 'Failed to fetch liveId' }
  }
})
