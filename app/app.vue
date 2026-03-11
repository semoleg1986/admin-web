<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'en' }
})

type ShellTab = {
  to: string
  label: string
}

const tabs: ShellTab[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/users', label: 'Users' },
  { to: '/assessment', label: 'Assessment' },
  { to: '/content-ops', label: 'Content Ops' },
  { to: '/audit', label: 'Audit' }
]

const route = useRoute()
const authState = useState('admin-auth', () => ({
  isAuthed: false,
  isAdmin: false
}))

const isRouteActive = (tabPath: string) => route.path.startsWith(tabPath)

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
    <div class="shell">
      <header class="header">
        <NuxtLink
          :to="authState.isAuthed ? '/dashboard' : '/login'"
          class="brand"
        >
          <span class="brand__title">Monitoring Admin</span>
          <span class="brand__subtitle">Methodist workspace</span>
        </NuxtLink>

        <div class="header-actions">
          <NuxtLink
            v-if="authState.isAuthed"
            to="/settings"
            class="action-link"
          >
            Settings
          </NuxtLink>
          <button
            v-if="authState.isAuthed"
            class="action-link action-link--button"
            @click="signOut"
          >
            Sign out
          </button>
        </div>
      </header>

      <nav
        v-if="authState.isAuthed"
        class="tabs"
      >
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="tab"
          :class="{ 'tab--active': isRouteActive(tab.to) }"
        >
          {{ tab.label }}
        </NuxtLink>
      </nav>

      <UMain class="content">
        <NuxtPage />
      </UMain>
    </div>
  </UApp>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(52, 211, 153, 0.08) 0%, rgba(52, 211, 153, 0) 180px),
    var(--bg);
}

.header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--panel) 92%, transparent);
  backdrop-filter: blur(8px);
}

.brand {
  display: grid;
  text-decoration: none;
}

.brand__title {
  font-weight: 700;
  color: var(--text);
}

.brand__subtitle {
  font-size: 0.76rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-link {
  text-decoration: none;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 0.9rem;
  color: var(--text);
  background: var(--panel);
}

.action-link--button {
  cursor: pointer;
}

.tabs {
  position: sticky;
  top: 66px;
  z-index: 15;
  display: flex;
  gap: 8px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--panel) 88%, transparent);
  backdrop-filter: blur(8px);
  overflow-x: auto;
}

.tab {
  white-space: nowrap;
  text-decoration: none;
  color: var(--muted);
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 600;
}

.tab--active {
  color: var(--text);
  border-color: var(--border);
  background: var(--panel);
}

.content {
  padding: 0;
}
</style>
