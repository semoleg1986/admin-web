import { requireAdminToken } from '~~/server/utils/admin'
import { fetchWithAuthRetry } from '~~/server/utils/auth'
import { readRequiredStringField } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  await requireAdminToken(event)
  const body = await readBody(event)

  const sourceId = readRequiredStringField(body, 'source_id')
  const contractVersion = readRequiredStringField(body, 'contract_version')
  const payload
    = typeof body === 'object' && body !== null && 'payload' in body
      ? (body as { payload?: unknown }).payload
      : undefined

  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw createError({ statusCode: 422, statusMessage: 'Field \'payload\' must be object' })
  }
  const validateOnly
    = typeof body === 'object' && body !== null && 'validate_only' in body
      ? (body as { validate_only?: unknown }).validate_only
      : undefined
  const errorMode
    = typeof body === 'object' && body !== null && 'error_mode' in body
      ? (body as { error_mode?: unknown }).error_mode
      : undefined

  return await fetchWithAuthRetry(event, `${config.assessmentServiceUrl}/v1/admin/content/import`, {
    method: 'POST',
    body: {
      source_id: sourceId,
      contract_version: contractVersion,
      validate_only: typeof validateOnly === 'boolean' ? validateOnly : undefined,
      error_mode: typeof errorMode === 'string' && errorMode ? errorMode : undefined,
      payload
    }
  })
})
