#!/bin/sh

# Wait for db to be ready:
echo "Waiting for database..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "Database started"

# Appliquer les migrations
python manage.py migrate

# Collecter les fichiers statiques
python manage.py collectstatic --no-input

# Lancer Gunicorn 
exec gunicorn Certichain.wsgi:application --bind 0.0.0.0:8000