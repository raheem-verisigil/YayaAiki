# YayaAiki Phase 1: Nigeria-First Work Assurance Schema and API

**Status:** Draft for engineering review  
**Scope:** One self-service web console, Nigeria, NGN, buyer-funded work, human/rule verification, licensed payment execution, operations-assisted fulfillment  
**Source of truth:** Web application and database  
**Out of scope:** Wallet custody, payment processing, public reputation scores, USSD, voice, pan-African rollout, autonomous AI decisions, microservices

## Design decision

YayaAiki should preserve the current repository foundation and make the Work Assurance model persistent. The current repository uses Drizzle with `mysql-core` and `mysql2`, so this draft is intentionally MySQL-compatible rather than introducing an unrequested database migration. The business concepts remain portable if PostgreSQL becomes necessary later.

The first transaction must be reconstructable as:

> **Demand → Work Order → Acceptance Criteria → Assignment → Evidence Pack → Verification → Accept/Rework/Dispute → Payment State → Provider Confirmation → Work Assurance Record → Work History**

A database record is not automatically trusted. Trust is earned only when the required transitions and evidence exist, actor permissions are satisfied, and provider confirmation is recorded for payment.

## Core lifecycle

### Work-order statuses

`DRAFT` → `SUBMITTED` → `REVIEW` → `READY` → `FUNDED` → `ASSIGNING` → `ACTIVE` → `SUBMITTED_FOR_VERIFICATION` → `UNDER_VERIFICATION` → `ACCEPTED` → `PAYMENT_AUTHORIZED` → `PAYMENT_PROCESSING` → `PAYMENT_CONFIRMED` → `COMPLETED`

Exceptional states are `REWORK`, `DISPUTED`, and `CANCELLED`. A transition must be executed through a server procedure that checks the current status, actor permission, required inputs, and idempotency key. Clients must never update status directly.

### Payment states

`NOT_APPLICABLE` → `UNFUNDED` → `COMMITTED` → `CONFIRMED` → `AUTHORIZED` → `PROCESSING` → `CONFIRMED_BY_PROVIDER` → `FAILED` → `REFUNDED` → `RECONCILIATION_REQUIRED`

YayaAiki must not hold customer funds in Phase 1. The payment provider remains responsible for money movement, KYC/AML controls, settlement, and provider-specific callbacks. YayaAiki stores intent, reference, state, and reconciliation facts.

### Evidence and review states

Evidence artifacts are immutable versions. A correction creates a new version and never rewrites a prior artifact. Review decisions are append-only: `PENDING`, `PASSED`, `FAILED`, `REWORK`, or `DISPUTED`.

AI may classify, summarize, detect missing evidence, or flag anomalies. It may not be the final authority for a consequential verification, payment, sanction, or worker-access decision.

## Entity model

### `users`

Keep the current authentication table. The global `role` column should not be the source of product authorization; product roles belong in tenant memberships and operations grants.

Important fields: `id`, `openId`, `name`, `email`, `loginMethod`, `createdAt`, `updatedAt`, `lastSignedIn`.

### `tenants`

Represents a business, YayaAiki internal operations tenant, or future partner organization.

Fields:

- `id`: bigint primary key
- `kind`: `BUSINESS | OPERATIONS | PARTNER`
- `legalName`: varchar
- `displayName`: varchar
- `countryCode`: char(2), initially `NG`
- `defaultCurrency`: char(3), initially `NGN`
- `status`: `ACTIVE | SUSPENDED | CLOSED`
- `createdAt`, `updatedAt`

Indexes: `(countryCode, status)`, unique stable tenant slug.

### `tenant_memberships`

Links users to tenants and defines authorization.

Fields:

- `id`, `tenantId`, `userId`
- `role`: `OWNER | ADMIN | BUYER | PROFESSIONAL | REVIEWER | SUPPORT | FINANCE | OPS_ADMIN`
- `status`: `INVITED | ACTIVE | SUSPENDED | REMOVED`
- `invitedByUserId`, `joinedAt`, `createdAt`, `updatedAt`

