# Autonomy Scale ROI

A strategic simulator that models when large fixed autonomy investments (R&D + platform development) become economically justified through network expansion.

## Overview

This tool helps answer:
- Given a fixed autonomy investment and target expansion plan, when does the system generate acceptable returns?
- How fast must expansion occur for break-even?
- How many cities are required for profitability?
- What utilization and margin assumptions matter most?

## Features

- **ROI Calculation Engine**: Models cumulative profit vs fixed investment over time
- **4 Scenario Presets**: Conservative, Base Case, Aggressive, High Margin
- **Interactive Charts**: Visualize break-even timing and ROI curves
- **Ask AI Integration**: Get strategic insights powered by GPT-4
- **Full Analytics**: Track user behavior and AI interactions via Supabase
- **Mobile Responsive**: Clean, professional UI optimized for all devices

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Charts**: Recharts for data visualization
- **Database**: Supabase for analytics and AI logs
- **AI**: OpenAI GPT-4 for strategic analysis
- **Deployment**: Vercel

## Setup Instructions

### 1. Environment Variables

Copy the environment template and fill in your values:

```bash
cp environment-template.txt .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `OPENAI_API_KEY`: Your OpenAI API key
- `NEXT_PUBLIC_APP_URL`: Your app URL (http://localhost:3000 for local)

### 2. Supabase Setup

1. Create a new Supabase project
2. Run the SQL commands from `supabase-schema.sql` in your Supabase SQL editor
3. This will create the required tables: `analytics_events` and `ai_logs`

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The app will automatically deploy on every push to main branch.

## Usage

1. **Select a Preset**: Choose from Conservative, Base Case, Aggressive, or High Margin scenarios
2. **Adjust Inputs**: Use sliders to modify key parameters like fixed investment, profit per mile, and expansion rate
3. **Analyze Results**: View break-even timing, ROI projections, and key metrics
4. **Visualize Data**: Study the cumulative profit vs fixed investment chart
5. **Ask AI**: Get strategic insights and recommendations based on your scenario

## Key Metrics Tracked

- Break-even year
- ROI at 5 and 10 years
- Total network miles
- R&D cost per mile
- Required cities for 5-year break-even

## Analytics Events

The app tracks comprehensive user behavior:
- `page_view`, `session_start`
- `preset_selected`, `input_change`
- `run_started`, `run_completed`
- `ai_opened`, `ai_question`, `ai_response`

## Model Assumptions

- Deterministic scaling model (no randomness)
- Cities ramp to full production over configurable time period
- Linear profit per mile across all scenarios
- Fixed investment amortized across total network miles
- No external dependencies or market factors

## Contributing

This is a strategic analysis tool focused on autonomy economics. Contributions should maintain the executive-level focus and analytical rigor.

## License

Private project - All rights reserved.
