import os
import sys
import psycopg2

try:
    psycopg2.connect(
        dbname=os.environ.get("POSTGRES_DATABASE", "pos_systemdb"),
        user=os.environ.get("POSTGRES_USER", "postgres"),
        password=os.environ.get("POSTGRES_PASSWORD", "UZeuqhdkAzhFCXuXeyXICpJmGIXBmrYN"),
        host=os.environ.get("POSTGRES_HOST", "postgres.railway.internal"),
        port=os.environ.get("POSTGRES_PORT", "5432")
    ).close()
    sys.exit(0)
except Exception as exc:
    print(exc, file=sys.stderr)
    sys.exit(1)