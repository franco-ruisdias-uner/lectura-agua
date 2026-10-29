import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusEffect } from 'expo-router'

import { apiErrorMessage, isMissingResource } from '@/api/errors'
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
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'initial') setStatus('loading')

    try {
      setOverviews(await listRouteOverviews())
      setError(null)
      setStatus('ready')
    } catch (caught) {
      setError(apiErrorMessage(caught, 'No se pudieron cargar las rutas'))
      setStatus('error')
    }
  }, [])

  useFocusedLoad(load)

  return { overviews, status, error }
}

export function useRouteSupplies(routeKey: string) {
  const [supplies, setSupplies] = useState<RouteSupplies | null>(null)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'initial') setStatus('loading')

      try {
        const next = await listRouteSupplies(routeKey)
        setSupplies(next)
        setError(null)
        setStatus(next ? 'ready' : 'missing')
      } catch (caught) {
        if (isMissingResource(caught)) {
          setSupplies(null)
          setError(null)
          setStatus('missing')
          return
        }
        setError(apiErrorMessage(caught, 'No se pudo cargar la ruta'))
        setStatus('error')
      }
    },
    [routeKey],
  )

  useFocusedLoad(load)

  return { supplies, status, error }
}

export function useRouteSummary(routeKey: string) {
  const [summary, setSummary] = useState<RouteDaySummary | null>(null)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'initial') setStatus('loading')

      try {
        const next = await getRouteDaySummary(routeKey)
        setSummary(next)
        setError(null)
        setStatus(next ? 'ready' : 'missing')
      } catch (caught) {
        if (isMissingResource(caught)) {
          setSummary(null)
          setError(null)
          setStatus('missing')
          return
        }
        setError(apiErrorMessage(caught, 'No se pudo cargar el resumen'))
        setStatus('error')
      }
    },
    [routeKey],
  )

  useFocusedLoad(load)

  return { summary, status, error }
}

export function useReading(routeKey: string, suministroId: string) {
  const [context, setContext] = useState<ReadingContext | null>(null)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')

    try {
      const next = await getReadingContext(routeKey, suministroId)
      setContext(next)
      setError(null)
      setStatus(next ? 'ready' : 'missing')
    } catch (caught) {
      if (isMissingResource(caught)) {
        setContext(null)
        setError(null)
        setStatus('missing')
        return
      }
      setContext(null)
      setError(apiErrorMessage(caught, 'No se pudo cargar la lectura'))
      setStatus('error')
    }
  }, [routeKey, suministroId])

  useEffect(() => {
    void load()
  }, [load])

  return { context, status, error, reload: load }
}
