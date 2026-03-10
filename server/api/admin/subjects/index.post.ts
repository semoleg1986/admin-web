import { requireAdminToken } from '~~/server/utils/admin'
import { readRequiredStringField } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = requireAdminToken(event)
  const body = await readBody(event)

  const code = readRequiredStringField(body, 'code')
  const name = readRequiredStringField(body, 'name')

  return await $fetch(`${config.assessmentServiceUrl}/v1/admin/subjects`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { code, name }
  })
})
