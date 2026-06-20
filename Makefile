.PHONY: up up-quick down seed seed-quick mig run frontend dev-sync lint format

# Bitta buyruq — postgres + backend + frontend
up:
	docker compose up --build

up-quick:
	SEED_QUICK=1 docker compose up --build

down:
	docker compose down

# Lokal (Docker siz)
dev-sync:
	cd backend && uv sync --all-groups

mig:
	cd backend && uv run python manage.py migrate

run:
	cd backend && uv run python manage.py runserver 0.0.0.0:8000

frontend:
	cd frontend && bun run dev

# 100 ta magazin — har biriga to'liq ma'lumot
seed:
	cd backend && uv run python manage.py seed_magazin_ecosystem --clear --count 100 \
		--products-min 500 --products-max 1000 \
		--debtors-min 200 --debtors-max 300 \
		--daily-sales-min 800 --daily-sales-max 1000 \
		--revenue-min 5000000 --revenue-max 10000000

seed-quick:
	cd backend && uv run python manage.py seed_magazin_ecosystem --clear --count 3 \
		--products-min 50 --products-max 80 --debtors-min 20 --debtors-max 30 \
		--daily-sales-min 50 --daily-sales-max 80

lint:
	cd backend && uv run ruff check apps root

format:
	cd backend && uv run ruff format apps root
