import { requireAdminToken } from '~~/server/utils/admin'
import { readRequiredStringField } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = requireAdminToken(event)
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

  return await $fetch(`${config.assessmentServiceUrl}/v1/admin/content/import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      source_id: sourceId,
      contract_version: contractVersion,
      payload
    }
  })
})
