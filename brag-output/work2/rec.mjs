import { chromium } from '/home/user/opice-new/node_modules/playwright/index.mjs';
const B='http://localhost:8099';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:3, colorScheme:'dark' });
const page = await ctx.newPage();
import fs from 'node:fs'; fs.mkdirSync('raw',{recursive:true});
const cdp = await ctx.newCDPSession(page); let n=0; const idx=[];
cdp.on('Page.screencastFrame', async f => { const name=`raw/${String(n++).padStart(5,'0')}.jpg`; fs.writeFileSync(name, Buffer.from(f.data,'base64')); idx.push([f.metadata.timestamp,name]); cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{}); });
await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:1170,maxHeight:2532,everyNthFrame:1});
const T0=Date.now()/1000;
const t0=Date.now(); globalThis.T0w=t0/1000; const mark=(n)=>console.log(n, (Date.now()/1000).toFixed(2));
const vis=l=>l.filter({visible:true}).first();
const pill=l=>l==='Start lesson'?vis(page.getByTestId('start-card')):vis(page.getByText(`[${l.toUpperCase()}]`,{exact:true}));
await page.goto(B+'/dev'); await page.waitForTimeout(3000);
await vis(page.getByText(/Load demo profile/i)).click();
await page.waitForURL(u=>u.pathname==='/',{timeout:30000});
await page.waitForTimeout(1500); mark('map'); await page.screenshot({path:'s-map.png'});
await page.waitForTimeout(5000);
mark('startlesson'); await pill('Start lesson').click(); await page.waitForURL(/\/lesson\//);
await page.waitForTimeout(2500); await page.screenshot({path:'s-lesson.png'}); mark('lesson');
const cont=pill('Continue');
for (let i=0;i<40 && !(await cont.isVisible());i++){
  for (const l of ['Start','Done','Skip rest','Skip']) { const p=pill(l); if (await p.isVisible().catch(()=>false)) { mark('click '+l); await p.click().catch(()=>{}); await page.waitForTimeout(2200); break; } }
  await page.waitForTimeout(300);
}
mark('celebration'); await page.waitForTimeout(7000); await page.screenshot({path:'s-cel.png'});
await cont.click(); mark('after'); await page.waitForTimeout(4000); await page.screenshot({path:'s-after.png'}); console.log(page.url());
await cdp.send('Page.stopScreencast'); fs.writeFileSync('idx.json',JSON.stringify({T0,idx}));
await ctx.close(); await b.close();
