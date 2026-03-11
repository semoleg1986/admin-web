<template>
  <main class="page">
    <header class="header">
      <div>
        <p class="eyebrow">
          Admin
        </p>
        <h1>Users</h1>
      </div>
      <button
        class="btn btn--ghost"
        :disabled="loading"
        @click="loadUsers"
      >
        Refresh
      </button>
    </header>

    <section class="card">
      <article
        v-for="u in users"
        :key="u.user_id"
        class="user-row"
      >
        <div>
          <h3>{{ u.name || 'Unnamed user' }}</h3>
          <p>{{ u.user_id }}</p>
        </div>
        <button
          class="btn"
          @click="loadChildren(u.user_id)"
        >
          View children
        </button>
      </article>
    </section>

    <section
      v-if="selectedUserId"
      class="card"
    >
      <h2>Children of {{ selectedUserId }}</h2>
      <article
        v-for="child in children"
        :key="child.child_id"
        class="child-row"
      >
        <div>
          <strong>{{ child.name }}</strong>
          <p>{{ child.birthdate }}</p>
        </div>
      </article>
      <p
        v-if="!children.length"
        class="muted"
      >
        No active children.
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
type UserListItem = {
  user_id: string
  name?: string
}

type ChildListItem = {
  child_id: string
  name: string
  birthdate: string
}

type HttpError = {
  statusMessage?: string
  data?: { detail?: string }
}

const users = ref<UserListItem[]>([])
const children = ref<ChildListItem[]>([])
const selectedUserId = ref('')
const loading = ref(false)
const error = ref('')
const fetcher = $fetch as <T = unknown>(url: string, options?: Record<string, unknown>) => Promise<T>

const loadUsers = async () => {
  loading.value = true
  error.value = ''
  try {
    users.value = await fetcher<UserListItem[]>('/api/admin/users')
  } catch (err: unknown) {
    const e = err as HttpError
    error.value = e.statusMessage || e.data?.detail || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

const loadChildren = async (userId: string) => {
  loading.value = true
  error.value = ''
  selectedUserId.value = userId
  try {
    children.value = await fetcher<ChildListItem[]>(`/api/admin/users/${userId}/children`)
  } catch (err: unknown) {
    const e = err as HttpError
    error.value = e.statusMessage || e.data?.detail || 'Failed to load children'
    children.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.page { min-height: 100vh; padding: 30px 20px 60px; background: var(--bg); }
.header { max-width: 980px; margin: 0 auto 20px; display: flex; justify-content: space-between; align-items: center; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.75rem; color: var(--muted); }
.card { max-width: 980px; margin: 0 auto 20px; background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: grid; gap: 12px; }
.user-row, .child-row { display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--border); border-radius: 12px; padding: 12px; }
.user-row h3, .child-row strong { margin: 0 0 4px; }
.user-row p, .child-row p { margin: 0; color: var(--muted); font-size: 0.9rem; }
.btn { background: #0f172a; color: #fff; padding: 8px 12px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; }
.btn--ghost { background: var(--panel); color: var(--text); border: 1px solid var(--border); }
.error { max-width: 980px; margin: 8px auto 0; color: #b91c1c; }
.muted { color: var(--muted); }
</style>
