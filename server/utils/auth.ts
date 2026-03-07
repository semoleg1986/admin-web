import { getCookie, setCookie } from 'h3'
import type { H3Event } from 'h3'

declare const Buffer: {
  from(input: string, encoding: string): {
    toString(encoding: string): string
  }
}

type JwtPayload = {
  sub?: string
  roles?: string[] | string
}

export function getAccessToken(event: H3Event): string | null {
  return getCookie(event, 'access_token') || null
}

export function getRefreshToken(event: H3Event): string | null {
  return getCookie(event, 'refresh_token') || null
}

export function setAccessToken(event: H3Event, token: string, secure: boolean, sameSite: string): void {
  setCookie(event, 'access_token', token, {
    httpOnly: true,
    secure,
    sameSite: sameSite as 'lax' | 'strict' | 'none',
    path: '/'
  })
}

export function setRefreshToken(event: H3Event, token: string, secure: boolean, sameSite: string): void {
  setCookie(event, 'refresh_token', token, {
    httpOnly: true,
    secure,
    sameSite: sameSite as 'lax' | 'strict' | 'none',
    path: '/'
  })
}

export function clearTokens(event: H3Event): void {
  setCookie(event, 'access_token', '', { httpOnly: true, path: '/', maxAge: 0 })
  setCookie(event, 'refresh_token', '', { httpOnly: true, path: '/', maxAge: 0 })
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function getUserIdFromJwt(token: string): string | null {
  return decodeJwt(token)?.sub || null
}

export function getRolesFromJwt(token: string): string[] {
  const raw = decodeJwt(token)?.roles
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string') return raw.split(/[\s,]+/).filter(Boolean)
  return []
}

export function isAdminToken(token: string): boolean {
  return getRolesFromJwt(token).includes('admin')
}
