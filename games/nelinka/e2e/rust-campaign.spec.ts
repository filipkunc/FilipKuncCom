import { test, expect } from '@playwright/test';

const key = 'nelinka-campaign-v5';
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
    await expect(page.locator('#stats')).toContainText(`Kachňátka 0/${[2, 3, 1, 3, 3][i]}`);
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
  await expect(page.locator('#continue')).toContainText('Poslední výprava');
  expect(await page.evaluate(() => localStorage.getItem('nelinka-workshop-level-v2'))).toBe('editor-sentinel');
  expect(errors).toEqual([]);
});

test('saved checkpoint finishes through real movement, advances and retains completion', async ({page}) => {
  // Authored levels/zacatek.json IDs in Nelinka 2ea18c831712. No debug APIs.
  const progress = {version:5,current:3,completed:Array(5).fill(false),best_treats:Array(5).fill(0),secrets:Array(5).fill(false),runs:Array.from({length:5},()=>({checkpoint:null as number|null,activated:[] as number[],collected:[] as number[]}))};
  progress.runs[3] = {checkpoint:36,activated:[1,3,13,14,15],collected:[]};
  await page.addInitScript(({key,progress}) => { if(!localStorage.getItem(key)) localStorage.setItem(key,JSON.stringify(progress)); },{key,progress});
  await ready(page);
  await page.locator('#continue').click();
  await expect(page.locator('#stats')).toContainText('Kachňátka 3/3');
  await page.keyboard.down('ArrowLeft');
  await expect(page.locator('#next')).toBeVisible({timeout:20_000});
  await page.keyboard.up('ArrowLeft');
  await page.locator('#next').click();
  await expect(page.locator('#chapter')).toHaveText('Poslední výprava');
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
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(...args: Parameters<typeof start>) {
      if (this.buffer && Math.abs(this.buffer.duration - 0.4) < 0.01) (window as any).barks++;
      return start.apply(this,args);
    };
  });
  await ready(page);
  await page.locator('[data-level="0"]').click();
  await expect(page.locator('#overlay')).toBeHidden();
  // Deliver key-down and key-up in one task: no rendered frame can occur
  // between them. The player must retain the tap until a simulation tick.
  const queued = await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE'}));
    window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyE'}));
    return {held:(window as any).nelinkaCampaign.bits,latched:(window as any).nelinkaCampaign.latched};
  });
  expect(queued).toEqual({held:0,latched:8});
  await expect.poll(()=>page.evaluate(()=>(window as any).barks)).toBe(1);
  await expect.poll(()=>page.evaluate(()=>(window as any).nelinkaCampaign.latched)).toBe(0);
  await page.locator('#sound').click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','true');
  await page.waitForTimeout(650);
  await page.keyboard.press('e',{delay:80});
  expect(await page.evaluate(()=>(window as any).barks)).toBe(1);
  await page.reload();
  await page.locator('[data-level="0"]').click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','true');
});
