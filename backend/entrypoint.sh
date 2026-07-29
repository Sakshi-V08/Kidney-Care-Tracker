#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput || true

if [ "$SEED_DEMO" = "1" ]; then
  python manage.py seed_demo || true
fi

exec gunicorn khis.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120
