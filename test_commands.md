# Quick Testing Commands

## Test Edge Function (Friendship Acceptance)

```bash
curl -X POST "https://favcekmathhpjuokczkl.supabase.co/functions/v1/handle-presence-change" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdmNla21hdGhocGp1b2tjemtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQyMzgsImV4cCI6MjA2ODY3MDIzOH0.IFEhz6kp655WBGYolwV3AYP589n8SBWJNU-QMIwwIlo" \
  -d '{
    "record": {
      "id": "test-friendship-id",
      "user_id": "accepter-user-id",
      "friend_id": "requester-user-id",
      "status": "accepted"
    },
    "old_record": {
      "id": "test-friendship-id",
      "user_id": "accepter-user-id",
      "friend_id": "requester-user-id",
      "status": "pending"
    },
    "table": "friendships"
  }'
```

## Test Edge Function (Presence Change)

```bash
curl -X POST "https://favcekmathhpjuokczkl.supabase.co/functions/v1/handle-presence-change" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdmNla21hdGhocGp1b2tjemtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQyMzgsImV4cCI6MjA2ODY3MDIzOH0.IFEhz6kp655WBGYolwV3AYP589n8SBWJNU-QMIwwIlo" \
  -d '{
    "record": {
      "id": "user-id",
      "full_name": "Test User",
      "online_status": "online",
      "push_token": "ExponentPushToken[YOUR_TOKEN]"
    },
    "old_record": {
      "id": "user-id",
      "full_name": "Test User",
      "online_status": "offline",
      "push_token": "ExponentPushToken[YOUR_TOKEN]"
    },
    "table": "profiles"
  }'
```

## Check Database Users

```bash
curl "https://favcekmathhpjuokczkl.supabase.co/rest/v1/profiles?select=id,full_name,push_token" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdmNla21hdGhocGp1b2tjemtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQyMzgsImV4cCI6MjA2ODY3MDIzOH0.IFEhz6kp655WBGYolwV3AYP589n8SBWJNU-QMIwwIlo"
```

## Check Function Logs

Visit: https://supabase.com/dashboard/project/favcekmathhpjuokczkl/functions
