# angel-resume-website (Azure App Service - Python)

This is a Vite + React single-page app served by Flask for hosting on Azure App Service with the Python 3.13 runtime.

- Build static assets with `pnpm build` (outputs to `dist/`).
- Flask serves files from `dist/` and handles SPA fallback.
- Azure starts the app via the `Procfile` (Gunicorn).

Local run (optional):
1. Build: `pnpm install && pnpm build`
2. Run Flask: `python app.py` then open http://localhost:8000

Deployment notes:
- Ensure `requirements.txt` is present so Azure installs Flask and Gunicorn.
- If using Linux App Service (recommended), Procfile is honored; otherwise configure Startup Command.