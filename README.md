# Autonomy Scale ROI

Autonomy Scale ROI is an interactive simulation + insight tool for modeling how autonomous vehicle networks scale — combining real-world deployment data, unit economics, and conversational AI.

**Live app: [autonomy-scale-roi.vercel.app](https://autonomy-scale-roi.vercel.app)**

This project explores a core question:

> **What actually determines whether robotaxi networks reach economic break-even?**

---

## What this app does

### 1. Simulate autonomy scale economics

Model how changes in:

- Fleet size
- Cities per year
- Utilization
- Cost per mile
- Ramp timelines

affect:

- Net cash
- Paid trips
- Miles driven
- Break-even trajectory

Adjust inputs and immediately see system-level impact.

---

### 2. Conversational Insights (AI)

Use the Insights panel to:

- Ask questions like:
  - "What drives break-even most?"
  - "Which input has the biggest leverage?"

The AI responds with structured analysis tied directly to the current scenario.

**Design principle:**

> AI proposes. The system decides.

Insights never directly modify the model.

---

### 3. Community city requests

Request new cities conversationally:

> "I want Waymo in Boulder"

Flow:

1. AI detects intent
2. City is geocoded
3. User confirms
4. City appears on the map as **Requested**

This creates lightweight community demand signals.

---

### 4. URL → datapoint extraction (pending anchors)

Paste a news article or blog URL.

The system will:

- Extract candidate metrics (fleet size, trips, vehicles, etc.)
- Show them for review
- Allow batch insertion as **Pending**

Pending datapoints:

- Do **NOT** affect simulations
- Require approval before becoming historical anchors

This keeps the model grounded while allowing community contribution.

---

## Data governance

Every datapoint includes:

- Source URL
- Publisher
- Date
- Contributor attribution
- Status (anchored, testing, requested, projected, pending)
- Confidence

Only **anchored / approved** data influences simulation curves.

This prevents hallucinated AI data from polluting the model.

---

## Tech stack

- **Next.js** (App Router)
- **TypeScript**
- **Supabase** (data + analytics)
- **Mapbox** (geocoding + maps)
- **OpenAI** (structured insights + extraction)
- **Recharts** (visualization)
- **Vercel** (deployment)

**Architecture principle:**

> AI is an interface layer — never the source of truth.
>
> All writes are deterministic and validated server-side.

---

## Versioning

**Current release:**

**v0.6.0** — Conversational Insights + Community Map

Establishes:

- Unified Insights entry point
- City requests
- URL extraction
- Historical anchors + simulation blending

Future versions will expand into:

- Autonomy capital cycles
- Multi-city rollout dynamics
- ROI horizons
- Operator tooling

---

## Why this exists

This project explores:

- Physical AI economics
- Robotaxi scaling constraints
- Operations-first autonomy strategy

Built by Rafael Marañón.

Feedback welcome from autonomy, robotics, and infrastructure economics practitioners.

---

## License

MIT
