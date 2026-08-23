'use client'
import Dexie, { Table } from 'dexie'

export interface PendingUpload {
  id: string
  fileName: string
  base64Preview: string
  blob?: Blob
  status: 'queued' | 'uploading' | 'failed' | 'synced'
  retries: number
  createdAt: number
  error?: string
  result?: any
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
    id,
    fileName: file.name,
    base64Preview: base64,
    blob: file,
    status: 'queued',
    retries: 0,
    createdAt: Date.now()
  })
  return id
}

export async function getPendingCount() {
  return db.pendingUploads.where('status').anyOf(['queued', 'failed']).count()
}
