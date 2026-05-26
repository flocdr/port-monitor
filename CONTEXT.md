# Port Monitor — Domain Glossary

## Port Call

A single vessel visit to Puerto Antioquia, uniquely identified by `(voyage_code, eta)`. The same voyage code may appear multiple times with different ETAs — it represents a regular scheduled service, not a one-off trip.

**Avoid:** "vessel visit", "ship call", "escale" — use Port Call.

---

## Voyage Code

A port-assigned identifier for a scheduled service (e.g., `MSSA-0013`, `MMLI-0001`). Not unique on its own — the same code recurs across multiple Port Calls of the same line. Unique when combined with ETA.

---

## Section

The operational status of a Port Call as displayed on the port status page. Exactly one of:

- `announced` — vessel expected, not yet berthed
- `berthed` — vessel currently at berth
- `departed` — vessel has left the port

A Port Call progresses through sections over time. It is expected (but not guaranteed) to appear in all three.

---

## Port Call Event

A row in the Summary Table. Represents the **first time** a Port Call was observed in a given Section during a daily Snapshot. One Port Call generates at most three Port Call Events (one per Section).

Deduplication key: `(voyage_code, eta, section)`.

---

## Snapshot

A daily fetch of `https://puertoantioquia.com.co/en/situacion`. The page shows a rolling window of recent data — the Departed section in particular truncates older entries. The Snapshot captures the current state of all three Sections.

---

## Summary Table

The append-only CSV file (`data/port_calls.csv`) that accumulates Port Call Events over time. A row is inserted on each Snapshot only if its `(voyage_code, eta, section)` key is not already present. The Summary Table is the reconstructed historical record that the port page itself cannot provide.

---

## Dashboard

A static HTML page (`public/index.html`) regenerated on each Snapshot from the Summary Table. Served via GitHub Pages. Displays Port Call Events in a filterable table — no backend, no separate deployment.
