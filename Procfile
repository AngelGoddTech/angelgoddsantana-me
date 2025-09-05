web: sh -c 'set -e; if [ ! -d dist ]; then npm run build; fi; gunicorn --bind=0.0.0.0 --workers=4 wsgi:application'
