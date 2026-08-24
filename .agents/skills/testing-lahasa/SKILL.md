---
name: testing-lahasa
description: How to run and end-to-end test the Lahasa monorepo (FastAPI CIN/OCR API in apps/api + Next.js offline-first PWA in apps/web), including how to reach the real OCR regex parsing path instead of the canned mock data.
---

# Testing Lahasa (API + web PWA)

## Backend (apps/api)
- A venv usually exists at `apps/api/.venv`. `pip install -r requirements-dev.txt` may fail because `requirements.txt` pins a nonexistent `python-qrcode[pil]==8.0`; if so install with that line filtered: `grep -v python-qrcode requirements.txt > /tmp/r.txt && .venv/bin/pip install -r /tmp/r.txt pytest`.
- Unit tests: `cd apps/api && .venv/bin/python -m pytest -q` (expect all green; the mock OCR path uses `random`, so run it a few times to check for flakes).
- Run the API: `cd apps/api && .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000` → Swagger at `/docs`, health at `/api/v1/cin/health` (reports `ocr_engine` and `tesseract_available`).
- State is in-memory (`app/services/duplicate_service._in_memory_store`), so restarting uvicorn clears all records/duplicate history. Restart the API to get a clean duplicate-detection state.

## Reaching the real OCR / regex parsing path (important)
- `OCREngine.parse_cin_fields` short-circuits: if the OCR text contains any `MOCK_DATA_POOL` CIN number it returns a canned sample and the `CIN_PATTERNS` regexes never run. With no Tesseract installed the mock engine always emits one of those samples, so regex behaviour (nom/prenoms parsing) is NOT observable through `/api/v1/cin/extract`.
- To exercise the regexes end-to-end: `sudo apt-get install -y tesseract-ocr tesseract-ocr-fra`, then feed a synthetic card image whose CIN number is NOT in `MOCK_DATA_POOL`. Generate one with PIL (white 1400x800, DejaVuSans-Bold 44px) with lines like:
  `REPOBLIKAN'I MADAGASIKARA` / `KARA-PANONDRO` / `Anarana: <NOM>` / `Fanampiny: <Prenoms>` / `Teraka ny: 03/09/1991 tao Mahajanga` / `Laharana: 402 111 222 333` / `Nomena ny: 15/06/2020`.
  Tesseract reads this cleanly and the validate page shows the parsed fields plus the raw OCR text under "Voir texte brut OCR".
- Uploads must be `image/*` content type and >1000 bytes, else the endpoint returns 400.

## Frontend (apps/web)
- `cd apps/web && npm install && npm run dev` (port 3000). API base URL comes from `NEXT_PUBLIC_API_URL`, defaulting to `http://localhost:8000` (`lib/api.ts`).
- Flow: `/capture` → click "Parcourir" (native GTK file dialog: press ctrl+l and type the absolute image path) → auto-redirects to `/validate/<uuid>` with an editable form + per-field confidence badges → "Valider ✓" → validated screen with rendered QR PNG and `LAHASA:v1:...` payload.
- `/validate/<id>` reads its data from `sessionStorage` (`lahasa:<id>`), so opening that URL directly in a fresh tab shows "session expirée" — always arrive via the capture upload.
- `/dashboard` shows Dexie local history, the offline queue, API health and backend records — handy single screen for asserting server state.
- Offline behaviour is driven by `navigator.onLine`; emulate it with DevTools → Network → throttling "Offline". Expect the header badge to switch to "● Hors-ligne — file d'attente activée" and uploads to be queued (amber card) instead of navigating.

## Known rough edges (may still be present)
- The duplicate banner on `/validate/[id]` always says "Un enregistrement avec le même N°CIN existe déjà", even for fuzzy name matches with a different CIN — the wording is hardcoded, so don't rely on it to distinguish exact vs fuzzy; use `POST /api/v1/cin/duplicate-check` messages instead.
- `DuplicateCheckResult` does not expose the `type` field returned internally; infer exact vs fuzzy from the `message`.

## Devin Secrets Needed
- None; everything runs locally with default settings.
