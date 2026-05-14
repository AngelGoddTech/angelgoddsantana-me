# angelgoddsantana.me — Personal Portfolio Website

> Vite + React 19 + TailwindCSS 4 SPA served by Flask on Azure App Service (Linux, Python 3.13)

## 🏗️ Architecture

| Component | Detail |
|-----------|--------|
| **Frontend** | React 19, TailwindCSS 4, Framer Motion, Three.js (lazy) |
| **Backend** | Flask 3.0.3 → Gunicorn (serves `dist/` with SPA fallback) |
| **Hosting** | Azure App Service — **Basic B1** (Linux, East US 2) |
| **App Name** | `angelgoddsantana-me-v2` |
| **Subscription** | `deb5fa03-e79e-4b80-a59f-77a3f93abd9d` (Microsoft Partner Network-2021-HoA) |
| **Tenant** | `a486452d-40ff-4507-8b8f-4a7668c81006` |
| **Resource Group** | `angelgoddsantana-me-rg` |
| **Custom Domain** | [angelgoddsantana.me](https://angelgoddsantana.me) |
| **SSL** | Azure Managed Certificate (auto-renewing) |
| **DNS** | Azure DNS zone in `dns-4angelgoddsantana-me-rg` (source sub `19a6d236`) |
| **CI/CD** | GitHub Actions → OIDC → Azure (`main_angelgoddsantana-me.yml`) |
| **Domain Registrar** | GoDaddy (expires 2027-09-04) |

## 💰 Monthly Cost

| Service | Cost |
|---------|-----:|
| App Service B1 Linux | $12.41 |
| Azure DNS (1 zone) | $0.50 |
| GoDaddy .me domain | $2.33 |
| GitHub/SSL/LFS | $0.00 |
| **Total** | **$15.24** |

## 🛠️ Local Development

```bash
# Install & build
npm install --legacy-peer-deps  # or: npx -y pnpm install
npm run build                    # or: npx -y pnpm run build

# Run Flask dev server
python app.py  # → http://localhost:8000
```

## 🚀 Deployment

Code deploys to Azure via GitHub Actions on push to `main`:
1. Checkout → Python venv → pip install → Upload artifact
2. Azure OIDC login → Deploy to App Service

**Manual deploy (if needed):**
```bash
# Build locally, then zip deploy
npm run build
zip -r deploy.zip app.py wsgi.py Procfile requirements.txt dist/
az webapp deploy --name angelgoddsantana-me-v2 \
  --resource-group angelgoddsantana-me-rg \
  --subscription deb5fa03-e79e-4b80-a59f-77a3f93abd9d \
  --src-path deploy.zip --type zip
```

## 📋 Infrastructure Changelog

| Date | Change | Impact |
|------|--------|--------|
| 2026-05-14 | **B2 → B1 downgrade** | -$12.41/mo (-45%) |
| 2026-05-14 | **Migrated to sub `deb5fa03`** | Cross-tenant recreate (from `19a6d236`) |
| 2026-05-14 | App renamed `angelgoddsantana-me-v2` | Soft-delete name conflict |
