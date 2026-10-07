# Angel Godd Santana — Career Portfolio

[angelgoddsantana.me](https://angelgoddsantana.me)

Recruiter-first portfolio and résumé site for Angel Godd Santana, Principal Cloud & AI Platform Architect.

## Purpose

This repository contains the source for the public career site. It presents selected architecture evidence, redacted reference work, and a downloadable résumé for U.S.-remote Principal Cloud Architect, AI Platform Architect, Cloud Governance, and Cloud/DevSecOps opportunities.

## What this demonstrates

- A React and Vite frontend served as a Flask single-page application
- Clear résumé access, recruiter-focused positioning, and consulting conversion paths
- Accessible architecture-evidence pages for cloud governance, cross-cloud identity, and secure AI platform design
- A deliberate public boundary between redacted reference material and private client, employer, or production systems

## Local development

```bash
pnpm install
pnpm build
python app.py
```

## Deployment

Changes merged to `main` are built and deployed through GitHub Actions. Runtime infrastructure and operational configuration are intentionally kept private.

## Public-repository boundary

This repository does not publish customer data, production configurations, tenant or subscription identifiers, credentials, or deployment logs. Architecture examples are intentionally redacted and presented as reference material rather than client delivery evidence.

## Security

See [SECURITY.md](SECURITY.md) for the reporting guidance and public-repository boundary.

## AI assistant launch preparation

The assistant remains unavailable. `/privacy`, `/terms`, `/ai-retention-policy`
and `/assistant` provide the scoped disclosures and an inactive text/voice notice.
No provider SDK, conversation request or microphone access is included.

`GET /api/assistant/readiness` on the canonical site host returns `ready: false`, the exact notice versions
and SHA-256, and an unavailable-bridge code. `POST /api/assistant/consent` validates
the same origin and exact notice/mode contract, then returns 503. It cannot issue
authorization or store consent. A reviewed server bridge must provide real CSRF
validation and one-use consent binding to authenticated provider identity/start;
client booleans and copied conversation IDs are never evidence. Provider-role,
retention/Keep and supervised acceptance gates remain required before activation.
Unknown hosts and forwarded-host claims do not establish the personal-site source.

Local gate checks:

```bash
python -m unittest discover -s tests -p 'test_*.py'
node --test tests/*.test.js
pnpm build
```
