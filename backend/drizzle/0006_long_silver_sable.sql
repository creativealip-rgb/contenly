ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'IMAGE_GENERATION';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'SLIDE_IMAGE';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'THUMBNAIL_GENERATION';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'STORYBOARD_GENERATION';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'HASHTAG_GENERATION';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'VIDEO_SCRIPT';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'ALTERNATE_HOOKS';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'BROLL_KEYWORDS';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'SUGGEST_FOOTAGE_KEYWORDS';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'AUTO_CUTAWAY';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'TTS_PREVIEW';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'TTS_VOICEOVER';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'REGENERATE_FIELD';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'REGENERATE_VOICEOVER';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'IMPROVE_VISUAL';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'VIDEO_ANALYSIS';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'VIDEO_EXPORT';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'MOTION_GRAPHICS_RENDER';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'TEXT_OVERLAY';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'AI_CHAT';--> statement-breakpoint
ALTER TYPE "public"."subscription_plan" ADD VALUE IF NOT EXISTS 'STARTER' BEFORE 'PRO';--> statement-breakpoint
ALTER TYPE "public"."subscription_plan" ADD VALUE IF NOT EXISTS 'BUSINESS' BEFORE 'ENTERPRISE';
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'VIDEO_LIGHT';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'VIDEO_HEAVY';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'MOTION_RENDER';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'MOTION_GRAPHICS_PNG_RENDER';--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE IF NOT EXISTS 'AUDIO_TRANSCRIPTION';--> statement-breakpoint
