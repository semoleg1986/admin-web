import { requireAdminToken } from '~~/server/utils/admin'
import { fetchWithAuthRetry } from '~~/server/utils/auth'
import { readRequiredStringField } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  await requireAdminToken(event)
  const body = await readBody(event)

  const code = readRequiredStringField(body, 'code')
  const name = readRequiredStringField(body, 'name')

  return await fetchWithAuthRetry(event, `${config.assessmentServiceUrl}/v1/admin/subjects`, {
    method: 'POST',
    body: { code, name }
  })
})
