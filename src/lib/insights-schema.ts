import { z } from 'zod'

// ---------------------------------------------------------------------------
// Action: answer — chart explanations, lever analysis
// ---------------------------------------------------------------------------

export const KeyLeverSchema = z.object({
  name: z.string(),
  direction: z.string(),
  why: z.string(),
}).passthrough()

export const SuggestedInputSchema = z.object({
  inputKey: z.string(),
  suggestedValue: z.number(),
  reason: z.string(),
}).passthrough()

export const AnswerActionSchema = z.object({
  action: z.literal('answer'),
  answer_markdown: z.string(),
  key_levers: z.array(KeyLeverSchema).optional(),
  suggested_next_inputs: z.array(SuggestedInputSchema).optional(),
}).passthrough()

// ---------------------------------------------------------------------------
// Action: city_request — request a city on the map
// ---------------------------------------------------------------------------

export const CityRequestActionSchema = z.object({
  action: z.literal('city_request'),
  city_query: z.string().optional(),
  needs_clarification: z.boolean().optional(),
  clarification_question: z.string().optional(),
  user_display_name: z.string().nullable().optional(),
  user_link: z.string().nullable().optional(),
}).passthrough()

// ---------------------------------------------------------------------------
// Action: url_extract — extract datapoints from a news URL
// ---------------------------------------------------------------------------

export const CandidateSchema = z.object({
  company: z.string(),
  metric: z.string(),
  year: z.number(),
  month: z.number().nullable().optional(),
  value: z.number(),
  unit: z.string(),
  city: z.string().nullable().optional(),
  source_title: z.string().optional(),
  source_publisher: z.string().optional(),
  source_date: z.string().nullable().optional(),
  source_url: z.string().optional(),
  evidence_quote: z.string().optional(),
  confidence: z.string().optional(),
  status: z.string().optional(),
}).passthrough()

export const UrlExtractActionSchema = z.object({
  action: z.literal('url_extract'),
  url: z.string().optional(),
  candidates: z.array(CandidateSchema).optional(),
}).passthrough()

// ---------------------------------------------------------------------------
// Union schema — the model must return exactly one of these
// ---------------------------------------------------------------------------

export const InsightsActionSchema = z.discriminatedUnion('action', [
  AnswerActionSchema,
  CityRequestActionSchema,
  UrlExtractActionSchema,
])

export type InsightsAction = z.infer<typeof InsightsActionSchema>
export type AnswerAction = z.infer<typeof AnswerActionSchema>
export type CityRequestAction = z.infer<typeof CityRequestActionSchema>
export type UrlExtractAction = z.infer<typeof UrlExtractActionSchema>
export type Candidate = z.infer<typeof CandidateSchema>

// ---------------------------------------------------------------------------
// Normalize raw OpenAI payload before Zod validation
// Handles model alias quirks (city vs cityName, url vs urls, etc.)
// ---------------------------------------------------------------------------

export function normalizePayload(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw
  const p = { ...raw }

  // Normalize city_request aliases
  if (p.action === 'city_request') {
    p.city_query = p.city_query ?? p.cityQuery ?? p.city ?? p.cityName ?? p.place ?? ''
    p.needs_clarification = p.needs_clarification ?? p.needsClarification ?? false
    p.clarification_question = p.clarification_question ?? p.clarificationQuestion ?? p.clarification ?? undefined
  }

  // Normalize url_extract aliases
  if (p.action === 'url_extract') {
    p.url = p.url ?? p.urls?.[0] ?? p.source_url ?? ''
    p.candidates = p.candidates ?? p.datapoints ?? p.anchors ?? p.data ?? []

    // Force confidence/status on each candidate
    if (Array.isArray(p.candidates)) {
      p.candidates = p.candidates.map((c: any) => ({
        ...c,
        confidence: 'pending',
        status: 'proposed',
        source_url: c.source_url ?? p.url ?? '',
        source_title: c.source_title ?? c.title ?? '',
        source_publisher: c.source_publisher ?? c.publisher ?? '',
        evidence_quote: c.evidence_quote ?? c.quote ?? c.excerpt ?? '',
      }))
    }
  }

  return p
}

// ---------------------------------------------------------------------------
// Vague city stoplist — trigger clarification instead of geocoding
// ---------------------------------------------------------------------------

export const VAGUE_CITY_STOPLIST = [
  'my city', 'my town', 'my area', 'near me', 'here',
  'my location', 'my place', 'my neighborhood', 'my region',
  'where i live', 'where i am', 'my home', 'home',
]

export function isVagueCityQuery(query: string): boolean {
  const lower = query.toLowerCase().trim()
  return VAGUE_CITY_STOPLIST.some(s => lower === s || lower.includes(s))
}

// ---------------------------------------------------------------------------
// OpenAI function schema (JSON Schema format for structured output)
// ---------------------------------------------------------------------------

export const INSIGHTS_FUNCTION_SCHEMA = {
  name: 'insights_action',
  description: 'Return a structured action based on the user message.',
  parameters: {
    type: 'object',
    required: ['action'],
    properties: {
      action: {
        type: 'string',
        enum: ['answer', 'city_request', 'url_extract'],
        description: 'The type of action to take.',
      },
      // answer fields
      answer_markdown: {
        type: 'string',
        description: 'Markdown response for chart/scenario questions. Required when action=answer.',
      },
      key_levers: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'direction', 'why'],
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            direction: { type: 'string', enum: ['increase', 'decrease'] },
            why: { type: 'string' },
          },
        },
        description: 'Key levers ranked by impact. Optional.',
      },
      suggested_next_inputs: {
        type: 'array',
        items: {
          type: 'object',
          required: ['inputKey', 'suggestedValue', 'reason'],
          additionalProperties: false,
          properties: {
            inputKey: { type: 'string' },
            suggestedValue: { type: 'number' },
            reason: { type: 'string' },
          },
        },
        description: 'Suggested input changes. Optional.',
      },
      // city_request fields
      city_query: {
        type: 'string',
        description: 'City name to geocode. Required when action=city_request.',
      },
      needs_clarification: {
        type: 'boolean',
        description: 'True if the user did not provide a specific city. Required when action=city_request.',
      },
      clarification_question: {
        type: 'string',
        description: 'Follow-up question to ask user for city details. Required when needs_clarification=true.',
      },
      user_display_name: {
        type: ['string', 'null'],
        description: 'Optional contributor display name.',
      },
      user_link: {
        type: ['string', 'null'],
        description: 'Optional contributor link.',
      },
      // url_extract fields
      url: {
        type: 'string',
        description: 'The URL from the user message. Required when action=url_extract.',
      },
      candidates: {
        type: 'array',
        items: {
          type: 'object',
          required: ['company', 'metric', 'year', 'value', 'unit', 'source_title', 'source_publisher', 'source_url', 'evidence_quote', 'confidence', 'status'],
          additionalProperties: false,
          properties: {
            company: { type: 'string' },
            metric: { type: 'string' },
            year: { type: 'number' },
            month: { type: ['number', 'null'] },
            value: { type: 'number' },
            unit: { type: 'string' },
            city: { type: ['string', 'null'] },
            source_title: { type: 'string' },
            source_publisher: { type: 'string' },
            source_date: { type: ['string', 'null'] },
            source_url: { type: 'string' },
            evidence_quote: { type: 'string' },
            confidence: { type: 'string', enum: ['pending'] },
            status: { type: 'string', enum: ['proposed'] },
          },
        },
        description: 'Extracted datapoint candidates. Required when action=url_extract.',
      },
    },
  },
}
