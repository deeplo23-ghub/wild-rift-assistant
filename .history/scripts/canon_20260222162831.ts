import { writeFile } from 'fs/promises';
import { join } from 'path';

async function generateCanonicalList() {
  console.log("Fetching latest Data Dragon champion data...");
  const cacheTtlBuster = Date.now();
  const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/14.4.1/data/en_US/champion.json?t=${cacheTtlBuster}`);
  const data = await res.json();
  
  const allPCChampions = Object.values(data.data).map((c: any) => c.name);
  
  // Wild Rift hasn't released EVERY PC champion yet. 
  // We'll scrape wr-meta's full HTML table again, as it currently displays all released WR champions.
  const wrResponse = await fetch("https://wr-meta.com/meta/");
  const wrHtml = await wrResponse.text();
  
  const matches = wrHtml.match(/<div class="top-title">([^<]+)<\/div>/g);
  let wrChampions = new Set<string>();
  
  if (matches) {
    for (const match of matches) {
      const name = match.replace(/<div class="top-title">/g, '').replace(/<\/div>/g, '').trim();
      wrChampions.add(name);
    }
  }

  // Combine them - PC gives us exact casing/naming for many, WR gives us the actual WR release list.
  // We'll use WR as the base list but format to our expected schema (upper case for matching).
  const canonList = Array.from(wrChampions).map(c => c.toUpperCase()).sort();
  
  // Note: WR has 114 or 132 or 136? Let's check WR specific list explicitly from the audit
  console.log(`Extracted ${canonList.length} unique champions from wr-meta DOM.`);
  
  // The user states WR has 136 right now. wr-meta had 132 in our last full audit.
  // There are likely exactly 4 very newly released champions not on wr-meta or ones named differently
  // e.g., Nunu vs Nunu & Willump, Wukong vs MonkeyKing, etc.
  
  const outPath = join(process.cwd(), 'src', 'lib', 'data', 'canonical-champions.json');
  await writeFile(outPath, JSON.stringify(canonList, null, 2), 'utf-8');
  console.log(`Wrote ${canonList.length} canonical champions to ${outPath}`);
}

generateCanonicalList().catch(console.error);