Unique constraint: `(tenantId, userId)`. Index: `(userId, status)`.

### `professional_profiles`

A professional’s capability and payout profile. Do not publish a global score in Phase 1.

Fields:

- `id`, `userId`, optional `tenantId` for agency-owned professionals
- `displayName`, `bio`, `countryCode`, `timezone`
- `phoneE164`, `preferredLanguage`
- `onboardingStatus`: `STARTED | SUBMITTED | APPROVED | REJECTED | SUSPENDED`
- `availabilityStatus`: `AVAILABLE | LIMITED | UNAVAILABLE`
- `consentVersion`, `consentedAt`
- `createdAt`, `updatedAt`

Keep identity verification details in a separate restricted table or provider reference. Do not store raw government identity documents in the normal application database.

### `job_families`

A controlled category used for templates, routing, pricing, and reporting.

Fields: `id`, `code`, `name`, `description`, `countryCode`, `status`, `createdAt`, `updatedAt`.

Initial examples: `DATA_QA`, `TRANSCRIPTION`, `TRANSLATION`, `RESEARCH`, `CATALOGUE_QA`. These are testable categories, not permanent company identity.

### `task_templates`

Defines reusable work-order structure without forcing every buyer into the same wording.

Fields:

- `id`, `jobFamilyId`, `version`
- `name`, `description`
- `defaultAcceptancePolicy` as JSON
- `defaultDataClass`: `D0 | D1 | D2 | D3 | D4 | D5`
- `active`, `createdByUserId`, `createdAt`

Unique constraint: `(jobFamilyId, version)`.

### `work_orders`

The central economic record.

Fields:

- `id`, `publicId` such as `WO-01J...`
- `buyerTenantId`, optional `templateId`, `jobFamilyId`
- `title`, `description`, `instructions`
- `status`
- `countryCode`: `NG`
- `currency`: `NGN`
- `priceMinor`: unsigned bigint; never use floating-point money
- `professionalPayoutMinor`, `platformFeeMinor`, `reviewFeeMinor`
- `deadlineAt`, `submittedAt`, `acceptedAt`, `completedAt`
- `dataClass`, `jurisdictionCode`
- `createdByUserId`, `assignedProfessionalId`, `assignedReviewerId`
- `currentVersion`, `createdAt`, `updatedAt`

Indexes: `(buyerTenantId, status, updatedAt)`, `(jobFamilyId, status)`, `(assignedProfessionalId, status)`, `(assignedReviewerId, status)`, unique `publicId`.

### `acceptance_criteria`

Replace the weak `string[]` concept with auditable criteria.

Fields:

- `id`, `workOrderId`, `version`, `criterionKey`
- `description`
- `type`: `BOOLEAN | NUMERIC | TEXT_MATCH | FILE_REQUIRED | HUMAN_JUDGMENT`
- `required`: boolean
- `validationMethod`: `RULE | HUMAN | AI_ASSISTED_HUMAN`
- `evidenceRequired`: boolean
- `sortOrder`
- `status`: `PENDING | PASSED | FAILED | WAIVED`
- `verifiedByUserId`, `verifiedAt`, `failureReason`
- `createdAt`, `updatedAt`

Unique constraint: `(workOrderId, version, criterionKey)`. A criterion should be traceable to one or more evidence artifacts.

### `assignments`

Separates the work order from the professional relationship and allows reassignment history.

Fields: `id`, `workOrderId`, `professionalProfileId`, `assignedByUserId`, `status`, `offeredAt`, `acceptedAt`, `startedAt`, `endedAt`, `rejectionReason`, `createdAt`, `updatedAt`.

Statuses: `OFFERED | ACCEPTED | DECLINED | ACTIVE | WITHDRAWN | COMPLETED`.

Unique active assignment rule: only one `ACCEPTED` or `ACTIVE` assignment per work order in Phase 1.

### `evidence_packs`

A submission bundle for a work order.

Fields: `id`, `workOrderId`, `assignmentId`, `submittedByUserId`, `version`, `status`, `submittedAt`, `supersedesPackId`, `summary`, `createdAt`.

