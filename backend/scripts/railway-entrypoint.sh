#!/bin/sh
set -e

echo ">> Migratsiyalar..."
uv run python manage.py migrate --noinput

run_seed() {
  if [ "$SEED_QUICK" = "1" ]; then
    uv run python manage.py seed_magazin_ecosystem --clear --count 3 \
      --products-min 50 --products-max 80 \
      --debtors-min 20 --debtors-max 30 \
      --daily-sales-min 50 --daily-sales-max 80 \
      --revenue-min 500000 --revenue-max 1000000
  else
    uv run python manage.py seed_magazin_ecosystem --clear \
      --count "${SEED_MAGAZIN_COUNT:-100}" \
      --products-min "${SEED_PRODUCTS_MIN:-500}" \
      --products-max "${SEED_PRODUCTS_MAX:-1000}" \
      --suppliers-min "${SEED_SUPPLIERS_MIN:-30}" \
      --suppliers-max "${SEED_SUPPLIERS_MAX:-50}" \
      --debtors-min "${SEED_DEBTORS_MIN:-200}" \
      --debtors-max "${SEED_DEBTORS_MAX:-300}" \
      --daily-sales-min "${SEED_DAILY_SALES_MIN:-25}" \
      --daily-sales-max "${SEED_DAILY_SALES_MAX:-45}" \
      --history-days "${SEED_HISTORY_DAYS:-30}" \
      --revenue-min "${SEED_REVENUE_MIN:-5000000}" \
      --revenue-max "${SEED_REVENUE_MAX:-10000000}" \
      --sub-branches-min "${SEED_SUB_BRANCHES_MIN:-1}" \
      --sub-branches-max "${SEED_SUB_BRANCHES_MAX:-3}"
  fi
}

if [ "$SEED_MAGAZIN" = "1" ]; then
  EXISTING=$(uv run python manage.py shell -c "
from apps.models import Branch
print(Branch.objects.filter(name__startswith='Magazin ').count())
" 2>/dev/null | tail -1)

  if [ "$EXISTING" = "0" ] || [ "$SEED_FORCE" = "1" ]; then
    echo ">> Magazin seed boshlandi..."
    run_seed
    echo ">> Seed tugadi."
  else
    echo ">> Magazin ma'lumotlari mavjud ($EXISTING ta). Qayta seed: SEED_FORCE=1"
  fi
fi

PORT="${PORT:-8000}"
echo ">> Gunicorn :$PORT"
exec uv run gunicorn root.wsgi:application \
  --bind "0.0.0.0:$PORT" \
  --workers "${GUNICORN_WORKERS:-2}" \
  --timeout 120
