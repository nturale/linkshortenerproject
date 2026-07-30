---
name: links-monthly-chart
description: Query the database for links created over the past 12 months and generate a bar chart PNG. Use this skill whenever the user wants to visualise link creation trends, see monthly link stats, plot link data, generate a chart of links per month, or export link analytics as an image. Even if the user just asks to "show me link stats" or "chart the links", use this skill.
---

# Links Monthly Chart Skill

Generates a bar chart showing how many links were created per month over the past 12 months, exported as a PNG image.

## Prerequisites

- Python 3.8+
- A `.env.local` file in the project root containing `DATABASE_URL`
- Required Python packages: `psycopg2-binary`, `matplotlib`, `python-dotenv`

## Workflow

### Step 1 — Install dependencies

Run the following if not already installed:

```bash
pip install psycopg2-binary matplotlib python-dotenv
```

### Step 2 — Run the script

Execute the bundled script from the project root:

```bash
python .agents/skills/links-monthly-chart/scripts/plot_links.py
```

By default the chart is saved to `links-monthly-chart.png` in the project root. You can override the output path:

```bash
python .agents/skills/links-monthly-chart/scripts/plot_links.py --output path/to/output.png
```

### Step 3 — Report to the user

After the script completes, tell the user:
- Where the PNG was saved
- The monthly totals surfaced by the query (the script prints them)
- Any months with zero links (shown as empty bars)

## What the script does

1. Loads `DATABASE_URL` from `.env.local` in the current working directory.
2. Connects to the Neon PostgreSQL database.
3. Runs a SQL query grouping `links.created_at` by calendar month for the 12 months ending today.
4. Fills in any months with no links (so every month always appears on the chart).
5. Plots a bar chart with `matplotlib` — months on the x-axis, link count on the y-axis.
6. Saves the figure as a PNG.

## Troubleshooting

| Problem | Fix |
|---|---|
| `DATABASE_URL not found` | Make sure `.env.local` exists at the project root and contains `DATABASE_URL=...` |
| `ModuleNotFoundError` | Run `pip install psycopg2-binary matplotlib python-dotenv` |
| `connection refused` | Check that your Neon database is reachable and the DATABASE_URL is correct |
| Empty chart | No links exist in the database yet, or the date range is wrong |
