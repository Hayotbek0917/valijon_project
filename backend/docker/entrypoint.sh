#!/bin/sh
set -e

echo "PostgreSQL kutilyapti..."
until nc -z "${POSTGRES_HOST:-postgres.railway.internal}" "${POSTGRES_PORT:-5432}"; do
  echo "Baza hali tayyor emas, kutilmoqda..."
  sleep 1
done

echo "PostgreSQL tayyor!"

echo "Migratsiyalar..."
uv run python3 manage.py migrate --noinput

if [ "${SEED_DEMO:-1}" = "1" ]; then
  echo "Demo ma'lumotlar (seed)..."
  uv run python3 manage.py seed_pos_demo || true
fi

echo "Backend tayyor."
exec "$@"