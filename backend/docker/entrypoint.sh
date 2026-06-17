#!/bin/sh
set -e

echo "PostgreSQL kutilyapti..."
until uv run python - <<'PY'
import os
import sys
import psycopg2

try:
    psycopg2.connect(
        dbname=os.environ.get("POSTGRES_DATABASE", "pos_cursor"),
        user=os.environ.get("POSTGRES_USER", "postgres"),
        password=os.environ.get("POSTGRES_PASSWORD", ""),
        #!/bin/sh
set -e

echo "PostgreSQL kutilyapti..."
until uv run python - <<'PY'
import os
import sys
import psycopg2

try:
    psycopg2.connect(
        dbname=os.environ.get("POSTGRES_DATABASE", "pos_cursor"),
        user=os.environ.get("POSTGRES_USER", "postgres"),
        password=os.environ.get("POSTGRES_PASSWORD", ""),
        host=os.environ.get("POSTGRES_HOST", "postgres.railway.internal"),
        port=os.environ.get("POSTGRES_PORT", "5432"),
    ).close()
except Exception as exc:
    print(exc, file=sys.stderr)
    sys.exit(1)
PY
do
  sleep 1
done

echo "Migratsiyalar..."
uv run python manage.py migrate --noinput

if [ "${SEED_DEMO:-1}" = "1" ]; then
  echo "Demo ma'lumotlar (seed)..."
  uv run python manage.py seed_pos_demo || true
fi

echo "Backend tayyor."
exec "$@"

        port=os.environ.get("POSTGRES_PORT", "5432"),
    ).close()
except Exception as exc:
    print(exc, file=sys.stderr)
    sys.exit(1)
PY
do
  sleep 1
done

echo "Migratsiyalar..."
uv run python manage.py migrate --noinput

if [ "${SEED_DEMO:-1}" = "1" ]; then
  echo "Demo ma'lumotlar (seed)..."
  uv run python manage.py seed_pos_demo || true
fi

echo "Backend tayyor."
exec "$@"
