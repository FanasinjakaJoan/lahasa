.PHONY: dev api web install clean

install:
	cd apps/api && pip install -r requirements.txt
	cd apps/web && npm install

api:
	cd apps/api && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

web:
	cd apps/web && npm run dev

dev:
	@echo "Lancer api et web en parallèle via docker-compose ou deux terminaux"
	docker-compose up --build

clean:
	rm -rf apps/web/.next apps/web/node_modules apps/api/__pycache__ apps/api/uploads

health:
	curl http://localhost:8000/api/v1/cin/health | jq
