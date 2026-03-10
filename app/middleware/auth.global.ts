export default defineNuxtRouteMiddleware(async (to) => {
  const protectedPrefixes = ['/users', '/audit', '/assessment', '/content-ops', '/settings']
  if (!protectedPrefixes.some(prefix => to.path.startsWith(prefix))) return

  if (import.meta.server) {
    const token = useCookie('access_token')
    if (!token.value) {
      return navigateTo('/login')
    }
    return
  }

  try {
    const me = await $fetch<{ is_admin: boolean }>('/api/me')
    if (!me.is_admin) {
      return navigateTo('/login')
    }
  } catch (err: unknown) {
    const statusCode = typeof err === 'object' && err !== null && 'statusCode' in err
      ? (err as { statusCode?: number }).statusCode
      : undefined
    if (statusCode === 401 || statusCode === 403) {
      return navigateTo('/login')
    }
    return
  }
})
