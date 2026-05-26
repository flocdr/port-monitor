# ADR-0001 — CSV in repo as Summary Table

## Status
Accepted

## Context
The scraper runs once per day via GitHub Actions and appends new Port Call Events to the Summary Table. Volume is low (~5–15 new rows/day). The data needs to be queryable after the fact but has no concurrent writers and no relational integrity requirements.

The project is a Node.js ESM package. The scraper uses Node's native `fetch` + `cheerio` for HTML parsing.

Two alternatives were considered:
- **Supabase (managed Postgres)** — standard choice, enables SQL queries directly, but adds an external service dependency and credentials to manage.
- **CSV committed to the repo** — no external service, git history is the audit trail, readable by any tool (pandas, DuckDB, Excel).

## Decision
Store the Summary Table as a CSV file committed to the repository (`data/port_calls.csv`). The GitHub Actions job appends new rows and creates a commit after each Snapshot.

## Consequences
- No external service or credentials required beyond the repo itself.
- Git history provides a built-in audit trail of every daily run.
- SQL queries require DuckDB or pandas — not native, but trivial.
- If volume grows significantly (tens of thousands of rows/year), migrating to a DB later is straightforward since the CSV is the natural export format.