Statuses: `DRAFT | SUBMITTED | UNDER_REVIEW | ACCEPTED | REWORK | REJECTED`.

### `evidence_artifacts`

Stores metadata and a private object-storage key, not a public URL.

Fields:

- `id`, `evidencePackId`, `criterionId`
- `artifactType`, `objectKey`, `originalFilename`
- `contentType`, `sizeBytes`, `sha256`
- `source`: `UPLOAD | GENERATED | EXTERNAL_REFERENCE`
- `capturedAt`, `uploadedAt`
- `version`, `supersedesArtifactId`
- `metadataJson`, `createdAt`

Access is authorized by work-order membership and evidence policy. Signed URLs must be short-lived.

### `verification_reviews`

Every decision is append-only.

Fields: `id`, `workOrderId`, `evidencePackId`, `reviewerUserId`

- `method`: `HUMAN | RULE | AI_ASSISTED_HUMAN`
- `decision`: `PASS | FAIL | REWORK | DISPUTE`
- `reason`, `confidence` nullable
- `policyVersion`, `modelReference` nullable
- `criterionResultsJson`
- `createdAt`

Reviewers must not be the submitting professional or the buyer for independent-review policies. High-risk or disputed work requires an operations reviewer.

### `rework_requests`

Fields: `id`, `workOrderId`, `evidencePackId`, `requestedByUserId`, `reason`, `requiredActionsJson`, `dueAt`, `resolvedAt`, `createdAt`.

### `disputes`

Fields: `id`, `workOrderId`, `openedByUserId`, `reasonCode`, `description`, `status`, `resolutionCode`, `resolvedByUserId`, `resolvedAt`, `createdAt`, `updatedAt`.

Statuses: `OPEN | UNDER_REVIEW | RESOLVED_BUYER | RESOLVED_PROFESSIONAL | SPLIT | ESCALATED | CLOSED`.

### `payment_intents`

Fields: `id`, `workOrderId`, `provider`, `providerReference`, `amountMinor`, `currency`, `state`, `idempotencyKey`, `authorizedAt`, `providerConfirmedAt`, `failureCode`, `rawEventReference`, `createdAt`, `updatedAt`.

Unique constraints: `(provider, providerReference)` where present and `idempotencyKey`.

### `payment_events`

Immutable provider callback ledger: `id`, `paymentIntentId`, `providerEventId`, `eventType`, `signatureVerified`, `payloadHash`, `receivedAt`, `processedAt`, `processingStatus`, `errorCode`.

Never trust a browser redirect as payment confirmation. Only a verified provider callback or a reconciled provider query can move the payment state.

### `work_assurance_records`

A generated snapshot/reference for the buyer.

Fields: `id`, `workOrderId`, `recordVersion`, `recordStatus`, `recordHash`, `jsonObjectKey`, `pdfObjectKey`, `generatedAt`, `publishedAt`.

The record should cite the work order, criteria, assignment, evidence-pack versions, decisions, rework, dispute, payment confirmation, and outcome. It must not expose private identity or evidence beyond the viewer’s authorization.

### `work_history_entries`

Derived, not manually edited.

Fields: `id`, `professionalProfileId`, `workOrderId`, `jobFamilyId`, `outcome`: `ACCEPTED | ACCEPTED_AFTER_REWORK | DISPUTED | CANCELLED`, `onTime`, `firstPassAccepted`, `buyerTenantId`, `visibility`: `PRIVATE | SHARED_WITH_CONSENT`, `consentVersion`, `createdAt`.

Do not calculate or display a universal public score in Phase 1.

### `domain_events`

Append-only lifecycle history.

Fields: `id`, `tenantId`, `aggregateType`, `aggregateId`, `sequenceNumber`, `eventType`, `actorUserId`, `actorRole`, `payloadJson`, `policyVersion`, `previousHash`, `eventHash`, `occurredAt`, `correlationId`, `idempotencyKey`.

Unique constraint: `(aggregateType, aggregateId, sequenceNumber)`. The hash chain provides tamper evidence, not blockchain-style consensus.

