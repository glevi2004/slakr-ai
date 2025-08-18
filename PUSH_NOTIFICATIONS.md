# Push Notification System Implementation

This document describes the push notification system implemented for the Slakr AI app.

## Overview

The push notification system sends notifications to friends when someone comes online. It works both when the app is open (in-app notifications) and when the app is closed (background notifications via Supabase Edge Functions).

## Components

### 1. Push Notification Service (`services/pushNotificationService.ts`)

- Handles registration for push notifications
- Manages Expo push tokens
- Sends notifications to specific users
- Provides notification event listeners

### 2. Database Schema (`database/add_push_token_to_profiles.sql`)

- Adds `push_token` field to the `profiles` table
- Creates index for efficient token queries

### 3. Updated Presence Service (`services/presenceService.ts`)

- Integrates with push notification service
- Sends notifications when friends come online
- Handles friend online status changes

### 4. Updated Auth Context (`contexts/AuthContext.tsx`)

- Initializes push notifications on login
- Registers and saves push tokens
- Handles cleanup on logout

### 5. Updated Friends Card (`components/FriendsCard.tsx`)

- Triggers notifications when friends come online
- Handles real-time presence updates

### 6. Main App Layout (`app/_layout.tsx`)

- Handles notification taps
- Routes users based on notification content

### 7. Supabase Edge Function (`supabase/functions/handle-presence-change/index.ts`)

- Handles background notifications when app is closed
- Triggers on database changes

## Setup Instructions

### 1. Database Setup

Run the SQL script to add push token support:

```sql
-- Run this in your Supabase SQL editor
\i database/add_push_token_to_profiles.sql
```

### 2. App Configuration

The `app.json` has been updated with:

- Expo notifications plugin
- Proper icon and color configuration

### 3. Edge Function Deployment (Optional)

Deploy the edge function to handle background notifications:

```bash
supabase functions deploy handle-presence-change
```

## How It Works

### When App is Open

1. User logs in → Push token is registered and saved to profile
2. Friend comes online → Presence service detects change
3. Push notification service sends notification to all friends
4. Friends receive in-app notification

### When App is Closed

1. Friend comes online → Database change triggers edge function
2. Edge function fetches friend's push tokens
3. Notifications sent via Expo push service
4. Friends receive background notification

## Testing

### Test Push Notifications

1. Install app on two devices
2. Log in with different accounts
3. Add each other as friends
4. Put one app in background
5. Come online with the other account
6. Verify notification is received

### Test Edge Function

1. Deploy edge function to Supabase
2. Close app completely
3. Come online with another account
4. Verify background notification is received

## Troubleshooting

### Common Issues

1. **No notifications received**: Check if push tokens are saved in database
2. **Background notifications not working**: Ensure edge function is deployed
3. **Permission denied**: Check notification permissions in device settings

### Debug Steps

1. Check console logs for push token registration
2. Verify push tokens in database
3. Test edge function manually
4. Check Expo push service status

## Security Considerations

- Push tokens are stored securely in the database
- Only friends receive notifications
- Edge function validates user relationships
- No sensitive data in notification payload

## Future Enhancements

- Custom notification sounds
- Different notification types (studying, streaks, etc.)
- Notification preferences per user
- Rich notifications with images
- Notification history
