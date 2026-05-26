import { writeFileSync } from 'fs';
import { readAll } from './csv.js';

export function generateDashboard() {
  const allRows = readAll();
  const departed = allRows.filter((r) => r.section === 'departed');
  departed.sort((a, b) => b.eta.localeCompare(a.eta));

  const updatedAt = new Date().toISOString().slice(0, 10);
  const json = JSON.stringify(departed);

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
    <!-- HISTORY -->
    <div id="tab-history" class="tab-panel active">
      <div class="controls" style="margin-top:.5rem">
        <input type="search" id="search" placeholder="Search vessel or voyage…">
      </div>
      <table id="hist-table">
        <thead><tr>
          <th>Voyage</th><th>Service</th><th>Vessel</th>
          <th>ETA</th><th>ETD</th><th>ATA</th><th>ATD</th>
          <th>Agency</th><th>Remarks</th><th>Captured</th>
        </tr></thead>
        <tbody id="hist-body"></tbody>
      </table>
    </div>

    <!-- STATS -->
    <div id="tab-stats" class="tab-panel">
      <div class="cards" id="stat-cards" style="margin-top:.5rem"></div>
      <div class="section-title">Weekly activity (departed vessels)</div>
      <div class="chart-wrap"><svg id="chart" height="180"></svg></div>
      <div class="section-title">Vessels by number of port calls</div>
      <table class="rank-table" id="vessel-table">
        <thead><tr><th>#</th><th>Vessel</th><th>Calls</th><th>Services</th></tr></thead>
        <tbody id="vessel-body"></tbody>
      </table>
      <div class="section-title">Voyages with multiple calls</div>
      <table class="rank-table" id="voyage-table">
        <thead><tr><th>#</th><th>Voyage</th><th>Vessel</th><th>Calls</th></tr></thead>
        <tbody id="voyage-body"></tbody>
      </table>
    </div>
  </main>

  <script>
    const DATA = ${json};

    // ── helpers ──────────────────────────────────────────────
    function parseDate(str) {
      if (!str) return null;
      const m = str.match(/(\\d{2})\\/(\\d{2})\\/(\\d{4})/);
      return m ? new Date(\`\${m[3]}-\${m[2]}-\${m[1]}\`) : null;
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

    // ── history tab ──────────────────────────────────────────
    const histBody = document.getElementById('hist-body');
    histBody.innerHTML = DATA.map(r => \`<tr>
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
    </tr>\`).join('');

    document.getElementById('search').addEventListener('input', function() {
      const q = this.value.toLowerCase();
      histBody.querySelectorAll('tr').forEach(row => {
        row.classList.toggle('hidden', q && !row.textContent.toLowerCase().includes(q));
      });
    });

    // ── stats tab (lazy render) ───────────────────────────────
    let statsRendered = false;
    function renderStats() {
      if (statsRendered) return;
      statsRendered = true;

      const total = DATA.length;
      const vessels = new Set(DATA.map(r => r.vessel));
      const voyages = new Set(DATA.map(r => r.voyage_code));

      document.getElementById('stat-cards').innerHTML = [
        [total, 'Total port calls'],
        [vessels.size, 'Unique vessels'],
        [voyages.size, 'Unique voyage codes'],
      ].map(([n, l]) => \`<div class="card"><div class="num">\${n}</div><div class="lbl">\${l}</div></div>\`).join('');

      // weekly chart
      const weekMap = {};
      DATA.forEach(r => {
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
      DATA.forEach(r => {
        if (!vesselMap[r.vessel]) vesselMap[r.vessel] = { calls: 0, services: new Set() };
        vesselMap[r.vessel].calls++;
        vesselMap[r.vessel].services.add(r.service);
      });
      const vesselRank = Object.entries(vesselMap)
        .sort((a, b) => b[1].calls - a[1].calls);
      document.getElementById('vessel-body').innerHTML = vesselRank.map(([name, d], i) => \`<tr>
        <td style="color:#94a3b8">\${i + 1}</td>
        <td style="font-weight:600">\${esc(name)}</td>
        <td><span class="pill">\${d.calls}</span></td>
        <td style="font-size:.8rem;color:#64748b">\${[...d.services].join(', ')}</td>
      </tr>\`).join('');

      // voyage ranking (multi-call only)
      const voyageMap = {};
      DATA.forEach(r => {
        if (!voyageMap[r.voyage_code]) voyageMap[r.voyage_code] = { calls: 0, vessel: r.vessel };
        voyageMap[r.voyage_code].calls++;
      });
      const voyageRank = Object.entries(voyageMap)
        .filter(([, d]) => d.calls > 1)
        .sort((a, b) => b[1].calls - a[1].calls);
      const voyageBody = document.getElementById('voyage-body');
      if (voyageRank.length === 0) {
        voyageBody.innerHTML = '<tr><td colspan="4" style="color:#94a3b8;text-align:center;padding:1.5rem">No voyage with multiple calls yet</td></tr>';
      } else {
        voyageBody.innerHTML = voyageRank.map(([code, d], i) => \`<tr>
          <td style="color:#94a3b8">\${i + 1}</td>
          <td>\${esc(code)}</td>
          <td style="font-weight:600">\${esc(d.vessel)}</td>
          <td><span class="pill">\${d.calls}</span></td>
        </tr>\`).join('');
      }
    }

    function renderChart(weeks, counts) {
      const svg = document.getElementById('chart');
      const W = Math.max(svg.parentElement.clientWidth - 40, weeks.length * 36);
      const H = 180;
      const pad = { top: 10, right: 10, bottom: 40, left: 32 };
      const chartW = W - pad.left - pad.right;
      const chartH = H - pad.top - pad.bottom;
      const max = Math.max(...counts, 1);
      const barW = Math.max(Math.floor(chartW / weeks.length) - 4, 4);

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
        const x = i * (chartW / weeks.length) + (chartW / weeks.length - barW) / 2;
        const barH = (counts[i] / max) * chartH;
        const y = chartH - barH;
        out += \`<rect x="\${x}" y="\${y}" width="\${barW}" height="\${barH}" fill="#3b82f6" rx="2" opacity=".85">
          <title>\${w}: \${counts[i]} vessels</title></rect>\`;
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
