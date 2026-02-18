.PHONY: dev test lint migrate migrate-create migrate-rollback seed stop clean

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

migrate-create:
	docker compose exec backend alembic revision --autogenerate -m "$(MSG)"

migrate-rollback:
	docker compose exec backend alembic downgrade -1

seed:
	docker compose exec backend python -m app.seed

clean:
	docker compose down -v
