import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url),"utf8").split(/\r?\n/).filter(l=>l.includes("=")&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,"")]}));
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
let users = [];
for (let page=1;;page++){
  const r = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=200`, {headers:H});
  if(!r.ok){ console.log("list fail", r.status); process.exit(1); }
  const j = await r.json(); users.push(...j.users); if(j.users.length<200) break;
}
console.log("users", users.length);
let ok=0, skip=0, fail=0;
for (const u of users){
  if(!u.email || !u.email.endsWith("@vbspu.com")){ skip++; continue; }
  const email = u.email.replace(/@vbspu\.com$/, "@vbspu.ac.in");
  const r = await fetch(`${url}/auth/v1/admin/users/${u.id}`, {method:"PUT", headers:H, body: JSON.stringify({email, email_confirm:true})});
  if(r.ok) ok++; else { fail++; console.log("fail", u.email, r.status, (await r.text()).slice(0,120)); }
}
console.log({ok, skip, fail});
