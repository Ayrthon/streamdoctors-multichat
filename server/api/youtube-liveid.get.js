// server/api/youtube-liveid.get.js
export default defineEventHandler(async (event) => {
  const { handle } = getQuery(event)
  if (!handle) return { error: 'Missing handle' }

  try {
    // Normalize handle (remove @ if included)
    const cleanHandle = handle.replace(/^@/, '').trim()

    // Fetch YouTube live page HTML
    const res = await fetch(`https://www.youtube.com/@${cleanHandle}/live`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
    })

    const html = await res.text()

    // Look for "videoId":"XXXXXXXXXXX" pattern in the HTML
    const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/)
    const liveVideoId = match ? match[1] : null

    if (liveVideoId) {
      console.log(`✅ YouTube: ${handle} is LIVE → ${liveVideoId}`)
      return { liveVideoId }
    } else {
      console.log(`❌ YouTube: ${handle} is NOT live`)
      return { liveVideoId: null }
    }
  } catch (err) {
    console.error('❌ YouTube liveId fetch failed:', err)
    return { liveVideoId: null, error: 'Failed to fetch live stream info' }
  }
})
