<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'en' }
})

const authState = useState('admin-auth', () => ({
  isAuthed: false,
  isAdmin: false
}))

onMounted(async () => {
  try {
    const me = await $fetch<{ is_admin: boolean }>('/api/me')
    authState.value.isAuthed = true
    authState.value.isAdmin = Boolean(me.is_admin)
  } catch {
    authState.value.isAuthed = false
    authState.value.isAdmin = false
  }
})

const signOut = async () => {
  await $fetch('/api/auth/logout', { method: 'POST' })
  authState.value.isAuthed = false
  authState.value.isAdmin = false
  await navigateTo('/login')
}
</script>

<template>
  <UApp>
    <div class="app-shell">
      <header class="topbar">
        <NuxtLink
          :to="authState.isAuthed ? '/users' : '/login'"
          class="brand"
        >Admin Portal</NuxtLink>
        <nav class="nav">
          <NuxtLink
            v-if="authState.isAuthed"
            to="/users"
            class="nav-link"
          >Users</NuxtLink>
          <NuxtLink
            v-if="authState.isAuthed"
            to="/audit"
            class="nav-link"
          >Audit</NuxtLink>
          <NuxtLink
            v-if="authState.isAuthed"
            to="/assessment"
            class="nav-link"
          >Assessment</NuxtLink>
          <NuxtLink
            v-if="!authState.isAuthed"
            to="/login"
            class="nav-link"
          >Login</NuxtLink>
          <button
            v-if="authState.isAuthed"
            class="nav-link btn-link"
            @click="signOut"
          >
            Sign out
          </button>
          <UColorModeButton />
        </nav>
      </header>
      <UMain class="main">
        <NuxtPage />
      </UMain>
    </div>
  </UApp>
</template>

<style scoped>
.app-shell { min-height: 100vh; background: var(--bg); }
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
  position: sticky;
  top: 0;
  z-index: 10;
}
.brand { font-weight: 700; text-decoration: none; color: var(--text); }
.nav { display: flex; gap: 12px; align-items: center; }
.nav-link { text-decoration: none; color: var(--muted); font-weight: 600; }
.btn-link { background: transparent; border: none; cursor: pointer; padding: 0; }
.nav-link:hover { color: var(--text); }
.main { padding: 0; }
</style>
