import { z } from 'zod'

// ---------------------------------------------------------------------------
// Action: answer — chart explanations, lever analysis
// ---------------------------------------------------------------------------

export const KeyLeverSchema = z.object({
  name: z.string(),
  direction: z.enum(['increase', 'decrease']),
  why: z.string(),
})

export const SuggestedInputSchema = z.object({
  inputKey: z.string(),
  suggestedValue: z.number(),
  reason: z.string(),
})

export const AnswerActionSchema = z.object({
  action: z.literal('answer'),
  answer_markdown: z.string(),
  key_levers: z.array(KeyLeverSchema).optional(),
  suggested_next_inputs: z.array(SuggestedInputSchema).optional(),
})

// ---------------------------------------------------------------------------
// Action: city_request — request a city on the map
// ---------------------------------------------------------------------------

export const CityRequestActionSchema = z.object({
  action: z.literal('city_request'),
  city_query: z.string(),
  needs_clarification: z.boolean(),
  clarification_question: z.string().optional(),
  user_display_name: z.string().nullable().optional(),
  user_link: z.string().nullable().optional(),
})

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
  source_title: z.string(),
  source_publisher: z.string(),
  source_date: z.string().nullable().optional(),
  source_url: z.string(),
  evidence_quote: z.string(),
  confidence: z.literal('pending'),
  status: z.literal('proposed'),
})

export const UrlExtractActionSchema = z.object({
  action: z.literal('url_extract'),
  url: z.string(),
  candidates: z.array(CandidateSchema),
})

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
  strict: true,
  parameters: {
    type: 'object',
    required: ['action'],
    additionalProperties: false,
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
