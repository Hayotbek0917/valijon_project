#!/bin/sh
set -e

echo "PostgreSQL kutilyapti..."
until nc -z "${POSTGRES_HOST:-postgres.railway.internal}" "${POSTGRES_PORT:-5432}"; do
  echo "Baza hali tayyor emas, kutilmoqda..."
  sleep 1
done

echo "PostgreSQL tayyor!"

echo "Migratsiya fayllarini yaratish (makemigrations)..."
uv run python3 manage.py makemigrations apps --noinput

echo "Migratsiyalar..."
uv run python3 manage.py migrate --noinput

# Xato berayotgan SEED_DEMO qismi olib tashlandi, backend muammosiz ishga tushishi uchun

echo "Backend tayyor."
exec "$@"