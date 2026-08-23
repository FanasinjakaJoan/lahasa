# Lahasa - Architecture Détaillée

## 1. Vue d'ensemble

Lahasa est une plateforme **offline-first** pour la collecte d'identités basée sur OCR de CIN malgaches.

### Principes

- **2-3 clics par action** : UX ultra-simplifiée pour agents peu formés
- **Offline-first** : PWA + IndexedDB + sync batch
- **Confidentialité** : chiffrement at rest, minimisation PII
- **Extensible** : abstraction OCR pour changer moteur sans toucher API

## 2. Stack

| Couche | Tech | Rôle |
|--------|------|------|
| Web | Next.js 14, Tailwind, Dexie, Zustand | PWA responsive, camera, offline queue |
| Mobile | Expo SDK 51, SecureStore, SQLite | App terrain native, background sync |
| API | FastAPI, Pydantic, SQLAlchemy | Endpoints REST, validation, auth |
| OCR | OpenCV + Tesseract 5 (prod) / Mock (dev) | Preprocess + extraction |
| DB | PostgreSQL (prod) / SQLite (dev) | Stockage métadonnées |
| Storage | MinIO / S3 | Images chiffrées |
| QR | qrcode + HMAC SHA256 | ID unique vérifiable offline |

## 3. Flux OCR

```
Upload (multipart) → Validation (type, size)
→ OpenCV Preprocess:
  - resize 1200px
  - grayscale
  - CLAHE (clipLimit 2.0)
  - fastNlMeansDenoising
  - adaptiveThreshold (Gaussian, 31, 15)
→ OCR Engine (abstraction):
  if tesseract available:
    pytesseract --oem 3 --psm 6 -l fra+eng
    + image_to_data pour confidence
  else:
    mock avec pool de données réalistes MG
→ Regex Parsing:
  - NUMERO: \d{3}\s?\d{3}\s?\d{3}\s?\d{3}
  - DATE: DD/MM/YYYY
  - NOM/PRENOMS: patterns Anarana/Fanampiny
→ Duplicate Check:
  - Exact: normalize CIN (12 digits) → hashmap
  - Fuzzy: RapidFuzz ratio nom+prenoms >85%
→ QR Gen: LH-XXXX-XXXX + payload signé HMAC
→ Response JSON
```

## 4. Modèle de données

```sql
CINRecord:
  id UUID PK
  lh_id VARCHAR(12) UNIQUE -- LH-XXXX-XXXX
  numero_cin VARCHAR(16) UNIQUE INDEX -- 12 digits
  nom TEXT
  prenoms TEXT
  date_naissance DATE
  lieu_naissance TEXT
  sexe CHAR(1)
  adresse TEXT
  date_emission DATE
  lieu_emission TEXT
  image_front_url TEXT
  qr_code_url TEXT
  statut ENUM(pending, validated, duplicate, archived)
  confidence_score FLOAT
  raw_ocr_text TEXT
  agent_id UUID FK
  created_at, updated_at, synced_at TIMESTAMP
```

## 5. Offline-first

### Web (Dexie)

```ts
// db.ts
pendingUploads: { id, fileName, base64Preview, blob, status, retries, createdAt }
localRecords: { id, lh_id, data, qr_data, qr_base64, createdAt, synced }

// Flow
if (!navigator.onLine || fetch fails) -> addPending(file, base64)
Banner "Mode hors-ligne (n)" + bouton Sync
on online event -> for each pending: POST /extract, move to localRecords
```

### Mobile (SQLite + SecureStore)

```ts
// Similaire mais SQLite + chiffrement
// Background task every 15min if online
```

### Sync API

```
POST /api/v1/cin/sync/batch
Body: [CINData, ...]
Response: { synced: n, duplicates: m, results: [...] }
Conflict: last-write-wins + flag manuel si fuzzy >85%
```

## 6. Sécurité

- JWT (access 7j) + RBAC (agent, supervisor, admin)
- Images chiffrées AES-256 at rest, clé via ENV / SecureStore
- QR payload signé HMAC-SHA256 avec secret serveur, vérifiable offline via clé publique future
- Audit log: toute lecture CIN loggée (qui, quand, pourquoi)
- Rate limit: 60 req/min / IP sur /extract

## 7. i18n

- Dictionnaires JSON fr/mg dans packages/shared/i18n
- Hook useT() avec fallback
- Langue stockée localStorage + SecureStore
- Tout UI doit passer par t('key.path')

## 8. Scalabilité future

- Remplacer Tesseract par PaddleOCR fine-tuned sur dataset CIN MG (5k images annotées)
- Ajouter face detection pour vérifier photo vs titulaire (optionnel)
- Blockchain légère pour horodatage immuable (Hyperledger Fabric)
- Export CSV/Excel + stats dashboard superviseur
```

## 9. Diagramme C4 (textuel)

```
Agent -- (photo) --> PWA/Mobile -- (HTTPS) --> FastAPI -- (OCR) --> Tesseract
                                 |
                                 --> Dexie/SQLite (offline)
                                 --> S3 (images)
                                 --> Postgres (metadata)
```

## 10. Choix techniques justifiés

- **FastAPI** plutôt que Node pour OCR: écosystème Python CV mature, async performant
- **Next.js** plutôt que CRA: PWA, SSR pour SEO admin, App Router moderne
- **Dexie** plutôt que localForage: IndexedDB avec requêtes indexées, perf
- **Tesseract** pour MVP: gratuit, offline, suffisant 85%+ avec preprocessing. PaddleOCR pour v2.
- **Monorepo** sans Turborepo pour simplicité: pnpm workspaces suffisent au début
