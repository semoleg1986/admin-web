import { requireAdminToken } from '~~/server/utils/admin'
import { readRequiredStringField } from '~~/server/utils/validation'

type QuestionInput = {
  node_id: string
  text: string
  answer_key: string
  max_score?: number
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = requireAdminToken(event)
  const body = await readBody(event)

  const subjectCode = readRequiredStringField(body, 'subject_code')
  const gradeRaw
    = typeof body === 'object' && body !== null && 'grade' in body
      ? (body as { grade?: unknown }).grade
      : undefined
  const questionsRaw
    = typeof body === 'object' && body !== null && 'questions' in body
      ? (body as { questions?: unknown }).questions
      : undefined

  if (typeof gradeRaw !== 'number' || !Number.isInteger(gradeRaw) || gradeRaw < 1 || gradeRaw > 4) {
    throw createError({ statusCode: 422, statusMessage: 'Field \'grade\' must be integer in [1..4]' })
  }
  if (!Array.isArray(questionsRaw) || questionsRaw.length === 0) {
    throw createError({ statusCode: 422, statusMessage: 'Field \'questions\' must be non-empty array' })
  }

  const questions: QuestionInput[] = questionsRaw.map((item, idx) => {
    if (typeof item !== 'object' || item === null) {
      throw createError({ statusCode: 422, statusMessage: `questions[${idx}] must be object` })
    }
    const nodeId = readRequiredStringField(item, 'node_id')
    const text = readRequiredStringField(item, 'text')
    const answerKey = readRequiredStringField(item, 'answer_key')
    const maxScoreRaw = (item as { max_score?: unknown }).max_score
    const maxScore = typeof maxScoreRaw === 'number' && Number.isInteger(maxScoreRaw) && maxScoreRaw > 0
      ? maxScoreRaw
      : 1
    return {
      node_id: nodeId,
      text,
      answer_key: answerKey,
      max_score: maxScore
    }
  })

  return await $fetch(`${config.assessmentServiceUrl}/v1/admin/tests`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      subject_code: subjectCode,
      grade: gradeRaw,
      questions
    }
  })
})
