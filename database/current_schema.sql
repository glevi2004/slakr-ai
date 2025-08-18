-- Current Database Schema for Slakr AI
-- Generated from Supabase project: favcekmathhpjuokczkl

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- Profiles table
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone,
    "username" "text",
    "full_name" "text",
    "avatar_url" "text",
    "school" "text",
    "grade" "text",
    "major" "text",
    "last_seen" timestamp with time zone DEFAULT "now"(),
    "online_status" character varying(10) DEFAULT 'offline'::character varying,
    "bio" "text",
    "push_token" "text",
    CONSTRAINT "profiles_online_status_check" CHECK ((("online_status")::"text" = ANY ((ARRAY['online'::character varying, 'away'::character varying, 'offline'::character varying, 'studying'::character varying])::"text"[]))),
    CONSTRAINT "username_length" CHECK (("char_length"("username") >= 3))
);

-- Friendships table
CREATE TABLE IF NOT EXISTS "public"."friendships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friend_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "friendships_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text"])))
);

-- Daily stats table
CREATE TABLE IF NOT EXISTS "public"."daily_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "total_study_time_seconds" integer DEFAULT 0,
    "session_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Study sessions table
CREATE TABLE IF NOT EXISTS "public"."study_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "duration_seconds" integer DEFAULT 0,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "study_sessions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'completed'::"text"])))
);

-- User streaks table
CREATE TABLE IF NOT EXISTS "public"."user_streaks" (
    "user_id" "uuid" NOT NULL,
    "current_streak" integer DEFAULT 0,
    "longest_streak" integer DEFAULT 0,
    "last_session_date" "date",
    "total_study_time_seconds" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Primary keys
ALTER TABLE ONLY "public"."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."friendships" ADD CONSTRAINT "friendships_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."daily_stats" ADD CONSTRAINT "daily_stats_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."study_sessions" ADD CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."user_streaks" ADD CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("user_id");

-- Unique constraints
ALTER TABLE ONLY "public"."profiles" ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");
ALTER TABLE ONLY "public"."friendships" ADD CONSTRAINT "unique_friendship" UNIQUE ("user_id", "friend_id");
ALTER TABLE ONLY "public"."daily_stats" ADD CONSTRAINT "daily_stats_user_date_unique" UNIQUE ("user_id", "date");

-- Indexes
CREATE INDEX "idx_daily_stats_date" ON "public"."daily_stats" USING "btree" ("date");
CREATE INDEX IF NOT EXISTS "idx_profiles_push_token" ON "public"."profiles" ("push_token");

-- Comments
COMMENT ON COLUMN "public"."profiles"."push_token" IS 'User''s expo push notifications token';

-- Functions
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."update_last_seen"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."upsert_daily_stats"("p_user_id" "uuid", "p_date" "date", "p_additional_seconds" integer, "p_additional_sessions" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO daily_stats (user_id, date, total_study_time_seconds, session_count)
    VALUES (p_user_id, p_date, p_additional_seconds, p_additional_sessions)
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        total_study_time_seconds = daily_stats.total_study_time_seconds + p_additional_seconds,
        session_count = daily_stats.session_count + p_additional_sessions,
        updated_at = NOW();
END;
$$;

-- Triggers
CREATE TRIGGER "handle_new_user" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();
CREATE TRIGGER "update_last_seen" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_last_seen"();

-- RLS Policies (if any exist)
-- Note: RLS policies should be added here if they exist in your current database
