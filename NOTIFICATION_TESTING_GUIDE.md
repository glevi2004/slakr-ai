# Notification System Testing Guide

## Prerequisites

- 2 physical devices (push notifications don't work on simulators)
- 2 test user accounts
- App installed on both devices

## Step 1: Verify Database Setup

Run these queries in Supabase SQL Editor to verify setup:

```sql
-- Check if push_token column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'push_token';

-- Check if trigger exists
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'presence_change_trigger';

-- Check if http extension is enabled
SELECT * FROM pg_extension WHERE extname = 'http';
```

## Step 2: Test Push Token Registration

1. **Device 1**: Log in with Account A
2. **Check console logs** for: `"✅ Push token obtained:"`
3. **Verify in database**:

```sql
SELECT id, full_name, push_token
FROM profiles
WHERE push_token IS NOT NULL;
```

## Step 3: Test Friendships

1. **Both devices**: Add each other as friends
2. **Verify in database**:

```sql
SELECT * FROM friendships WHERE status = 'accepted';
```

## Step 4: Test In-App Notifications (App in Background)

1. **Device 1**: Log in with Account A
2. **Device 2**: Log in with Account B, put app in background
3. **Device 1**: Come online (change status to "online")
4. **Expected**: Device 2 receives notification

## Step 4.5: Test Friend Request Acceptance Notifications

1. **Device 1**: Log in with Account A
2. **Device 2**: Log in with Account B, put app in background
3. **Device 1**: Send friend request to Account B
4. **Device 2**: Accept friend request
5. **Expected**: Device 1 receives notification that friend request was accepted

## Step 5: Test Background Notifications (App Closed)

1. **Device 1**: Log in with Account A
2. **Device 2**: Log in with Account B, completely close app
3. **Device 1**: Come online
4. **Expected**: Device 2 receives background notification

## Step 6: Test Edge Function Manually

Test the edge function directly:

```bash
# Test presence change notification
curl -X POST https://favcekmathhpjuokczkl.supabase.co/functions/v1/handle-presence-change \
  -H "Content-Type: application/json" \
  -d '{
    "record": {
      "id": "YOUR_USER_ID",
      "full_name": "Test User",
      "online_status": "online",
      "push_token": "YOUR_PUSH_TOKEN"
    },
    "old_record": {
      "id": "YOUR_USER_ID",
      "full_name": "Test User",
      "online_status": "offline",
      "push_token": "YOUR_PUSH_TOKEN"
    },
    "table": "profiles"
  }'

# Test friend request acceptance notification
curl -X POST https://favcekmathhpjuokczkl.supabase.co/functions/v1/handle-presence-change \
  -H "Content-Type: application/json" \
  -d '{
    "record": {
      "id": "FRIENDSHIP_ID",
      "user_id": "ACCEPTER_USER_ID",
      "friend_id": "REQUESTER_USER_ID",
      "status": "accepted"
    },
    "old_record": {
      "id": "FRIENDSHIP_ID",
      "user_id": "ACCEPTER_USER_ID",
      "friend_id": "REQUESTER_USER_ID",
      "status": "pending"
    },
    "table": "friendships"
  }'
```

## Step 7: Debug Common Issues

### No Notifications Received

- Check push tokens in database
- Verify notification permissions
- Ensure testing on physical devices

### Background Notifications Not Working

- Verify edge function is deployed
- Check database trigger is active
- Check function logs in Supabase dashboard

### Permission Denied

- Check device notification settings
- Re-request permissions in app

## Step 8: Monitor Logs

### Console Logs to Watch

- `"✅ Push token obtained:"` - Token registration
- `"✅ Push token saved to profile"` - Token saved
- `"✅ Sent online notifications for [name]"` - Notifications sent

### Supabase Logs to Check

- Function logs: https://supabase.com/dashboard/project/favcekmathhpjuokczkl/functions
- Database logs: Check for trigger executions

## Step 9: Manual Push Token Testing

1. Get your push token from console logs
2. Visit: https://expo.dev/notifications
3. Send test notification to your token

## Troubleshooting Commands

```bash
# Check edge function status
supabase functions list

# View function logs
supabase functions logs handle-presence-change

# Redeploy function if needed
supabase functions deploy handle-presence-change
```
