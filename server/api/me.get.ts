import { getAccessToken, getRolesFromJwt, getUserIdFromJwt, isAdminToken } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const token = getAccessToken(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

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
