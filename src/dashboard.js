import { writeFileSync, mkdirSync } from 'fs';
import { readAll } from './csv.js';

const BADGE = {
  announced: 'background:#3b82f6;color:#fff',
  berthed: 'background:#f59e0b;color:#fff',
  departed: 'background:#10b981;color:#fff',
};

export function generateDashboard() {
  const rows = readAll();
  rows.sort((a, b) => b.eta.localeCompare(a.eta));

  const counts = { announced: 0, berthed: 0, departed: 0 };
  for (const r of rows) counts[r.section] = (counts[r.section] ?? 0) + 1;

  const tableRows = rows
    .map(
      (r) => `<tr data-section="${r.section}">
      <td>${r.voyage_code}</td>
      <td>${r.vessel}</td>
      <td><span class="badge" style="${BADGE[r.section]}">${r.section}</span></td>
      <td>${r.eta}</td>
      <td>${r.atd || '—'}</td>
      <td>${r.agency}</td>
      <td>${r.scraped_at}</td>
    </tr>`
    )
    .join('\n');

  const updatedAt = new Date().toISOString().slice(0, 10);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Puerto Antioquia — Port Monitor</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #f8fafc; color: #1e293b; }
    header { background: #1e3a5f; color: #fff; padding: 1.25rem 2rem; }
    header h1 { font-size: 1.25rem; font-weight: 600; }
    header p { font-size: .8rem; opacity: .7; margin-top: .2rem; }
    main { max-width: 1400px; margin: 0 auto; padding: 1.5rem 2rem; }
    .stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .stat { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: .75rem 1.25rem; flex: 1; }
    .stat .num { font-size: 1.75rem; font-weight: 700; }
    .stat .lbl { font-size: .75rem; color: #64748b; text-transform: uppercase; letter-spacing: .05em; }
    .controls { display: flex; gap: .75rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center; }
    input[type=search] { border: 1px solid #cbd5e1; border-radius: 6px; padding: .45rem .75rem; font-size: .875rem; width: 220px; }
    .filter-btn { border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; padding: .4rem .9rem; font-size: .8rem; cursor: pointer; }
    .filter-btn.active { background: #1e3a5f; color: #fff; border-color: #1e3a5f; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; font-size: .85rem; }
    th { background: #f1f5f9; text-align: left; padding: .65rem 1rem; font-weight: 600; font-size: .75rem; text-transform: uppercase; letter-spacing: .04em; color: #475569; border-bottom: 1px solid #e2e8f0; }
    td { padding: .6rem 1rem; border-bottom: 1px solid #f1f5f9; }
    tr:last-child td { border-bottom: none; }
    tr[data-section]:hover td { background: #f8fafc; }
    .badge { display: inline-block; padding: .2rem .55rem; border-radius: 4px; font-size: .72rem; font-weight: 600; text-transform: uppercase; }
    tr.hidden { display: none; }
  </style>
</head>
<body>
  <header>
    <h1>Puerto Antioquia — Port Monitor</h1>
    <p>Last updated: ${updatedAt} · ${rows.length} events recorded</p>
  </header>
  <main>
    <div class="stats">
      <div class="stat"><div class="num" style="color:#3b82f6">${counts.announced}</div><div class="lbl">Announced</div></div>
      <div class="stat"><div class="num" style="color:#f59e0b">${counts.berthed}</div><div class="lbl">Berthed</div></div>
      <div class="stat"><div class="num" style="color:#10b981">${counts.departed}</div><div class="lbl">Departed</div></div>
    </div>
    <div class="controls">
      <input type="search" id="search" placeholder="Search vessel or voyage…">
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="announced">Announced</button>
      <button class="filter-btn" data-filter="berthed">Berthed</button>
      <button class="filter-btn" data-filter="departed">Departed</button>
    </div>
    <table id="table">
      <thead><tr>
        <th>Voyage</th><th>Vessel</th><th>Section</th>
        <th>ETA</th><th>ATD</th><th>Agency</th><th>Captured</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </main>
  <script>
    const rows = Array.from(document.querySelectorAll('#table tbody tr'));
    let activeFilter = 'all';

    function applyFilters() {
      const q = document.getElementById('search').value.toLowerCase();
      for (const row of rows) {
        const matchSection = activeFilter === 'all' || row.dataset.section === activeFilter;
        const matchSearch = !q || row.textContent.toLowerCase().includes(q);
        row.classList.toggle('hidden', !(matchSection && matchSearch));
      }
    }

    document.getElementById('search').addEventListener('input', applyFilters);

    for (const btn of document.querySelectorAll('.filter-btn')) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        applyFilters();
      });
    }
  </script>
</body>
</html>`;

  mkdirSync('public', { recursive: true });
  writeFileSync('public/index.html', html);
}
