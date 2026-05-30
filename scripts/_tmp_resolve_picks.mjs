import fs from 'fs';
const K='/Users/brianderario/Documents/Documents - Brian\'s MacBook Air/KerriOS';
const norm=s=>(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const idx=JSON.parse(fs.readFileSync(`${K}/data/lead-research/_tmp_idxnorm.json`,'utf8')); // normname -> target {domain,orgId,lanes,sources,founded,revenue,ticker,linkedin,name,hc6}
const picks=JSON.parse(fs.readFileSync(`${K}/data/lead-research/_tmp_picks.json`,'utf8'));
const companies=JSON.parse(fs.readFileSync(`${K}/data/companies.json`,'utf8'));

// customer dedup sets
const custDom=new Set(); const custName=new Set();
for(const [d,c] of Object.entries(companies.companies)){custDom.add(d.toLowerCase());(c.aliases||[]).forEach(a=>custDom.add(a.toLowerCase()));custName.add(norm(c.name));}

// Manual org->domain fixes for picks whose org name doesn't normalize to a target
const FIX={
  'planettogether':'planettogether.com',
};

// title priority
function tpri(t){t=(t||'').toLowerCase();
  if(/\bcmo\b|chief marketing/.test(t))return 100;
  if(/(vp|vice president).*(marketing)/.test(t)||/(svp|evp).*marketing/.test(t))return 95;
  if(/head of (marketing|growth|brand|demand)/.test(t))return 90;
  if(/(director).*(marketing)/.test(t)||/marketing director/.test(t))return 80;
  if(/head of growth|head of brand/.test(t))return 85;
  if(/(founder|ceo|chief executive|president)/.test(t))return 70;
  if(/marketing/.test(t))return 60;
  return 40;
}

const byDomain=new Map(); // domain -> best pick (resolved)
const skipped=[];
for(const p of picks){
  if(p.title==='skip'||p.org==='skipme')continue;
  const key=norm(p.org);
  let tgt=idx[key];
  let domain=tgt?tgt.domain:FIX[key];
  if(!domain){skipped.push({...p,reason:'no-domain-match'});continue;}
  // customer dedup
  if(custDom.has(domain)||custName.has(key)){skipped.push({...p,reason:'existing-customer'});continue;}
  const rec={pid:p.pid,first:p.first,title:p.title,company:p.org,domain,
    orgId:tgt?tgt.orgId:null, lanes:tgt?tgt.lanes:['conference'], sources:tgt?tgt.sources:['icp:unknown'],
    founded:tgt?tgt.founded:null, revenue:tgt?tgt.revenue:null, ticker:tgt?tgt.ticker:null, linkedin:tgt?tgt.linkedin:null, hc6:tgt?tgt.hc6:null};
  const ex=byDomain.get(domain);
  if(!ex||tpri(p.title)>tpri(ex.title)) byDomain.set(domain,rec);
}
const resolved=[...byDomain.values()];
fs.writeFileSync(`${K}/data/lead-research/_tmp_resolved.json`, JSON.stringify(resolved,null,2));
console.log('picks:',picks.length,'resolved unique companies:',resolved.length,'skipped:',skipped.length);
console.log('skip reasons:', skipped.map(s=>s.org+':'+s.reason).join(' | ')||'none');
// emit bulk_match batches of 10 (need first_name + domain; we lack last name, but bulk_match can match on first_name+domain+org)
const dm=resolved.map(r=>({id:r.pid, first_name:r.first, domain:r.domain, organization_name:r.company}));
const batches=[];for(let i=0;i<dm.length;i+=10)batches.push(dm.slice(i,i+10));
fs.writeFileSync(`${K}/data/lead-research/_tmp_match_batches.json`, JSON.stringify(batches));
console.log('bulk-match batches:',batches.length);
