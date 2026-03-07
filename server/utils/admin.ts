import { getAccessToken, isAdminToken } from '~~/server/utils/auth'

export function requireAdminToken(event: Parameters<typeof getAccessToken>[0]): string {
  const token = getAccessToken(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (!isAdminToken(token)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin role required' })
  }
  return token
}
