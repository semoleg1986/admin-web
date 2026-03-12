<template>
  <main class="page">
    <section class="card">
      <header class="card__header">
        <div>
          <p class="eyebrow">
            System
          </p>
          <h1>Settings</h1>
        </div>
        <span
          class="badge"
          :class="isProdLike ? 'badge--prod' : 'badge--dev'"
        >
          {{ isProdLike ? 'prod-like' : 'dev/local' }}
        </span>
      </header>

      <dl class="env-list">
        <div>
          <dt>Public Base URL</dt>
          <dd>{{ publicBaseUrl }}</dd>
        </div>
        <div>
          <dt>Assessment API</dt>
          <dd>{{ assessmentServiceUrl }}</dd>
        </div>
        <div>
          <dt>User/Children API</dt>
          <dd>{{ userChildrenServiceUrl }}</dd>
        </div>
        <div>
          <dt>Auth API</dt>
          <dd>{{ authServiceUrl }}</dd>
        </div>
      </dl>

      <section class="theme">
        <h2>Theme</h2>
        <p class="theme__hint">
          Default is system. You can override it here.
        </p>
        <div class="theme__actions">
          <button
            v-for="option in themeOptions"
            :key="option.value"
            class="theme__button"
            :class="{ 'theme__button--active': colorMode.preference === option.value }"
            @click="setTheme(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
        <p class="theme__meta">
          active: {{ colorMode.value }}
        </p>
      </section>

      <section class="sessions">
        <header class="sessions__header">
          <div>
            <h2>Session Telemetry</h2>
            <p class="sessions__hint">
              Current admin sessions from auth-service (IP / location / user-agent).
            </p>
          </div>
          <button
            class="theme__button"
            :disabled="sessionsLoading"
            @click="loadMySessions"
          >
            {{ sessionsLoading ? 'Loading...' : 'Refresh' }}
          </button>
        </header>

        <p
          v-if="sessionsError"
          class="sessions__error"
        >
          {{ sessionsError }}
        </p>

        <div
          v-else-if="latestSession"
          class="sessions__latest"
        >
          <p class="sessions__latest-title">
            Latest session
          </p>
          <p><strong>Location:</strong> {{ latestLocation }}</p>
          <p><strong>IP:</strong> {{ latestSession.ip_address || 'n/a' }}</p>
          <p><strong>User-Agent:</strong> {{ latestSession.user_agent || 'n/a' }}</p>
          <p><strong>Created:</strong> {{ formatDateTime(latestSession.created_at) }}</p>
        </div>

        <div class="sessions__list">
          <article
            v-for="session in sessions"
            :key="session.token_id"
            class="sessions__item"
          >
            <p class="sessions__row">
              <strong>Status:</strong> {{ sessionStatus(session) }}
            </p>
            <p class="sessions__row">
              <strong>Location:</strong> {{ sessionLocation(session) }}
            </p>
            <p class="sessions__row">
              <strong>IP:</strong> {{ session.ip_address || 'n/a' }}
            </p>
            <p class="sessions__row">
              <strong>User-Agent:</strong> {{ session.user_agent || 'n/a' }}
            </p>
            <p class="sessions__row">
              <strong>Created:</strong> {{ formatDateTime(session.created_at) }}
            </p>
            <p class="sessions__row">
              <strong>Expires:</strong> {{ formatDateTime(session.expires_at) }}
            </p>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
type MeResponse = {
  user_id: string
}

type SessionTelemetryItem = {
  token_id: string
  created_at: string
  expires_at: string
  revoked_at: string | null
  revoke_reason: string | null
  ip_address: string | null
  user_agent: string | null
  geo_city: string | null
  geo_region: string | null
  geo_country: string | null
  geo_display: string | null
}

type HttpError = {
  statusMessage?: string
  data?: { detail?: string }
}

const config = useRuntimeConfig()

