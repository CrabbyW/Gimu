import { open } from './cap.mjs';
const { b, page, rec, wait } = await open();
await page.goto('http://localhost:8099/dev'); await page.waitForTimeout(6000);
await page.getByText(/Load demo profile/i).filter({visible:true}).first().click(); await page.waitForTimeout(8000);
await page.goto('http://localhost:8099/stage-up?from=1&to=2'); 
await rec('stgtest', 3.0);
await b.close();