### `audit_logs`

Security and access trail for logins, membership changes, exports, evidence reads, verification, payment changes, disputes, and administrative actions. Keep sensitive values redacted and record the resource, actor, action, result, IP hash or approved operational identifier, and timestamp.

## tRPC API contract

All procedures use `superjson`, Zod input validation, tenant authorization, and an idempotency key for mutations. Inputs must reject unknown or overlong fields where appropriate. Every mutation returns a stable public identifier and the resulting status, not an untrusted client-supplied status.

### Session and workspace

- `auth.me`: return authenticated user and active tenant memberships.
- `workspace.list`: list authorized tenants and roles.
- `workspace.switch`: set the active tenant context in the session; verify membership.
- `workspace.inviteMember`: owner/admin only; create invitation with expiry.
- `workspace.acceptInvite`: authenticated user accepts a valid invitation.

### Professional onboarding

- `professional.getMyProfile`: protected; own profile or authorized operations.
- `professional.upsertProfile`: own profile; validates country, phone, language, availability, and consent version.
- `professional.submitForReview`: own profile; moves `STARTED` to `SUBMITTED`.
- `professional.approve`: operations reviewer only; records policy version and audit event.
- `professional.setAvailability`: own profile; does not override active assignment obligations.

### Job families and templates

- `jobFamily.list`: public authenticated catalog of active Nigeria families.
- `taskTemplate.get`: authorized template retrieval.
- `taskTemplate.create`: operations admin only.
- `taskTemplate.publish`: operations admin plus policy review.

### Business work orders

- `workOrder.createDraft`: buyer/admin; accepts title, description, job family, currency, price, deadline, data class, and criteria.
- `workOrder.updateDraft`: buyer/admin; only while `DRAFT`.
- `workOrder.submit`: buyer/admin; validates minimum brief, criteria, price, deadline, and data policy.
- `workOrder.list`: tenant-scoped cursor pagination with filters for status, family, and date.
- `workOrder.get`: buyer member, assigned professional, assigned reviewer, or operations member according to policy.
- `workOrder.requestQuote`: optional Phase 1 operation; creates a quote task without pretending a price is final.
- `workOrder.cancel`: buyer/admin or operations with reason; blocked after provider-confirmed payment unless refund flow exists.

### Assignment and work execution

- `assignment.offer`: operations or authorized buyer; selects an approved professional.
- `assignment.accept`: assigned professional only; checks offer expiry and conflict policy.
- `assignment.decline`: assigned professional only; requires reason.
- `assignment.start`: assigned professional; records start event and any required check-in metadata.
- `assignment.listAvailable`: approved professional; only eligible, non-conflicting work.

### Criteria and evidence

- `criteria.list`: authorized work-order members.
- `criteria.updateDraft`: buyer/operations while work order is before `FUNDED`.
- `evidencePack.createDraft`: assigned professional; creates a versioned pack.
- `evidencePack.createUploadUrl`: assigned professional or authorized submitter; validates artifact type, size, and criterion mapping; returns short-lived signed upload URL.
- `evidencePack.finalize`: submitter; checks required artifacts and hashes, then moves pack to `SUBMITTED`.
- `evidencePack.list`: authorized members; metadata only by default.
- `evidenceArtifact.getDownloadUrl`: authorized member; records an evidence-read audit event.
- `evidencePack.requestRework`: reviewer or buyer; creates rework request and moves work order to `REWORK`.

### Verification and disputes

- `verification.claimReview`: eligible reviewer only; prevents self-review and duplicate active claims.
- `verification.submitDecision`: reviewer; requires criterion-level outcomes, reason, policy version, and idempotency key.
- `verification.getReviewHistory`: authorized operations and relevant parties; redact reviewer identity where policy requires.
- `dispute.open`: buyer or professional; requires reason and affected evidence/criterion.
- `dispute.list`: authorized tenant/operations.
- `dispute.resolve`: operations only in Phase 1; records resolution, policy, and any payment consequence.

### Payment and reconciliation

