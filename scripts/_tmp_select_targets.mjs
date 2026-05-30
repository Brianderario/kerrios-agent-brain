import fs from 'fs';
const KERRIOS = '/Users/brianderario/Documents/Documents - Brian\'s MacBook Air/KerriOS';
const cands = JSON.parse(fs.readFileSync(`${KERRIOS}/data/lead-research/_tmp_candidates.json`,'utf8'));

// Drop obvious media/info-only or non-product orgs by name heuristic
const BAD = /(magazine|news|media group|consult|staffing|recruit|university|college|\bllc directory\b|associates|chamber|\bblog\b|wikipedia|review|\.org$)/i;
// keep .org if it's a robotics/standards body? we'll just lightly penalize, not drop, except clear media
const filtered = cands.filter(c => {
  const n = (c.name||'');
  if (/magazine|news|\bmedia\b|\bblog\b|wikipedia|directory|recruit|staffing|chamber/i.test(n)) return false;
  return true;
});

// score-ish prelim for selection priority (full scoring happens at lead build)
function prelim(c){
  let s = 10;
  s += (c.sources.length-1)*20; // multi-source
  if (c.lanes.includes('lookalike')) s += 25;
  if (c.hc6 && c.hc6 > 0.05) s += 10; // growing -> likely hiring
  if (c.revenue && c.revenue > 200000000) s -= 10; // too big
  if (c.revenue && c.revenue < 1000000) s -= 5; // very small
  if (c.ticker) s -= 5;
  return s;
}
for (const c of filtered) c._p = prelim(c);

// Balance: take from each lane. Aim ~270 target companies.
const byLane = { lookalike:[], conference:[], 'software-to-mfg':[] };
for (const c of filtered) {
  // assign to its highest-priority single lane bucket for balancing
  const primary = c.lanes.includes('lookalike') ? 'lookalike'
    : c.lanes.includes('software-to-mfg') ? 'software-to-mfg' : 'conference';
  byLane[primary].push(c);
}
for (const k of Object.keys(byLane)) byLane[k].sort((a,b)=>b._p-a._p);

const TARGET = { lookalike: 70, conference: 120, 'software-to-mfg': 90 };
let picked = [];
for (const k of Object.keys(TARGET)) picked = picked.concat(byLane[k].slice(0, TARGET[k]));

// final dedup by domain
const seen = new Set(); const final = [];
for (const c of picked){ if(seen.has(c.domain))continue; seen.add(c.domain); final.push(c); }

fs.writeFileSync(`${KERRIOS}/data/lead-research/_tmp_targets.json`, JSON.stringify(final,null,2));
console.log('Filtered candidates:', filtered.length, '| Selected target companies:', final.length);
const lc={}; for(const c of final){const p=c.lanes.includes('lookalike')?'lookalike':c.lanes.includes('software-to-mfg')?'software-to-mfg':'conference';lc[p]=(lc[p]||0)+1;}
console.log('Selected by primary lane:', lc);
