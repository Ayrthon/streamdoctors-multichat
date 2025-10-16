import { createError, defineEventHandler, readBody } from 'h3'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { projectId, uid, platforms } = body || {}

  if (!projectId || !uid) {
    throw createError({ statusCode: 400, message: 'Missing projectId or uid' })
  }

  const config = useRuntimeConfig()

  const token = jwt.sign({ projectId, uid, platforms }, config.jwtSecret, { expiresIn: '2h' })

  return { token }
})
