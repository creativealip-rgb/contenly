CREATE TABLE "content_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"config" jsonb NOT NULL,
	"is_favorite" boolean DEFAULT false,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"encrypted" boolean DEFAULT false,
	"category" varchar(50) DEFAULT 'general',
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "video_clip_preset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"config" jsonb NOT NULL,
	"is_favorite" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "article" ADD COLUMN "versions" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "video_clip_projects" ADD COLUMN "thumbnail_path" text;--> statement-breakpoint
ALTER TABLE "video_clip_projects" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "video_clip_projects" ADD COLUMN "waveform" jsonb;--> statement-breakpoint
ALTER TABLE "video_clip_projects" ADD COLUMN "broll_plan" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "content_template" ADD CONSTRAINT "content_template_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_clip_preset" ADD CONSTRAINT "video_clip_preset_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;