-- Add friendship notification trigger
-- This file adds the friendship trigger to the existing notification system

-- Update the existing trigger function to handle friendship changes
CREATE OR REPLACE FUNCTION handle_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle presence changes (profiles table)
  IF TG_TABLE_NAME = 'profiles' THEN
    -- Only trigger when online_status changes
    IF OLD.online_status IS DISTINCT FROM NEW.online_status THEN
      -- Call the edge function
      PERFORM extensions.http_post(
        url := 'https://favcekmathhpjuokczkl.supabase.co/functions/v1/handle-presence-change',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdmNla21hdGhocGp1b2tjemtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQyMzgsImV4cCI6MjA2ODY3MDIzOH0.IFEhz6kp655WBGYolwV3AYP589n8SBWJNU-QMIwwIlo"}',
        body := json_build_object(
          'record', NEW,
          'old_record', OLD,
          'table', 'profiles'
        )::text
      );
    END IF;
  END IF;

  -- Handle friendship changes (friendships table)
  IF TG_TABLE_NAME = 'friendships' THEN
    -- Only trigger when status changes to 'accepted'
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'accepted' THEN
      -- Call the edge function
      PERFORM extensions.http_post(
        url := 'https://favcekmathhpjuokczkl.supabase.co/functions/v1/handle-presence-change',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdmNla21hdGhocGp1b2tjemtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQyMzgsImV4cCI6MjA2ODY3MDIzOH0.IFEhz6kp655WBGYolwV3AYP589n8SBWJNU-QMIwwIlo"}',
        body := json_build_object(
          'record', NEW,
          'old_record', OLD,
          'table', 'friendships'
        )::text
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on friendships table for friend request acceptances
DROP TRIGGER IF EXISTS friendship_change_trigger ON friendships;
CREATE TRIGGER friendship_change_trigger
  AFTER UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION handle_notifications();
