import { requireAdminToken } from '~~/server/utils/admin'
import { fetchWithAuthRetry } from '~~/server/utils/auth'
import { readRequiredStringField } from '~~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  await requireAdminToken(event)
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

  return await fetchWithAuthRetry(event, `${config.assessmentServiceUrl}/v1/admin/topics`, {
    method: 'POST',
    body: {
      code,
      subject_code: subjectCode,
      grade: gradeRaw,
      name
    }
  })
})
