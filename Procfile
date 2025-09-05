web: sh -c "pnpm install --frozen-lockfile && pnpm build && gunicorn -w 4 -k gthread -b 0.0.0.0:$PORT wsgi:app"
