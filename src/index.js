import { scrape } from './scrape.js';
import { appendNew } from './csv.js';
import { generateDashboard } from './dashboard.js';

const events = await scrape();
console.log(`Scraped ${events.length} events`);

const added = appendNew(events);
console.log(`Added ${added} new rows`);

generateDashboard();
console.log('Dashboard generated');