- `payment.createIntent`: buyer/finance; calculates or validates exact NGN amount, creates provider intent, and stores idempotency key.
- `payment.get`: authorized buyer, finance, professional for their own payout state, or operations.
- `payment.providerWebhook`: public callback endpoint behind signature verification; idempotently stores callback before applying state transition.
- `payment.reconcile`: operations/finance; provider query or manual exception workflow with reason.
- `payment.requestPayout`: professional/operations only after accepted work and provider-specific eligibility.

### Assurance record and history

- `assuranceRecord.generate`: operations after payment confirmation; creates JSON and human-readable snapshot.
- `assuranceRecord.get`: authorized buyer and professional with consent; private fields redacted by role.
- `assuranceRecord.createDownloadUrl`: authorized viewer; audit logged.
- `workHistory.listMine`: professional; returns derived records and buyer-scoped metrics.
- `workHistory.share`: professional; creates explicit consented share token with expiry and scope.
- `workHistory.revokeShare`: professional or data owner.

### Operations

- `ops.queue`: authorized operations; lists work needing review, assignment, rework, dispute, or payment reconciliation.
- `ops.eventHistory`: authorized operations; cursor-paginated events for one aggregate.
- `ops.metrics`: authorized operations; counts and economic metrics with no unredacted sensitive data.

## Authorization matrix

| Action | Buyer | Professional | Reviewer | Finance | Operations |
|---|---:|---:|---:|---:|---:|
| Create/edit own draft | Yes | No | No | No | Yes |
| Submit work order | Yes | No | No | No | Yes |
| Accept assignment | No | Own only | No | No | Override with reason |
| Upload evidence | No | Own assignment | No | No | Assisted upload |
| Review evidence | No | No | Yes, independent | No | Yes |
| Open dispute | Yes | Yes | No | No | Yes |
| Resolve dispute | No | No | No | No | Yes |
| Create payment intent | Yes/Finance | No | No | Yes | Yes |
| Process provider callback | No | No | No | System/Provider | System/Finance |
| Generate assurance record | No | No | No | No | Yes |
| View private evidence | Scoped | Own work | Assigned work | Payment-only | Yes, audited |

## Transaction invariants

1. A work order cannot become `READY` without at least one required acceptance criterion.
2. A work order cannot become `FUNDED` without a committed payment intent or approved payment exception.
3. A professional must have an approved profile and active consent before assignment.
4. An assigned professional cannot verify their own work.
5. A verification decision must cite criteria and evidence-pack version.
6. `PAYMENT_CONFIRMED` requires verified provider evidence or reconciled provider evidence.
7. A completed work order must have an assurance record and a domain-event trail.
8. No domain mutation may silently overwrite history; corrections create events or new versions.
9. All tenant-owned queries must enforce tenant scope in the server layer.
10. AI-assisted suggestions must store model/policy provenance and remain non-authoritative.

## Phase 1 acceptance tests

The first release is acceptable only when automated tests cover happy paths and failure paths for draft creation, tenant isolation, role authorization, criteria validation, assignment conflicts, evidence versioning, reviewer separation, rework, disputes, idempotent payment callbacks, provider-confirmed completion, assurance-record generation, audit events, and signed evidence access.

Run `pnpm check`, `pnpm test`, and `pnpm build`. Add an end-to-end smoke test that creates a seeded buyer, professional, reviewer, and work order in a test database and reconstructs the final record from `domain_events`.


## Revision addendum from strategic review

The following refinements are adopted from the latest review material.

### Deliverable is separate from evidence

A **deliverable** is what the professional produced. An **evidence item** explains why the system believes that deliverable satisfies a criterion. They should not be collapsed into one table.

Add these entities to the implementation backlog before evidence upload is wired:

- `deliverables`: `id`, `workOrderId`, `assignmentId`, `version`, `title`, `description`, `artifactType`, `objectKey`, `sha256`, `submittedByUserId`, `submittedAt`, `supersedesDeliverableId`, `status`, timestamps.
- `evidence_packs`: reference a `deliverableId` and contain a versioned review submission.
- `evidence_artifacts`: reference a criterion and an evidence pack, with provenance, content hash, source, and capture metadata.

