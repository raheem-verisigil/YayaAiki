import { randomUUID, createHash } from "crypto";
import { z } from "zod";
import { eq, and, count } from "drizzle-orm";
import { protectedProcedure, router } from "./trpc";
import { getDb } from "../db";
import {
  tenant, actor, workOrder, evidence, verification,
  reputationFact, event,
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

// --- Phase 1 bootstrap helpers -------------------------------------------
// MVP simplification: every user gets one actor under a single default
// platform tenant. Real multi-tenant client onboarding (separate tenants
// per client company) is deferred — see ADR-001 Phase 2/3.

async function ensureDefaultTenant(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  const existing = await db.select().from(tenant).where(eq(tenant.tenantName, "YayaAiki Platform")).limit(1);
  if (existing.length) return existing[0];
  const [created] = await db.insert(tenant).values({
    tenantName: "YayaAiki Platform",
    tenantType: "INTERNAL",
    jurisdiction: "NG",
  }).returning();
  return created;
}

async function ensureActorForUser(
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
async function appendEvent(
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

        // NOTE: Payment Authorization is deliberately NOT implemented here.
        // It requires selecting a licensed payment provider (Paystack,
        // Flutterwave, etc.) first — a business/compliance decision, not
        // a default I should pick. See ADR-001 §16 "Payment boundary."
        // TODO: on PASS, call paymentAuthorization creation once a provider
        // is chosen and its integration boundary is defined.

        return v;
      }),
  }),
});
