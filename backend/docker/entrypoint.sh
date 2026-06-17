#!/bin/sh
set -e

echo "PostgreSQL kutilyapti..."
# Python3 deb aniq ko'rsatildi va uv muhitida ishga tushirildi
until uv run python3 docker/wait_for_db.py; do
  sleep 1
done

echo "Migratsiyalar..."
uv run python3 manage.py migrate --noinput

if [ "${SEED_DEMO:-1}" = "1" ]; then
  echo "Demo ma'lumotlar (seed)..."
  uv run python3 manage.py seed_pos_demo || true
fi

echo "Backend tayyor."
exec "$@"