A deliverable can have several evidence items, and one evidence item may support one criterion only in the initial implementation. This keeps traceability simple and reviewable.

### Separate buyer acceptance from verification

A YayaAiki reviewer verifies whether the stated criteria were met. The commercial buyer must still have an explicit acceptance event. These are different facts and must be represented separately.

Add `buyer_acceptances` with `id`, `workOrderId`, `buyerUserId`, `decision: ACCEPT | REJECT | ACCEPT_WITH_EXCEPTION`, `reason`, `acceptedEvidencePackId`, `createdAt`. A buyer rejection must create a dispute or rework path; it must not silently overwrite a passed verification.

The state sequence is therefore:

`EVIDENCE_SUBMITTED` → `UNDER_VERIFICATION` → `VERIFIED` → `BUYER_ACCEPTED` → `PAYMENT_AUTHORIZED` → `PAYMENT_CONFIRMED` → `COMPLETED`.

### Add outcome and reviewer-quality records

Add `work_outcomes` as a derived commercial result containing buyer acceptance, quality result, timeliness result, rework count, dispute count, payment result, and outcome summary.

Add `reviewer_calibrations` only after the first review workflow is stable. It should store calibration sample, expected decision, reviewer decision, correctness, task template, and calibration version. This supports reviewer accuracy, disagreement, false-acceptance, false-rejection, and drift metrics without pretending those metrics exist before data exists.

### Add capabilities as evidence-backed observations

A capability should distinguish `SELF_DECLARED`, `ASSESSMENT`, `WORK_HISTORY`, `CLIENT_CONFIRMED`, and `INSTITUTION_CONFIRMED` sources. Do not create a single reputation score. Derive buyer-scoped observations for quality, timeliness, reliability, rework, specialization, and repeat buyer outcomes.

### Payment decomposition

The payment abstraction should eventually separate:

- `payment_obligations`: who owes what and to whom;
- `payment_transactions`: provider-specific authorization, transfer, refund, or payout records;
- `payment_reconciliations`: expected versus provider-confirmed amounts and exception status.

This reinforces the invariant that **verification is not payment** and **payment confirmation is not buyer acceptance**.

### Governance entities

Add `consents` and `data_processing_records` before collecting identity or sensitive evidence. Minimum data-governance fields are purpose, processing basis, data class, jurisdiction, storage region, processing region, cross-border status, AI-processing status, training permission, retention policy, deletion policy, consent version, granted/withdrawn timestamps, and expiry.

### API boundary decision

The internal React application may continue to use tRPC for type-safe calls. Design procedure names and resource identifiers so a versioned REST boundary can be added later without changing domain semantics. Do not build two independent implementations in Phase 1. The source of truth remains the domain service and event ledger.

Recommended future REST mapping:

- `POST /api/v1/work-orders`
- `GET /api/v1/work-orders`
- `GET /api/v1/work-orders/:id`
- `POST /api/v1/work-orders/:id/submit`
- `POST /api/v1/work-orders/:id/accept`
- `POST /api/v1/work-orders/:id/dispute`
- `POST /api/v1/work-orders/:id/evidence-packs`
- `POST /api/v1/evidence-packs/:id/submit`
- `POST /api/v1/work-orders/:id/verification/start`
- `POST /api/v1/verifications/:id/decision`
- `POST /api/v1/work-orders/:id/payment/authorize`
- `POST /api/v1/webhooks/payment/:provider`
- `GET /api/v1/work-orders/:id/assurance.json`

### Repository compatibility correction

The current checked-out repository imports `drizzle-orm/mysql-core` and `drizzle-orm/mysql2`, and `package.json` includes `mysql2`. The strategic review describes the repository as PostgreSQL-based, but that is not true of the current code snapshot. The Phase 1 implementation should either remain MySQL-compatible as this draft assumes or execute a deliberate, separately reviewed PostgreSQL migration. Do not silently change database engines while implementing the work-order loop.


## Async acquisition and public work intake

