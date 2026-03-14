import { requireAdminToken } from '~~/server/utils/admin'
import { fetchWithAuthRetry } from '~~/server/utils/auth'
import { ensureUuid } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  await requireAdminToken(event)

  const userId = event.context.params?.userId
  const tokenId = event.context.params?.tokenId
  if (!userId || !tokenId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing userId or tokenId' })
  }
  ensureUuid(userId, 'userId')
  ensureUuid(tokenId, 'tokenId')

  const config = useRuntimeConfig()
  try {
    await fetchWithAuthRetry(event, `${config.authServiceUrl}/v1/admin/users/${userId}/sessions/${tokenId}/revoke`, {
      method: 'POST'
    })
    return { ok: true }
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
      throw createError({ statusCode: 503, statusMessage: 'Auth upstream is unavailable' })
    }
    throw err
  }
})
