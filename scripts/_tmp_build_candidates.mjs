import fs from 'fs';

const DIR = '/Users/brianderario/.claude/projects/-Users-brianderario/1961655b-1858-436e-b761-b4029e8c28a9/tool-results';
const KERRIOS = '/Users/brianderario/Documents/Documents - Brian\'s MacBook Air/KerriOS';

// timestamp -> {lane, source}
const FILES = {
  '1780114600550': { lane: 'lookalike', source: 'icp:contract-manufacturing' },
  '1780114603170': { lane: 'conference', source: 'icp:pcb' },
  '1780114605270': { lane: 'conference', source: 'icp:semiconductor' },
  '1780114607480': { lane: 'conference', source: 'icp:robotics' },
  '1780114637534': { lane: 'conference', source: 'icp:industrial-automation' },
  '1780114640172': { lane: 'conference', source: 'icp:battery' },
  '1780114641937': { lane: 'conference', source: 'icp:embedded' },
  '1780114644402': { lane: 'conference', source: 'icp:additive-manufacturing' },
  '1780114647060': { lane: 'software-to-mfg', source: 'icp:plm' },
  '1780114648827': { lane: 'software-to-mfg', source: 'icp:cad-eda' },
  '1780114652328': { lane: 'software-to-mfg', source: 'icp:mes' },
  '1780114653421': { lane: 'software-to-mfg', source: 'icp:simulation-cae' },
};

// Load companies.json for dedup
const companies = JSON.parse(fs.readFileSync(`${KERRIOS}/data/companies.json`, 'utf8'));
const custDomains = new Set();
const custNames = new Set();
for (const [dom, c] of Object.entries(companies.companies)) {
  custDomains.add(dom.toLowerCase());
  for (const a of (c.aliases || [])) custDomains.add(a.toLowerCase());
  custNames.add((c.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''));
}

// Roster seed names (Kinetic 2026 sponsors) for dedup + lookalike marking
const rosterNames = ['advanced pcb','allspice','array labs','astranis','bananaz.ai','bc devices','circuit.ly','colab software','colab','colare','component ai','cosmon','dirac','drafter','eight sleep','embedded ventures','zoo.dev','fictiv','first resonance','flow engineering','hestus','kipo','pcbnet','ptc','synera'];
const rosterNorm = new Set(rosterNames.map(n => n.replace(/[^a-z0-9]/g,'')));

function rootDomain(d) {
  if (!d) return null;
  d = d.toLowerCase().trim().replace(/^www\./,'');
  return d;
}

const byDomain = new Map();

for (const [ts, meta] of Object.entries(FILES)) {
  const path = `${DIR}/mcp-574942fb-ccac-4d90-bab7-b5cf9d9873d0-apollo_mixed_companies_search-${ts}.txt`;
  if (!fs.existsSync(path)) { console.error('MISSING', ts); continue; }
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  for (const o of (data.organizations || [])) {
    const dom = rootDomain(o.primary_domain);
    if (!dom) continue;
    const nameNorm = (o.name || '').toLowerCase().replace(/[^a-z0-9]/g,'');
    // dedup vs customers
    if (custDomains.has(dom)) continue;
    if (custNames.has(nameNorm)) continue;
    // dedup vs roster seeds (they're already sponsors/customers)
    if (rosterNorm.has(nameNorm)) continue;
    // skip obvious non-US giant / media (heuristic: name contains 'engineering' magazine etc handled later)
    if (!byDomain.has(dom)) {
      byDomain.set(dom, {
        name: o.name,
        domain: dom,
        orgId: o.id,
        founded: o.founded_year || null,
        revenue: o.organization_revenue || null,
        ticker: o.publicly_traded_symbol || null,
        linkedin: o.linkedin_url || null,
        hc6: o.organization_headcount_six_month_growth ?? null,
        hc12: o.organization_headcount_twelve_month_growth ?? null,
        lanes: new Set([meta.lane]),
        sources: new Set([meta.source]),
      });
    } else {
      const e = byDomain.get(dom);
      e.lanes.add(meta.lane);
      e.sources.add(meta.source);
    }
  }
}

const out = [...byDomain.values()].map(e => ({
  ...e,
  lanes: [...e.lanes],
  sources: [...e.sources],
}));

fs.writeFileSync(`${KERRIOS}/data/lead-research/_tmp_candidates.json`, JSON.stringify(out, null, 2));
console.log('Total unique candidate companies (post customer-dedup):', out.length);
const byLane = {};
for (const c of out) for (const l of c.lanes) byLane[l] = (byLane[l]||0)+1;
console.log('By lane (a company can span lanes):', byLane);
console.log('Publicly traded (will penalize if huge):', out.filter(c=>c.ticker).length);
