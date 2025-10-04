import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_contact_form_fields_type" AS ENUM('text', 'email', 'tel', 'number', 'textarea', 'select', 'checkbox');
  ALTER TYPE "public"."enum_about_sections_layout" ADD VALUE 'text-only';
  ALTER TYPE "public"."enum_about_sections_layout" ADD VALUE 'image-only';
  ALTER TYPE "public"."enum__about_v_version_sections_layout" ADD VALUE 'text-only';
  ALTER TYPE "public"."enum__about_v_version_sections_layout" ADD VALUE 'image-only';
  CREATE TABLE "contact_form_fields_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar
  );
  
  CREATE TABLE "contact_form_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"type" "enum_contact_form_fields_type" DEFAULT 'text' NOT NULL,
  	"placeholder" varchar,
  	"required" boolean DEFAULT false,
  	"rows" numeric DEFAULT 4
  );
  
  CREATE TABLE "contact" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Contact Us' NOT NULL,
  	"description" varchar DEFAULT 'We usually reply within 1–2 days.',
  	"social_links_linkedin" varchar,
  	"social_links_instagram" varchar,
  	"content" jsonb,
  	"submit_button_text" varchar DEFAULT 'Send message',
  	"success_message" varchar DEFAULT 'Message sent!',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "_join_v_version_form_fields_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_join_v_version_form_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_join_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_join_v_version_form_fields_options" CASCADE;
  DROP TABLE "_join_v_version_form_fields" CASCADE;
  DROP TABLE "_join_v" CASCADE;
  DROP INDEX "join__status_idx";
  ALTER TABLE "join_form_fields" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "join_form_fields" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "join_form_fields" ALTER COLUMN "type" SET DEFAULT 'text';
  ALTER TABLE "join_form_fields" ALTER COLUMN "type" SET NOT NULL;
  ALTER TABLE "join" ADD COLUMN "content" jsonb;
  ALTER TABLE "contact_form_fields_options" ADD CONSTRAINT "contact_form_fields_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact_form_fields"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contact_form_fields" ADD CONSTRAINT "contact_form_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "contact_form_fields_options_order_idx" ON "contact_form_fields_options" USING btree ("_order");
  CREATE INDEX "contact_form_fields_options_parent_id_idx" ON "contact_form_fields_options" USING btree ("_parent_id");
  CREATE INDEX "contact_form_fields_order_idx" ON "contact_form_fields" USING btree ("_order");
  CREATE INDEX "contact_form_fields_parent_id_idx" ON "contact_form_fields" USING btree ("_parent_id");
  ALTER TABLE "join" DROP COLUMN "intro_text";
  ALTER TABLE "join" DROP COLUMN "details_html";
  ALTER TABLE "join" DROP COLUMN "_status";
  DROP TYPE "public"."enum_join_status";
  DROP TYPE "public"."enum__join_v_version_form_fields_type";
  DROP TYPE "public"."enum__join_v_version_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_join_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__join_v_version_form_fields_type" AS ENUM('text', 'email', 'textarea', 'select');
  CREATE TYPE "public"."enum__join_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "_join_v_version_form_fields_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_join_v_version_form_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"label" varchar,
  	"type" "enum__join_v_version_form_fields_type",
  	"required" boolean DEFAULT false,
  	"placeholder" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_join_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_intro_text" jsonb,
  	"version_details_html" jsonb,
  	"version__status" "enum__join_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  ALTER TABLE "contact_form_fields_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contact_form_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contact" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "contact_form_fields_options" CASCADE;
  DROP TABLE "contact_form_fields" CASCADE;
  DROP TABLE "contact" CASCADE;
  ALTER TABLE "about_sections" ALTER COLUMN "layout" SET DATA TYPE text;
  ALTER TABLE "about_sections" ALTER COLUMN "layout" SET DEFAULT 'text-image'::text;
  DROP TYPE "public"."enum_about_sections_layout";
  CREATE TYPE "public"."enum_about_sections_layout" AS ENUM('text-image', 'image-text');
  ALTER TABLE "about_sections" ALTER COLUMN "layout" SET DEFAULT 'text-image'::"public"."enum_about_sections_layout";
  ALTER TABLE "about_sections" ALTER COLUMN "layout" SET DATA TYPE "public"."enum_about_sections_layout" USING "layout"::"public"."enum_about_sections_layout";
  ALTER TABLE "_about_v_version_sections" ALTER COLUMN "layout" SET DATA TYPE text;
  ALTER TABLE "_about_v_version_sections" ALTER COLUMN "layout" SET DEFAULT 'text-image'::text;
  DROP TYPE "public"."enum__about_v_version_sections_layout";
  CREATE TYPE "public"."enum__about_v_version_sections_layout" AS ENUM('text-image', 'image-text');
  ALTER TABLE "_about_v_version_sections" ALTER COLUMN "layout" SET DEFAULT 'text-image'::"public"."enum__about_v_version_sections_layout";
  ALTER TABLE "_about_v_version_sections" ALTER COLUMN "layout" SET DATA TYPE "public"."enum__about_v_version_sections_layout" USING "layout"::"public"."enum__about_v_version_sections_layout";
  ALTER TABLE "join_form_fields" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "join_form_fields" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "join_form_fields" ALTER COLUMN "type" DROP DEFAULT;
  ALTER TABLE "join_form_fields" ALTER COLUMN "type" DROP NOT NULL;
  ALTER TABLE "join" ADD COLUMN "intro_text" jsonb;
  ALTER TABLE "join" ADD COLUMN "details_html" jsonb;
  ALTER TABLE "join" ADD COLUMN "_status" "enum_join_status" DEFAULT 'draft';
  ALTER TABLE "_join_v_version_form_fields_options" ADD CONSTRAINT "_join_v_version_form_fields_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_join_v_version_form_fields"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_join_v_version_form_fields" ADD CONSTRAINT "_join_v_version_form_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_join_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_join_v_version_form_fields_options_order_idx" ON "_join_v_version_form_fields_options" USING btree ("_order");
  CREATE INDEX "_join_v_version_form_fields_options_parent_id_idx" ON "_join_v_version_form_fields_options" USING btree ("_parent_id");
  CREATE INDEX "_join_v_version_form_fields_order_idx" ON "_join_v_version_form_fields" USING btree ("_order");
  CREATE INDEX "_join_v_version_form_fields_parent_id_idx" ON "_join_v_version_form_fields" USING btree ("_parent_id");
  CREATE INDEX "_join_v_version_version__status_idx" ON "_join_v" USING btree ("version__status");
  CREATE INDEX "_join_v_created_at_idx" ON "_join_v" USING btree ("created_at");
  CREATE INDEX "_join_v_updated_at_idx" ON "_join_v" USING btree ("updated_at");
  CREATE INDEX "_join_v_latest_idx" ON "_join_v" USING btree ("latest");
  CREATE INDEX "_join_v_autosave_idx" ON "_join_v" USING btree ("autosave");
  CREATE INDEX "join__status_idx" ON "join" USING btree ("_status");
  ALTER TABLE "join" DROP COLUMN "content";
  DROP TYPE "public"."enum_contact_form_fields_type";`)
}
