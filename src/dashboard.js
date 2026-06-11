import { writeFileSync } from 'fs';
import { readAll } from './csv.js';

export function generateDashboard() {
  const allRows = readAll().filter((r) => r.voyage_code && !/no results/i.test(r.voyage_code));
  allRows.sort((a, b) => b.scraped_at.localeCompare(a.scraped_at) || b.eta.localeCompare(a.eta));

  const updatedAt = new Date().toISOString().slice(0, 10);
  const sourceUrl = 'https://puertoantioquia.com.co/en/situacion';
  const json = JSON.stringify(allRows);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Puerto Antioquia — Port Monitor</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #f8fafc; color: #1e293b; }
    header { background: #1e3a5f; color: #fff; padding: 1.25rem 2rem; display: flex; align-items: baseline; gap: 1.5rem; }
    header h1 { font-size: 1.2rem; font-weight: 600; }
    header p { font-size: .8rem; opacity: .6; }
    nav { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 0 2rem; display: flex; gap: 0; }
    .tab-btn { padding: .75rem 1.25rem; font-size: .875rem; font-weight: 500; border: none; background: none; cursor: pointer; color: #64748b; border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .tab-btn.active { color: #1e3a5f; border-bottom-color: #1e3a5f; }
    main { max-width: 1400px; margin: 0 auto; padding: 1.5rem 2rem; }
    .tab-panel { display: none; }
    .tab-panel.active { display: block; }

    /* History */
    .controls { display: flex; gap: .75rem; margin-bottom: 1rem; align-items: center; flex-wrap: wrap; }
    input[type=search] { border: 1px solid #cbd5e1; border-radius: 6px; padding: .45rem .75rem; font-size: .875rem; width: 240px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; font-size: .85rem; }
    th { background: #f1f5f9; text-align: left; padding: .65rem 1rem; font-weight: 600; font-size: .72rem; text-transform: uppercase; letter-spacing: .04em; color: #475569; border-bottom: 1px solid #e2e8f0; }
    th.sortable { cursor: pointer; user-select: none; white-space: nowrap; }
    th.sortable::after { content: '↕'; margin-left: .35rem; color: #94a3b8; font-size: .68rem; }
    th.sortable.sort-asc::after { content: '↑'; color: #1e3a5f; }
    th.sortable.sort-desc::after { content: '↓'; color: #1e3a5f; }
    td { padding: .6rem 1rem; border-bottom: 1px solid #f1f5f9; }
    tr:last-child td { border-bottom: none; }
    tbody tr:hover td { background: #f8fafc; }
    tr.hidden { display: none; }

    /* Stats */
    .cards { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: .85rem 1.25rem; min-width: 140px; }
    .card .num { font-size: 2rem; font-weight: 700; color: #1e3a5f; line-height: 1; }
    .card .lbl { font-size: .72rem; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin-top: .3rem; }
    .section-title { font-size: .9rem; font-weight: 600; color: #1e293b; margin: 1.5rem 0 .75rem; }
    .chart-wrap { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; overflow-x: auto; }
    .rank-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; font-size: .85rem; margin-bottom: 1.5rem; }
    .rank-table th { background: #f1f5f9; text-align: left; padding: .65rem 1rem; font-weight: 600; font-size: .72rem; text-transform: uppercase; letter-spacing: .04em; color: #475569; border-bottom: 1px solid #e2e8f0; }
    .rank-table td { padding: .6rem 1rem; border-bottom: 1px solid #f1f5f9; }
    .rank-table tr:last-child td { border-bottom: none; }
    .pill { display: inline-block; background: #e0f2fe; color: #0369a1; border-radius: 99px; padding: .15rem .6rem; font-size: .75rem; font-weight: 600; }
    .notice { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; border-radius: 8px; padding: .75rem 1rem; margin: .5rem 0 1rem; font-size: .875rem; line-height: 1.4; }
    .notice a { color: #92400e; font-weight: 700; }
  </style>
</head>
<body>
  <header>
    <h1>Puerto Antioquia — Port Monitor</h1>
    <p>Updated ${updatedAt}</p>
  </header>
  <nav>
    <button class="tab-btn active" data-tab="history">History</button>
    <button class="tab-btn" data-tab="stats">Statistics</button>
  </nav>
  <main>
    <div class="notice">
      ⚠️ This dashboard is a quick monitoring aid, not an official source. Please verify operational decisions against the original data on
      <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">Puerto Antioquia's site</a>.
    </div>

    <!-- HISTORY -->
    <div id="tab-history" class="tab-panel active">
      <div class="controls" style="margin-top:.5rem">
        <input type="search" id="search" placeholder="Search vessel or voyage…">
      </div>
      <table id="hist-table">
        <thead><tr>
          <th data-sort="text" data-key="section">Status</th><th data-sort="text" data-key="voyage_code">Voyage</th><th data-sort="text" data-key="service">Service</th><th data-sort="text" data-key="vessel">Vessel</th>
          <th data-sort="date" data-key="eta">ETA</th><th data-sort="date" data-key="etd">ETD</th><th data-sort="date" data-key="ata">ATA</th><th data-sort="date" data-key="atd">ATD</th>
          <th data-sort="text" data-key="agency">Agency</th><th data-sort="text" data-key="remarks">Remarks</th><th data-sort="date" data-key="scraped_at">Last seen</th><th data-sort="number" data-key="event_count">Events</th>
        </tr></thead>
        <tbody id="hist-body"></tbody>
      </table>
    </div>

    <!-- STATS -->
    <div id="tab-stats" class="tab-panel">
      <div class="cards" id="stat-cards" style="margin-top:.5rem"></div>
      <div class="section-title">Weekly activity by ETA (all statuses, unique port calls)</div>
      <div class="chart-wrap"><svg id="chart" height="180"></svg></div>
      <div class="section-title">Vessels by number of port calls</div>
      <table class="rank-table" id="vessel-table">
        <thead><tr><th data-sort="number">#</th><th data-sort="text">Vessel</th><th data-sort="number">Calls</th><th data-sort="text">Services</th></tr></thead>
        <tbody id="vessel-body"></tbody>
      </table>
      <div class="section-title">Voyages with multiple calls</div>
      <table class="rank-table" id="voyage-table">
        <thead><tr><th data-sort="number">#</th><th data-sort="text">Voyage</th><th data-sort="text">Vessel</th><th data-sort="number">Calls</th></tr></thead>
        <tbody id="voyage-body"></tbody>
      </table>
    </div>
  </main>

  <script>
    const DATA = ${json};

    // ── helpers ──────────────────────────────────────────────
    function parseDate(str) {
      if (!str) return null;
      const s = String(str).trim();
      const dmy = s.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})(?:\\s*-\\s*(\\d{1,2}):(\\d{2}))?/);
      if (dmy) {
        const hh = (dmy[4] ?? '0').padStart(2, '0');
        const mm = dmy[5] ?? '00';
        return new Date(\`\${dmy[3]}-\${dmy[2].padStart(2, '0')}-\${dmy[1].padStart(2, '0')}T\${hh}:\${mm}:00\`);
      }
      const iso = s.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);
      if (iso) return new Date(\`\${iso[1]}-\${iso[2]}-\${iso[3]}T00:00:00\`);
      return null;
    }

    function formatDateKey(date) {
      if (!date) return '';
      return \`\${date.getFullYear()}-\${String(date.getMonth() + 1).padStart(2, '0')}-\${String(date.getDate()).padStart(2, '0')}\`;
    }

    function etaDateKey(str) {
      return formatDateKey(parseDate(str)) || String(str ?? '').trim();
    }

    function isoWeek(date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
      const y = d.getFullYear();
      const w1 = new Date(y, 0, 4);
      const wn = 1 + Math.round(((d - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
      return \`\${y}-W\${String(wn).padStart(2,'0')}\`;
    }

    function esc(s) {
      return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    // ── tabs ─────────────────────────────────────────────────
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'stats') renderStats();
      });
    });

    function compareValues(a, b, type, dir) {
      let av = a ?? '';
      let bv = b ?? '';
      if (type === 'date') {
        av = parseDate(av)?.getTime() ?? -Infinity;
        bv = parseDate(bv)?.getTime() ?? -Infinity;
      } else if (type === 'number') {
        av = Number(String(av).replace(/[^0-9.-]/g, '')) || 0;
        bv = Number(String(bv).replace(/[^0-9.-]/g, '')) || 0;
      } else {
        av = String(av).toLocaleLowerCase();
        bv = String(bv).toLocaleLowerCase();
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    }

    function initDomTableSort(table) {
      const ths = [...table.querySelectorAll('thead th[data-sort]')];
      ths.forEach((th, index) => {
        th.classList.add('sortable');
        th.addEventListener('click', () => {
          const dir = th.classList.contains('sort-asc') ? -1 : 1;
          ths.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
          th.classList.add(dir === 1 ? 'sort-asc' : 'sort-desc');
          const rows = [...table.tBodies[0].rows];
          rows.sort((ra, rb) => compareValues(ra.cells[index]?.textContent, rb.cells[index]?.textContent, th.dataset.sort, dir));
          rows.forEach(row => table.tBodies[0].appendChild(row));
        });
      });
    }

    // ── port call summaries ──────────────────────────────────
    const STATUS_RANK = { announced: 1, berthed: 2, departed: 3 };

    function statusRank(section) {
      return STATUS_RANK[section] ?? 0;
    }

    function portCallKey(r) {
      return [r.voyage_code, r.vessel, etaDateKey(r.eta)].join('|');
    }

    function shouldUseAsRepresentative(current, candidate) {
      const rankDiff = statusRank(candidate.section) - statusRank(current.section);
      if (rankDiff !== 0) return rankDiff > 0;
      return compareValues(candidate.scraped_at, current.scraped_at, 'date', 1) > 0;
    }

    function summarizePortCalls(events) {
      const groups = new Map();
      events.forEach(event => {
        const key = portCallKey(event);
        const existing = groups.get(key);
        if (!existing) {
          groups.set(key, { ...event, first_seen: event.scraped_at, last_seen: event.scraped_at, event_count: 1 });
          return;
        }

        const firstSeen = compareValues(event.scraped_at, existing.first_seen, 'date', 1) < 0 ? event.scraped_at : existing.first_seen;
        const lastSeen = compareValues(event.scraped_at, existing.last_seen, 'date', 1) > 0 ? event.scraped_at : existing.last_seen;
        const eventCount = existing.event_count + 1;
        const representative = shouldUseAsRepresentative(existing, event) ? { ...existing, ...event } : existing;
        groups.set(key, { ...representative, first_seen: firstSeen, last_seen: lastSeen, scraped_at: lastSeen, event_count: eventCount });
      });
      return [...groups.values()];
    }

    const PORT_CALLS = summarizePortCalls(DATA);

    // ── history tab ──────────────────────────────────────────
    const histBody = document.getElementById('hist-body');
    const searchInput = document.getElementById('search');
    let historySort = { key: 'scraped_at', type: 'date', dir: -1 };

    function renderHistory() {
      const q = searchInput.value.toLowerCase();
      const rows = [...PORT_CALLS]
        .filter(r => !q || Object.values(r).join(' ').toLowerCase().includes(q))
        .sort((a, b) => compareValues(a[historySort.key], b[historySort.key], historySort.type, historySort.dir));
      histBody.innerHTML = rows.map(r => \`<tr>
        <td>\${esc(r.section)}</td>
        <td>\${esc(r.voyage_code)}</td>
        <td>\${esc(r.service)}</td>
        <td style="font-weight:600">\${esc(r.vessel)}</td>
        <td>\${esc(r.eta)}</td>
        <td>\${esc(r.etd)}</td>
        <td>\${esc(r.ata)}</td>
        <td>\${esc(r.atd)}</td>
        <td>\${esc(r.agency)}</td>
        <td>\${esc(r.remarks)}</td>
        <td>\${esc(r.scraped_at)}</td>
        <td>\${esc(r.event_count)}</td>
      </tr>\`).join('');
    }

    document.querySelectorAll('#hist-table th[data-key]').forEach(th => {
      th.classList.add('sortable');
      if (th.dataset.key === historySort.key) th.classList.add('sort-desc');
      th.addEventListener('click', () => {
        const sameColumn = historySort.key === th.dataset.key;
        historySort = { key: th.dataset.key, type: th.dataset.sort, dir: sameColumn ? -historySort.dir : 1 };
        document.querySelectorAll('#hist-table th').forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
        th.classList.add(historySort.dir === 1 ? 'sort-asc' : 'sort-desc');
        renderHistory();
      });
    });

    searchInput.addEventListener('input', renderHistory);
    renderHistory();

    // ── stats tab (lazy render) ───────────────────────────────
    let statsRendered = false;
    function renderStats() {
      if (statsRendered) return;
      statsRendered = true;

      const totalEvents = DATA.length;
      const announced = PORT_CALLS.filter(r => r.section === 'announced');
      const berthed = PORT_CALLS.filter(r => r.section === 'berthed');
      const departed = PORT_CALLS.filter(r => r.section === 'departed');
      const vessels = new Set(PORT_CALLS.map(r => r.vessel).filter(Boolean));
      const voyages = new Set(PORT_CALLS.map(r => r.voyage_code).filter(Boolean));

      document.getElementById('stat-cards').innerHTML = [
        [PORT_CALLS.length, 'Port calls shown'],
        [totalEvents, 'Observed events'],
        [announced.length, 'Announced'],
        [berthed.length, 'Berthed'],
        [departed.length, 'Departed'],
        [vessels.size, 'Unique vessels'],
        [voyages.size, 'Unique voyage codes'],
      ].map(([n, l]) => \`<div class="card"><div class="num">\${n}</div><div class="lbl">\${l}</div></div>\`).join('');

      // weekly chart: summarized port calls, using the latest known ETA date in each group
      const weekMap = {};
      PORT_CALLS.forEach(r => {
        const d = parseDate(r.eta);
        if (!d) return;
        const w = isoWeek(d);
        weekMap[w] = (weekMap[w] ?? 0) + 1;
      });
      const weeks = Object.keys(weekMap).sort();
      const counts = weeks.map(w => weekMap[w]);
      renderChart(weeks, counts);

      // vessel ranking
      const vesselMap = {};
      PORT_CALLS.forEach(r => {
        if (!r.vessel) return;
        if (!vesselMap[r.vessel]) vesselMap[r.vessel] = { calls: 0, services: new Set() };
        vesselMap[r.vessel].calls++;
        vesselMap[r.vessel].services.add(r.service);
      });
      const vesselRank = Object.entries(vesselMap)
        .sort((a, b) => b[1].calls - a[1].calls || a[0].localeCompare(b[0]));
      document.getElementById('vessel-body').innerHTML = vesselRank.map(([name, d], i) => \`<tr>
        <td style="color:#94a3b8">\${i + 1}</td>
        <td style="font-weight:600">\${esc(name)}</td>
        <td><span class="pill">\${d.calls}</span></td>
        <td style="font-size:.8rem;color:#64748b">\${[...d.services].join(', ')}</td>
      </tr>\`).join('');

      // voyage ranking (multi-call only)
      const voyageMap = {};
      PORT_CALLS.forEach(r => {
        if (!voyageMap[r.voyage_code]) voyageMap[r.voyage_code] = { calls: 0, vessels: new Set() };
        voyageMap[r.voyage_code].calls++;
        if (r.vessel) voyageMap[r.voyage_code].vessels.add(r.vessel);
      });
      const voyageRank = Object.entries(voyageMap)
        .filter(([, d]) => d.calls > 1)
        .sort((a, b) => b[1].calls - a[1].calls || a[0].localeCompare(b[0]));
      const voyageBody = document.getElementById('voyage-body');
      if (voyageRank.length === 0) {
        voyageBody.innerHTML = '<tr><td colspan="4" style="color:#94a3b8;text-align:center;padding:1.5rem">No voyage with multiple calls yet</td></tr>';
      } else {
        voyageBody.innerHTML = voyageRank.map(([code, d], i) => \`<tr>
          <td style="color:#94a3b8">\${i + 1}</td>
          <td>\${esc(code)}</td>
          <td style="font-weight:600">\${esc([...d.vessels].join(', '))}</td>
          <td><span class="pill">\${d.calls}</span></td>
        </tr>\`).join('');
      }

      initDomTableSort(document.getElementById('vessel-table'));
      initDomTableSort(document.getElementById('voyage-table'));
    }

    function renderChart(weeks, counts) {
      const svg = document.getElementById('chart');
      const W = Math.max(svg.parentElement.clientWidth - 40, Math.max(weeks.length, 1) * 36);
      const H = 180;
      const pad = { top: 10, right: 10, bottom: 40, left: 32 };
      const chartW = W - pad.left - pad.right;
      const chartH = H - pad.top - pad.bottom;
      const max = Math.max(...counts, 1);
      const barW = Math.max(Math.floor(chartW / Math.max(weeks.length, 1)) - 4, 4);

      svg.setAttribute('width', W);
      svg.setAttribute('viewBox', \`0 0 \${W} \${H}\`);

      let out = \`<g transform="translate(\${pad.left},\${pad.top})">\`;

      // y gridlines
      const steps = 4;
      for (let i = 0; i <= steps; i++) {
        const y = chartH - (i / steps) * chartH;
        const val = Math.round((i / steps) * max);
        out += \`<line x1="0" y1="\${y}" x2="\${chartW}" y2="\${y}" stroke="#e2e8f0" stroke-width="1"/>\`;
        out += \`<text x="-4" y="\${y + 4}" text-anchor="end" font-size="10" fill="#94a3b8">\${val}</text>\`;
      }

      // bars + x labels
      weeks.forEach((w, i) => {
        const x = i * (chartW / Math.max(weeks.length, 1)) + (chartW / Math.max(weeks.length, 1) - barW) / 2;
        const barH = (counts[i] / max) * chartH;
        const y = chartH - barH;
        out += \`<rect x="\${x}" y="\${y}" width="\${barW}" height="\${barH}" fill="#3b82f6" rx="2" opacity=".85">
          <title>\${w}: \${counts[i]} port calls</title></rect>\`;
        if (weeks.length <= 24 || i % 2 === 0) {
          const label = w.replace(/^\\d{4}-/, '');
          out += \`<text x="\${x + barW / 2}" y="\${chartH + 16}" text-anchor="middle" font-size="9" fill="#94a3b8" transform="rotate(-35,\${x + barW / 2},\${chartH + 16})">\${label}</text>\`;
        }
      });

      out += '</g>';
      svg.innerHTML = out;
    }
  </script>
</body>
</html>`;

  writeFileSync('index.html', html);
}
