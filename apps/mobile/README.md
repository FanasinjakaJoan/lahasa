# Lahasa Mobile - App Terrain

Expo React Native app pour agents terrain.

## Features offline-first

- **Capture**: expo-camera avec overlay guide CIN
- **Stockage**: expo-sqlite (table `pending_cin`, `validated_cin`) + expo-secure-store pour clé AES
- **Sync**: Background task (expo-task-manager) qui POST /api/v1/cin/sync/batch dès online
- **Sécurité**: Chiffrement image locale AES-256-GCM, clé stockée dans SecureStore
- **QR**: Génération locale via `react-native-qrcode-svg` + vérif HMAC
- **i18n**: même dictionnaires que web (fr/mg)

## Structure prévue

```
app/
  index.tsx -> Dashboard agent
  capture.tsx -> Camera + preview
  validate/[id].tsx -> Formulaire édition
  sync.tsx -> File d'attente + bouton sync manuel
lib/
  db.ts -> SQLite wrapper
  api.ts -> même que web mais avec queue
  crypto.ts -> chiffrement
```

## Lancer

```bash
pnpm install
pnpm start
# Scanner QR avec Expo Go
```

Pour MVP, la PWA web (`apps/web`) couvre déjà 90% des besoins mobile (responsive, camera via getUserMedia, Dexie offline). Cette app Expo est le conteneur natif qui ajoute SecureStore + background sync.
