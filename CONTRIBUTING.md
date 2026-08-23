# Contributing

## Workflow

1. `git checkout -b feat/ma-feature`
2. Code + tests
3. `npm run build` dans apps/web doit passer
4. `curl http://localhost:8000/api/v1/cin/health` OK
5. PR vers main

## Standards

- Frontend: Tailwind, composants `ui/` réutilisables, pas de CSS inline complexe
- Backend: Pydantic models, services séparés, pas de logique dans routes
- i18n: toute string UI doit passer par `t('key')`
- Offline: toute feature web doit gérer `navigator.onLine`
