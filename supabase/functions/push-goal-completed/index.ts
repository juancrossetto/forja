// Supabase Edge Function: push-goal-completed
// Triggered via database webhook when a goal is completed,
// or called directly from the app when goal completion is detected.
//
// Deploy: supabase functions deploy push-goal-completed
// Set secret: supabase secrets set EXPO_ACCESS_TOKEN=your_expo_token

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushPayload {
  user_id: string;
  goal_title: string;
  goal_type: string;
}

serve(async (req: Request) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    const payload: PushPayload = await req.json();
    const { user_id, goal_title, goal_type } = payload;

    if (!user_id || !goal_title) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or goal_title' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Create Supabase admin client to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's push tokens
    const { data: tokens, error: tokenErr } = await supabase
      .from('push_tokens')
      .select('expo_token')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (tokenErr || !tokens?.length) {
      return new Response(
        JSON.stringify({ sent: 0, reason: tokenErr?.message ?? 'No active tokens' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Build Expo push messages
    const messages = tokens.map((t: { expo_token: string }) => ({
      to: t.expo_token,
      sound: 'default',
      title: 'Meta cumplida! 🎯',
      body: `Completaste: ${goal_title}`,
      data: { type: 'goal_completed', goalTitle: goal_title, goalType: goal_type },
      channelId: 'goals',
      priority: 'high',
    }));

    // Send via Expo Push API
    const expoToken = Deno.env.get('EXPO_ACCESS_TOKEN');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (expoToken) {
      headers['Authorization'] = `Bearer ${expoToken}`;
    }

    const expoPushResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(messages),
    });

    const result = await expoPushResponse.json();

    return new Response(
      JSON.stringify({ sent: messages.length, result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('push-goal-completed error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
