-- Enable the http extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- Create trigger function to handle presence changes
CREATE OR REPLACE FUNCTION handle_presence_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when online_status changes
  IF OLD.online_status IS DISTINCT FROM NEW.online_status THEN
    -- Call the edge function
    PERFORM extensions.http_post(
      url := 'https://favcekmathhpjuokczkl.supabase.co/functions/v1/handle-presence-change',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdmNla21hdGhocGp1b2tjemtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQyMzgsImV4cCI6MjA2ODY3MDIzOH0.IFEhz6kp655WBGYolwV3AYP589n8SBWJNU-QMIwwIlo"}',
      body := json_build_object(
        'record', NEW,
        'old_record', OLD
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS presence_change_trigger ON profiles;
CREATE TRIGGER presence_change_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_presence_change();

-- Add push_token column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add index for efficient push token queries
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON profiles (push_token);
