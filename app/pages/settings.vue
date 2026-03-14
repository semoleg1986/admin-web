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
            <h2>Active sessions</h2>
            <p class="sessions__hint">
              Manage active admin sessions from auth-service.
            </p>
          </div>
          <button
            class="theme__button"
            :disabled="sessionsResource.isLoading.value || sessionsResource.isRefreshing.value"
            @click="sessionsResource.refresh()"
          >
            {{ sessionsResource.isRefreshing.value ? 'Syncing...' : 'Refresh' }}
          </button>
        </header>

        <p
          v-if="sessionUpdatedLabel"
          class="sessions__updated"
        >
          updated {{ sessionUpdatedLabel }}
        </p>

        <p
          v-if="sessionsError"
          class="sessions__error"
        >
          {{ sessionsError }}
        </p>

        <p
          v-else-if="!activeSessions.length"
          class="sessions__empty"
        >
          No active sessions.
        </p>

        <div
          v-else
          class="sessions__table"
        >
          <div class="sessions__table-head">
            <span>Location</span>
            <span>Time</span>
            <span>Browser</span>
            <span class="sessions__head-action">Action</span>
          </div>
          <article
            v-for="session in activeSessions"
            :key="session.token_id"
            class="sessions__row"
          >
            <div
              class="sessions__location"
              data-label="Location"
            >
              <div class="sessions__location-main">
                {{ sessionLocation(session) }}
              </div>
              <p class="sessions__location-meta">
                {{ session.ip_address || 'n/a' }}
              </p>
              <span
                v-if="session.is_current"
                class="sessions__device-badge"
              >
                This device
              </span>
            </div>

            <div
              class="sessions__time"
              :title="formatDateTime(session.created_at)"
              data-label="Time"
            >
              {{ formatRelativeTime(session.created_at) }}
            </div>

            <div
              class="sessions__browser"
              :title="session.user_agent || 'n/a'"
              data-label="Browser"
            >
              {{ sessionBrowser(session) }}
            </div>

            <div
              class="sessions__action"
              data-label="Action"
            >
              <button
                class="sessions__logout"
                :disabled="isRevokePending(session.token_id)"
                @click="revokeSession(session.token_id)"
              >
                <span>
                  {{ isRevokePending(session.token_id) ? 'LOGGING OUT...' : 'LOGOUT SESSION' }}
                </span>
                <span
                  aria-hidden="true"
                  class="sessions__arrow"
                >
                  ›
                </span>
              </button>
            </div>
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
  is_current?: boolean
}

const config = useRuntimeConfig()

const publicBaseUrl = String(config.public.baseUrl || '')
const assessmentServiceUrl = String(config.assessmentServiceUrl || '')
const userChildrenServiceUrl = String(config.userChildrenServiceUrl || '')
const authServiceUrl = String(config.authServiceUrl || '')
const colorMode = useColorMode()
const fetcher = $fetch as <T = unknown>(url: string, options?: Record<string, unknown>) => Promise<T>

const isProdLike = computed(() => !publicBaseUrl.includes('localhost'))
const meResource = useLiveResource(
  async () => await fetcher<MeResponse>('/api/me'),
  {
    pollIntervalMs: 0,
    refetchOnFocus: true,
    refetchOnReconnect: true
  }
)
const sessionsResource = useLiveResource(
  async () => {
    const me = meResource.data.value
    if (!me?.user_id) return []
    return await fetcher<SessionTelemetryItem[]>(`/api/admin/users/${me.user_id}/sessions`)
  },
  {
    pollIntervalMs: 20000,
    pollWhenHidden: false,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    enabled: computed(() => Boolean(meResource.data.value?.user_id))
  }
)
const revokingTokenIds = ref<string[]>([])
const revokeError = ref('')
const sessions = computed(() => sessionsResource.data.value ?? [])
const activeSessions = computed(() => sessions.value.filter(session => !session.revoked_at))
const sessionsError = computed(() => {
  return revokeError.value
    || toErrorMessage(meResource.error.value)
    || toErrorMessage(sessionsResource.error.value)
})
const sessionUpdatedLabel = computed(() => {
  if (!sessionsResource.lastUpdatedAt.value) return ''
  return sessionsResource.lastUpdatedAt.value.toLocaleTimeString()
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

const relativeTimeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
const formatRelativeTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'n/a'
  const diffMs = date.getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60000)
  if (Math.abs(diffMinutes) < 1) return 'just now'
  if (Math.abs(diffMinutes) < 60) return relativeTimeFormat.format(diffMinutes, 'minute')
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return relativeTimeFormat.format(diffHours, 'hour')
  const diffDays = Math.round(diffHours / 24)
  return relativeTimeFormat.format(diffDays, 'day')
}

