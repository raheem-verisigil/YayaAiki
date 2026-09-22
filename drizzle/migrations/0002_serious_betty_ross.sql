CREATE TYPE "public"."worker_interest_status" AS ENUM('RECEIVED', 'CONTACTED', 'ONBOARDED', 'DECLINED');--> statement-breakpoint
CREATE TABLE "worker_interest" (
	"worker_interest_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"location" text NOT NULL,
	"work_types" text NOT NULL,
	"experience_level" text,
	"availability" text,
	"whatsapp_opt_in" boolean DEFAULT true NOT NULL,
	"status" "worker_interest_status" DEFAULT 'RECEIVED' NOT NULL,
	"converted_actor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "worker_interest_public_id_unique" UNIQUE("public_id")
);
