<template>
  <main class="page">
    <section class="card">
      <header>
        <p class="eyebrow">
          Admin Auth
        </p>
        <h1>Sign in</h1>
        <p class="subtitle">
          Use admin account credentials.
        </p>
      </header>

      <form
        class="form"
        @submit.prevent="onLogin"
      >
        <label>
          Identifier
          <input
            v-model="identifier"
            type="text"
            placeholder="email or phone"
            required
          >
        </label>
        <label>
          Password
          <input
            v-model="password"
            type="password"
            placeholder="••••••"
            required
          >
        </label>

        <button
          class="btn"
          type="submit"
          :disabled="loading"
        >
          {{ loading ? 'Please wait...' : 'Login as Admin' }}
        </button>
      </form>

      <p
        v-if="error"
        class="error"
      >
        {{ error }}
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
type HttpError = {
  statusMessage?: string
  data?: { detail?: string }
}

const identifier = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const authState = useState('admin-auth', () => ({
  isAuthed: false,
  isAdmin: false
}))

const onLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { identifier: identifier.value, password: password.value }
    })

    const me = await $fetch<{ is_admin: boolean }>('/api/me')
    if (!me.is_admin) {
      await $fetch('/api/auth/logout', { method: 'POST' })
      throw createError({ statusCode: 403, statusMessage: 'Admin role required' })
    }

    authState.value.isAuthed = true
    authState.value.isAdmin = true
    await navigateTo('/users')
  } catch (err: unknown) {
    const e = err as HttpError
    error.value = e.statusMessage || e.data?.detail || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
  background:
    radial-gradient(circle at 15% 15%, rgba(59, 130, 246, 0.16), transparent 42%),
    radial-gradient(circle at 85% 85%, rgba(2, 132, 199, 0.12), transparent 44%),
    var(--bg);
}
.card {
  width: min(440px, 92vw);
  background: var(--panel);
  border-radius: 16px;
  padding: 28px;
  border: 1px solid var(--border);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.75rem; color: var(--muted); }
.subtitle { color: var(--muted); margin-top: 6px; }
.form { display: grid; gap: 12px; margin-top: 16px; }
label { display: grid; gap: 6px; font-size: 0.9rem; color: var(--text); }
input { border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; font-size: 0.95rem; background: var(--panel); color: var(--text); }
.btn {
  margin-top: 8px;
  background: #0f172a;
  color: #fff;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-weight: 600;
  cursor: pointer;
}
.error { margin-top: 12px; color: #b91c1c; }

:global(.dark) .btn {
  background: #2563eb;
  color: #e5e7eb;
}

:global(.dark) .page {
  background:
    radial-gradient(circle at 15% 15%, rgba(37, 99, 235, 0.22), transparent 42%),
    radial-gradient(circle at 85% 85%, rgba(14, 165, 233, 0.16), transparent 44%),
    var(--bg);
}
</style>
