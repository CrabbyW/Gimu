import { chromium } from '/home/user/opice-new/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const B='http://localhost:8099';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:3, colorScheme:'dark' });
const page = await ctx.newPage();
page.on('dialog', d => d.accept());
await page.clock.install();
const vis=l=>l.filter({visible:true}).first();
const run=async ms=>{ for(let x=0;x<ms;x+=100) await page.clock.runFor(100); };
const until=async(fn,max=40000)=>{ for(let x=0;x<max;x+=200){ if(await fn().catch(()=>false)) return true; await page.clock.runFor(200); await page.waitForTimeout(20);} console.log('TIMEOUT'); return false; };
async function seg(name, frames, el){ fs.mkdirSync(name,{recursive:true}); for(let i=1;i<=frames;i++){ await page.clock.runFor(1000/30); await (el??page).screenshot({path:`${name}/${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:90}); } console.log(name); }
const only=process.argv[2];
if(!only||only==='onb'){
  await page.goto(B+'/');
  await until(async()=>/onboarding\/path/.test(page.url()) && await vis(page.getByRole('radio')).isVisible());
  await run(1500); await seg('path',45);
  await vis(page.getByRole('radio')).click(); await seg('path2',24);
  await vis(page.getByRole('button',{name:/^Continue$/})).click();
  await until(async()=>/birth/.test(page.url()));
  await seg('birth',150);
}
if(!only||only==='acts'){
  await page.goto(B+'/dev'); await until(()=>vis(page.getByText(/Load demo profile/i)).isVisible());
  await vis(page.getByText(/Load demo profile/i)).click();
  await until(async()=>new URL(page.url()).pathname==='/');
  await run(1500); await seg('mapidle',60);
  for (const [tab,name] of [['league','league'],['season','season'],['progress','progress']]) {
    await page.goto(B+'/'+tab); await until(()=>Promise.resolve(true),100); await run(2500); await seg(name,60);
  }
  await page.goto(B+'/dev'); await run(3000);
  const stage=vis(page.getByTestId('mascot-actions-stage'));
  await until(()=>stage.isVisible());
  for (const id of ['liftBarbell','handstandPlate','hangFinger','flameJump','climbPodium','flip','trainAlong','shrug','boredSit','grow','giggle','waveRun','wipeSweat','plateHop']) {
    const btn=vis(page.getByTestId(`act-${id}`)); await btn.scrollIntoViewIfNeeded(); await stage.scrollIntoViewIfNeeded();
    await btn.click(); await seg('act-'+id,75,stage); await run(1500);
  }
}
await b.close();
