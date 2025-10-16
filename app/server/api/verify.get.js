// ~/server/api/verify.get.js
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const token = getQuery(event).token
  if (!token) throw createError({ statusCode: 401, message: 'Token required' })

  const secret = process.env.JWT_SECRET || 'dev-secret-key'

  try {
    const decoded = jwt.verify(token, secret)
    return decoded // contains { projectId, uid, iat, exp }
  } catch (err) {
    throw createError({ statusCode: 403, message: 'Invalid or expired token' })
  }
})
