export type Sexe = 'M' | 'F';

export type StatutCIN = 'pending' | 'validated' | 'duplicate' | 'archived';

export interface CINData {
  numero_cin: string; // 12 chiffres format XXX XXX XXX XXX
  nom: string;
  prenoms: string;
  date_naissance: string; // ISO YYYY-MM-DD
  lieu_naissance: string;
  sexe: Sexe;
  adresse: string;
  date_emission: string;
  lieu_emission: string;
  profession?: string;
}

export interface CINConfidence {
  numero_cin: number;
  nom: number;
  prenoms: number;
  date_naissance: number;
  lieu_naissance: number;
  adresse: number;
  global: number;
}

export interface CINExtractionResult {
  id: string; // temporaire uuid
  lh_id: string; // LH-XXXX-XXXX
  data: CINData;
  confidence: CINConfidence;
  raw_text: string;
  duplicate_of?: string; // id si doublon détecté
  duplicate_score?: number;
  image_preview_url?: string;
  qr_data: string; // payload QR
  created_at: string;
}

export interface PendingUpload {
  id: string;
  fileName: string;
  fileBlob: Blob;
  base64Preview: string;
  status: 'queued' | 'uploading' | 'failed' | 'synced';
  retries: number;
  createdAt: number;
  error?: string;
}

export interface Agent {
  id: string;
  nom: string;
  region: string;
  role: 'agent' | 'supervisor' | 'admin';
}
