import fs from 'node:fs'
import path from 'node:path'

function fail(message) {
  throw new Error(`[contract] ${message}`)
}

function loadSpec(serviceDir) {
  const baseDir = process.env.CONTRACT_SPECS_BASE_DIR
    ? path.resolve(process.env.CONTRACT_SPECS_BASE_DIR)
    : path.resolve(process.cwd(), '..')
  const specPath = path.resolve(
    baseDir,
    serviceDir,
    'openapi.yaml'
  )

  if (!fs.existsSync(specPath)) {
    fail(`OpenAPI artifact not found: ${specPath}`)
  }

  const raw = fs.readFileSync(specPath, 'utf-8').trim()
  if (!raw.startsWith('{')) {
    fail('openapi.yaml is expected to be JSON-rendered OpenAPI artifact')
  }

  return JSON.parse(raw)
}

function assertPathMethod(spec, routePath, method) {
  const route = spec.paths?.[routePath]
  if (!route) fail(`Missing path: ${routePath}`)
  if (!route[method]) fail(`Missing method: ${method.toUpperCase()} ${routePath}`)
  return route[method]
}

function assertResponses(operation, expectedCodes, label) {
  for (const code of expectedCodes) {
    if (!operation.responses?.[code]) {
      fail(`Missing response ${code} for ${label}`)
    }
  }
}

function assertProblemJson(operation, code, label) {
  const content = operation.responses?.[code]?.content
  if (!content?.['application/problem+json']) {
    fail(`Missing application/problem+json for ${label} response ${code}`)
  }
}

function run() {
  const childrenSpec = loadSpec('user-children-service')
  const authSpec = loadSpec('auth-service')

  const listUsers = assertPathMethod(childrenSpec, '/v1/admin/users', 'get')
  assertResponses(listUsers, ['200', '401', '403', '404', '409'], 'GET /v1/admin/users')
  for (const code of ['401', '403', '404', '409']) {
    assertProblemJson(listUsers, code, 'GET /v1/admin/users')
  }

  const listChildren = assertPathMethod(childrenSpec, '/v1/admin/users/{user_id}/children', 'get')
  assertResponses(listChildren, ['200', '401', '403', '404', '409', '422'], 'GET /v1/admin/users/{user_id}/children')

  const listAudit = assertPathMethod(childrenSpec, '/v1/admin/audit/events', 'get')
  assertResponses(listAudit, ['200', '401', '403', '404', '409', '422'], 'GET /v1/admin/audit/events')

  const login = assertPathMethod(authSpec, '/v1/auth/login', 'post')
  assertResponses(login, ['200', '401', '403', '404', '409', '422'], 'POST /v1/auth/login')
  assertProblemJson(login, '401', 'POST /v1/auth/login')

  const refresh = assertPathMethod(authSpec, '/v1/auth/refresh', 'post')
  assertResponses(refresh, ['200', '401', '403', '404', '409', '422'], 'POST /v1/auth/refresh')

  const logout = assertPathMethod(authSpec, '/v1/auth/logout', 'post')
  assertResponses(logout, ['204', '401', '403', '404', '409', '422'], 'POST /v1/auth/logout')

  console.log('[contract] admin-web consumer contract checks passed')
}

run()
