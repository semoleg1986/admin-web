import { getQuery } from 'h3'
import { getAccessToken, isAdminToken } from '~~/server/utils/auth'
import { ensureUuid } from '~~/server/utils/validation'

function validateIsoDateTime(value: string, field: string): string {
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    throw createError({ statusCode: 422, statusMessage: `Field '${field}' must be a valid ISO datetime` })
  }
  return new Date(timestamp).toISOString()
}

export default defineEventHandler(async (event) => {
  const token = getAccessToken(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (!isAdminToken(token)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin role required' })
  }

  const query = getQuery(event)
  const params = new URLSearchParams()

  if (typeof query.actor_id === 'string' && query.actor_id.trim()) {
    ensureUuid(query.actor_id, 'actor_id')
    params.set('actor_id', query.actor_id)
  }
  if (typeof query.action === 'string' && query.action.trim()) {
    params.set('action', query.action.trim())
  }
  if (typeof query.target_type === 'string' && query.target_type.trim()) {
    params.set('target_type', query.target_type.trim())
  }
  if (typeof query.from === 'string' && query.from.trim()) {
    params.set('from', validateIsoDateTime(query.from, 'from'))
  }
  if (typeof query.to === 'string' && query.to.trim()) {
    params.set('to', validateIsoDateTime(query.to, 'to'))
  }

  const config = useRuntimeConfig()
  const baseUrl = `${config.userChildrenServiceUrl}/v1/admin/audit/events`
  const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl

  try {
    return await $fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
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
