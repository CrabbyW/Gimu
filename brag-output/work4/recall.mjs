import { open } from './cap.mjs';
const B='http://localhost:8099';
const only=process.argv[2];
const { b, page, vis, rec } = await open();
const pill=l=>l==='Start lesson'?vis(page.getByTestId('start-card')):vis(page.getByText(`[${l.toUpperCase()}]`,{exact:true}));
const until=async(fn,max=120000)=>{ const t=Date.now(); while(Date.now()-t<max){ if(await fn().catch(()=>false)) return true; await page.waitForTimeout(300);} console.log('TIMEOUT'); return false; };
if(!only||only==='onb'){
  await page.goto(B+'/'); await until(async()=>/onboarding\/path/.test(page.url()) && await vis(page.getByRole('radio')).isVisible());
  await page.waitForTimeout(6000); await rec('path',1.2);
  await vis(page.getByRole('radio')).click(); await rec('pathsel',0.9);
  await vis(page.getByRole('button',{name:/^Continue$/})).click(); await rec('birth',4.5);
}
if(!only||only==='main'){
  await page.goto(B+'/dev'); await until(()=>vis(page.getByText(/Load demo profile/i)).isVisible());
  await vis(page.getByText(/Load demo profile/i)).click();
  await until(async()=>new URL(page.url()).pathname==='/' && await pill('Start lesson').isVisible());
  await page.waitForTimeout(6000); await rec('map',4.2);
  await pill('Start lesson').click(); await until(()=>pill('Start').isVisible()); await page.waitForTimeout(3000);
  await pill('Start').click(); await rec('lesson',4.5);
  for(let i=0;i<60;i++){
    const last=await vis(page.getByText('04/04')).isVisible().catch(()=>false);
    if(last && await pill('Skip').isVisible().catch(()=>false) && !(await pill('Start').isVisible().catch(()=>false))){ await pill('Skip').click(); await rec('cel',6.5); break; }
    let did=false;
    for(const l of ['Start','Done','Skip rest','Skip']){ const p=pill(l); if(await p.isVisible().catch(()=>false)){ await p.click().catch(()=>{}); did=true; break; } }
    await page.waitForTimeout(did?4000:1500);
  }
  await until(()=>pill('Continue').isVisible()); await page.waitForTimeout(1500);
  await pill('Continue').click(); await rec('stg',4.5); console.log(page.url());
  for(const t of ['league','season','progress']){ await page.goto(B+'/'+t); await page.waitForTimeout(12000); await rec(t,2.5); }
  await page.goto(B+'/dev'); await page.waitForTimeout(12000);
  const stage=vis(page.getByTestId('mascot-actions-stage'));
  for(const id of ['boredSit','hangFinger','shrug','liftBarbell','handstandPlate','flameJump','climbPodium','trainAlong','flip','grow','waveRun','giggle']){
    const btn=vis(page.getByTestId(`act-${id}`)); await btn.scrollIntoViewIfNeeded(); await stage.scrollIntoViewIfNeeded();
    const bb=await stage.boundingBox(); await btn.click(); await rec('act-'+id,3.0,bb); await page.waitForTimeout(6000);
  }
}
await b.close();
