import { requireAdminToken } from '~~/server/utils/admin'
import { ensureUuid } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = requireAdminToken(event)

  const childId = getRouterParam(event, 'childId')
  if (!childId) {
    throw createError({ statusCode: 422, statusMessage: 'childId is required' })
  }
  ensureUuid(childId, 'childId')

  return await $fetch(`${config.assessmentServiceUrl}/v1/admin/diagnostics/children/${childId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
})
