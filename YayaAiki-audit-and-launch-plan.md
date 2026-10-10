# YayaAiki Repository Audit and Launch Plan

**Repository:** `raheem-verisigil/YayaAiki`  
**Audit date:** 18 September 2026  
**Prepared by:** Manus AI

## Executive conclusion

YayaAiki currently presents a clear and differentiated product concept: a verified-work infrastructure layer connecting a business brief, a professional, evidence, verification, payment state, and economic reputation. The public-facing experience is visually coherent and communicates the trust model well.

The repository is not yet a self-service production platform. It is a functioning prototype with a strong product narrative and a small tested foundation. The database currently contains only the authentication user table. The API currently exposes authentication and system routes, not work-order, evidence, verification, payment, reputation, tenant, or messaging operations. The business, professional, and operations workspaces display hard-coded example records, and their buttons mainly trigger local UI state or toast messages. The implementation therefore does not yet support real user onboarding, real work execution, real evidence submission, real payment reconciliation, or multi-country operations.

The correct next step is not to add more marketing surface. It is to implement one narrow, auditable transaction loop end to end, starting with one country, one currency, one payment provider, and a small set of work categories. Once that loop works with real persistence and human review, the platform can expand safely through country-specific adapters and policy configuration.

## What was verified

The repository was cloned from the public GitHub repository and checked locally. `pnpm check` passed, and the existing Vitest suite passed with six tests across three test files. The successful checks validate ordering and naming assumptions in the shared workflow model; they do not validate live database behavior, authorization, file handling, payments, or production deployment.

The application is a React and Vite client with a Node and Express server, tRPC routing, Drizzle ORM, and a MySQL-oriented schema. The package scripts provide type checking, tests, build, and database migration commands. The architecture document describes a work-order lifecycle and an append-only event history, but those primitives are currently represented mainly in shared TypeScript types and documentation rather than persisted domain tables and server procedures.

## Findings by product area

### Product positioning and trust claims

The positioning is strong when it describes YayaAiki as a trust layer rather than a generic marketplace. The public site clearly distinguishes the business, professional, and operations roles. It also correctly qualifies future access channels such as voice and USSD as roadmap items.

The wording must be tightened before broad launch. Claims such as “event log online,” “append-only history,” “sha256 verified,” “verified reputation,” and “payment confirmed” currently appear in illustrative interface data. They should be labelled as demonstrations until backed by live records. A production interface must never imply that a payment, verification decision, identity check, or evidence hash exists when it is only sample data.

### Self-service capability

The product is not self-service yet. A business can open a form and save a local brief, but the brief is not sent to the server. A professional can open an evidence action, but no file or structured evidence is persisted. Operations can filter a sample event list, but cannot actually qualify, assign, verify, dispute, or reconcile work.

The minimum self-service loop should be: create account; choose business or professional role; complete a role-specific profile; create or accept a work order; define acceptance criteria; reserve or record payment commitment; submit evidence; review or request rework; confirm payment through a provider callback; and publish a derived verified outcome. Each transition needs a server-side authorization check and an audit event.

### Data model and scalability

The current schema has only `users` and includes a role enum limited to `user` and `admin`. It does not provide tenant membership, business accounts, professional profiles, work orders, assignments, evidence versions, verification decisions, payment intents, disputes, events, notifications, consent records, or country configuration.

The architecture calls for tenant isolation and append-only event history, but neither is enforceable with the current schema. Before onboarding multiple organizations, the database should add tenant identifiers to every tenant-owned record, database indexes for the primary access paths, immutable event records with sequence numbers, and explicit ownership relationships. The event log should be written as part of the same transaction as the business state transition where possible.

Country expansion should not be implemented by copying tables or branching product logic. Use configuration and adapters for country, currency, language, payment provider, tax or invoice requirements, evidence policy, data retention, and dispute policy. Keep the core workflow country-neutral while allowing jurisdiction-specific rules to be versioned and audited.

### Security and governance

The security document states appropriate baseline controls, including role-based access, tenant isolation, rate limits, secure uploads, audit events, and redaction. The code inspected so far does not yet demonstrate those controls for the product domain because the corresponding routes and tables are not implemented.

The highest-risk launch gaps are authorization boundaries, object-level access to evidence, secure upload handling, rate limiting, payment callback verification, and separation between submitter and verifier. These should be treated as release blockers for any real-money pilot. The product should also provide consent and retention controls for identity documents, participant records, location data, and client-confidential evidence.

### Revenue and unit economics

