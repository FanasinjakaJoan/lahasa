'use client'
import Dexie, { Table } from 'dexie'
import { extractCIN, type ExtractionResult } from './api'

export interface PendingUpload {
  id: string
  fileName: string
  base64Preview: string
  blob?: Blob
  status: 'queued' | 'uploading' | 'failed' | 'synced'
  retries: number
  createdAt: number
  error?: string
  result?: ExtractionResult
}

export interface LocalRecord {
  id: string
  lh_id: string
  data: any
  qr_data: string
  qr_base64?: string
  createdAt: number
  synced: boolean
}

class LahasaDB extends Dexie {
  pendingUploads!: Table<PendingUpload>
  localRecords!: Table<LocalRecord>

  constructor() {
    super('LahasaDB')
    this.version(1).stores({
      pendingUploads: 'id, status, createdAt',
      localRecords: 'id, lh_id, createdAt, synced'
    })
  }
}

export const db = new LahasaDB()

export async function addPending(file: File, base64: string) {
  const id = crypto.randomUUID()
  await db.pendingUploads.add({
    id, fileName: file.name, base64Preview: base64, blob: file,
    status: 'queued', retries: 0, createdAt: Date.now()
  })
  return id
}

/** Uploads the offline queue sequentially and is safe to call repeatedly. */
export async function syncPendingUploads(): Promise<{ synced: number; failed: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { synced: 0, failed: 0 }
  let synced = 0
  let failed = 0
  const pending = await db.pendingUploads.where('status').anyOf(['queued', 'failed']).sortBy('createdAt')
  for (const item of pending) {
    if (!item.blob) {
      await db.pendingUploads.update(item.id, { status: 'failed', error: 'Fichier local indisponible' })
      failed++
      continue
    }
    await db.pendingUploads.update(item.id, { status: 'uploading', error: undefined })
    try {
      const result = await extractCIN(new File([item.blob], item.fileName, { type: item.blob.type || 'image/jpeg' }))
      await db.localRecords.put({
        id: result.id, lh_id: result.lh_id, data: result.data, qr_data: result.qr_data,
        qr_base64: result.qr_image_base64, createdAt: Date.now(), synced: true
      })
      await db.pendingUploads.update(item.id, { status: 'synced', result, error: undefined })
      synced++
    } catch (error) {
      const retries = item.retries + 1
      await db.pendingUploads.update(item.id, {
        status: 'failed', retries,
        error: error instanceof Error ? error.message : 'Erreur de synchronisation'
      })
      failed++
      // Stop on a network/API outage; the next online event will retry.
      if (error instanceof TypeError || /fetch|network|failed/i.test(String(error))) break
    }
  }
  return { synced, failed }
}

export async function getPendingCount() {
  return db.pendingUploads.where('status').anyOf(['queued', 'failed']).count()
}
