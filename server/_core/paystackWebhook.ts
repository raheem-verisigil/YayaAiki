import { createHmac, timingSafeEqual } from "crypto";
import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { paymentTransaction, paymentAuthorization, paymentCommitment, workOrder } from "../../drizzle/schema";
import { appendEvent } from "./workEngineRouter";

export async function handlePaystackWebhook(req: Request, res: Response) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) { res.status(500).send("Paystack not configured"); return; }

  const signature = req.headers["x-paystack-signature"];
  const rawBody = req.body as Buffer;
  if (!signature || typeof signature !== "string" || !Buffer.isBuffer(rawBody)) {
    res.status(400).send("Missing signature or body");
    return;
  }

  const expectedHash = createHmac("sha512", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expectedHash, "utf-8");
  const gotBuf = Buffer.from(signature, "utf-8");
  if (expectedBuf.length !== gotBuf.length || !timingSafeEqual(expectedBuf, gotBuf)) {
    res.status(401).send("Invalid signature");
    return;
  }

  // Signature verified — safe to trust this payload now.
  res.status(200).send("OK"); // ack immediately; Paystack retries on timeout/non-2xx

  let payload: { event?: string; data?: { reference?: string; status?: string } };
  try {
    payload = JSON.parse(rawBody.toString("utf-8"));
  } catch {
    return;
  }

  if (payload.event !== "charge.success" || !payload.data?.reference) return;

  const db = await getDb();
  if (!db) return;

  const [txn] = await db.select().from(paymentTransaction)
    .where(eq(paymentTransaction.providerReference, payload.data.reference)).limit(1);
  if (!txn || txn.status !== "PENDING") return; // already processed or unknown reference — idempotent no-op

  const [authorization] = await db.select().from(paymentAuthorization)
    .where(eq(paymentAuthorization.authorizationId, txn.authorizationId)).limit(1);
  if (!authorization) return;

  const [commitment] = await db.select().from(paymentCommitment)
    .where(eq(paymentCommitment.commitmentId, authorization.commitmentId)).limit(1);
  if (!commitment) return;

  const [order] = await db.select().from(workOrder)
    .where(eq(workOrder.workOrderId, commitment.workOrderId)).limit(1);
  if (!order) return;

  await db.update(paymentTransaction).set({ status: "CONFIRMED", confirmedAt: new Date() })
    .where(eq(paymentTransaction.transactionId, txn.transactionId));

  await db.update(workOrder).set({ status: "PAYMENT_CONFIRMED" })
    .where(eq(workOrder.workOrderId, order.workOrderId));

  await appendEvent(db, {
    eventType: "PAYMENT_CONFIRMED",
    aggregateType: "WorkOrder",
    aggregateId: order.workOrderId,
    tenantId: order.tenantId,
    payload: { transactionId: txn.transactionId, amount: txn.amount, method: "PAYSTACK", reference: payload.data.reference },
  });
}
