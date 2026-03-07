import { requireAdminToken } from '~~/server/utils/admin'
import { ensureUuid, readRequiredStringField } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = requireAdminToken(event)
  const body = await readBody(event)

  const testId = readRequiredStringField(body, 'test_id')
  const childId = readRequiredStringField(body, 'child_id')
  ensureUuid(testId, 'test_id')
  ensureUuid(childId, 'child_id')

  return await $fetch(`${config.assessmentServiceUrl}/v1/admin/assignments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { test_id: testId, child_id: childId }
  })
})
