import { ensureAccessToken, isAdminToken } from '~~/server/utils/auth'

export async function requireAdminToken(
  event: Parameters<typeof ensureAccessToken>[0]
): Promise<string> {
  const token = await ensureAccessToken(event)
  if (!isAdminToken(token)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin role required' })
  }
  return token
}
