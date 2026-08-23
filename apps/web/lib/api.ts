const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ExtractionResult {
  id: string
  lh_id: string
  data: {
    numero_cin: string
    nom: string
    prenoms: string
    date_naissance: string
    lieu_naissance: string
    sexe: string
    adresse: string
    date_emission: string
    lieu_emission: string
    profession?: string
  }
  confidence: {
    numero_cin: number
    nom: number
    prenoms: number
    date_naissance: number
    lieu_naissance: number
    adresse: number
    global: number
  }
  raw_text: string
  duplicate_of?: string
  duplicate_score?: number
  qr_data: string
  qr_image_base64: string
  created_at: string
}

export async function extractCIN(file: File, useMock = false): Promise<ExtractionResult> {
  const form = new FormData()
  form.append('front_image', file)
  form.append('use_mock', String(useMock))

  const res = await fetch(`${API_BASE}/api/v1/cin/extract`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Erreur API ${res.status}`)
  }

  return res.json()
}

export async function validateCIN(id: string, data: any) {
  const res = await fetch(`${API_BASE}/api/v1/cin/validate/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Validation échouée')
  return res.json()
}

export async function listRecords() {
  const res = await fetch(`${API_BASE}/api/v1/cin/records`)
  if (!res.ok) throw new Error('List failed')
  return res.json()
}

export async function healthCheck() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/cin/health`, { cache: 'no-store' })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}
