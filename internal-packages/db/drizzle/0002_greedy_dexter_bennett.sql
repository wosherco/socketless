ALTER TABLE "project" DROP CONSTRAINT "project_client_secret_unique";--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "concurrent_connections" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_webhook__project_id_idx" ON "project_webhook" USING btree ("project_id");--> statement-breakpoint
ALTER TABLE "project" DROP COLUMN IF EXISTS "client_secret";