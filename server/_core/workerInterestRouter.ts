import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "./trpc";
import { getDb } from "../db";
import { workerInterest } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

function generatePublicId(): string {
  const n = Math.floor(100000 + Math.random() * 899999);
  return `WK-NG-${n}`;
}

export const workerInterestRouter = router({
  submit: publicProcedure
    .input(z.object({
      fullName: z.string().min(1),
      phone: z.string().min(1),
      email: z.string().email().optional(),
      location: z.string().min(1),
      workTypes: z.string().min(1),
      experienceLevel: z.string().optional(),
      availability: z.string().optional(),
      whatsappOptIn: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const publicId = generatePublicId();
      const [created] = await db.insert(workerInterest).values({
        publicId,
        ...input,
      }).returning();

      return { publicId: created.publicId, status: created.status };
    }),

  status: publicProcedure
    .input(z.object({ publicId: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [row] = await db.select({
        publicId: workerInterest.publicId,
        fullName: workerInterest.fullName,
        status: workerInterest.status,
        createdAt: workerInterest.createdAt,
      }).from(workerInterest).where(eq(workerInterest.publicId, input.publicId)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "No application found with that ID" });
      return row;
    }),

  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db.select().from(workerInterest).orderBy(workerInterest.createdAt);
  }),
});
