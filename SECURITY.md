# YayaAiki Security Baseline

This document defines the minimum security posture for the Phase 1 verified-work foundation. It is an implementation baseline, not a legal or compliance certification.

## Required controls

- HTTPS for every deployed surface.
- Standards-based authentication with secure, short-lived sessions where applicable.
- Role-based authorization for business, professional, operations, and support actions.
- Tenant isolation at the application, database, and object-storage boundaries.
- Input validation at every API and upload boundary.
- Rate limiting for authentication, forms, messaging, and file operations.
- Secure headers, CSRF protection where applicable, and output encoding to reduce XSS risk.
- Secrets stored in environment or managed secret storage; never in client bundles or source control.
- Audit events for logins, privilege changes, exports, evidence access, verification, payment state changes, and disputes.
- Time-limited elevated operations access with approval and an immutable trail.
- Secure file handling with content-type checks, size limits, malware scanning strategy, and object-level access control.

## Economic controls

Verification and payment are separate facts. The UI must not display a payment as confirmed until the licensed provider has returned confirmation. Evidence submissions are versioned; corrections create new records rather than rewriting historical records. Verifiers must be separated from the submitting actor for consequential decisions.

## Sensitive information

Passwords, authentication tokens, payment credentials, government IDs, private evidence, confidential client data, and sensitive personal data must not enter browser logs, analytics, session replay, or error messages. Production observability must use redaction and explicit allowlists.

## Incident principles

Preserve the event history, suspend compromised access, rotate affected credentials, document the incident, and prefer corrective events over destructive edits. Disputes, sanctions, qualification changes, and payment exceptions require human review when automated confidence is low or the consequence is high.
