CREATE TYPE "public"."intake_status" AS ENUM('RECEIVED', 'IN_REVIEW', 'CONVERTED', 'DECLINED');--> statement-breakpoint
CREATE TABLE "intake" (
	"intake_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"expected_output" text NOT NULL,
	"quantity" text NOT NULL,
	"deadline" text,
	"acceptance_criteria" text,
	"evidence_expected" text,
	"data_class_requested" text,
	"frequency" text,
	"budget_range" text,
	"contact_name" text NOT NULL,
	"contact_organization" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text NOT NULL,
	"status" "intake_status" DEFAULT 'RECEIVED' NOT NULL,
	"converted_work_order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "intake_public_id_unique" UNIQUE("public_id")
);
