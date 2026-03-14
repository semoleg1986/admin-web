import { requireAdminToken } from '~~/server/utils/admin'
import { fetchWithAuthRetry } from '~~/server/utils/auth'
import { readRequiredStringField } from '~~/server/utils/validation'

type QuestionType = 'text' | 'single_choice'
type DiagnosticTag = 'inattention' | 'misread_condition' | 'calc_error' | 'concept_gap' | 'guessing' | 'other'
type TextMatchMode = 'exact' | 'normalized' | 'regex'

type QuestionOptionInput = {
  option_id: string
  text: string
  position: number
  diagnostic_tag: DiagnosticTag | null
}

type TextDistractorInput = {
  pattern: string
  match_mode: TextMatchMode
  diagnostic_tag: DiagnosticTag
}

type QuestionInput = {
  node_id: string
  text: string
  question_type: QuestionType
  answer_key?: string | null
  correct_option_id?: string | null
  options?: QuestionOptionInput[]
  text_distractors?: TextDistractorInput[]
  max_score?: number
}

const DIAGNOSTIC_TAGS: ReadonlySet<string> = new Set([
  'inattention',
  'misread_condition',
  'calc_error',
  'concept_gap',
  'guessing',
  'other'
])
const TEXT_MATCH_MODES: ReadonlySet<string> = new Set(['exact', 'normalized', 'regex'])

function toQuestionType(raw: unknown, idx: number): QuestionType {
  if (raw === undefined || raw === null || raw === '') {
    return 'text'
  }
  if (raw === 'text' || raw === 'single_choice') {
    return raw
  }
  throw createError({
    statusCode: 422,
    statusMessage: `questions[${idx}].question_type must be 'text' or 'single_choice'`
  })
}

function readOptionalTrimmedString(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null
  }
  const trimmed = input.trim()
  return trimmed.length ? trimmed : null
}

function parseOptions(raw: unknown, idx: number): QuestionOptionInput[] {
  if (!Array.isArray(raw)) {
    throw createError({
      statusCode: 422,
      statusMessage: `questions[${idx}].options must be an array`
    })
  }

  const options = raw.map((item, optionIdx) => {
    if (typeof item !== 'object' || item === null) {
      throw createError({
        statusCode: 422,
        statusMessage: `questions[${idx}].options[${optionIdx}] must be an object`
      })
    }

    const optionId = readRequiredStringField(item, 'option_id')
    const text = readRequiredStringField(item, 'text')
    const diagnosticRaw = (item as { diagnostic_tag?: unknown }).diagnostic_tag
    const diagnosticTag
      = diagnosticRaw === null || diagnosticRaw === undefined || diagnosticRaw === ''
        ? null
        : readRequiredStringField(item, 'diagnostic_tag')

    if (diagnosticTag !== null && !DIAGNOSTIC_TAGS.has(diagnosticTag)) {
      throw createError({
        statusCode: 422,
        statusMessage: `questions[${idx}].options[${optionIdx}].diagnostic_tag is invalid`
      })
    }

    return {
      option_id: optionId,
      text,
      position: optionIdx + 1,
      diagnostic_tag: diagnosticTag as DiagnosticTag | null
    }
  })

  if (options.length < 2) {
    throw createError({
      statusCode: 422,
      statusMessage: `questions[${idx}] single_choice must contain at least 2 options`
    })
  }

  const uniqueIds = new Set(options.map(option => option.option_id))
  if (uniqueIds.size !== options.length) {
    throw createError({
      statusCode: 422,
      statusMessage: `questions[${idx}] options.option_id must be unique`
    })
  }

  return options
}

function parseTextDistractors(raw: unknown, idx: number): TextDistractorInput[] {
  if (raw === undefined || raw === null) {
    return []
  }
  if (!Array.isArray(raw)) {
    throw createError({
      statusCode: 422,
      statusMessage: `questions[${idx}].text_distractors must be an array`
    })
  }

  return raw.map((item, distractorIdx) => {
    if (typeof item !== 'object' || item === null) {
      throw createError({
        statusCode: 422,
        statusMessage: `questions[${idx}].text_distractors[${distractorIdx}] must be an object`
      })
    }

    const pattern = readRequiredStringField(item, 'pattern')
    const modeRaw = (item as { match_mode?: unknown }).match_mode
    const mode = readOptionalTrimmedString(modeRaw) ?? 'exact'
    if (!TEXT_MATCH_MODES.has(mode)) {
      throw createError({
        statusCode: 422,
        statusMessage: `questions[${idx}].text_distractors[${distractorIdx}].match_mode is invalid`
      })
    }

    const diagnosticTag = readRequiredStringField(item, 'diagnostic_tag')
    if (!DIAGNOSTIC_TAGS.has(diagnosticTag)) {
      throw createError({
        statusCode: 422,
        statusMessage: `questions[${idx}].text_distractors[${distractorIdx}].diagnostic_tag is invalid`
      })
    }

    return {
      pattern,
      match_mode: mode as TextMatchMode,
      diagnostic_tag: diagnosticTag as DiagnosticTag
    }
  })
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  await requireAdminToken(event)
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
    const questionType = toQuestionType((item as { question_type?: unknown }).question_type, idx)
    const answerKey = readOptionalTrimmedString((item as { answer_key?: unknown }).answer_key)
    const maxScoreRaw = (item as { max_score?: unknown }).max_score
    const maxScore = typeof maxScoreRaw === 'number' && Number.isInteger(maxScoreRaw) && maxScoreRaw > 0
      ? maxScoreRaw
      : 1
    const baseQuestion: QuestionInput = {
      node_id: nodeId,
      text,
      question_type: questionType,
      max_score: maxScore
    }

    if (questionType === 'text') {
      if (!answerKey) {
        throw createError({
          statusCode: 422,
          statusMessage: `questions[${idx}] text question requires answer_key`
        })
      }
      baseQuestion.answer_key = answerKey
      const distractors = parseTextDistractors(
        (item as { text_distractors?: unknown }).text_distractors,
        idx
      )
      if (distractors.length) {
        baseQuestion.text_distractors = distractors
      }
      return baseQuestion
    }

    const options = parseOptions((item as { options?: unknown }).options, idx)
    const correctOptionId = readOptionalTrimmedString(
      (item as { correct_option_id?: unknown }).correct_option_id
    )
    if (!correctOptionId) {
      throw createError({
        statusCode: 422,
        statusMessage: `questions[${idx}] single_choice requires correct_option_id`
      })
    }
    if (!options.some(option => option.option_id === correctOptionId)) {
      throw createError({
        statusCode: 422,
        statusMessage: `questions[${idx}] correct_option_id must reference options.option_id`
      })
    }
    const correctOption = options.find(option => option.option_id === correctOptionId)
    if (correctOption?.diagnostic_tag) {
      throw createError({
        statusCode: 422,
        statusMessage: `questions[${idx}] diagnostic_tag for correct option must be null`
      })
    }

    baseQuestion.correct_option_id = correctOptionId
    baseQuestion.options = options
    return baseQuestion
  })

  return await fetchWithAuthRetry(event, `${config.assessmentServiceUrl}/v1/admin/tests`, {
    method: 'POST',
    body: {
      subject_code: subjectCode,
      grade: gradeRaw,
      questions
    }
  })
})
