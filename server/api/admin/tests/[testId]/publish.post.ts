import { requireAdminToken } from '~~/server/utils/admin'
import { fetchWithAuthRetry } from '~~/server/utils/auth'
import { ensureUuid } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  await requireAdminToken(event)

  const testId = getRouterParam(event, 'testId')
  if (!testId) {
    throw createError({ statusCode: 422, statusMessage: 'testId is required' })
  }
  ensureUuid(testId, 'testId')

  return await fetchWithAuthRetry(event, `${config.assessmentServiceUrl}/v1/admin/tests/${testId}/publish`, {
    method: 'POST',
  })
})
