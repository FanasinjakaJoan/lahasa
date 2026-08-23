# Lahasa — Plateforme d'automatisation de la collecte d'identité

> **Lahasa** (du malgache *lahasaina* = à organiser) est une plateforme offline-first pour la numérisation, l'extraction OCR et la gestion des Cartes d'Identité Nationales (CIN) malgaches. Pensée pour le terrain : 2-3 clics par action, multilingue (MG/FR), QR code instantané.

![License](https://img.shields.io/badge/license-MIT-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%20%2B%20FastAPI%20%2B%20Postgres-green)
![Status](https://img.shields.io/badge/status-MVP-orange)

## 🎯 Vision Produit

**Problème** : Collecte manuelle des CIN lente, erreurs de saisie, doublons, zones sans connectivité.

**Solution Lahasa** :
1. **Numérisation OCR** : Capture photo → extraction auto (Nom, Prénoms, Date/Lieu naissance, N°CIN 12 chiffres, Date émission, Adresse) → validation rapide
2. **Collecte terrain offline-first** : PWA + App mobile Expo avec stockage local chiffré + sync auto
3. **UX ultra-simplifiée** : 2-3 clics, mode sombre/clair, MG/FR, QR code unique par identité

## 🏗️ Architecture Technique

### Stack proposée

```
lahasa/
├── apps/
│   ├── web/          # Frontend Web PWA - Next.js 14, Tailwind, Dexie (IndexedDB)
│   ├── mobile/       # App terrain - Expo React Native (partage 80% code web)
│   └── api/          # Backend - FastAPI Python + OCR Engine
├── packages/
│   ├── shared/       # Types TS, constantes CIN, i18n dictionaries
│   └── ocr-core/     # Logique OCR commune (preprocessing, regex MG)
└── infra/
    ├── docker-compose.yml
    └── nginx/
```

**Frontend (Web & Mobile)**
- **Web** : Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Zustand, Dexie.js (offline), next-pwa
- **Mobile** : Expo SDK 51, React Native, expo-camera, expo-secure-store, expo-sqlite (offline), même design system
- **Commun** : Multilingue custom (fr/mg), QR code (qrcode.react), camera API, drag&drop

**Backend (API + OCR)**
- **API** : FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, PostgreSQL, JWT Auth
- **OCR Engine** : Abstraction `OCREngine`
  - Prod : PaddleOCR / Tesseract 5 + OpenCV preprocessing (deskew, CLAHE, adaptive threshold)
  - Fallback : Simulation intelligente pour démo/dev
  - Post-processing : Regex spécifiques CIN malgache (format `XXX XXX XXX XXX`)
- **Stockage** : S3-compatible (MinIO local / AWS S3), chiffrement AES-256 at rest
- **QR & ID** : Génération ID unique `LH-XXXX-XXXX` + QR code (qrcode + signature HMAC)

**Flux de données**

```
[Capture Photo] → [Preprocess OpenCV] → [OCR Engine] → [NLP Regex + Validation] 
→ [Duplicate Check (num_cin + fuzzy name)] → [Editable Review UI] → [PostgreSQL + S3] → [QR Gen]
```

**Offline-first**
- Web : Service Worker + Dexie IndexedDB queue `pending_uploads`
- Mobile : SQLite + SecureStore + Background Sync (expo-task-manager)
- Sync : `POST /api/v1/sync/batch` avec conflict resolution (last-write-wins + manuel)

### Modèle de données (simplifié)

```python
CINRecord {
  id: UUID
  lh_id: str # LH-XXXX-XXXX unique
  numero_cin: str # 12 digits, unique index
  nom: str
  prenoms: str
  date_naissance: date
  lieu_naissance: str
  sexe: enum
  adresse: str
  date_emission: date
  lieu_emission: str
  image_front_url: str
  image_back_url: str?
  qr_code_url: str
  statut: enum [pending, validated, duplicate, archived]
  agent_id: UUID
  created_at, updated_at, synced_at
  confidence_score: float # score OCR global
  raw_ocr_text: str
}
```

## 🚀 Démarrage rapide

### Prérequis
- Node.js 20+
- Python 3.11+
- Docker (optionnel)

### Installation automatisée (recommandée)

Depuis la racine du dépôt, une seule commande prépare l'environnement Python et les workspaces Node :

```bash
cp .env.example apps/api/.env
make install
# ou : npm install
```

`make install` crée `apps/api/.venv`, installe aussi les dépendances de test et utilise le lockfile racine reproductible.

### 1. Backend API

```bash
make api # http://localhost:8000/docs
# Optionnel: installer tesseract pour l'OCR réel
# brew install tesseract # macOS / apt install tesseract-ocr tesseract-ocr-fra -y
```

### 2. Frontend Web

```bash
make web # http://localhost:3000
```

Les appels du navigateur passent par le proxy Next.js (`/api`) : aucune URL `localhost` n'est codée dans le client, ce qui évite les erreurs sur mobile, Docker et les previews distantes.

### 3. Full stack Docker

```bash
docker compose up --build
# web: http://localhost:3000
# api: http://localhost:8000
```

Le web utilise `http://api:8000` entre conteneurs et conserve des URLs relatives côté navigateur.

### 4. App Mobile (Expo)

```bash
cd apps/mobile
pnpm install
pnpm start
# Scanner QR avec Expo Go
```

## 📦 Premier module — Acquisition CIN (implémenté)

**Backend** `POST /api/v1/cin/extract`:
- Upload multipart `front_image` (+ optionnel `back_image`)
- Preprocessing OpenCV : resize 1200px, grayscale, CLAHE, denoise, adaptive threshold
- OCR : Tesseract si dispo sinon simulation avec données réalistes MG
- Parsing : regex pour CIN malgache + date `DD/MM/YYYY`
- Retourne `CINExtractionResult` avec `confidence` par champ

**Frontend** `/capture`:
- Drag & Drop + Camera (getUserMedia / expo-camera)
- Preview instantanée + crop UI
- Appel API + loader
- Redirection vers `/validate/[id]` avec formulaire éditable + détection doublon temps réel
- Génération QR instantanée (canvas) + bouton Imprimer / Partager

**Offline**:
- Si `navigator.onLine === false` ou API down → sauvegarde dans Dexie `pendingQueue`
- Banner "Mode hors-ligne" + compteur
- Bouton "Synchroniser" → batch upload dès online

## 🌐 i18n — Malagasy & Français

Dictionnaires dans `packages/shared/i18n/` :
- `fr.json` : "Numériser une CIN", "Nom", "Valider"...
- `mg.json` : "Haka Kara-panondro", "Anarana", "Hamarino"...

Hook `useT()` : `t('capture.title')`

## 🔒 Sécurité & Conformité

- Chiffrement images au repos (AES-256, clé via ENV)
- PII minimisation : pas de stockage raw image après validation si configuré
- JWT + RBAC (agent, superviseur, admin)
- Audit log de toute consultation CIN
- RGPD-like : droit à l'oubli, export

## 🗺️ Roadmap

- [x] Squelette monorepo + API + Web PWA + Module acquisition
- [x] OCR abstraction + simulation + regex MG
- [x] Validation UI + duplicate detection + QR
- [x] Offline-first (Dexie + Sync)
- [ ] Mobile Expo final + SecureStore + Biometrie
- [ ] PaddleOCR fine-tuned sur CIN malgache (dataset 5k images)
- [ ] Admin dashboard + stats + export CSV/Excel
- [ ] Signature électronique agent + horodatage blockchain léger

## 🤝 Contribution

Voir `CONTRIBUTING.md`. Workflow : feature branch → PR → CI (lint, test, build)

## 📄 Licence

MIT — Voir `LICENSE`

---
Construit avec ❤️ pour Madagascar — *Lahasa manamora ny fiainana*
