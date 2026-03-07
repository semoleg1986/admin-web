<template>
  <main class="page">
    <header class="header">
      <div>
        <p class="eyebrow">
          Admin
        </p>
        <h1>Audit Events</h1>
      </div>
      <button
        class="btn btn--ghost"
        :disabled="loading"
        @click="loadEvents"
      >
        Refresh
      </button>
    </header>

    <section class="card filters">
      <label>
        Actor ID
        <input
          v-model="actorId"
          type="text"
          placeholder="uuid"
        >
      </label>
      <label>
        Action
        <input
          v-model="action"
          type="text"
          placeholder="child.created"
        >
      </label>
      <label>
        Target type
        <input
          v-model="targetType"
          type="text"
          placeholder="user | child"
        >
      </label>
      <label>
        From
        <input
          v-model="fromDateTime"
          type="datetime-local"
        >
      </label>
      <label>
        To
        <input
          v-model="toDateTime"
          type="datetime-local"
        >
      </label>
      <button
        class="btn"
        :disabled="loading"
        @click="loadEvents"
      >
        Apply filters
      </button>
    </section>

    <section class="card">
      <article
        v-for="event in events"
        :key="event.event_id"
        class="event-row"
      >
        <div class="row-main">
          <strong>{{ event.action }}</strong>
          <p>{{ event.occurred_at }}</p>
        </div>
        <div class="row-meta">
          <span>target: {{ event.target_type }} / {{ event.target_id }}</span>
          <span>actor: {{ event.actor_role }} / {{ event.actor_id }}</span>
        </div>
      </article>
      <p
        v-if="!events.length"
        class="muted"
      >
        No events.
      </p>
    </section>

    <p
      v-if="error"
      class="error"
    >
      {{ error }}
    </p>
  </main>
</template>

<script setup lang="ts">
type AuditEvent = {
  event_id: string
  action: string
  occurred_at: string
  target_type: string
  target_id: string
  actor_role: string
  actor_id: string
}

type HttpError = {
  statusMessage?: string
  data?: { detail?: string }
}

const events = ref<AuditEvent[]>([])
const actorId = ref('')
const action = ref('')
const targetType = ref('')
const fromDateTime = ref('')
const toDateTime = ref('')
const loading = ref(false)
const error = ref('')

const loadEvents = async () => {
  loading.value = true
  error.value = ''
  try {
    const query: Record<string, string> = {}
    if (actorId.value.trim()) query.actor_id = actorId.value.trim()
    if (action.value.trim()) query.action = action.value.trim()
    if (targetType.value.trim()) query.target_type = targetType.value.trim()
    if (fromDateTime.value) query.from = new Date(fromDateTime.value).toISOString()
    if (toDateTime.value) query.to = new Date(toDateTime.value).toISOString()

    events.value = await $fetch<AuditEvent[]>('/api/admin/audit/events', { query })
  } catch (err: unknown) {
    const e = err as HttpError
    error.value = e.statusMessage || e.data?.detail || 'Failed to load audit events'
    events.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadEvents)
</script>

<style scoped>
.page { min-height: 100vh; padding: 30px 20px 60px; background: var(--bg); }
.header { max-width: 980px; margin: 0 auto 20px; display: flex; justify-content: space-between; align-items: center; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.75rem; color: var(--muted); }
.card { max-width: 980px; margin: 0 auto 20px; background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: grid; gap: 12px; }
.filters { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); align-items: end; }
label { display: grid; gap: 6px; color: var(--text); font-size: 0.9rem; }
input { border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; background: var(--panel); color: var(--text); }
.event-row { border: 1px solid var(--border); border-radius: 12px; padding: 12px; display: grid; gap: 8px; }
.row-main strong { margin: 0; }
.row-main p { margin: 4px 0 0; color: var(--muted); font-size: 0.9rem; }
.row-meta { display: grid; gap: 4px; color: var(--muted); font-size: 0.85rem; }
.btn { background: #0f172a; color: #fff; padding: 8px 12px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; }
.btn--ghost { background: var(--panel); color: var(--text); border: 1px solid var(--border); }
.error { max-width: 980px; margin: 8px auto 0; color: #b91c1c; }
.muted { color: var(--muted); }
</style>
