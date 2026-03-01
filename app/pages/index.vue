<template>
  <main class="page">
    <section class="card">
      <h1>Admin Portal</h1>
      <p class="subtitle">
        Redirecting to login.
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
onMounted(() => {
  navigateTo('/login')
})
</script>

<style scoped>
.page { min-height: 100vh; display: grid; place-items: center; background: var(--bg); }
.card { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 20px; }
.subtitle { color: var(--muted); }
</style>
