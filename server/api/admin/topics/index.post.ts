import { requireAdminToken } from '~~/server/utils/admin'
import { readRequiredStringField } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = requireAdminToken(event)
  const body = await readBody(event)

  const code = readRequiredStringField(body, 'code')
  const subjectCode = readRequiredStringField(body, 'subject_code')
  const name = readRequiredStringField(body, 'name')
  const gradeRaw
    = typeof body === 'object' && body !== null && 'grade' in body
      ? (body as { grade?: unknown }).grade
      : undefined

  if (typeof gradeRaw !== 'number' || !Number.isInteger(gradeRaw) || gradeRaw < 1 || gradeRaw > 11) {
    throw createError({ statusCode: 422, statusMessage: 'Field \'grade\' must be integer in [1..11]' })
  }

  return await $fetch(`${config.assessmentServiceUrl}/v1/admin/topics`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      code,
      subject_code: subjectCode,
      grade: gradeRaw,
      name
    }
  })
})