const sessionLocation = (item: SessionTelemetryItem) => {
  if (item.geo_display) return item.geo_display
  const parts = [item.geo_city, item.geo_region, item.geo_country].filter(Boolean)
  if (!parts.length) return 'n/a'
  return parts.join(', ')
}

const sessionBrowser = (item: SessionTelemetryItem) => {
  const ua = item.user_agent || ''
  if (!ua) return 'n/a'
  const extract = (pattern: RegExp) => pattern.exec(ua)?.[1] || ''
  if (ua.includes('Edg/')) {
    const version = extract(/Edg\/([\d.]+)/)
    return version ? `Edge ${version}` : 'Edge'
  }
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    const version = extract(/Chrome\/([\d.]+)/)
    return version ? `Chrome ${version}` : 'Chrome'
  }
  if (ua.includes('Firefox/')) {
    const version = extract(/Firefox\/([\d.]+)/)
    return version ? `Firefox ${version}` : 'Firefox'
  }
  if (ua.includes('Safari/') && ua.includes('Version/')) {
    const version = extract(/Version\/([\d.]+)/)
    return version ? `Safari ${version}` : 'Safari'
  }
  return ua.length > 44 ? `${ua.slice(0, 44)}...` : ua
}

const isRevokePending = (tokenId: string) => {
  return revokingTokenIds.value.includes(tokenId)
}

const revokeSession = async (tokenId: string) => {
  const me = meResource.data.value
  if (!me?.user_id || isRevokePending(tokenId)) return
  revokeError.value = ''
  revokingTokenIds.value = [...revokingTokenIds.value, tokenId]
  try {
    await fetcher(`/api/admin/users/${me.user_id}/sessions/${tokenId}/revoke`, { method: 'POST' })
    await sessionsResource.refresh()
  } catch (error: unknown) {
    revokeError.value = toErrorMessage(error) || 'Failed to logout session'
  } finally {
    revokingTokenIds.value = revokingTokenIds.value.filter(id => id !== tokenId)
  }
}

const toErrorMessage = (value: unknown) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && 'statusMessage' in value) {
    const statusMessage = (value as { statusMessage?: unknown }).statusMessage
    if (typeof statusMessage === 'string' && statusMessage) return statusMessage
  }
  if (typeof value === 'object' && value !== null && 'message' in value) {
    const message = (value as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return 'Unexpected error'
}
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

.sessions__empty {
  margin: 12px 0 0;
  color: var(--muted);
}

.sessions__updated {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 0.85rem;
}

.sessions__table {
  margin-top: 12px;
  border-top: 1px solid var(--border);
}

.sessions__table-head {
  display: grid;
  grid-template-columns: minmax(260px, 2.2fr) minmax(120px, 1fr) minmax(150px, 1.2fr) auto;
  gap: 16px;
  padding: 14px 0 12px;
  color: var(--muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  border-bottom: 1px solid var(--border);
}

.sessions__head-action {
  text-align: right;
}

.sessions__row {
  display: grid;
  grid-template-columns: minmax(260px, 2.2fr) minmax(120px, 1fr) minmax(150px, 1.2fr) auto;
  gap: 16px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}

.sessions__row:last-child {
  border-bottom: none;
}

.sessions__location-main {
  font-size: 1.02rem;
  font-weight: 600;
  word-break: break-word;
}

.sessions__location-meta {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.sessions__device-badge {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  background: #1f7a4c;
  color: #fff;
}

.sessions__time,
.sessions__browser {
  color: var(--text);
}

.sessions__action {
  display: flex;
  justify-content: flex-end;
}

.sessions__logout {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: none;
  background: transparent;
  color: #b91c1c;
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  text-transform: uppercase;
  padding: 0;
}

.sessions__logout:disabled {
  opacity: 0.55;
  cursor: default;
}

.sessions__arrow {
  color: var(--text);
  font-size: 1.65rem;
  line-height: 1;
}

@media (max-width: 840px) {
  .sessions__table-head {
    display: none;
  }

  .sessions__row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .sessions__location,
  .sessions__time,
  .sessions__browser,
  .sessions__action {
    position: relative;
    padding-top: 16px;
  }

  .sessions__location::before,
  .sessions__time::before,
  .sessions__browser::before,
  .sessions__action::before {
    content: attr(data-label);
    position: absolute;
    left: 0;
    top: 0;
    color: var(--muted);
    font-size: 0.73rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .sessions__action {
    justify-content: flex-start;
  }
}
</style>
