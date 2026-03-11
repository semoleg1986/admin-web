<template>
  <main class="page">
    <header class="header">
      <div>
        <p class="eyebrow">
          Admin
        </p>
        <h1>Dashboard</h1>
        <p class="subtitle">
          Recent operations and quick access.
        </p>
      </div>
    </header>

    <section class="card shortcuts">
      <NuxtLink
        v-for="item in shortcuts"
        :key="item.to"
        :to="item.to"
        class="shortcut"
      >
        <strong>{{ item.title }}</strong>
        <p>{{ item.description }}</p>
      </NuxtLink>
    </section>

    <section class="card">
      <div class="history-header">
        <h2>Run history</h2>
        <button
          class="btn btn--ghost"
          @click="loadHistory"
        >
          Refresh
        </button>
      </div>

      <article
        v-for="item in history"
        :key="item.id"
        class="history-row"
      >
        <div class="history-row__top">
          <strong>{{ item.operation }}</strong>
          <span>{{ item.time }}</span>
        </div>
        <p class="history-row__summary">
          {{ item.summary }}
        </p>
        <p class="history-row__meta">
          status={{ item.status }}
          <template v-if="item.requestId">
            · request_id={{ item.requestId }}
          </template>
        </p>
      </article>

      <p
        v-if="!history.length"
        class="muted"
      >
        No history yet. First run from Content Ops will appear here.
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
type HistoryItem = {
  id: string
  operation: string
  status: string
  summary: string
  time: string
  requestId?: string
}

const HISTORY_KEY = 'admin-content-ops-history'

const shortcuts = [
  { to: '/content-ops', title: 'Content Ops', description: 'Import, validate, cleanup, and manual catalog actions.' },
  { to: '/assessment', title: 'Assessment', description: 'Create tests, assign tests, and check attempts.' },
  { to: '/users', title: 'Users', description: 'Manage users, children, and assignments.' },
  { to: '/audit', title: 'Audit', description: 'Inspect events and security trail.' }
]

const history = ref<HistoryItem[]>([])

const loadHistory = () => {
  if (!import.meta.client) return
  const raw = localStorage.getItem(HISTORY_KEY)
  if (!raw) {
    history.value = []
    return
  }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      history.value = parsed
        .filter(item => typeof item === 'object' && item !== null)
        .map((item) => {
          const source = item as Partial<HistoryItem>
          return {
            id: String(source.id ?? ''),
            operation: String(source.operation ?? 'unknown'),
            status: String(source.status ?? 'unknown'),
            summary: String(source.summary ?? ''),
            time: String(source.time ?? ''),
            requestId: source.requestId ? String(source.requestId) : undefined
          }
        })
        .slice(0, 30)
    } else {
      history.value = []
    }
  } catch {
    history.value = []
  }
}

onMounted(loadHistory)
</script>

<style scoped>
.page {
  min-height: calc(100vh - 130px);
  padding: 30px 20px 60px;
}

.header {
  max-width: 980px;
  margin: 0 auto 18px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.75rem;
  color: var(--muted);
}

.subtitle {
  margin: 6px 0 0;
  color: var(--muted);
}

.card {
  max-width: 980px;
  margin: 0 auto 16px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
}

.shortcuts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.shortcut {
  text-decoration: none;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  color: var(--text);
  background: color-mix(in srgb, var(--panel) 80%, transparent);
}

.shortcut p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.history-header h2 {
  margin: 0;
}

.history-row {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
}

.history-row:last-of-type {
  margin-bottom: 0;
}

.history-row__top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.history-row__top span {
  color: var(--muted);
  font-size: 0.85rem;
}

.history-row__summary {
  margin: 8px 0 0;
}

.history-row__meta {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 0.85rem;
}

.btn {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn--ghost {
  background: var(--panel);
  color: var(--text);
}

.muted {
  color: var(--muted);
}
</style>
