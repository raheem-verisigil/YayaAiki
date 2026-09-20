import {
  pgTable, pgEnum, uuid, text, varchar, serial, timestamp, jsonb,
  numeric, integer, bigint, boolean, inet, unique, index,
} from "drizzle-orm/pg-core";

export const dataClassEnum = pgEnum("data_class", ["D0","D1","D2","D3","D4","D5"]);
export const tenantTypeEnum = pgEnum("tenant_type", ["CLIENT_ORG","WORKER_COOP","INTERNAL"]);
export const actorTypeEnum = pgEnum("actor_type", ["WORKER","TEAM","VERIFIER","CLIENT","ORG","SYSTEM","AI_AGENT"]);
export const actorTierEnum = pgEnum("actor_tier", ["T1_PROFESSIONAL","T2_BASIC_LITERACY","T3_VOICE_ONLY"]);
export const workOrderStatusEnum = pgEnum("work_order_status", ["CREATED","FUNDS_RESERVED","ACTOR_ASSIGNED","WORK_STARTED","EVIDENCE_SUBMITTED","VERIFICATION_PASSED","VERIFICATION_FAILED","REWORK_REQUESTED","PAYMENT_AUTHORIZED","PAYMENT_CONFIRMED","CLOSED","CANCELLED","DISPUTED"]);
export const riskClassEnum = pgEnum("risk_class", ["LOW","MEDIUM","HIGH"]);
export const verificationMethodEnum = pgEnum("verification_method", ["CLIENT_REVIEW","SENIOR_WORKER","AUTOMATED_QA","MULTI_REVIEWER_CONSENSUS"]);
export const verificationDecisionEnum = pgEnum("verification_decision", ["PASS","FAIL","REWORK_REQUESTED"]);
export const paymentTxnStatusEnum = pgEnum("payment_txn_status", ["PENDING","CONFIRMED","FAILED","REVERSED"]);
export const reputationDimensionEnum = pgEnum("reputation_dimension", ["ACCURACY","TIMELINESS","ACCEPTANCE","REWORK","RELIABILITY","TASK_COMPLEXITY","REPEAT_CLIENT"]);
export const auditEventTypeEnum = pgEnum("audit_event_type", ["LOGIN","AUTH_FAILURE","ROLE_CHANGE","PRIVILEGE_ESCALATION","DATA_ACCESS","DATA_EXPORT","KEY_USE","POLICY_CHANGE","PAYMENT_CONFIG_CHANGE","ADMIN_ACTION"]);
export const userRoleEnum = pgEnum("role", ["user","admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // NOTE: despite the name, this stores the Supabase auth user's UUID (authUser.id from sdk.ts), not a Manus OAuth id. Kept as "openId" to avoid an unnecessary migration.
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const tenant = pgTable("tenant", {
  tenantId: uuid("tenant_id").primaryKey().defaultRandom(),
  tenantName: text("tenant_name").notNull(),
  tenantType: tenantTypeEnum("tenant_type").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const actor = pgTable("actor", {
  actorId: uuid("actor_id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenant.tenantId),
  userId: integer("user_id").references(() => users.id),
  actorType: actorTypeEnum("actor_type").notNull(),
  displayName: text("display_name").notNull(),
  tier: actorTierEnum("tier"),
  languages: text("languages").array(),
  accessChannel: text("access_channel").array(),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ tenantIdx: index("idx_actor_tenant").on(t.tenantId) }));

export const organization = pgTable("organization", {
  organizationId: uuid("organization_id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenant.tenantId),
  orgType: text("org_type").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organizationMember = pgTable("organization_member", {
  organizationId: uuid("organization_id").notNull().references(() => organization.organizationId),
  actorId: uuid("actor_id").notNull().references(() => actor.actorId),
  role: text("role").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ pk: unique().on(t.organizationId, t.actorId) }));

export const workOrder = pgTable("work_order", {
  workOrderId: uuid("work_order_id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenant.tenantId),
  clientActorId: uuid("client_actor_id").notNull().references(() => actor.actorId),
  taskType: text("task_type").notNull(),
  specification: jsonb("specification").notNull(),
  acceptanceCriteria: jsonb("acceptance_criteria").notNull(),
  priceAmount: numeric("price_amount", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  workerRequirements: jsonb("worker_requirements"),
  riskClass: riskClassEnum("risk_class").notNull().default("LOW"),
  dataClass: dataClassEnum("data_class").notNull().default("D1"),
  jurisdiction: text("jurisdiction").notNull(),
  status: workOrderStatusEnum("status").notNull().default("CREATED"),
  deadlineAt: timestamp("deadline_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
}, (t) => ({ tenantStatusIdx: index("idx_wo_tenant_status").on(t.tenantId, t.status) }));

export const workOrderRequirement = pgTable("work_order_requirement", {
  requirementId: uuid("requirement_id").primaryKey().defaultRandom(),
  workOrderId: uuid("work_order_id").notNull().references(() => workOrder.workOrderId),
  description: text("description").notNull(),
  isMandatory: boolean("is_mandatory").notNull().default(true),
});

export const workOrderAssignment = pgTable("work_order_assignment", {
  assignmentId: uuid("assignment_id").primaryKey().defaultRandom(),
  workOrderId: uuid("work_order_id").notNull().references(() => workOrder.workOrderId),
  actorId: uuid("actor_id").notNull().references(() => actor.actorId),
  roleOnOrder: text("role_on_order").notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
});

export const evidence = pgTable("evidence", {
  evidenceId: uuid("evidence_id").primaryKey().defaultRandom(),
  workOrderId: uuid("work_order_id").notNull().references(() => workOrder.workOrderId),
  actorId: uuid("actor_id").notNull().references(() => actor.actorId),
  artifactType: text("artifact_type").notNull(),
  artifactLocation: text("artifact_location").notNull(),
  artifactHash: text("artifact_hash").notNull(),
  source: text("source").notNull(),
  metadata: jsonb("metadata"),
  versionNumber: integer("version_number").notNull().default(1),
  supersedesEvidenceId: uuid("supersedes_evidence_id"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  workOrderIdx: index("idx_evidence_work_order").on(t.workOrderId),
  noDuplicateSubmission: unique().on(t.workOrderId, t.artifactHash),
}));

export const verification = pgTable("verification", {
  verificationId: uuid("verification_id").primaryKey().defaultRandom(),
  evidenceId: uuid("evidence_id").notNull().references(() => evidence.evidenceId),
  verifierActorId: uuid("verifier_actor_id").notNull().references(() => actor.actorId),
  verificationMethod: verificationMethodEnum("verification_method").notNull(),
  decision: verificationDecisionEnum("decision").notNull(),
  reason: text("reason"),
  confidence: numeric("confidence", { precision: 3, scale: 2 }),
  policyVersion: text("policy_version").notNull(),
  supersedesVerificationId: uuid("supersedes_verification_id"),
  decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ evidenceIdx: index("idx_verification_evidence").on(t.evidenceId) }));

export const paymentCommitment = pgTable("payment_commitment", {
  commitmentId: uuid("commitment_id").primaryKey().defaultRandom(),
  workOrderId: uuid("work_order_id").notNull().references(() => workOrder.workOrderId),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  reservedAt: timestamp("reserved_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("RESERVED"),
});

export const paymentAuthorization = pgTable("payment_authorization", {
  authorizationId: uuid("authorization_id").primaryKey().defaultRandom(),
  commitmentId: uuid("commitment_id").notNull().references(() => paymentCommitment.commitmentId),
  verificationId: uuid("verification_id").notNull().references(() => verification.verificationId),
  payeeActorId: uuid("payee_actor_id").notNull().references(() => actor.actorId),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  authorizedAt: timestamp("authorized_at", { withTimezone: true }).notNull().defaultNow(),
  authorizedBy: uuid("authorized_by").notNull().references(() => actor.actorId),
});

export const paymentTransaction = pgTable("payment_transaction", {
  transactionId: uuid("transaction_id").primaryKey().defaultRandom(),
  authorizationId: uuid("authorization_id").notNull().references(() => paymentAuthorization.authorizationId),
  providerName: text("provider_name").notNull(),
  providerReference: text("provider_reference").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  status: paymentTxnStatusEnum("status").notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ authIdx: index("idx_payment_txn_auth").on(t.authorizationId) }));

export const reputationFact = pgTable("reputation_fact", {
  factId: uuid("fact_id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").notNull().references(() => actor.actorId),
  workOrderId: uuid("work_order_id").notNull().references(() => workOrder.workOrderId),
  dimension: reputationDimensionEnum("dimension").notNull(),
  value: numeric("value", { precision: 6, scale: 3 }).notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ actorIdx: index("idx_reputation_actor").on(t.actorId) }));

export const policy = pgTable("policy", {
  policyId: uuid("policy_id").primaryKey().defaultRandom(),
  policyType: text("policy_type").notNull(),
  version: text("version").notNull(),
  definition: jsonb("definition").notNull(),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull().defaultNow(),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
});

export const consentRecord = pgTable("consent_record", {
  consentId: uuid("consent_id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  purpose: text("purpose").notNull(),
  channel: text("channel").notNull(),
  voiceRecordingRef: text("voice_recording_ref"),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const dataAsset = pgTable("data_asset", {
  dataAssetId: uuid("data_asset_id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenant.tenantId),
  dataClass: dataClassEnum("data_class").notNull(),
  dataOwnerActorId: uuid("data_owner_actor_id").references(() => actor.actorId),
  purpose: text("purpose").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  storageRegion: text("storage_region").notNull(),
  processingRegion: text("processing_region").notNull(),
  crossBorderStatus: text("cross_border_status").notNull().default("PROHIBITED"),
  aiProcessingStatus: text("ai_processing_status").notNull().default("PROHIBITED"),
  trainingPermission: boolean("training_permission").notNull().default(false),
  retentionPolicy: text("retention_policy").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const dataAccessGrant = pgTable("data_access_grant", {
  grantId: uuid("grant_id").primaryKey().defaultRandom(),
  dataAssetId: uuid("data_asset_id").notNull().references(() => dataAsset.dataAssetId),
  actorId: uuid("actor_id").notNull().references(() => actor.actorId),
  scope: text("scope").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const event = pgTable("event", {
  eventId: uuid("event_id").primaryKey().defaultRandom(),
  eventType: text("event_type").notNull(),
  aggregateType: text("aggregate_type").notNull(),
  aggregateId: uuid("aggregate_id").notNull(),
  actorId: uuid("actor_id").references(() => actor.actorId),
  tenantId: uuid("tenant_id").notNull().references(() => tenant.tenantId),
  sequenceNumber: bigint("sequence_number", { mode: "number" }).notNull(),
  payload: jsonb("payload").notNull(),
  payloadHash: text("payload_hash").notNull(),
  previousEventHash: text("previous_event_hash"),
  schemaVersion: integer("schema_version").notNull().default(1),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  aggregateIdx: index("idx_event_aggregate").on(t.aggregateType, t.aggregateId, t.sequenceNumber),
  noDup: unique().on(t.aggregateType, t.aggregateId, t.sequenceNumber),
}));

export const auditEvent = pgTable("audit_event", {
  auditId: uuid("audit_id").primaryKey().defaultRandom(),
  eventType: auditEventTypeEnum("event_type").notNull(),
  actorId: uuid("actor_id").references(() => actor.actorId),
  tenantId: uuid("tenant_id").references(() => tenant.tenantId),
  detail: jsonb("detail"),
  ipAddress: inet("ip_address"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
});