The revised go-to-market direction makes **Start a Work Order** the primary conversion. That requires a controlled public intake layer before a buyer has a full authenticated workspace.

### `work_order_intakes`

This is a lead and qualification object, not yet an executable work order.

Fields:

- `id`, `publicId` such as `INT-NG-000001`
- `sourceChannel`: `WEBSITE | WHATSAPP | FACEBOOK | INSTAGRAM | TIKTOK | EMAIL | LINKEDIN | REFERRAL | DIRECT`
- `campaignCode`, `landingPath`, `referrer` nullable
- `contactName`, `organizationName`, `contactEmail`, `contactPhoneE164`
- `countryCode`, `jurisdictionCode`, `preferredLanguage`
- `jobFamilyId` nullable, `taskDescription`, `expectedOutput`, `quantityText`, `deadlineAt` nullable
- `acceptanceSummary`, `evidenceSummary`, `dataClass`, `budgetRangeMinor` nullable, `currency`
- `status`: `RECEIVED | NEEDS_CLARIFICATION | QUALIFIED | QUOTED | CONVERTED | DECLINED | SPAM | EXPIRED`
- `convertedWorkOrderId` nullable
- `consentVersion`, `consentedAt`
- `createdAt`, `updatedAt`

Indexes: `(status, createdAt)`, `(sourceChannel, createdAt)`, `(contactEmail, createdAt)`, unique `publicId`.

Do not expose intake records publicly by sequential numeric ID. Use a random public ID and a short-lived signed status token. Rate-limit submissions by IP/device fingerprint and contact identifier, add bot protection, validate email/phone formats, and record only the minimum information required to qualify the request.

### Intake-to-work-order flow

`PUBLIC_INTAKE_RECEIVED` → `INTAKE_QUALIFIED` → `QUOTE_ISSUED` → `BUYER_ACCEPTED_QUOTE` → `WORK_ORDER_CREATED`.

The buyer should receive an intake ID immediately, then a clear status page. The system must not imply that capacity, price, verification, or payment is confirmed until operations has completed those steps.

### Public intake procedures

- `publicIntake.create`: public, rate-limited; accepts task description, expected output, quantity, deadline, acceptance requirements, evidence requirements, data sensitivity, jurisdiction, budget range, preferred language, contact details, and attribution fields. Returns `intakePublicId` and a signed status token.
- `publicIntake.getStatus`: public with signed token; returns only safe status, next action, and whether clarification or authenticated onboarding is required.
- `publicIntake.requestClarification`: public with signed token; allows the buyer to add missing information without exposing other records.
- `publicIntake.convertToWorkOrder`: operations or authenticated buyer after qualification; creates the tenant, membership invitation, work-order draft, criteria version, and `INTAKE_CONVERTED` event in one transaction.
- `publicIntake.list`: operations only; filters by channel, status, job family, date, and campaign.

### Acquisition attribution

Every converted work order should retain `originatingIntakeId`, `sourceChannel`, `campaignCode`, and `firstTouchAt`. This allows YayaAiki to measure whether WhatsApp, Facebook, Instagram, TikTok, email, LinkedIn, referral, or direct traffic produces qualified paid work rather than vanity engagement.

### Website acceptance test

Before scaling paid or high-volume outreach, a Nigerian business must be able to complete this path without a meeting:

1. Understand the offer.
2. Select **Start a Work Order**.
3. Describe the work and expected output.
4. Define acceptance requirements and evidence.
5. Classify data sensitivity and jurisdiction.
6. Submit contact details and consent.
7. Receive a work-intake ID immediately.
8. Track whether the request is received, needs clarification, qualified, quoted, or converted.

### Channel safeguards

Use WhatsApp, Facebook, Instagram, TikTok, email, LinkedIn, and referrals as acquisition channels, but do not rely on unsolicited bulk messaging. Use opt-in click-to-chat, relevant community participation, personalized outreach, platform rules, clear identity, frequency limits, and an easy opt-out. Do not upload contact lists to advertising platforms without a lawful basis and appropriate consent. Marketing analytics must not contain task data, identity documents, private evidence, payment details, or sensitive work descriptions.
