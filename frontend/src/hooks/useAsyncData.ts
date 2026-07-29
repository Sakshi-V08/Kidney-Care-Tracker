import { useCallback, useEffect, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  error: string | null
  loading: boolean
  isMock: boolean
  reload: () => void
}

/**
 * Fetch real API data only. Does NOT fall back to sample/mock clinical values.
 * Pass `fallback` only for non-clinical scaffolding; lab insights must use undefined.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  fallback?: T,
  deps: unknown[] = [],
  options?: { allowMockFallback?: boolean },
): AsyncState<T> {
  const allowMock = options?.allowMockFallback === true
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMock, setIsMock] = useState(false)
  const [tick, setTick] = useState(0)

  const reload = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setIsMock(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          if (allowMock && fallback !== undefined) {
            setData(fallback)
            setIsMock(true)
          } else {
            setData(null)
            setIsMock(false)
          }
          setError(err instanceof Error ? err.message : 'Request failed')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps])

  return { data, error, loading, isMock, reload }
}
