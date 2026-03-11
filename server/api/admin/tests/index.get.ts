import { requireAdminToken } from '~~/server/utils/admin'
import { fetchWithAuthRetry } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  await requireAdminToken(event)

  return await fetchWithAuthRetry(event, `${config.assessmentServiceUrl}/v1/admin/tests`, {
    method: 'GET'
  })
})
