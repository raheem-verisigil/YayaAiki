# YayaAiki Deployment Guide

YayaAiki should remain portable across managed hosting, Hostinger, a VPS, or another standard Node-compatible environment. The application must not depend on a private development runtime in production.

## Build contract

```bash
npm install
npm run check
npm run test
npm run build
npm run start
```

The current full-stack build produces a Vite client and a bundled Node server. Keep the database, object storage, payment provider, WhatsApp provider, and AI provider behind environment-backed adapters.

## Environment setup

Copy `.env.example` into the environment's secret store. Never commit `.env`. Configure separate values for development, staging, and production. Use HTTPS and a production domain such as `https://yayaaiki.com`.

## Hostinger handoff

1. Create the application or Node hosting environment.
2. Connect the repository or upload the build through the approved deployment path.
3. Configure production environment variables and database connectivity.
4. Set the build command to `npm install && npm run build`.
5. Set the start command to `npm run start` when using the full-stack server.
6. Configure the domain and HTTPS certificate.
7. Configure object storage, payment-provider callbacks, and the WhatsApp provider through their adapters.
8. Run a smoke test for public pages, authentication, work-order creation, evidence access, verification, and payment confirmation.
9. Keep a rollback checkpoint before each production release.

## Release discipline

Production changes should pass type checks, unit tests, and a responsive visual check. Manual deployment is acceptable for the first pilot. Add CI/CD after the hosting environment is stable: push → lint → type check → tests → build → deploy.

## Current product scope

Do not require a native mobile application, blockchain, cryptocurrency, full IVR/USSD stack, or complex microservices for Phase 1. Build the first economic loop well, then expand from evidence.
