# YayaAiki Architecture

## Product boundary

YayaAiki is a verified-work infrastructure platform. The public website explains the system, authenticated workspaces operate it, WhatsApp provides an additional doorway, and the Operations Console moves work through its lifecycle. These surfaces share one economic record; they are not separate products.

## Phase 1 system shape

```text
Public Web / Business / Professional / Operations / WhatsApp
                         |
                    Work Engine
                         |
 Work Order -> Actor -> Evidence -> Verification -> Payment -> Reputation
                         |
                  Append-only Event History
```

The first commercial proof is one real transaction reconstructed from the event history: work request, work order, funding commitment, assignment, work, evidence, verification, payment confirmation, and work-history update.

## Core domain primitives

| Primitive | Responsibility |
|---|---|
| Work Order | Defines the request, acceptance criteria, deadline, price, risk, jurisdiction, and status. |
| Actor | Represents the economic participant without exposing a person's identity beyond purpose. |
| Evidence | Stores an artifact reference, provenance, hash, version, and submission claim. |
| Verification | Records an independent or designated review decision, reason, confidence, and policy version. |
| Payment Assurance | Separates client obligation, funding, authorization, provider execution, confirmation, and reconciliation. |
| Reputation | Derives portable work history from verified outcomes, not self-declared ratings. |
| Event | Captures immutable state transitions with sequence and hash-chain metadata. |

## Access architecture

Web, WhatsApp, and future voice or assisted access are channels into the same identity and Work Engine. Channel-specific interfaces must never create a second worker profile, payment history, or verification standard. WhatsApp is a messaging adapter, not the source of truth.

## Product surfaces

- **Public website:** explains the value proposition, trust model, access options, and how to start.
- **Business workspace:** submits work, tracks work orders, reviews evidence, and communicates with YayaAiki.
- **Professional workspace:** manages capability, assignments, evidence, payment status, and verified history.
- **Operations Console:** manages requests, qualification, assignments, verification, rework, disputes, payment state, and events.
- **Messaging adapter:** delivers notifications, simple actions, onboarding support, and escalation to humans.

## Boundary decisions

YayaAiki is not a bank. Payment execution belongs to a licensed provider and is recorded back as a separate fact. YayaAiki is not a blockchain. Append-only relational events plus hash chaining provide tamper evidence without unnecessary distributed-ledger complexity. AI may assist classification, matching, support, or quality checks, but high-impact decisions remain reviewable and policy-versioned.

## Evolution path

Phase 1 proves verified work. Later phases can add workforce orchestration, universal access, economic mobility, and sovereign infrastructure without replacing the core model. The current interface intentionally presents those as a direction rather than claiming they are already live.
