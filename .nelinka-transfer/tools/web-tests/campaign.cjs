const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const key='nelinka-campaign-v3';
const base=process.env.NELINKA_CAMPAIGN_URL || 'http://127.0.0.1:8765/player.html';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:900}}), errors=[];
  page.setDefaultTimeout(15000);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'||/PanicHookInfo|CONTEXT_LOST_WEBGL/.test(m.text()))errors.push(m.text());});
  await require('./audio-probe.cjs')(page);
  const legacy=JSON.stringify({version:1,current:4,completed:Array(5).fill(true),best_treats:Array(5).fill(0),secrets:Array(5).fill(false),runs:Array.from({length:5},()=>({checkpoint:null,activated:[],collected:[]}))});
  await page.addInitScript(legacy=>{ if(!localStorage.getItem('nelinka-campaign-v1'))localStorage.setItem('nelinka-campaign-v1',legacy); },legacy);
  await page.goto(base);
  await page.locator('canvas[data-ready=true]').waitFor({timeout:60000});
  await page.locator('.chapter').last().waitFor();
  assert.equal(await page.locator('.chapter').count(),5);
  assert.equal(await page.locator('.chapter.done').count(),0);
  const shots=path.resolve(__dirname,'../../screenshots');fs.mkdirSync(shots,{recursive:true});
  await page.screenshot({path:path.join(shots,'campaign-menu.png')});
  await page.evaluate(()=>localStorage.setItem('nelinka-workshop-level-v2','editor-save-must-stay'));
  for(let i=0;i<5;i++){
   console.log("Checking chapter",i+1);
   await page.locator(`[data-level="${i}"]`).click();
   await page.locator('#overlay').waitFor({state:'hidden'});
   assert.match(await page.locator('#stats').textContent(), new RegExp(`Kachňátka 0/${i===0?2:i===2?1:3}`));
   if(i===0) {
    const queued=await page.evaluate(()=>{
      window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE'}));
      window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyE'}));
      return {held:window.nelinkaCampaign.bits,latched:window.nelinkaCampaign.latched};
    });
    assert.deepEqual(queued,{held:0,latched:8});
    await page.waitForFunction(()=>window.audioPlays.some(s=>Math.abs(s.duration-0.4)<0.01) && window.nelinkaCampaign.latched===0);
   }
   await page.keyboard.down('ArrowRight');await page.waitForTimeout(350);await page.keyboard.up('ArrowRight');
   await page.keyboard.press('Space',{delay:150});await page.keyboard.press('e',{delay:60});
   await page.screenshot({path:path.join(shots,`campaign-${i+1}.png`)});
   await page.keyboard.press('Escape',{delay:80});await page.locator('#continue').waitFor();
   const paused=await page.locator('canvas').screenshot();await page.waitForTimeout(150);
   assert.deepEqual(await page.locator('canvas').screenshot(),paused,'paused canvas stays still');
   await page.locator('#continue').click();await page.locator('#overlay').waitFor({state:'hidden'});
   await page.locator('#pause').click();await page.locator('#menu').click();
  }
  assert.equal(await page.evaluate(()=>localStorage.getItem('nelinka-workshop-level-v2')),'editor-save-must-stay');
  assert.equal(await page.evaluate(()=>localStorage.getItem('nelinka-campaign-v1')),legacy);
  assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).version,key),3);
  await page.reload();await page.locator('canvas[data-ready=true]').waitFor();
  assert.match(await page.locator('#continue').textContent(),/Poslední výprava/);
  // Resume a validated checkpoint with real IDs, then walk home. No gameplay test hooks.
  const level=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../levels/zacatek.json'),'utf8'));
  const progress=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  progress.current=3;
  progress.runs[3]={checkpoint:level.objects.filter(o=>o.kind==='checkpoint').at(-1).id,activated:level.objects.filter(o=>['duckling','key','secret','gate','flower_bridge'].includes(o.kind)).map(o=>o.id),collected:[]};
  await page.evaluate(({key,progress})=>localStorage.setItem(key,JSON.stringify(progress)),{key,progress});
  await page.reload();await page.locator('canvas[data-ready=true]').waitFor();
  await page.locator('#continue').click();await page.locator('#overlay').waitFor({state:'hidden'});
  await page.keyboard.down('ArrowLeft');
  await page.locator('#next').waitFor({timeout:20000});await page.keyboard.up('ArrowLeft');
  await page.screenshot({path:path.join(shots,'campaign-won.png')});
  await page.locator('#next').click();await page.locator('#overlay').waitFor({state:'hidden'});
  assert.match(await page.locator('#chapter').textContent(),/Poslední výprava/);
  assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).completed[3],key),true);
  await page.reload();await page.locator('canvas[data-ready=true]').waitFor();
  assert.match(await page.locator('[data-level="3"]').getAttribute('class'),/done/);
  // Release the desktop renderer before testing mobile. SwiftShader shares GPU
  // resources across contexts, and the desktop app continuously repaints.
  assert.deepEqual(errors,[]);
  await page.close();
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  mobile.on('pageerror',e=>errors.push(e.message));
  mobile.on('console',m=>{if(m.type()==='error'||/PanicHookInfo|CONTEXT_LOST_WEBGL/.test(m.text()))errors.push(m.text());});
  await mobile.goto(base);await mobile.locator('canvas[data-ready=true]').waitFor({timeout:60000});
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await mobile.locator('[data-level="0"]').click();await mobile.locator('#touch').waitFor();
  const client=await mobile.context().newCDPSession(mobile);
  const rect=await mobile.locator('[data-bit="2"]').boundingBox();
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rect.x+rect.width/2,y:rect.y+rect.height/2,id:1}]});
  assert.equal(await mobile.evaluate(()=>window.nelinkaCampaign.bits),2);
  await client.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  assert.equal(await mobile.evaluate(()=>window.nelinkaCampaign.bits),0);
  await mobile.screenshot({path:path.join(shots,'campaign-mobile.png')});
  assert.deepEqual(errors,[]);
  console.log('PASS: five chapters, keyboard controls, pause/resume, independent saves, checkpoint restore, completion/next level, reload, mobile layout and touch release');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
