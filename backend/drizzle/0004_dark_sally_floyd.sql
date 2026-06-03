CREATE TYPE "public"."video_clip_status" AS ENUM('created', 'downloading', 'transcribing', 'analyzing', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "render_presets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"template_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"props" jsonb NOT NULL,
	"format" varchar(10) DEFAULT 'mp4',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_clip_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"source_url" text NOT NULL,
	"status" "video_clip_status" DEFAULT 'created' NOT NULL,
	"video_path" text,
	"duration" integer,
	"transcript" text,
	"words" jsonb,
	"segments" jsonb,
	"exports" jsonb DEFAULT '[]'::jsonb,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "render_presets" ADD CONSTRAINT "render_presets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_clip_projects" ADD CONSTRAINT "video_clip_projects_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feed_user_id_idx" ON "feed" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feed_status_idx" ON "feed" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feed_item_feed_id_idx" ON "feed_item" USING btree ("feed_id");--> statement-breakpoint
CREATE INDEX "feed_item_status_idx" ON "feed_item" USING btree ("status");--> statement-breakpoint
CREATE INDEX "instagram_project_user_id_idx" ON "instagram_project" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_user_id_status_idx" ON "subscription" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "wp_site_user_id_idx" ON "wp_site" USING btree ("user_id");