const publicBaseUrl = String(config.public.baseUrl || '')
const assessmentServiceUrl = String(config.assessmentServiceUrl || '')
const userChildrenServiceUrl = String(config.userChildrenServiceUrl || '')
const authServiceUrl = String(config.authServiceUrl || '')
const colorMode = useColorMode()
const fetcher = $fetch as <T = unknown>(url: string, options?: Record<string, unknown>) => Promise<T>

const isProdLike = computed(() => !publicBaseUrl.includes('localhost'))
const sessions = ref<SessionTelemetryItem[]>([])
const sessionsLoading = ref(false)
const sessionsError = ref('')
const latestSession = computed<SessionTelemetryItem | null>(() => sessions.value[0] || null)
const latestLocation = computed(() => {
  if (!latestSession.value) return 'n/a'
  return sessionLocation(latestSession.value)
})

const themeOptions = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
] as const

const setTheme = (value: 'system' | 'light' | 'dark') => {
  colorMode.preference = value
}

const formatDateTime = (value: string) => {
  return new Date(value).toLocaleString()
}

const sessionLocation = (item: SessionTelemetryItem) => {
  if (item.geo_display) return item.geo_display
  const parts = [item.geo_city, item.geo_region, item.geo_country].filter(Boolean)
  if (!parts.length) return 'n/a'
  return parts.join(', ')
}

const sessionStatus = (item: SessionTelemetryItem) => {
  if (item.revoked_at) {
    return item.revoke_reason ? `revoked (${item.revoke_reason})` : 'revoked'
  }
  return 'active'
}

const loadMySessions = async () => {
  sessionsLoading.value = true
  sessionsError.value = ''
  try {
    const me = await fetcher<MeResponse>('/api/me')
    sessions.value = await fetcher<SessionTelemetryItem[]>(`/api/admin/users/${me.user_id}/sessions`)
  } catch (err: unknown) {
    const e = err as HttpError
    sessionsError.value = e.statusMessage || e.data?.detail || 'Failed to load session telemetry'
    sessions.value = []
  } finally {
    sessionsLoading.value = false
  }
}

onMounted(loadMySessions)
</script>

<style scoped>
.page {
  min-height: calc(100vh - 130px);
  padding: 28px 20px 60px;
}

.card {
  max-width: 980px;
  margin: 0 auto;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--muted);
  font-size: 0.75rem;
  margin: 0 0 4px;
}

h1 {
  margin: 0;
}

.badge {
  border-radius: 999px;
  padding: 7px 10px;
  font-size: 0.8rem;
  font-weight: 700;
}

.badge--prod {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.badge--dev {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.env-list {
  margin: 18px 0 0;
  display: grid;
  gap: 12px;
}

.env-list div {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
}

dt {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
}

dd {
  margin: 8px 0 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  word-break: break-all;
}

.theme {
  margin-top: 18px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
}

.theme h2 {
  margin: 0;
}

.theme__hint {
  margin: 8px 0 0;
  color: var(--muted);
}

.theme__actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.theme__button {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--panel);
  color: var(--text);
  padding: 8px 12px;
  font-weight: 600;
  cursor: pointer;
}

.theme__button--active {
  background: color-mix(in srgb, #22c55e 18%, var(--panel));
  border-color: color-mix(in srgb, #22c55e 60%, var(--border));
}

.theme__meta {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.sessions {
  margin-top: 18px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
}

.sessions__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.sessions__hint {
  margin: 8px 0 0;
  color: var(--muted);
}

.sessions__error {
  margin: 12px 0 0;
  color: #b91c1c;
}

.sessions__latest {
  margin-top: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  background: color-mix(in srgb, var(--panel) 88%, #0ea5e9 12%);
}

.sessions__latest-title {
  margin: 0 0 8px;
  font-weight: 700;
}

.sessions__latest p {
  margin: 4px 0;
}

.sessions__list {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}

.sessions__item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
}

.sessions__row {
  margin: 4px 0;
  word-break: break-word;
}
</style>
