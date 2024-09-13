CREATE TABLE IF NOT EXISTS "connected_clients" (
	"id" bigserial NOT NULL,
	"project_id" integer NOT NULL,
	"identifier" text NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project" RENAME COLUMN "concurrent_connections" TO "concurrent_connections_limit";--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "concurrent_connections_limit" SET DEFAULT 100;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "incoming_messages_limit" integer DEFAULT 1000000 NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "outgoing_messages_limit" integer DEFAULT 1000000 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connected_clients" ADD CONSTRAINT "connected_clients_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
