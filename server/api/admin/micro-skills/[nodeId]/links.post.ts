import { requireAdminToken } from '~~/server/utils/admin'

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
    throw createError({ statusCode: 422, statusMessage: 'Field \'predecessor_ids\' must be string[]' })
  }
  return value.map(item => item.trim()).filter(Boolean)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = requireAdminToken(event)
  const nodeId = getRouterParam(event, 'nodeId')
  if (!nodeId || !nodeId.trim()) {
    throw createError({ statusCode: 422, statusMessage: 'nodeId is required' })
  }

  const body = await readBody(event)
  const predecessorIds
    = typeof body === 'object' && body !== null && 'predecessor_ids' in body
      ? parseStringArray((body as { predecessor_ids?: unknown }).predecessor_ids)
      : []

  return await $fetch(`${config.assessmentServiceUrl}/v1/admin/micro-skills/${nodeId}/links`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      predecessor_ids: predecessorIds
    }
  })
})
