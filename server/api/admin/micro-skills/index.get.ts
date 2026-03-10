import { requireAdminToken } from '~~/server/utils/admin'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = requireAdminToken(event)

  return await $fetch(`${config.assessmentServiceUrl}/v1/admin/micro-skills`, {
    headers: { Authorization: `Bearer ${token}` }
  })
})
