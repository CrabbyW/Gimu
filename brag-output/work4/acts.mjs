import { open } from './cap.mjs';
const B='http://localhost:8099';
const { b, page, vis, rec } = await open();
await page.goto(B+'/dev'); await page.waitForTimeout(12000);
await vis(page.getByText(/Load demo profile/i)).click(); await page.waitForTimeout(12000);
await page.goto(B+'/dev'); await page.waitForTimeout(12000);
const stage=vis(page.getByTestId('mascot-actions-stage'));
for(const id of ['boredSit','hangFinger','shrug','liftBarbell','handstandPlate','flameJump','climbPodium','trainAlong','flip','grow','waveRun','giggle','plateHop','strain']){
  const btn=vis(page.getByTestId(`act-${id}`)); await btn.scrollIntoViewIfNeeded().catch(()=>{});
  await btn.click();
  await stage.evaluate(e=>e.scrollIntoView({block:'center'}));
  const bb=await stage.boundingBox(); const sy=await page.evaluate(()=>{let m=0;for(const e of document.querySelectorAll('*')){if(e.scrollTop>m)m=e.scrollTop}return [window.scrollY,m]});
  const vp=page.viewportSize(); const x=Math.max(0,bb.x), y=Math.max(0,bb.y), w=Math.min(bb.width,vp.width-x), h=Math.min(bb.height,vp.height-y);
  console.log(id, JSON.stringify(bb), sy);
  await rec('act-'+id,3.0,{x,y:y+sy[0],width:w,height:h}); await page.waitForTimeout(6000);
}
await b.close();
