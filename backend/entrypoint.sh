#!/bin/bash
set -e

echo "Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."

until python -c "
import socket, sys, os
host = os.environ.get('POSTGRES_HOST', 'db')
port = int(os.environ.get('POSTGRES_PORT', '5432'))
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(2)
try:
    s.connect((host, port))
    s.close()
    sys.exit(0)
except Exception as e:
    print(f'  Connection to {host}:{port} failed: {e}')
    sys.exit(1)
" 2>&1; do
    echo "PostgreSQL not ready — retrying in 2s..."
    sleep 2
done

echo "PostgreSQL is ready!"

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting Django server..."
exec gunicorn backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120
