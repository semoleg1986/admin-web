export type ContentOpsHistoryItem = {
  id: string
  operation: string
  status: string
  summary: string
  time: string
  requestId?: string
}

const HISTORY_KEY = 'admin-content-ops-history'
const MAX_HISTORY_ITEMS = 30

export function useContentOpsHistory() {
  const parse = (raw: string | null): ContentOpsHistoryItem[] => {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) return []
      return parsed
        .filter(item => typeof item === 'object' && item !== null)
        .map((item) => {
          const source = item as Partial<ContentOpsHistoryItem>
          return {
            id: String(source.id ?? ''),
            operation: String(source.operation ?? 'unknown'),
            status: String(source.status ?? 'unknown'),
            summary: String(source.summary ?? ''),
            time: String(source.time ?? ''),
            requestId: source.requestId ? String(source.requestId) : undefined
          }
        })
        .slice(0, MAX_HISTORY_ITEMS)
    } catch {
      return []
    }
  }

  const read = (): ContentOpsHistoryItem[] => {
    if (!import.meta.client) return []
    return parse(localStorage.getItem(HISTORY_KEY))
  }

  return {
    read
  }
}
