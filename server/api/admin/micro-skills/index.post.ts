import { requireAdminToken } from '~~/server/utils/admin'
import { readRequiredStringField } from '~~/server/utils/validation'

type Criticality = 'low' | 'medium' | 'high'
type SkillStatus = 'draft' | 'active' | 'archived'

function parseStringArray(value: unknown, field: string): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
    throw createError({ statusCode: 422, statusMessage: `Field '${field}' must be string[]` })
  }
  return value.map(item => item.trim()).filter(Boolean)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = requireAdminToken(event)
  const body = await readBody(event)

  const nodeId = readRequiredStringField(body, 'node_id')
  const subjectCode = readRequiredStringField(body, 'subject_code')
  const topicCode = readRequiredStringField(body, 'topic_code')
  const sectionCode = readRequiredStringField(body, 'section_code')
  const sectionName = readRequiredStringField(body, 'section_name')
  const microSkillName = readRequiredStringField(body, 'micro_skill_name')
  const gradeRaw
    = typeof body === 'object' && body !== null && 'grade' in body
      ? (body as { grade?: unknown }).grade
      : undefined
  const predecessorIds
    = typeof body === 'object' && body !== null && 'predecessor_ids' in body
      ? parseStringArray((body as { predecessor_ids?: unknown }).predecessor_ids, 'predecessor_ids')
      : []
  const criticalityRaw
    = typeof body === 'object' && body !== null && 'criticality' in body
      ? (body as { criticality?: unknown }).criticality
      : 'medium'
  const statusRaw
    = typeof body === 'object' && body !== null && 'status' in body
      ? (body as { status?: unknown }).status
      : 'active'
  const sourceRef
    = typeof body === 'object' && body !== null && 'source_ref' in body
      ? (body as { source_ref?: unknown }).source_ref
      : undefined
  const description
    = typeof body === 'object' && body !== null && 'description' in body
      ? (body as { description?: unknown }).description
      : undefined
  const externalRef
    = typeof body === 'object' && body !== null && 'external_ref' in body
      ? (body as { external_ref?: unknown }).external_ref
      : undefined

  if (typeof gradeRaw !== 'number' || !Number.isInteger(gradeRaw) || gradeRaw < 1 || gradeRaw > 11) {
    throw createError({ statusCode: 422, statusMessage: 'Field \'grade\' must be integer in [1..11]' })
  }
  if (criticalityRaw !== 'low' && criticalityRaw !== 'medium' && criticalityRaw !== 'high') {
    throw createError({ statusCode: 422, statusMessage: 'Field \'criticality\' must be low|medium|high' })
  }
  if (statusRaw !== 'draft' && statusRaw !== 'active' && statusRaw !== 'archived') {
    throw createError({ statusCode: 422, statusMessage: 'Field \'status\' must be draft|active|archived' })
  }

  return await $fetch(`${config.assessmentServiceUrl}/v1/admin/micro-skills`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      node_id: nodeId,
      subject_code: subjectCode,
      topic_code: topicCode,
      grade: gradeRaw,
      section_code: sectionCode,
      section_name: sectionName,
      micro_skill_name: microSkillName,
      predecessor_ids: predecessorIds,
      criticality: criticalityRaw as Criticality,
      status: statusRaw as SkillStatus,
      source_ref: typeof sourceRef === 'string' && sourceRef.trim() ? sourceRef.trim() : null,
      description: typeof description === 'string' && description.trim() ? description.trim() : null,
      external_ref: typeof externalRef === 'string' && externalRef.trim() ? externalRef.trim() : null
    }
  })
})
