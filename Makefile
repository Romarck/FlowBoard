.PHONY: dev test lint migrate stop clean

dev:
	docker compose up

dev-build:
	docker compose up --build

stop:
	docker compose down

test:
	docker compose exec backend pytest
	docker compose exec frontend npm test

lint:
	docker compose exec backend ruff check .
	docker compose exec frontend npm run lint

migrate:
	docker compose exec backend alembic upgrade head

clean:
	docker compose down -v
