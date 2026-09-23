# Phase B Scope — From Mock Dashboards to Real Self-Service

**Goal:** the minimum honest bar to let real businesses and workers log in and use YayaAiki, not just submit an intake form. Written the night of the Phase 1 launch, to pick up fresh next session.

---

## 1. Dashboard: mock data to real data (Workspace.tsx)

Right now workOrders and events in Workspace.tsx are hardcoded arrays. The backend already has everything needed to replace them - this is wiring, not new architecture.

Concrete steps:
1. Add three read procedures to workEngineRouter.ts (all already-protected, scoped to ctx.user's actor):
   - workOrder.listForActor - returns real Work Orders where the user is the client OR the assigned worker
   - event.listRecent - returns real rows from the event table for the ops view
   - workOrder.getDetail - powers the detail drawer
2. In Workspace.tsx, replace the two hardcoded arrays with real trpc queries.
3. Handle the empty state honestly - a brand-new user has zero Work Orders.
4. The intake.list / staff conversion queue needs its own Ops-view section.

Honest estimate: one focused session.

---

## 2. Payment: stub to minimum honest version

Do not start with Paystack/Flutterwave integration - that's its own project.

Minimum honest version - "Manual Bank Transfer Confirmation":
1. Add a paymentTransaction row with providerName MANUAL_BANK_TRANSFER, status PENDING, when a Work Order passes verification.
2. Ops dashboard gets one action: "Confirm payment received."
3. Worker-facing UI shows honest status, never claims instant payment it doesn't do.
4. Launch-safe: slower than Paystack, but not dishonest.

Decision needed: who is the designated staff member confirming payments.

---

## 3. What Phase B does NOT include

- Real-time payment gateway integration
- Non-literate/IVR/USSD access (Phase 3)
- Worker self-onboarding with document verification
- Any AI-agent automation

---

## 4. Suggested order for next session

1. Wire workOrder.listForActor + empty state
2. Wire event.listRecent for Ops
3. Add intake queue view to Ops
4. Add manual payment confirmation flow
5. Re-test full loop: intake to conversion to assignment to evidence to verification to payment to reputation

Once step 5 passes with a real test business and worker account, that is the actual ready-to-market line.

---

Written after Phase 1's first successful live production request (INT-NG-454023, yayaaiki.com).

---

## Incident note: local tunnel migrations are unreliable — use Railway Console instead

On 2026-09-22, a migration (worker_interest table) applied successfully through
`railway connect Postgres --tunnel-only` but never reached the actual production
database the live app uses — the tunnel connected to something else. Diagnosed
via Railway's Console tab (runs inside the real container, uses the real
DATABASE_URL directly, no proxy ambiguity), then fixed by applying the migration
SQL manually there:

  node -e "const {Client}=require('pg');(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL});await c.connect();const sql=require('fs').readFileSync('drizzle/migrations/FILENAME.sql','utf-8');await c.query(sql);console.log('done');await c.end();})();"

RULE GOING FORWARD: apply every future migration through Railway's browser
Console (YayaAiki service -> Console tab), not the local tunnel. The tunnel
remains fine for read-only verification queries, but treat any migration run
through it as unconfirmed until double-checked via Console.

Also: always commit a new router file together with the routers.ts edit that
imports it, in the same commit — splitting them (as happened with
workerInterestRouter.ts) creates a real, if brief, broken deployment window.
