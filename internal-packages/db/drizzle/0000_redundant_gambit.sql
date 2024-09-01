CREATE TABLE IF NOT EXISTS "connection_rooms" (
	"room" text NOT NULL,
	"project_id" integer NOT NULL,
	"identifier" text NOT NULL,
	CONSTRAINT "connection_rooms_room_project_id_identifier_pk" PRIMARY KEY("room","project_id","identifier")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "logs" (
	"id" bigserial NOT NULL,
	"project_id" integer NOT NULL,
	"action" text NOT NULL,
	"data" json,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "logs_id_timestamp_pk" PRIMARY KEY("id","timestamp")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth_account" (
	"provider_id" text NOT NULL,
	"provider_user_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "oauth_account_provider_id_provider_user_id_pk" PRIMARY KEY("provider_id","provider_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"client_id" text NOT NULL,
	"client_secret" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_plan" text DEFAULT 'FREE' NOT NULL,
	"stripe_subscription_id" text,
	"owner_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "project_client_id_unique" UNIQUE("client_id"),
	CONSTRAINT "project_client_secret_unique" UNIQUE("client_secret"),
	CONSTRAINT "project_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "project_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_token" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_webhook" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"text" text NOT NULL,
	"send_on_connect" boolean DEFAULT false NOT NULL,
	"send_on_message" boolean DEFAULT true NOT NULL,
	"send_on_disconnect" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "room" (
	"name" text NOT NULL,
	"project_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_name_project_id_pk" PRIMARY KEY("name","project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"profile_picture" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connection_rooms" ADD CONSTRAINT "connection_rooms_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "logs" ADD CONSTRAINT "logs_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth_account" ADD CONSTRAINT "oauth_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project" ADD CONSTRAINT "project_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_token" ADD CONSTRAINT "project_token_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_webhook" ADD CONSTRAINT "project_webhook_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "room" ADD CONSTRAINT "room_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "connection_rooms__identifier_project_id_idx" ON "connection_rooms" USING btree ("identifier","project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project__ownedId_idx" ON "project" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project__ownedId_deleted_idx" ON "project" USING btree ("owner_id","deleted");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project__ownedId_id_deleted_idx" ON "project" USING btree ("owner_id","id","deleted");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "room__projectId_idx" ON "room" USING btree ("project_id");