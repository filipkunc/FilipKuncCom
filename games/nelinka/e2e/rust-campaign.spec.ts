import { test, expect } from '@playwright/test';

const key = 'nelinka-campaign-v1';
async function ready(page: import('@playwright/test').Page) {
  await page.goto('/nelinka?campaign=1');
  await expect(page).toHaveURL(/\/nelinka\/index\.html\?campaign=1$/);
  await expect(page.locator('canvas[data-ready=true]')).toBeVisible({timeout: 30_000});
  await expect(page.locator('.chapter')).toHaveCount(5);
}

test('pinned Rust game selects five chapters, pauses and keeps editor saves separate', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await ready(page);
  await page.evaluate(() => localStorage.setItem('nelinka-workshop-level-v2','editor-sentinel'));
  for (let i = 0; i < 5; i++) {
    await page.locator(`[data-level="${i}"]`).click();
    await expect(page.locator('#overlay')).toBeHidden();
    await expect(page.locator('#stats')).toContainText('Kachňátka 0/3');
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(150);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.press('Space', {delay:80});
    await page.keyboard.press('Escape', {delay:80});
    await expect(page.locator('#title')).toHaveText('Chvilka na oddech');
    await page.locator('#continue').click();
    await expect(page.locator('#overlay')).toBeHidden();
    await page.locator('#pause').click();
    await page.locator('#menu').click();
  }
  await page.reload();
  await expect(page.locator('#continue')).toContainText('Lesní slavnost');
  expect(await page.evaluate(() => localStorage.getItem('nelinka-workshop-level-v2'))).toBe('editor-sentinel');
  expect(errors).toEqual([]);
});

test('saved checkpoint finishes through real movement, advances and retains completion', async ({page}) => {
  // Authored Houbové stráně IDs from the pinned Nelinka level. No debug APIs.
  const progress = {version:1,current:3,completed:[false,false,false,false,false],best_treats:[0,0,0,0,0],secrets:[false,false,false,false,false],runs:Array.from({length:5},()=>({checkpoint:null as number|null,activated:[] as number[],collected:[] as number[]}))};
  progress.runs[3] = {checkpoint:60,activated:[50,51,52,54,55,56],collected:[]};
  await page.addInitScript(({key,progress}) => { if(!localStorage.getItem(key)) localStorage.setItem(key,JSON.stringify(progress)); },{key,progress});
  await ready(page);
  await page.locator('#continue').click();
  await expect(page.locator('#stats')).toContainText('Kachňátka 3/3');
  await page.keyboard.down('ArrowRight');
  await expect(page.locator('#next')).toBeVisible({timeout:15_000});
  await page.keyboard.up('ArrowRight');
  await page.locator('#next').click();
  await expect(page.locator('#chapter')).toHaveText('Lesní slavnost');
  await expect(page.locator('#overlay')).toBeHidden();
  await page.reload();
  await expect(page.locator('[data-level="3"]')).toHaveClass(/done/);
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).completed[3],key)).toBe(true);
});

test('mobile campaign exposes independent multitouch buttons and releases cancelled input', async ({browser}) => {
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await ready(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('[data-level="0"]').click();
  await expect(page.locator('#touch')).toBeVisible();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const client = await page.context().newCDPSession(page);
  const points = await Promise.all([2,4].map(async (bit,id) => {
    const rect = await page.locator(`[data-bit="${bit}"]`).boundingBox();
    return {id, x:rect!.x+rect!.width/2, y:rect!.y+rect!.height/2};
  }));
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
  expect(await page.evaluate(()=>(window as any).nelinkaCampaign.bits)).toBe(6);
  await client.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  expect(await page.evaluate(()=>(window as any).nelinkaCampaign.bits)).toBe(0);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[points[0]]});
  expect(await page.evaluate(()=>(window as any).nelinkaCampaign.bits)).toBe(2);
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  expect(await page.evaluate(()=>(window as any).nelinkaCampaign.bits)).toBe(0);
  expect(errors).toEqual([]);
  await page.close();
});

test('recorded bark plays once per press and the sound preference persists', async ({page}) => {
  await page.addInitScript(() => {
    (window as any).barks = 0;
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function() { (window as any).barks++; return play.call(this); };
  });
  await ready(page);
  await page.locator('[data-level="0"]').click();
  await expect(page.locator('#overlay')).toBeHidden();
  await page.keyboard.press('e',{delay:80});
  await expect.poll(()=>page.evaluate(()=>(window as any).barks)).toBe(1);
  await page.locator('#sound').click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','true');
  await page.waitForTimeout(650);
  await page.keyboard.press('e',{delay:80});
  expect(await page.evaluate(()=>(window as any).barks)).toBe(1);
  await page.reload();
  await page.locator('[data-level="0"]').click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','true');
});
