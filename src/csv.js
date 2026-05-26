import { readFileSync, writeFileSync, existsSync } from 'fs';

export const CSV_PATH = 'data/port_calls.csv';

const COLUMNS = [
  'voyage_code', 'service', 'operation', 'vessel',
  'eta', 'etd', 'terminal_cut_off', 'etb', 'ata', 'atd',
  'agency', 'remarks', 'section', 'scraped_at',
];

const HEADER = COLUMNS.join(',');

function escape(val) {
  const s = String(val ?? '');
  return s.includes(',') ? `"${s.replace(/"/g, '""')}"` : s;
}

function toLine(row) {
  return COLUMNS.map((col) => escape(row[col])).join(',');
}

function parseLine(line) {
  // Simple CSV parse — handles quoted fields
  const values = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      values.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  values.push(cur);
  return Object.fromEntries(COLUMNS.map((col, i) => [col, values[i] ?? '']));
}

function loadRows() {
  if (!existsSync(CSV_PATH)) return [];
  const lines = readFileSync(CSV_PATH, 'utf8').trim().split('\n');
  return lines.slice(1).filter(Boolean).map(parseLine);
}

export function getExistingKeys() {
  return new Set(loadRows().map((r) => `${r.voyage_code}|${r.eta}|${r.section}`));
}

export function appendNew(events) {
  const existing = getExistingKeys();
  const newRows = events.filter(
    (e) => e.voyage_code && !existing.has(`${e.voyage_code}|${e.eta}|${e.section}`)
  );

  if (newRows.length === 0) return 0;

  if (!existsSync(CSV_PATH)) {
    writeFileSync(CSV_PATH, HEADER + '\n');
  }

  const content = readFileSync(CSV_PATH, 'utf8');
  const lines = newRows.map(toLine).join('\n');
  const separator = content.endsWith('\n') ? '' : '\n';
  writeFileSync(CSV_PATH, content + separator + lines + '\n');

  return newRows.length;
}

export function readAll() {
  return loadRows();
}