The most credible initial revenue model is a transaction or service fee on verified work, combined with a business subscription for repeat buyers who need workflow, reporting, and team controls. Avoid launching with several monetization models at once. First measure completion rate, verification turnaround, dispute rate, repeat business usage, payment failure rate, and gross margin per completed work order.

A practical pilot could charge businesses for completed verified outcomes while keeping professional onboarding free. Later, business plans can add workflow volume, team access, analytics, procurement controls, and service-level commitments. Any payment or fee claim must be displayed as an estimate or configured price until the provider integration and reconciliation process are live.

## Recommended build sequence

### Release 0: truthfulness and instrumentation

Replace hard-coded “live” language with explicit demo labels where records are illustrative. Add product analytics events for landing-page conversion, role selection, onboarding completion, brief creation, assignment, evidence submission, review, rework, payment confirmation, and completion. Add error monitoring with sensitive-data redaction. Create a staging environment and a seed-data boundary so example records cannot be confused with production records.

### Release 1: the verified-work vertical slice

Implement the database tables and tRPC procedures for tenants, memberships, professional profiles, work orders, assignments, evidence versions, verification decisions, payment intents, and append-only events. Add server-side role and tenant authorization. Implement one complete work order flow with human verification and a sandbox payment provider. Store money as integer minor units with an ISO currency code. Add idempotency keys to mutations and provider callbacks.

The first vertical slice should support one country and a deliberately small category set, such as field audits, structured interviews, or data-cleaning tasks. The acceptance criteria must be structured enough that an independent reviewer can make a reproducible decision.

### Release 2: safe self-service

Connect the business brief form to the API. Add professional onboarding, capability records, availability, and assignment acceptance. Add secure evidence upload through object storage with signed URLs, file-size and content-type checks, malware-scanning hooks, access policies, and immutable version records. Add client review, rework, dispute, and notification flows.

### Release 3: operational reliability

Add payment-provider webhooks with signature verification, reconciliation states, retries, and an operator exception queue. Add background jobs for notifications and timeouts. Add rate limiting, structured logs, health checks, backup and restore tests, and a deployment pipeline that runs type checks, tests, build, migration checks, and smoke tests.

### Release 4: country expansion

Add a country configuration registry rather than country-specific branches. Each country launch should pass a readiness checklist covering payment settlement, currency display, language, privacy and retention, identity requirements, dispute handling, support coverage, and local partner responsibilities. Expand through measured demand, not by claiming universal availability before operations can support it.

## Release blockers

The following should block a public production launch: no real authorization model; no tenant isolation; no persistent work-order lifecycle; no secure evidence storage; no verified payment callback flow; no dispute and rework records; no backup and restore test; no privacy and consent flow; and no monitoring or incident procedure.

The repository can support a controlled design-partner demo now, provided the interface clearly labels sample data and no real funds or sensitive identity documents are processed. It should not yet be marketed as a live self-service work and payment platform.

## Access and implementation status

The public repository was successfully inspected locally. The GitHub connector in the current Manus session remains disabled, so I cannot create branches, commit, open pull requests, manage issues, or push changes to the repository yet. Once the GitHub connection is approved, the implementation can proceed through a reviewable branch and pull request, beginning with the truthfulness and instrumentation changes followed by the first persisted vertical slice.

## References

[1]: https://github.com/raheem-verisigil/YayaAiki/blob/main/README.md "YayaAiki repository README"
[2]: https://github.com/raheem-verisigil/YayaAiki/blob/main/ARCHITECTURE.md "YayaAiki architecture"
[3]: https://github.com/raheem-verisigil/YayaAiki/blob/main/SECURITY.md "YayaAiki security baseline"
[4]: https://github.com/raheem-verisigil/YayaAiki/blob/main/DEPLOYMENT.md "YayaAiki deployment guide"
[5]: https://github.com/raheem-verisigil/YayaAiki/blob/main/drizzle/schema.ts "YayaAiki database schema"
[6]: https://github.com/raheem-verisigil/YayaAiki/blob/main/server/routers.ts "YayaAiki server routers"
[7]: https://github.com/raheem-verisigil/YayaAiki/blob/main/client/src/pages/Workspace.tsx "YayaAiki workspace interface"
[8]: https://github.com/raheem-verisigil/YayaAiki/blob/main/shared/work-engine.ts "YayaAiki shared work engine types"

## Verification record

The local verification completed on 18 September 2026 with `pnpm check` passing and `pnpm test` passing: three test files and six tests passed. This verifies the current repository baseline only; it is not a production security, legal, regulatory, payment, or country-readiness certification.
