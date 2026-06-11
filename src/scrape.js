import * as cheerio from 'cheerio';

const URL = 'https://puertoantioquia.com.co/en/situacion';

const SECTIONS = {
  anunciados: 'announced',
  atracados: 'berthed',
  zarpados: 'departed',
};

export async function scrape() {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${URL}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const scrapedAt = new Date().toISOString().slice(0, 10);
  const events = [];

  for (const [cls, section] of Object.entries(SECTIONS)) {
    const card = $(`.port-card-header.${cls}`).closest('.port-card');
    card.find('tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      const get = (i) => $(cells[i]).text().trim();
      const voyageCode = get(0);
      if (!voyageCode || /no results/i.test(voyageCode)) return;

      events.push({
        voyage_code: voyageCode,
        service: get(1),
        operation: get(2),
        vessel: get(3),
        eta: get(4),
        etd: get(5),
        terminal_cut_off: get(6),
        etb: get(7),
        ata: get(8),
        atd: get(9),
        agency: get(10),
        remarks: get(11),
        section,
        scraped_at: scrapedAt,
      });
    });
  }

  return events;
}
