import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_contact_submissions_status" AS ENUM('new', 'in-progress', 'replied', 'closed');
  CREATE TYPE "public"."enum_join_submissions_status" AS ENUM('pending', 'accepted', 'rejected', 'in-review');
  CREATE TYPE "public"."enum_email_settings_provider" AS ENUM('gmail', 'sendgrid', 'mailgun', 'custom');
  CREATE TABLE "contact_submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"message" varchar,
  	"form_data" jsonb,
  	"status" "enum_contact_submissions_status" DEFAULT 'new',
  	"admin_notes" varchar,
  	"reply_template_subject" varchar DEFAULT 'Re: Your contact form submission',
  	"reply_template_body" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "join_submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"form_data" jsonb,
  	"status" "enum_join_submissions_status" DEFAULT 'pending',
  	"review_notes" varchar,
  	"acceptance_email_subject" varchar DEFAULT '🎉 Welcome to Photonics Society Eindhoven!',
  	"acceptance_email_body" varchar,
  	"acceptance_email_sent" boolean DEFAULT false,
  	"acceptance_email_sent_at" timestamp(3) with time zone,
  	"rejection_email_subject" varchar DEFAULT 'Regarding your PhE application',
  	"rejection_email_body" varchar,
  	"rejection_email_sent" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "email_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"provider" "enum_email_settings_provider" DEFAULT 'gmail' NOT NULL,
  	"enabled" boolean DEFAULT false,
  	"gmail_settings_user" varchar,
  	"gmail_settings_app_password" varchar,
  	"gmail_settings_from_name" varchar DEFAULT 'PhE Team',
  	"sendgrid_settings_api_key" varchar,
  	"sendgrid_settings_from_email" varchar,
  	"sendgrid_settings_from_name" varchar DEFAULT 'PhE Team',
  	"mailgun_settings_api_key" varchar,
  	"mailgun_settings_domain" varchar,
  	"mailgun_settings_from_email" varchar,
  	"mailgun_settings_from_name" varchar DEFAULT 'PhE Team',
  	"custom_settings_host" varchar,
  	"custom_settings_port" numeric DEFAULT 587,
  	"custom_settings_secure" boolean DEFAULT false,
  	"custom_settings_user" varchar,
  	"custom_settings_password" varchar,
  	"custom_settings_from_email" varchar,
  	"custom_settings_from_name" varchar DEFAULT 'PhE Team',
  	"test_email" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contact_submissions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "join_submissions_id" integer;
  CREATE INDEX "contact_submissions_updated_at_idx" ON "contact_submissions" USING btree ("updated_at");
  CREATE INDEX "contact_submissions_created_at_idx" ON "contact_submissions" USING btree ("created_at");
  CREATE INDEX "join_submissions_updated_at_idx" ON "join_submissions" USING btree ("updated_at");
  CREATE INDEX "join_submissions_created_at_idx" ON "join_submissions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_submissions_fk" FOREIGN KEY ("contact_submissions_id") REFERENCES "public"."contact_submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_join_submissions_fk" FOREIGN KEY ("join_submissions_id") REFERENCES "public"."join_submissions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_contact_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_submissions_id");
  CREATE INDEX "payload_locked_documents_rels_join_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("join_submissions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "contact_submissions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "join_submissions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "email_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "contact_submissions" CASCADE;
  DROP TABLE "join_submissions" CASCADE;
  DROP TABLE "email_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contact_submissions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_join_submissions_fk";
  
  DROP INDEX "payload_locked_documents_rels_contact_submissions_id_idx";
  DROP INDEX "payload_locked_documents_rels_join_submissions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contact_submissions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "join_submissions_id";
  DROP TYPE "public"."enum_contact_submissions_status";
  DROP TYPE "public"."enum_join_submissions_status";
  DROP TYPE "public"."enum_email_settings_provider";`)
}
