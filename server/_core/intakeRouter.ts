import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "./trpc";
import { getDb } from "../db";
import { intake, workOrder, actor, tenant } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

function generatePublicId(): string {
  const n = Math.floor(100000 + Math.random() * 899999);
  return `INT-NG-${n}`;
}

export const intakeRouter = router({
  submit: publicProcedure
    .input(z.object({
      category: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      expectedOutput: z.string().min(1),
      quantity: z.string().min(1),
      deadline: z.string().optional(),
      acceptanceCriteria: z.string().optional(),
      evidenceExpected: z.string().optional(),
      dataClassRequested: z.string().optional(),
      frequency: z.string().optional(),
      budgetRange: z.string().optional(),
      contactName: z.string().min(1),
      contactOrganization: z.string().min(1),
      contactEmail: z.string().email(),
      contactPhone: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const publicId = generatePublicId();
      const [created] = await db.insert(intake).values({
        publicId,
        ...input,
      }).returning();

      return { publicId: created.publicId, status: created.status };
    }),

  // Public: lets a requester check status with the ID they were given —
  // deliberately returns only non-sensitive fields, not the full row.
  status: publicProcedure
    .input(z.object({ publicId: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [row] = await db.select({
        publicId: intake.publicId,
        title: intake.title,
        status: intake.status,
        createdAt: intake.createdAt,
      }).from(intake).where(eq(intake.publicId, input.publicId)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "No request found with that ID" });
      return row;
    }),

  // Staff-only: review queue.
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db.select().from(intake).orderBy(intake.createdAt);
  }),

  // Staff-only: converts a reviewed intake into a real, accountable Work
  // Order under a proper Client Actor — this is the deliberate hand-off
  // point ADR-001's identity model requires (no anonymous economic actors).
  convert: protectedProcedure
    .input(z.object({
      intakeId: z.string().uuid(),
      priceAmount: z.number().positive(),
      currency: z.string().min(3).max(3),
      jurisdiction: z.string().min(2),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [row] = await db.select().from(intake).where(eq(intake.intakeId, input.intakeId)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Intake not found" });
      if (row.status === "CONVERTED") throw new TRPCError({ code: "CONFLICT", message: "Already converted" });

      let [platformTenant] = await db.select().from(tenant).where(eq(tenant.tenantName, "YayaAiki Platform")).limit(1);
      if (!platformTenant) {
        [platformTenant] = await db.insert(tenant).values({
          tenantName: "YayaAiki Platform", tenantType: "INTERNAL", jurisdiction: input.jurisdiction,
        }).returning();
      }

      let [clientActor] = await db.select().from(actor)
        .where(eq(actor.displayName, row.contactOrganization)).limit(1);
      if (!clientActor) {
        [clientActor] = await db.insert(actor).values({
          tenantId: platformTenant.tenantId,
          actorType: "CLIENT",
          displayName: row.contactOrganization,
        }).returning();
      }

      const [order] = await db.insert(workOrder).values({
        tenantId: platformTenant.tenantId,
        clientActorId: clientActor.actorId,
        taskType: row.category,
        specification: { title: row.title, description: row.description, expectedOutput: row.expectedOutput, quantity: row.quantity },
        acceptanceCriteria: { criteria: row.acceptanceCriteria ?? "Pending definition" },
        priceAmount: input.priceAmount.toFixed(2),
        currency: input.currency,
        jurisdiction: input.jurisdiction,
      }).returning();

      await db.update(intake).set({ status: "CONVERTED", convertedWorkOrderId: order.workOrderId })
        .where(eq(intake.intakeId, input.intakeId));

      return order;
    }),
});
