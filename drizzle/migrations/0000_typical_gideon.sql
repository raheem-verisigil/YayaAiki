CREATE TYPE "public"."actor_tier" AS ENUM('T1_PROFESSIONAL', 'T2_BASIC_LITERACY', 'T3_VOICE_ONLY');--> statement-breakpoint
CREATE TYPE "public"."actor_type" AS ENUM('WORKER', 'TEAM', 'VERIFIER', 'CLIENT', 'ORG', 'SYSTEM', 'AI_AGENT');--> statement-breakpoint
CREATE TYPE "public"."audit_event_type" AS ENUM('LOGIN', 'AUTH_FAILURE', 'ROLE_CHANGE', 'PRIVILEGE_ESCALATION', 'DATA_ACCESS', 'DATA_EXPORT', 'KEY_USE', 'POLICY_CHANGE', 'PAYMENT_CONFIG_CHANGE', 'ADMIN_ACTION');--> statement-breakpoint
CREATE TYPE "public"."data_class" AS ENUM('D0', 'D1', 'D2', 'D3', 'D4', 'D5');--> statement-breakpoint
CREATE TYPE "public"."payment_txn_status" AS ENUM('PENDING', 'CONFIRMED', 'FAILED', 'REVERSED');--> statement-breakpoint
CREATE TYPE "public"."reputation_dimension" AS ENUM('ACCURACY', 'TIMELINESS', 'ACCEPTANCE', 'REWORK', 'RELIABILITY', 'TASK_COMPLEXITY', 'REPEAT_CLIENT');--> statement-breakpoint
CREATE TYPE "public"."risk_class" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."tenant_type" AS ENUM('CLIENT_ORG', 'WORKER_COOP', 'INTERNAL');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_decision" AS ENUM('PASS', 'FAIL', 'REWORK_REQUESTED');--> statement-breakpoint
CREATE TYPE "public"."verification_method" AS ENUM('CLIENT_REVIEW', 'SENIOR_WORKER', 'AUTOMATED_QA', 'MULTI_REVIEWER_CONSENSUS');--> statement-breakpoint
CREATE TYPE "public"."work_order_status" AS ENUM('CREATED', 'FUNDS_RESERVED', 'ACTOR_ASSIGNED', 'WORK_STARTED', 'EVIDENCE_SUBMITTED', 'VERIFICATION_PASSED', 'VERIFICATION_FAILED', 'REWORK_REQUESTED', 'PAYMENT_AUTHORIZED', 'PAYMENT_CONFIRMED', 'CLOSED', 'CANCELLED', 'DISPUTED');--> statement-breakpoint
CREATE TABLE "actor" (
	"actor_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" integer,
	"actor_type" "actor_type" NOT NULL,
	"display_name" text NOT NULL,
	"tier" "actor_tier",
	"languages" text[],
	"access_channel" text[],
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_event" (
	"audit_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" "audit_event_type" NOT NULL,
	"actor_id" uuid,
	"tenant_id" uuid,
	"detail" jsonb,
	"ip_address" "inet",
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_record" (
	"consent_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"purpose" text NOT NULL,
	"channel" text NOT NULL,
	"voice_recording_ref" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "data_access_grant" (
	"grant_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data_asset_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "data_asset" (
	"data_asset_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"data_class" "data_class" NOT NULL,
	"data_owner_actor_id" uuid,
	"purpose" text NOT NULL,
	"jurisdiction" text NOT NULL,
	"storage_region" text NOT NULL,
	"processing_region" text NOT NULL,
	"cross_border_status" text DEFAULT 'PROHIBITED' NOT NULL,
	"ai_processing_status" text DEFAULT 'PROHIBITED' NOT NULL,
	"training_permission" boolean DEFAULT false NOT NULL,
	"retention_policy" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "event" (
	"event_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"aggregate_type" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"actor_id" uuid,
	"tenant_id" uuid NOT NULL,
	"sequence_number" bigint NOT NULL,
	"payload" jsonb NOT NULL,
	"payload_hash" text NOT NULL,
	"previous_event_hash" text,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_aggregate_type_aggregate_id_sequence_number_unique" UNIQUE("aggregate_type","aggregate_id","sequence_number")
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"evidence_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"artifact_type" text NOT NULL,
	"artifact_location" text NOT NULL,
	"artifact_hash" text NOT NULL,
	"source" text NOT NULL,
	"metadata" jsonb,
	"version_number" integer DEFAULT 1 NOT NULL,
	"supersedes_evidence_id" uuid,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evidence_work_order_id_artifact_hash_unique" UNIQUE("work_order_id","artifact_hash")
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"organization_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"org_type" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_member" (
	"organization_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"role" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_member_organization_id_actor_id_unique" UNIQUE("organization_id","actor_id")
);
--> statement-breakpoint
CREATE TABLE "payment_authorization" (
	"authorization_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commitment_id" uuid NOT NULL,
	"verification_id" uuid NOT NULL,
	"payee_actor_id" uuid NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"authorized_at" timestamp with time zone DEFAULT now() NOT NULL,
	"authorized_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_commitment" (
	"commitment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" text NOT NULL,
	"reserved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'RESERVED' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transaction" (
	"transaction_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"authorization_id" uuid NOT NULL,
	"provider_name" text NOT NULL,
	"provider_reference" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"status" "payment_txn_status" NOT NULL,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy" (
	"policy_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_type" text NOT NULL,
	"version" text NOT NULL,
	"definition" jsonb NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reputation_fact" (
	"fact_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"dimension" "reputation_dimension" NOT NULL,
	"value" numeric(6, 3) NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant" (
	"tenant_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_name" text NOT NULL,
	"tenant_type" "tenant_type" NOT NULL,
	"jurisdiction" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"verification_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evidence_id" uuid NOT NULL,
	"verifier_actor_id" uuid NOT NULL,
	"verification_method" "verification_method" NOT NULL,
	"decision" "verification_decision" NOT NULL,
	"reason" text,
	"confidence" numeric(3, 2),
	"policy_version" text NOT NULL,
	"supersedes_verification_id" uuid,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_order" (
	"work_order_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_actor_id" uuid NOT NULL,
	"task_type" text NOT NULL,
	"specification" jsonb NOT NULL,
	"acceptance_criteria" jsonb NOT NULL,
	"price_amount" numeric(14, 2) NOT NULL,
	"currency" text NOT NULL,
	"worker_requirements" jsonb,
	"risk_class" "risk_class" DEFAULT 'LOW' NOT NULL,
	"data_class" "data_class" DEFAULT 'D1' NOT NULL,
	"jurisdiction" text NOT NULL,
	"status" "work_order_status" DEFAULT 'CREATED' NOT NULL,
	"deadline_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "work_order_assignment" (
	"assignment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"role_on_order" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_order_requirement" (
	"requirement_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"description" text NOT NULL,
	"is_mandatory" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "actor" ADD CONSTRAINT "actor_tenant_id_tenant_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actor" ADD CONSTRAINT "actor_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actor_id_actor_actor_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actor"("actor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_tenant_id_tenant_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_record" ADD CONSTRAINT "consent_record_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_access_grant" ADD CONSTRAINT "data_access_grant_data_asset_id_data_asset_data_asset_id_fk" FOREIGN KEY ("data_asset_id") REFERENCES "public"."data_asset"("data_asset_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_access_grant" ADD CONSTRAINT "data_access_grant_actor_id_actor_actor_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actor"("actor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_asset" ADD CONSTRAINT "data_asset_tenant_id_tenant_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_asset" ADD CONSTRAINT "data_asset_data_owner_actor_id_actor_actor_id_fk" FOREIGN KEY ("data_owner_actor_id") REFERENCES "public"."actor"("actor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_actor_id_actor_actor_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actor"("actor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_tenant_id_tenant_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_work_order_id_work_order_work_order_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_order"("work_order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_actor_id_actor_actor_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actor"("actor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_tenant_id_tenant_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_organization_id_organization_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_actor_id_actor_actor_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actor"("actor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_authorization" ADD CONSTRAINT "payment_authorization_commitment_id_payment_commitment_commitment_id_fk" FOREIGN KEY ("commitment_id") REFERENCES "public"."payment_commitment"("commitment_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_authorization" ADD CONSTRAINT "payment_authorization_verification_id_verification_verification_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."verification"("verification_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_authorization" ADD CONSTRAINT "payment_authorization_payee_actor_id_actor_actor_id_fk" FOREIGN KEY ("payee_actor_id") REFERENCES "public"."actor"("actor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_authorization" ADD CONSTRAINT "payment_authorization_authorized_by_actor_actor_id_fk" FOREIGN KEY ("authorized_by") REFERENCES "public"."actor"("actor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_commitment" ADD CONSTRAINT "payment_commitment_work_order_id_work_order_work_order_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_order"("work_order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transaction" ADD CONSTRAINT "payment_transaction_authorization_id_payment_authorization_authorization_id_fk" FOREIGN KEY ("authorization_id") REFERENCES "public"."payment_authorization"("authorization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_fact" ADD CONSTRAINT "reputation_fact_actor_id_actor_actor_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actor"("actor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_fact" ADD CONSTRAINT "reputation_fact_work_order_id_work_order_work_order_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_order"("work_order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification" ADD CONSTRAINT "verification_evidence_id_evidence_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("evidence_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification" ADD CONSTRAINT "verification_verifier_actor_id_actor_actor_id_fk" FOREIGN KEY ("verifier_actor_id") REFERENCES "public"."actor"("actor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_tenant_id_tenant_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_client_actor_id_actor_actor_id_fk" FOREIGN KEY ("client_actor_id") REFERENCES "public"."actor"("actor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_assignment" ADD CONSTRAINT "work_order_assignment_work_order_id_work_order_work_order_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_order"("work_order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_assignment" ADD CONSTRAINT "work_order_assignment_actor_id_actor_actor_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actor"("actor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_requirement" ADD CONSTRAINT "work_order_requirement_work_order_id_work_order_work_order_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_order"("work_order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_actor_tenant" ON "actor" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_event_aggregate" ON "event" USING btree ("aggregate_type","aggregate_id","sequence_number");--> statement-breakpoint
CREATE INDEX "idx_evidence_work_order" ON "evidence" USING btree ("work_order_id");--> statement-breakpoint
CREATE INDEX "idx_payment_txn_auth" ON "payment_transaction" USING btree ("authorization_id");--> statement-breakpoint
CREATE INDEX "idx_reputation_actor" ON "reputation_fact" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_verification_evidence" ON "verification" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX "idx_wo_tenant_status" ON "work_order" USING btree ("tenant_id","status");