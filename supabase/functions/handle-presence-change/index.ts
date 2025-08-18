import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Profile {
  id: string;
  full_name: string;
  online_status: string;
  push_token?: string;
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
}

interface RequestData {
  record: Profile | Friendship;
  old_record: Profile | Friendship;
  table: string;
}

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const { record, old_record, table }: RequestData = await req.json();

  // Handle presence changes (when someone comes online)
  if (table === "profiles") {
    const profileRecord = record as Profile;
    const oldProfileRecord = old_record as Profile;

    if (
      profileRecord.online_status === "online" &&
      oldProfileRecord.online_status !== "online"
    ) {
      // Get user's friends
      const { data: friendships } = await supabase
        .from("friendships")
        .select("friend_id")
        .eq("user_id", profileRecord.id)
        .eq("status", "accepted");

      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map((f: any) => f.friend_id);

        // Get push tokens for friends
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, push_token, full_name")
          .in("id", friendIds)
          .not("push_token", "is", null);

        // Send notifications
        for (const profile of profiles || []) {
          if (profile.push_token) {
            await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                to: profile.push_token,
                title: `${profileRecord.full_name} is online!`,
                body: "Your friend just came online",
                sound: "default",
                data: {
                  type: "friend_online",
                  friendName: profileRecord.full_name,
                },
              }),
            });
          }
        }
      }
    }
  }

  // Handle friendship acceptances
  if (table === "friendships") {
    const friendshipRecord = record as Friendship;
    const oldFriendshipRecord = old_record as Friendship;

    if (
      friendshipRecord.status === "accepted" &&
      oldFriendshipRecord.status !== "accepted"
    ) {
      // Get the user who sent the request (friend_id in the friendship)
      const { data: requesterProfile } = await supabase
        .from("profiles")
        .select("id, full_name, push_token")
        .eq("id", friendshipRecord.friend_id)
        .single();

      // Get the user who accepted the request (user_id in the friendship)
      const { data: accepterProfile } = await supabase
        .from("profiles")
        .select("id, full_name, push_token")
        .eq("id", friendshipRecord.user_id)
        .single();

      // Send notification to the person who sent the request
      if (requesterProfile?.push_token) {
        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: requesterProfile.push_token,
            title: `${accepterProfile?.full_name} accepted your friend request!`,
            body: "You are now friends",
            sound: "default",
            data: {
              type: "friend_request_accepted",
              friendName: accepterProfile?.full_name,
            },
          }),
        });
      }
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
