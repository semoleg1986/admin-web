import { ensureAccessToken, fetchWithAuthRetry, isAdminToken } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const token = await ensureAccessToken(event)
  if (!isAdminToken(token)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin role required' })
  }

  const config = useRuntimeConfig()

  try {
    return await fetchWithAuthRetry(event, `${config.userChildrenServiceUrl}/v1/admin/users`, {
      method: 'GET'
    })
  } catch (err: unknown) {
    const code
      = typeof err === 'object'
        && err !== null
        && 'cause' in err
        && typeof (err as { cause?: unknown }).cause === 'object'
        && (err as { cause?: unknown }).cause !== null
        && 'code' in ((err as { cause?: unknown }).cause as object)
        ? ((err as { cause?: { code?: string } }).cause?.code ?? '')
        : ''
    const message
      = typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message?: unknown }).message ?? '')
        : ''
    if (code === 'ECONNREFUSED' || message === 'fetch failed') {
      throw createError({ statusCode: 503, statusMessage: 'Admin upstream is unavailable' })
    }
    throw err
  }
})
