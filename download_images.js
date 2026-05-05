const { image_search } = require('duckduckgo-images-api');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // DuckDuckGo API uses an old axios, let's use global fetch

const denominations = [
  // MAD
  { query: 'billet 200 dirhams marocain', file: 'mad_200.jpg' },
  { query: 'billet 100 dirhams marocain', file: 'mad_100.jpg' },
  { query: 'billet 50 dirhams marocain', file: 'mad_50.jpg' },
  { query: 'billet 20 dirhams marocain', file: 'mad_20.jpg' },
  { query: 'piece 10 dirhams marocain', file: 'mad_10.jpg' },
  { query: 'piece 5 dirhams marocain', file: 'mad_5.jpg' },
  { query: 'piece 2 dirhams marocain', file: 'mad_2.jpg' },
  { query: 'piece 1 dirham marocain', file: 'mad_1.jpg' },
  { query: 'piece 0.5 dirham marocain', file: 'mad_0.5.jpg' },
  // USD
  { query: '100 dollar bill front', file: 'usd_100.jpg' },
  { query: '50 dollar bill front', file: 'usd_50.jpg' },
  { query: '20 dollar bill front', file: 'usd_20.jpg' },
  { query: '10 dollar bill front', file: 'usd_10.jpg' },
  { query: '5 dollar bill front', file: 'usd_5.jpg' },
  { query: '1 dollar bill front', file: 'usd_1.jpg' },
  // EUR
  { query: '500 euro banknote front', file: 'eur_500.jpg' },
  { query: '200 euro banknote front', file: 'eur_200.jpg' },
  { query: '100 euro banknote front', file: 'eur_100.jpg' },
  { query: '50 euro banknote front', file: 'eur_50.jpg' },
  { query: '20 euro banknote front', file: 'eur_20.jpg' },
  { query: '10 euro banknote front', file: 'eur_10.jpg' },
  { query: '5 euro banknote front', file: 'eur_5.jpg' },
  { query: '2 euro coin', file: 'eur_2.jpg' },
  { query: '1 euro coin', file: 'eur_1.jpg' }
];

const dir = path.join(__dirname, 'public', 'currency');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

async function download(url, dest) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`unexpected response ${res.statusText}`);
    const stream = fs.createWriteStream(dest);
    const body = await res.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(body));
    return true;
  } catch (e) {
    console.error(`Failed to download ${url}:`, e.message);
    return false;
  }
}

async function run() {
  for (const item of denominations) {
    console.log(`Searching for: ${item.query}`);
    try {
      const results = await image_search({ query: item.query, moderate: true });
      if (results && results.length > 0) {
        let success = false;
        for (let i = 0; i < Math.min(5, results.length); i++) {
          console.log(`  Trying to download: ${results[i].image}`);
          success = await download(results[i].image, path.join(dir, item.file));
          if (success) {
            console.log(`  Successfully downloaded ${item.file}`);
            break;
          }
        }
        if (!success) console.log(`  Failed to download any images for ${item.file}`);
      } else {
        console.log(`  No results found for ${item.query}`);
      }
    } catch (err) {
      console.error(`Error searching ${item.query}:`, err.message);
    }
  }
}

run();
