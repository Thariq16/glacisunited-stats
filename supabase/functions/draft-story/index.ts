import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';
import { generateText } from 'npm:ai@5';
import { createOpenAICompatible } from 'npm:@ai-sdk/openai-compatible@1';

const BodySchema = z.object({
  matchId: z.string().uuid(),
  audience: z.enum(['coach', 'player', 'analyst']),
});

const StorySchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(1),
  chapters: z
    .array(
      z.object({
        title: z.string().min(1),
        body: z.string().min(1),
        fixIt: z.string().optional(),
      })
    )
    .min(2)
    .max(6),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { matchId, audience } = parsed.data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Pull match + teams
    const { data: match, error: matchErr } = await admin
      .from('matches')
      .select('id, home_team_id, away_team_id, home_score, away_score, match_date, competition, venue')
      .eq('id', matchId)
      .maybeSingle();
    if (matchErr || !match) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: teams } = await admin
      .from('teams')
      .select('id, name')
      .in('id', [match.home_team_id, match.away_team_id]);
    const homeTeam = teams?.find((t) => t.id === match.home_team_id);
    const awayTeam = teams?.find((t) => t.id === match.away_team_id);

    // Pull match events (paginated to bypass 1k limit)
    const allEvents: any[] = [];
    for (let from = 0; from < 5000; from += 1000) {
      const { data: batch } = await admin
        .from('match_events')
        .select('event_type, successful, shot_outcome, half, minute, player_id, x, y, end_x, end_y')
        .eq('match_id', matchId)
        .range(from, from + 999);
      if (!batch || batch.length === 0) break;
      allEvents.push(...batch);
      if (batch.length < 1000) break;
    }

    // Aggregate
    const summarize = (teamId: string) => {
      const playerIds = new Set<string>();
      // We don't have team_id on events — derive via player team lookup
      return playerIds;
    };

    const { data: players } = await admin
      .from('players')
      .select('id, team_id')
      .in('team_id', [match.home_team_id, match.away_team_id]);
    const playerTeam = new Map(players?.map((p) => [p.id, p.team_id]) ?? []);

    const teamAgg = (teamId: string) => {
      const evs = allEvents.filter((e) => playerTeam.get(e.player_id) === teamId);
      const shots = evs.filter((e) => e.event_type === 'shot');
      const goals = shots.filter((e) => e.shot_outcome === 'goal').length;
      const onTarget = shots.filter((e) => e.shot_outcome === 'goal' || e.shot_outcome === 'saved').length;
      const passes = evs.filter((e) => e.event_type === 'pass');
      const passSuccess = passes.filter((e) => e.successful).length;
      const tackles = evs.filter((e) => e.event_type === 'tackle' && e.successful).length;
      const interceptions = evs.filter((e) => e.event_type === 'interception').length;
      const finalThirdEntries = passes.filter((e) => Number(e.end_x) >= 66 && e.successful).length;
      return {
        shots: shots.length,
        shotsOnTarget: onTarget,
        goals,
        passes: passes.length,
        passSuccessRate: passes.length ? Math.round((passSuccess / passes.length) * 100) : 0,
        tackles,
        interceptions,
        finalThirdEntries,
      };
    };

    const stats = {
      home: { name: homeTeam?.name, ...teamAgg(match.home_team_id) },
      away: { name: awayTeam?.name, ...teamAgg(match.away_team_id) },
      score: `${match.home_score}-${match.away_score}`,
      date: match.match_date,
      competition: match.competition,
      venue: match.venue,
    };

    // AI
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const gateway = createOpenAICompatible({
      name: 'lovable',
      baseURL: 'https://ai.gateway.lovable.dev/v1',
      headers: { 'Lovable-API-Key': lovableKey, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' },
    });
    const model = gateway('google/gemini-2.5-flash');

    const audiencePrompt = {
      coach: 'a head coach who needs tactical insight and concrete fixes',
      player: 'players reading on their phone — short, motivational, specific to behaviours',
      analyst: 'a fellow analyst — data-driven observations and patterns to investigate next',
    }[audience];

    const system = `You are a football analyst writing a short narrative report for ${audiencePrompt}.
Write in plain English, no jargon walls. Tell a story: what happened, why, what to do.
Return STRICT JSON only — no markdown fences — matching this shape:
{
  "headline": string (max 80 chars),
  "summary": string (1-2 sentences, the headline takeaway),
  "chapters": [ { "title": string, "body": string (2-4 sentences), "fixIt"?: string (1 sentence, only for coach audience) } ]
}
Produce 3-4 chapters: one on the attacking story, one on defensive shape, one on a key pattern, optionally one on individual standout.`;

    const user = `Match: ${stats.home.name} ${stats.score} ${stats.away.name}
Competition: ${stats.competition ?? 'Unknown'} · ${stats.date} · ${stats.venue ?? ''}

Stats:
${JSON.stringify(stats, null, 2)}`;

    const { text } = await generateText({
      model,
      system,
      prompt: user,
      temperature: 0.6,
    });

    // Strip code fences if any
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleaned);
    } catch {
      return new Response(JSON.stringify({ error: 'AI returned invalid JSON', raw: text }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const story = StorySchema.safeParse(parsedJson);
    if (!story.success) {
      return new Response(
        JSON.stringify({ error: 'AI output schema invalid', issues: story.error.flatten() }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Tag every chapter with a stable id
    const content = {
      ...story.data,
      chapters: story.data.chapters.map((c, i) => ({ id: `c${i + 1}`, ...c })),
    };

    return new Response(JSON.stringify({ content, stats }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('draft-story error', err);
    return new Response(JSON.stringify({ error: 'Failed to draft story' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
