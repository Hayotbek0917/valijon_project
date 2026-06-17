#!/bin/sh
set -e

echo "PostgreSQL kutilyapti..."

uv run python <<END
import os
import sys
import dj_database_url
from django.db import connections
from django.db.utils import OperationalError

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("DATABASE_URL topilmadi!")
    sys.exit(1)

try:
    conn = dj_database_url.parse(db_url)
    print("Bazaga ulanish muvaffaqiyatli!")
    sys.exit(0)
except Exception as e:
    print(f"Ulanishda xato: {e}")
    sys.exit(1)
END

echo "PostgreSQL tayyor, ilova ishga tushirilmoqda..."
# Migratsiyalarni amalga oshirish
uv run python manage.py migrate
exec "$@"