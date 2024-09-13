ALTER TABLE "project" RENAME COLUMN "stripe_plan" TO "plan";--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "stripe_customer_id" DROP NOT NULL;