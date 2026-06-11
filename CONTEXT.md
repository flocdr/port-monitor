# Port Monitor — Domain Glossary

## Port Call

A single vessel visit to Puerto Antioquia. For dashboard purposes, Port Call Events are grouped into one Port Call by `(voyage_code, vessel, eta_date)`, where `eta_date` is the calendar day of ETA and the ETA time may move as the schedule changes.

The same voyage code may appear multiple times on different ETA dates — it represents a regular scheduled service, not a one-off trip.

**Avoid:** "vessel visit", "ship call", "escale" — use Port Call.

---

## Voyage Code

A port-assigned identifier for a scheduled service (e.g., `MSSA-0013`, `MMLI-0001`). Not unique on its own — the same code recurs across multiple Port Calls of the same line. On the dashboard, it is interpreted together with vessel and ETA date.

---

## Section

The operational status of a Port Call as displayed on the port status page. Exactly one of:

- `announced` — vessel expected, not yet berthed
- `berthed` — vessel currently at berth
- `departed` — vessel has left the port

A Port Call progresses through sections over time. It is expected (but not guaranteed) to appear in all three.

---

## Port Call Event

A row in the Summary Table. Represents the **first time** a Port Call candidate was observed with a given exact ETA and Section during a daily Snapshot. A real Port Call can generate multiple Port Call Events as it progresses through Sections, and can also generate additional events if the port changes the ETA time.

CSV deduplication key: `(voyage_code, eta, section)`.

---

## Snapshot

A daily fetch of `https://puertoantioquia.com.co/en/situacion`. The page shows a rolling window of recent data — the Departed section in particular truncates older entries. The Snapshot captures the current state of all three Sections.

---

## Summary Table

The append-only CSV file (`data/port_calls.csv`) that accumulates Port Call Events over time. A row is inserted on each Snapshot only if its `(voyage_code, eta, section)` key is not already present. The Summary Table is the reconstructed historical record that the port page itself cannot provide.

---

## Dashboard

A static HTML page (`index.html`) regenerated on each Snapshot from the Summary Table. Served via GitHub Pages — no backend, no separate deployment.

The main table displays Port Calls, not raw Port Call Events. It groups raw events by `(voyage_code, vessel, eta_date)` and shows one line using the most advanced known Section (`departed` > `berthed` > `announced`). Within the same Section, the latest Snapshot is used as the representative row. The table keeps an `Events` count to show how many raw observations were folded into the displayed Port Call.
