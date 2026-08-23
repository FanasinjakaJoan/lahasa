.PHONY: dev api web install install-api install-web test lint build health clean

PYTHON := apps/api/.venv/bin/python
PIP := apps/api/.venv/bin/pip

install: install-api install-web

install-api:
	python3 -m venv apps/api/.venv
	$(PIP) install --upgrade pip
	$(PIP) install -r apps/api/requirements-dev.txt

install-web:
	npm ci

api:
	$(PYTHON) -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

web:
	npm --prefix apps/web run dev

dev:
	docker compose up --build

test:
	$(PYTHON) -m pytest apps/api/tests -q

lint:
	npm --prefix apps/web run lint

build:
	npm --prefix apps/web run build

health:
	curl --fail --silent http://localhost:8000/api/v1/cin/health | python3 -m json.tool

clean:
	rm -rf apps/web/.next apps/web/node_modules apps/api/__pycache__ apps/api/app/**/__pycache__ apps/api/uploads
