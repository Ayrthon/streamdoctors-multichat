// server/api/verify.get.js
import { createError, defineEventHandler, getQuery } from 'h3'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const { token } = getQuery(event)

  if (!token) {
    throw createError({ statusCode: 400, message: 'Missing token' })
  }

  const config = useRuntimeConfig()

  try {
    const decoded = jwt.verify(token, config.jwtSecret)

    // You can limit what data goes back to the client
    const { projectId, uid, platforms } = decoded

    return { projectId, uid, platforms }
  } catch (err) {
    console.error('Token verification failed:', err)
    throw createError({ statusCode: 403, message: 'Invalid or expired token' })
  }
})
