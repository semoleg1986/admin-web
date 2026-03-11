import { requireAdminToken } from '~~/server/utils/admin'
import { fetchWithAuthRetry } from '~~/server/utils/auth'
import { ensureUuid } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  await requireAdminToken(event)

  const childId = getRouterParam(event, 'childId')
  if (!childId) {
    throw createError({ statusCode: 422, statusMessage: 'childId is required' })
  }
  ensureUuid(childId, 'childId')

  return await fetchWithAuthRetry(event, `${config.assessmentServiceUrl}/v1/admin/diagnostics/children/${childId}`, {
    method: 'GET'
  })
})
