// app/server/api/token.post.js
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { projectId, uid } = body || {}

  if (!projectId || !uid) {
    throw createError({ statusCode: 400, message: 'Missing projectId or uid' })
  }

  const secret = process.env.JWT_SECRET || 'dev-secret-key'
  const token = jwt.sign({ projectId, uid }, secret, { expiresIn: '2h' })

  return { token }
})
