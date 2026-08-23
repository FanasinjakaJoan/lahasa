'use client'

import { useCallback, useEffect } from 'react'
import { syncPendingUploads } from '@/lib/db'

/** Centralises the retry behaviour so every page does not implement its own sync loop. */
export function OfflineSync() {
  const sync = useCallback(() => { void syncPendingUploads() }, [])

  useEffect(() => {
    sync()
    window.addEventListener('online', sync)
    const interval = window.setInterval(sync, 60_000)
    return () => {
      window.removeEventListener('online', sync)
      window.clearInterval(interval)
    }
  }, [sync])

  return null
}
