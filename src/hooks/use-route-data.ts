import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusEffect } from 'expo-router'

import {
  getReadingContext,
  getRouteDaySummary,
  listRouteOverviews,
  listRouteSupplies,
} from '@/services/routes'

import type { ReadingContext, RouteDaySummary, RouteOverview, RouteSupplies } from '@/services/routes'

type LoadStatus = 'loading' | 'ready' | 'missing' | 'error'

function useFocusedLoad(load: (mode: 'initial' | 'refresh') => Promise<void>) {
  const first = useRef(true)

  useFocusEffect(
    useCallback(() => {
      const mode = first.current ? 'initial' : 'refresh'
      first.current = false
      void load(mode)
    }, [load]),
  )
}

export function useRouteOverviews() {
  const [overviews, setOverviews] = useState<RouteOverview[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'initial') setStatus('loading')

    try {
      setOverviews(await listRouteOverviews())
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  useFocusedLoad(load)

  return { overviews, status }
}

export function useRouteSupplies(routeKey: string) {
  const [supplies, setSupplies] = useState<RouteSupplies | null>(null)
  const [status, setStatus] = useState<LoadStatus>('loading')

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'initial') setStatus('loading')

      try {
        const next = await listRouteSupplies(routeKey)
        setSupplies(next)
        setStatus(next ? 'ready' : 'missing')
      } catch {
        setStatus('error')
      }
    },
    [routeKey],
  )

  useFocusedLoad(load)

  return { supplies, status }
}

export function useRouteSummary(routeKey: string) {
  const [summary, setSummary] = useState<RouteDaySummary | null>(null)
  const [status, setStatus] = useState<LoadStatus>('loading')

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'initial') setStatus('loading')

      try {
        const next = await getRouteDaySummary(routeKey)
        setSummary(next)
        setStatus(next ? 'ready' : 'missing')
      } catch {
        setStatus('error')
      }
    },
    [routeKey],
  )

  useFocusedLoad(load)

  return { summary, status }
}

export function useReading(routeKey: string, suministroId: string) {
  const [context, setContext] = useState<ReadingContext | null>(null)
  const [status, setStatus] = useState<LoadStatus>('loading')

  const load = useCallback(async () => {
    setStatus('loading')

    try {
      const next = await getReadingContext(routeKey, suministroId)
      setContext(next)
      setStatus(next ? 'ready' : 'missing')
    } catch {
      setContext(null)
      setStatus('error')
    }
  }, [routeKey, suministroId])

  useEffect(() => {
    void load()
  }, [load])

  return { context, status, reload: load }
}
