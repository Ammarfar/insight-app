CREATE TYPE "public"."backup_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."backup_type" AS ENUM('MANUAL', 'AUTOMATIC');--> statement-breakpoint
CREATE TYPE "public"."review_item_outcome" AS ENUM('PENDING', 'SKIPPED', 'REMEMBERED', 'NEEDS_REVIEW');--> statement-breakpoint
CREATE TYPE "public"."review_result" AS ENUM('REMEMBERED', 'NEEDS_REVIEW');--> statement-breakpoint
CREATE TYPE "public"."review_session_status" AS ENUM('ACTIVE', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('BOOK', 'ARTICLE', 'VIDEO', 'PODCAST', 'COURSE', 'CONVERSATION', 'WORK', 'EXPERIENCE');--> statement-breakpoint
CREATE TYPE "public"."xp_event_type" AS ENUM('CREATE_INSIGHT', 'REVIEW_INSIGHT', 'CONNECT_INSIGHT', 'COMPLETE_DAILY_REVIEW');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "backups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"drive_file_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"type" "backup_type" NOT NULL,
	"status" "backup_status" DEFAULT 'PENDING' NOT NULL,
	"size_bytes" integer,
	"checksum" varchar(64),
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "daily_review_items" (
	"session_id" uuid NOT NULL,
	"insight_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"outcome" "review_item_outcome" DEFAULT 'PENDING' NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "daily_review_items_session_id_insight_id_pk" PRIMARY KEY("session_id","insight_id")
);
--> statement-breakpoint
CREATE TABLE "daily_review_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"review_date" date NOT NULL,
	"status" "review_session_status" DEFAULT 'ACTIVE' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insight_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source_insight_id" uuid NOT NULL,
	"target_insight_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "connections_canonical_pair" CHECK ("insight_connections"."source_insight_id" < "insight_connections"."target_insight_id")
);
--> statement-breakpoint
CREATE TABLE "insight_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"insight_id" uuid NOT NULL,
	"result" "review_result" NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insight_topics" (
	"insight_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insight_topics_insight_id_topic_id_pk" PRIMARY KEY("insight_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source_id" uuid,
	"title" varchar(180),
	"content" text NOT NULL,
	"reflection" text,
	"next_review_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insights_content_not_blank" CHECK (length(trim("insights"."content")) > 0)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "source_type" NOT NULL,
	"title" varchar(240) NOT NULL,
	"author" varchar(160),
	"url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(80) NOT NULL,
	"color" varchar(24) DEFAULT 'sage' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"timezone" varchar(80) DEFAULT 'UTC' NOT NULL,
	"automatic_backup_enabled" boolean DEFAULT false NOT NULL,
	"last_data_changed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"user_id" text PRIMARY KEY NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_learning_date" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp with time zone,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "xp_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "xp_event_type" NOT NULL,
	"amount" integer NOT NULL,
	"entity_id" uuid,
	"event_key" varchar(180) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "xp_events_positive_amount" CHECK ("xp_events"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backups" ADD CONSTRAINT "backups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_review_items" ADD CONSTRAINT "daily_review_items_session_id_daily_review_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."daily_review_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_review_items" ADD CONSTRAINT "daily_review_items_insight_id_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_review_sessions" ADD CONSTRAINT "daily_review_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_connections" ADD CONSTRAINT "insight_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_connections" ADD CONSTRAINT "insight_connections_source_insight_id_insights_id_fk" FOREIGN KEY ("source_insight_id") REFERENCES "public"."insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_connections" ADD CONSTRAINT "insight_connections_target_insight_id_insights_id_fk" FOREIGN KEY ("target_insight_id") REFERENCES "public"."insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_reviews" ADD CONSTRAINT "insight_reviews_insight_id_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_topics" ADD CONSTRAINT "insight_topics_insight_id_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_topics" ADD CONSTRAINT "insight_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "backups_user_created_idx" ON "backups" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_review_position_uidx" ON "daily_review_items" USING btree ("session_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_review_user_date_uidx" ON "daily_review_sessions" USING btree ("user_id","review_date");--> statement-breakpoint
CREATE INDEX "daily_review_user_status_idx" ON "daily_review_sessions" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "connections_pair_uidx" ON "insight_connections" USING btree ("user_id","source_insight_id","target_insight_id");--> statement-breakpoint
CREATE INDEX "connections_source_idx" ON "insight_connections" USING btree ("source_insight_id");--> statement-breakpoint
CREATE INDEX "connections_target_idx" ON "insight_connections" USING btree ("target_insight_id");--> statement-breakpoint
CREATE INDEX "reviews_insight_date_idx" ON "insight_reviews" USING btree ("insight_id","reviewed_at");--> statement-breakpoint
CREATE INDEX "insight_topics_topic_idx" ON "insight_topics" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "insights_user_created_idx" ON "insights" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "insights_user_due_idx" ON "insights" USING btree ("user_id","next_review_at");--> statement-breakpoint
CREATE INDEX "insights_source_idx" ON "insights" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sources_user_created_idx" ON "sources" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sources_user_title_type_uidx" ON "sources" USING btree ("user_id","title","type");--> statement-breakpoint
CREATE UNIQUE INDEX "topics_user_name_uidx" ON "topics" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE INDEX "topics_user_idx" ON "topics" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "xp_events_user_key_uidx" ON "xp_events" USING btree ("user_id","event_key");--> statement-breakpoint
CREATE INDEX "xp_events_user_created_idx" ON "xp_events" USING btree ("user_id","created_at");