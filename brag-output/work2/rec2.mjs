import { chromium } from '/home/user/opice-new/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const B='http://localhost:8099';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:3, colorScheme:'dark' });
const page = await ctx.newPage();
await page.clock.install();
const vis=l=>l.filter({visible:true}).first();
const pill=l=>l==='Start lesson'?vis(page.getByTestId('start-card')):vis(page.getByText(`[${l.toUpperCase()}]`,{exact:true}));
const run=async ms=>{ for(let x=0;x<ms;x+=100) { await page.clock.runFor(100); } };
async function seg(name, frames){ fs.mkdirSync(name,{recursive:true}); for(let i=1;i<=frames;i++){ await page.clock.runFor(1000/30); await page.screenshot({path:`${name}/${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:90}); } console.log(name,'done'); }
const until=async(fn,max=30000)=>{ for(let x=0;x<max;x+=200){ if(await fn().catch(()=>false)) return true; await page.clock.runFor(200); await page.waitForTimeout(20);} return false; };
await page.goto(B+'/dev');
await until(()=>vis(page.getByText(/Load demo profile/i)).isVisible());
await vis(page.getByText(/Load demo profile/i)).click();
await until(async()=>new URL(page.url()).pathname==='/' && await pill('Start lesson').isVisible());
await run(800); await seg('map',123);
await pill('Start lesson').click();
await until(async()=>/lesson/.test(page.url()) && await pill('Start').isVisible());
await run(300); await pill('Start').click(); await seg('les',123);
const cont=pill('Continue');
for (let i=0;i<40;i++){
  if (await vis(page.getByText('Plate on the bar.')).isVisible().catch(()=>false)) break;
  for (const l of ['Start','Done','Skip rest','Skip']) { const p=pill(l); if (await p.isVisible().catch(()=>false)) { await p.click().catch(()=>{}); break; } }
  await run(600);
}
await seg('cel',126);
await until(()=>page.getByRole('radio',{name:'Easy'}).filter({visible:true}).first().isEnabled());
await run(500); await cont.click();
await until(()=>Promise.resolve(/stage-up/.test(page.url())));
await seg('stg',126);
console.log(page.url()); await b.close();
