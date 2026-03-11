import { requireAdminToken } from '~~/server/utils/admin'
import { fetchWithAuthRetry } from '~~/server/utils/auth'

type PatternList = string[]

function parsePatterns(value: unknown, field: string): PatternList {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
    throw createError({ statusCode: 422, statusMessage: `Field '${field}' must be string[]` })
  }
  return value.map(item => item.trim()).filter(Boolean)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  await requireAdminToken(event)
  const body = await readBody(event)

  const dryRun
    = typeof body === 'object' && body !== null && 'dry_run' in body
      ? (body as { dry_run?: unknown }).dry_run
      : undefined
  if (typeof dryRun !== 'boolean') {
    throw createError({ statusCode: 422, statusMessage: 'Field \'dry_run\' must be boolean' })
  }

  const subjectPatterns
    = typeof body === 'object' && body !== null && 'subject_code_patterns' in body
      ? parsePatterns((body as { subject_code_patterns?: unknown }).subject_code_patterns, 'subject_code_patterns')
      : []
  const topicPatterns
    = typeof body === 'object' && body !== null && 'topic_code_patterns' in body
      ? parsePatterns((body as { topic_code_patterns?: unknown }).topic_code_patterns, 'topic_code_patterns')
      : []
  const nodePatterns
    = typeof body === 'object' && body !== null && 'node_id_patterns' in body
      ? parsePatterns((body as { node_id_patterns?: unknown }).node_id_patterns, 'node_id_patterns')
      : []

  return await fetchWithAuthRetry(event, `${config.assessmentServiceUrl}/v1/admin/fixtures/cleanup`, {
    method: 'POST',
    body: {
      dry_run: dryRun,
      subject_code_patterns: subjectPatterns.length ? subjectPatterns : undefined,
      topic_code_patterns: topicPatterns.length ? topicPatterns : undefined,
      node_id_patterns: nodePatterns.length ? nodePatterns : undefined
    }
  })
})
