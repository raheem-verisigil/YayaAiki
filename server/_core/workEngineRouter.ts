import { randomUUID, createHash } from "crypto";
import { z } from "zod";
import { eq, and, count, inArray } from "drizzle-orm";
import { protectedProcedure, router } from "./trpc";
import { getDb } from "../db";
import {
  tenant, actor, workOrder, workOrderAssignment, evidence, verification,
  reputationFact, event, paymentCommitment, paymentAuthorization, paymentTransaction,
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

// --- Phase 1 bootstrap helpers -------------------------------------------
// MVP simplification: every user gets one actor under a single default
// platform tenant. Real multi-tenant client onboarding (separate tenants
// per client company) is deferred — see ADR-001 Phase 2/3.

export async function ensureDefaultTenant(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  const existing = await db.select().from(tenant).where(eq(tenant.tenantName, "YayaAiki Platform")).limit(1);
  if (existing.length) return existing[0];
  const [created] = await db.insert(tenant).values({
    tenantName: "YayaAiki Platform",
    tenantType: "INTERNAL",
    jurisdiction: "NG",
  }).returning();
  return created;
}

export async function ensureActorForUser(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  actorType: "CLIENT" | "WORKER" | "VERIFIER",
  displayName: string,
) {
  const existing = await db.select().from(actor)
    .where(and(eq(actor.userId, userId), eq(actor.actorType, actorType))).limit(1);
  if (existing.length) return existing[0];

  const t = await ensureDefaultTenant(db);
  const [created] = await db.insert(actor).values({
    tenantId: t.tenantId,
    userId,
    actorType,
    displayName,
  }).returning();
  return created;
}

// --- Event log helper ------------------------------------------------------
export async function appendEvent(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  args: { eventType: string; aggregateType: string; aggregateId: string; actorId?: string; tenantId: string; payload: unknown },
) {
  const [{ value: existingCount }] = await db.select({ value: count() }).from(event)
    .where(and(eq(event.aggregateType, args.aggregateType), eq(event.aggregateId, args.aggregateId)));
  const payloadStr = JSON.stringify(args.payload);
  await db.insert(event).values({
    eventType: args.eventType,
    aggregateType: args.aggregateType,
    aggregateId: args.aggregateId,
    actorId: args.actorId,
    tenantId: args.tenantId,
    sequenceNumber: Number(existingCount) + 1,
    payload: args.payload as object,
    payloadHash: createHash("sha256").update(payloadStr).digest("hex"),
  });
}

export const workEngineRouter = router({
  workOrder: router({
    create: protectedProcedure
      .input(z.object({
        taskType: z.string().min(1),
        specification: z.record(z.string(), z.any()),
        acceptanceCriteria: z.record(z.string(), z.any()),
        priceAmount: z.number().positive(),
        currency: z.string().min(3).max(3),
        jurisdiction: z.string().min(2),
        deadlineAt: z.string().datetime().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const clientActor = await ensureActorForUser(db, ctx.user.id, "CLIENT", ctx.user.name ?? "Client");

        const [order] = await db.insert(workOrder).values({
          tenantId: clientActor.tenantId,
          clientActorId: clientActor.actorId,
          taskType: input.taskType,
          specification: input.specification,
          acceptanceCriteria: input.acceptanceCriteria,
          priceAmount: input.priceAmount.toFixed(2),
          currency: input.currency,
          jurisdiction: input.jurisdiction,
          deadlineAt: input.deadlineAt ? new Date(input.deadlineAt) : undefined,
        }).returning();

        await appendEvent(db, {
          eventType: "ORDER_CREATED",
          aggregateType: "WorkOrder",
          aggregateId: order.workOrderId,
          actorId: clientActor.actorId,
          tenantId: order.tenantId,
          payload: { taskType: order.taskType, priceAmount: order.priceAmount },
        });

        return order;
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const clientActor = await ensureActorForUser(db, ctx.user.id, "CLIENT", ctx.user.name ?? "Client");
      return db.select().from(workOrder).where(eq(workOrder.clientActorId, clientActor.actorId));
    }),

    get: protectedProcedure
      .input(z.object({ workOrderId: z.string().uuid() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const [order] = await db.select().from(workOrder).where(eq(workOrder.workOrderId, input.workOrderId)).limit(1);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Work order not found" });
        return order;
      }),

    listForActor: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const userActors = await db.select().from(actor).where(eq(actor.userId, ctx.user.id));
      if (userActors.length === 0) return [];
      const actorIds = userActors.map(a => a.actorId);

      const asClient = await db.select().from(workOrder).where(inArray(workOrder.clientActorId, actorIds));
      const assignments = await db.select().from(workOrderAssignment).where(inArray(workOrderAssignment.actorId, actorIds));
      const assignedOrderIds = assignments.map(a => a.workOrderId);
      const asWorker = assignedOrderIds.length
        ? await db.select().from(workOrder).where(inArray(workOrder.workOrderId, assignedOrderIds))
        : [];

      const seen = new Set<string>();
      const combined = [...asClient, ...asWorker].filter(o => {
        if (seen.has(o.workOrderId)) return false;
        seen.add(o.workOrderId);
        return true;
      });
      return combined;
    }),

    listAll: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      return db.select().from(workOrder).orderBy(workOrder.createdAt);
    }),
  }),

  event: router({
    listRecent: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(200).default(50) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        return db.select().from(event).orderBy(event.occurredAt).limit(input.limit);
      }),
  }),

  evidence: router({
    submit: protectedProcedure
      .input(z.object({
        workOrderId: z.string().uuid(),
        artifactType: z.string().min(1),
        artifactLocation: z.string().min(1),
        artifactContent: z.string().min(1), // used to compute the hash server-side
        source: z.enum(["APP", "WEB", "WHATSAPP", "USSD", "IVR", "AGENT_CAPTURED"]),
        metadata: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const [order] = await db.select().from(workOrder).where(eq(workOrder.workOrderId, input.workOrderId)).limit(1);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Work order not found" });

        const workerActor = await ensureActorForUser(db, ctx.user.id, "WORKER", ctx.user.name ?? "Worker");

        // Never trust the client-computed hash — the server recomputes it
        // from the artifact content, per ADR-001 §13 "Never trust the file alone."
        const artifactHash = createHash("sha256").update(input.artifactContent).digest("hex");

        // Unique (work_order_id, artifact_hash) at the DB layer blocks
        // duplicate-submission fraud even if this check is bypassed.
        const dup = await db.select().from(evidence)
          .where(and(eq(evidence.workOrderId, input.workOrderId), eq(evidence.artifactHash, artifactHash))).limit(1);
        if (dup.length) throw new TRPCError({ code: "CONFLICT", message: "This exact evidence was already submitted for this work order" });

        const [ev] = await db.insert(evidence).values({
          workOrderId: input.workOrderId,
          actorId: workerActor.actorId,
          artifactType: input.artifactType,
          artifactLocation: input.artifactLocation,
          artifactHash,
          source: input.source,
          metadata: input.metadata,
        }).returning();

        await db.update(workOrder).set({ status: "EVIDENCE_SUBMITTED" }).where(eq(workOrder.workOrderId, input.workOrderId));

        await appendEvent(db, {
          eventType: "EVIDENCE_SUBMITTED",
          aggregateType: "WorkOrder",
          aggregateId: input.workOrderId,
          actorId: workerActor.actorId,
          tenantId: order.tenantId,
          payload: { evidenceId: ev.evidenceId, artifactHash },
        });

        return ev;
      }),
  }),

  verification: router({
    decide: protectedProcedure
      .input(z.object({
        evidenceId: z.string().uuid(),
        decision: z.enum(["PASS", "FAIL", "REWORK_REQUESTED"]),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const [ev] = await db.select().from(evidence).where(eq(evidence.evidenceId, input.evidenceId)).limit(1);
        if (!ev) throw new TRPCError({ code: "NOT_FOUND", message: "Evidence not found" });

        const verifierActor = await ensureActorForUser(db, ctx.user.id, "VERIFIER", ctx.user.name ?? "Verifier");

        // Application-layer enforcement of the same rule the original SQL
        // trigger enforced: verifier must not be the evidence submitter.
        // (See ADR-001 §14 — Drizzle has no trigger DSL, so this check MUST
        // stay here; do not remove it when refactoring.)
        if (verifierActor.actorId === ev.actorId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Verifier must be independent of the submitting actor" });
        }

        const [order] = await db.select().from(workOrder).where(eq(workOrder.workOrderId, ev.workOrderId)).limit(1);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Work order not found" });

        const [v] = await db.insert(verification).values({
          evidenceId: input.evidenceId,
          verifierActorId: verifierActor.actorId,
          verificationMethod: "CLIENT_REVIEW",
          decision: input.decision,
          reason: input.reason,
          policyVersion: "phase1-v1",
        }).returning();

        const newStatus = input.decision === "PASS" ? "VERIFICATION_PASSED"
          : input.decision === "FAIL" ? "VERIFICATION_FAILED" : "REWORK_REQUESTED";
        await db.update(workOrder).set({ status: newStatus }).where(eq(workOrder.workOrderId, ev.workOrderId));

        if (input.decision === "PASS") {
          await db.insert(reputationFact).values({
            actorId: ev.actorId,
            workOrderId: ev.workOrderId,
            dimension: "ACCEPTANCE",
            value: "1.0",
          });
        }

        await appendEvent(db, {
          eventType: `VERIFICATION_${input.decision}`,
          aggregateType: "WorkOrder",
          aggregateId: ev.workOrderId,
          actorId: verifierActor.actorId,
          tenantId: order.tenantId,
          payload: { verificationId: v.verificationId, decision: input.decision },
        });

        return v;
      }),
  }),

  payment: router({
    // Minimum honest payment flow, per docs/PHASE-B-SCOPE.md section 2.
    // No gateway integration yet - staff manually confirms a bank transfer
    // was received. The paymentTransaction table is the same schema a real
    // Paystack/Flutterwave integration will use later; only providerName
    // changes from MANUAL_BANK_TRANSFER to a real provider.

    listPendingForOps: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      return db.select().from(paymentTransaction).where(eq(paymentTransaction.status, "PENDING"));
    }),

    confirmReceived: protectedProcedure
      .input(z.object({ workOrderId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const [order] = await db.select().from(workOrder).where(eq(workOrder.workOrderId, input.workOrderId)).limit(1);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Work order not found" });
        if (order.status !== "VERIFICATION_PASSED") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Work order must pass verification before payment can be authorized" });
        }

        const [ev] = await db.select().from(evidence).where(eq(evidence.workOrderId, input.workOrderId)).limit(1);
        if (!ev) throw new TRPCError({ code: "NOT_FOUND", message: "No evidence found for this work order" });

        const [passedVerification] = await db.select().from(verification)
          .where(and(eq(verification.evidenceId, ev.evidenceId), eq(verification.decision, "PASS"))).limit(1);
        if (!passedVerification) throw new TRPCError({ code: "NOT_FOUND", message: "No passing verification found" });

        const staffActor = await ensureActorForUser(db, ctx.user.id, "VERIFIER", ctx.user.name ?? "Staff");

        const [commitment] = await db.insert(paymentCommitment).values({
          workOrderId: input.workOrderId,
          amount: order.priceAmount,
          currency: order.currency,
          status: "RELEASED",
        }).returning();

        const [authorization] = await db.insert(paymentAuthorization).values({
          commitmentId: commitment.commitmentId,
          verificationId: passedVerification.verificationId,
          payeeActorId: ev.actorId,
          amount: order.priceAmount,
          authorizedBy: staffActor.actorId,
        }).returning();

        const [transaction] = await db.insert(paymentTransaction).values({
          authorizationId: authorization.authorizationId,
          providerName: "MANUAL_BANK_TRANSFER",
          providerReference: `MANUAL-${Date.now()}`,
          amount: order.priceAmount,
          status: "CONFIRMED",
          confirmedAt: new Date(),
        }).returning();

        await db.update(workOrder).set({ status: "PAYMENT_CONFIRMED" }).where(eq(workOrder.workOrderId, input.workOrderId));

        await appendEvent(db, {
          eventType: "PAYMENT_CONFIRMED",
          aggregateType: "WorkOrder",
          aggregateId: input.workOrderId,
          actorId: staffActor.actorId,
          tenantId: order.tenantId,
          payload: { transactionId: transaction.transactionId, amount: order.priceAmount, method: "MANUAL_BANK_TRANSFER" },
        });

        return transaction;
      }),
  }),
});
