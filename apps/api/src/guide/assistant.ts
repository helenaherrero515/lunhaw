/**
 * Lunhaw's commute guide: Claude Haiku 5.5 with two tools (find_place, plan_trip).
 *
 * The model only explains. Every route, station, time and fare comes from the tools (trip.ts), and the
 * structured trip is returned to the app separately so the trip card never depends on the model's wording.
 */
import Anthropic from '@anthropic-ai/sdk';
import { searchPlaces, type PlaceHit } from './ors.js';
import { planTrip, type Endpoint, type Trip } from './trip.js';
import type { LatLng } from './rail.js';

export const GUIDE_MODEL = 'claude-haiku-5-5';
const MAX_TOOL_ROUNDS = 4;

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface LunhawPlace extends LatLng {
  id: string;
  name: string;
  city: string;
  category: string;
}

export interface GuideInput {
  messages: ChatTurn[];
  location?: LatLng; // only when the user chose to share it
  destination?: LunhawPlace; // when the chat was opened from a place
}

export interface GuideOutput {
  reply: string;
  trip: Trip | null;
  places: (PlaceHit | (LunhawPlace & { source: 'lunhaw' }))[];
}

const SYSTEM = `You are the Lunhaw commute guide for Metro Manila, Philippines. You help people get from where they are to public parks, gardens, libraries and other places.

How you work:
- Use find_place to turn place names into coordinates, and plan_trip to get options. Use the user's shared location as the starting point when it is given; otherwise ask where they are starting from.
- If a place name is ambiguous, show the best few matches and ask which one they mean.

Facts and honesty (most important):
- State only routes, stations, lines, times, distances and fares that appear in tool results. Never invent or guess jeepney or bus routes, stops, landmarks, fares or schedules.
- Lunhaw does not plan jeepney or bus routes yet. For those, say the app shows an "Open in Sakay.ph" button for this trip.
- Times and distances are estimates: say "about". Train fares are not confirmed in Lunhaw: tell people to check the fare at the station.
- If a tool fails, say so plainly and suggest Sakay.ph or trying again. Do not fill the gap from memory.

Style:
- Reply in the user's language (English, Filipino or Taglish). Keep it short: a sentence or two, then the steps of the best option. The app shows the full trip card and map, so don't repeat every turn-by-turn step.
- Stay on getting around Metro Manila; briefly steer other topics back.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'find_place',
    description:
      'Find a place in Metro Manila by name or description (a landmark, mall, station, street, barangay, park or library). Returns up to 8 matches with coordinates, Lunhaw places first.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'What the user called the place, e.g. "SM Megamall" or "Rizal Park".' } },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'plan_trip',
    description:
      'Plan a trip between two points: a real walking route, and an LRT/MRT option when it is faster. Durations are estimates. Jeepney and bus are not planned (a Sakay.ph link is included).',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        from: {
          type: 'object',
          properties: { label: { type: 'string' }, lat: { type: 'number' }, lng: { type: 'number' } },
          required: ['label', 'lat', 'lng'],
          additionalProperties: false,
        },
        to: {
          type: 'object',
          properties: { label: { type: 'string' }, lat: { type: 'number' }, lng: { type: 'number' } },
          required: ['label', 'lat', 'lng'],
          additionalProperties: false,
        },
      },
      required: ['from', 'to'],
      additionalProperties: false,
    },
  },
];

const inNcr = (p: LatLng) => p.lat > 14.2 && p.lat < 14.95 && p.lng > 120.8 && p.lng < 121.3;

/** A compact description of a trip for the model (the app gets the full structure). */
function tripForModel(t: Trip) {
  return {
    from: t.from.label,
    to: t.to.label,
    straight_line_km: t.straight_line_km,
    options: t.options.map((o) => ({
      title: o.title,
      about_minutes: o.duration_min,
      fare: o.fare.status === 'VERIFIED' ? `PHP ${o.fare.amount_php} (${o.fare.note})` : o.fare.note,
      legs: o.legs.map((l) =>
        l.mode === 'walk'
          ? `Walk about ${l.duration_min} min (${(l.distance_m / 1000).toFixed(1)} km) from ${l.from} to ${l.to}`
          : l.mode === 'rail'
            ? `${l.line_name}: board at ${l.board} towards ${l.towards}, ride ${l.stops} stop${l.stops === 1 ? '' : 's'}, get off at ${l.alight}`
            : `Transfer: ${l.note}`
      ),
    })),
    jeepney_bus: 'Not planned by Lunhaw. The app shows an "Open in Sakay.ph" button for this trip.',
    note: t.verification.note,
  };
}

export async function runGuide(
  apiKey: string,
  orsKey: string | undefined,
  places: LunhawPlace[],
  input: GuideInput
): Promise<GuideOutput> {
  const client = new Anthropic({ apiKey, maxRetries: 2, timeout: 60_000 });
  let trip: Trip | null = null;
  let found: GuideOutput['places'] = [];

  const context: string[] = [];
  if (input.location && inNcr(input.location)) context.push(`The user shared their current location: lat ${input.location.lat}, lng ${input.location.lng}.`);
  if (input.destination) {
    const d = input.destination;
    context.push(`The user opened this chat from the Lunhaw place "${d.name}" (${d.category}, ${d.city}) at lat ${d.lat}, lng ${d.lng}.`);
  }

  const messages: Anthropic.MessageParam[] = input.messages.slice(-12).map((m) => ({ role: m.role, content: m.content }));
  if (context.length) messages.push({ role: 'system', content: context.join(' ') } as unknown as Anthropic.MessageParam);

  async function runTool(name: string, args: any): Promise<string> {
    try {
      if (name === 'find_place') {
        const q = String(args.query ?? '').slice(0, 120);
        const local = places
          .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes(p.name.toLowerCase()))
          .slice(0, 3)
          .map((p) => ({ ...p, source: 'lunhaw' as const }));
        const remote = await searchPlaces(orsKey, q, input.location);
        found = [...local, ...remote].slice(0, 8);
        return JSON.stringify(found.length ? found : { matches: [], note: 'No matches in Metro Manila.' });
      }
      if (name === 'plan_trip') {
        const from = args.from as Endpoint;
        const to = args.to as Endpoint;
        if (!inNcr(from) || !inNcr(to)) return JSON.stringify({ error: 'Lunhaw plans trips within Metro Manila only.' });
        trip = await planTrip(orsKey, from, to);
        return JSON.stringify(tripForModel(trip));
      }
      return JSON.stringify({ error: `Unknown tool ${name}` });
    } catch (e) {
      return JSON.stringify({ error: e instanceof Error ? e.message : 'Tool failed' });
    }
  }

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const response = await client.messages.create({
      model: GUIDE_MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      tools: TOOLS,
      output_config: { effort: 'low' },
      messages,
    });

    if (response.stop_reason === 'refusal') {
      return { reply: 'Sorry, I can’t help with that. I can help you get around Metro Manila, for example to a park or library.', trip, places: found };
    }
    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (response.stop_reason !== 'tool_use' || !toolUses.length || round === MAX_TOOL_ROUNDS) {
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
      return { reply: text || 'Sorry, I couldn’t work that out. Try naming where you are and where you want to go.', trip, places: found };
    }
    messages.push({ role: 'assistant', content: response.content });
    const results: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUses.map(async (t) => ({ type: 'tool_result' as const, tool_use_id: t.id, content: await runTool(t.name, t.input) }))
    );
    messages.push({ role: 'user', content: results });
  }
  return { reply: 'Sorry, that took too many steps. Please try again.', trip, places: found };
}
