import fs from 'fs';
const DIR='/Users/brianderario/.claude/projects/-Users-brianderario/1961655b-1858-436e-b761-b4029e8c28a9/tool-results';
const files=fs.readdirSync(DIR).filter(f=>f.includes('apollo_people_bulk_match'));
let credits=0; const byId={};
for(const f of files){
  let d=JSON.parse(fs.readFileSync(`${DIR}/${f}`,'utf8'));
  // some persisted as [{type:text,text:"..."}]
  if(Array.isArray(d)&&d[0]&&d[0].text) d=JSON.parse(d[0].text);
  credits+=(d.credits_consumed||0);
  for(const m of (d.matches||[])){
    if(!m||!m.id) continue;
    byId[m.id]={name:m.name, first:m.first_name, last:m.last_name, email:m.email||null,
      email_status:m.email_status||null, title:m.title, linkedin:m.linkedin_url||null,
      org:m.organization_name||(m.organization&&m.organization.name)||null};
  }
}
fs.writeFileSync('./data/lead-research/_tmp_emails.json', JSON.stringify(byId,null,2));
const ids=Object.keys(byId);
const withEmail=ids.filter(i=>byId[i].email);
console.log('files:',files.length,'credits_consumed_total:',credits);
console.log('matched people:',ids.length,'with email:',withEmail.length,'no email:',ids.length-withEmail.length);
