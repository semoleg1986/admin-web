import { ensureAccessToken, getRolesFromJwt, getUserIdFromJwt, isAdminToken } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const token = await ensureAccessToken(event)

  const userId = getUserIdFromJwt(token)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }

  return {
    user_id: userId,
    roles: getRolesFromJwt(token),
    is_admin: isAdminToken(token)
  }
})
