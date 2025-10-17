// /server/api/chatview.get.js
import { firestoreAdmin } from '../utils/firebaseAdmin'

export default defineEventHandler(async (event) => {
  const token = getQuery(event).token
  if (!token) {
    throw createError({ statusCode: 400, message: 'Missing token' })
  }

  try {
    // ✅ Lookup by token directly in publicProjects
    const projectRef = firestoreAdmin.collection('publicProjects').doc(token)
    const snap = await projectRef.get()

    if (!snap.exists) {
      throw createError({ statusCode: 404, message: 'Invalid token' })
    }

    const data = snap.data()

    return {
      projectId: data.projectId,
      uid: data.uid,
      name: data.name || '',
      platforms: data.platforms || [],
    }
  } catch (err) {
    console.error('[API:chatview.get]', err)
    throw createError({
      statusCode: 500,
      message: 'Failed to load project via token',
    })
  }
})
