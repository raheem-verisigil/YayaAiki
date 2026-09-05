# Contributing to YayaAiki

YayaAiki is simple for the person and rigorous for the system. Contributions should preserve that balance.

## Before changing code

Read `ARCHITECTURE.md`, `SECURITY.md`, and `DATA_GOVERNANCE.md` when a change touches work orders, evidence, verification, payments, identity, messaging, AI, or sensitive data. Prefer the existing Vite/React foundation and clean boundaries over a new framework or service.

## Product rules

Every screen should answer what the person needs to do next. The business next action is **Submit Work**. The professional next action is **Find or Complete Work**. The operations next action is **Move Work Forward**. WhatsApp is an access channel, never a second source of truth.

Do not claim live verification, reserved funds, payment confirmation, compliance, or security properties that are not backed by the implementation. Illustrative examples must be labeled as examples. High-impact AI decisions require reviewability and a recorded policy context.

## Checks

Run `pnpm check`, `pnpm test`, and `pnpm build` before requesting review. Add or update tests for domain behavior, lifecycle transitions, permissions, or data handling. Keep UI changes responsive on small Android-sized screens and include loading, empty, error, and human-assistance paths where relevant.

## Change discipline

Use focused branches and descriptive commits. Keep secrets out of source control. Significant architecture changes should update the relevant documentation and changelog. Production deployment should come from the reviewed main branch after checks pass.
