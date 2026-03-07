import { requireAdminToken } from '~~/server/utils/admin'
import { ensureUuid } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = requireAdminToken(event)

  const testId = getRouterParam(event, 'testId')
  if (!testId) {
    throw createError({ statusCode: 422, statusMessage: 'testId is required' })
  }
  ensureUuid(testId, 'testId')

  return await $fetch(`${config.assessmentServiceUrl}/v1/admin/tests/${testId}/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
})
