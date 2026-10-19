const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const key = 'nelinka-workshop-level-v2';
(async () => {
  const browser = await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:944}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error'||/PanicHookInfo|CONTEXT_LOST_WEBGL/.test(m.text()))errors.push(m.text());});
    // Use a stable terrain-only fixture, independent of the current startup level.
    const old=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../old_levels/meadow.json'),'utf8'));
    await page.addInitScript(({key,level})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(level));},{key,level:old});
    await page.goto(process.env.NELINKA_URL || 'http://127.0.0.1:8765');
    await page.locator('canvas[data-ready=true]').waitFor({timeout:30000});
    const settle = async () => {
      const frame = await page.locator('canvas').getAttribute('data-frame');
      await page.waitForFunction(before => Number(document.querySelector('canvas').dataset.frame) >= Number(before) + 2, frame);
    };
    const click=async(x,y)=>{await page.mouse.click(x,y+44);await settle();};
    const press = async chord => {
      const keys = chord.split('+');
      for (const key of keys) await page.keyboard.down(key);
      await settle();
      for (const key of keys.reverse()) await page.keyboard.up(key);
      await settle();
    };
    const save=async()=>{await press('Control+s');return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);};
    const drag=async(a,b)=>{await page.mouse.move(a[0],a[1]+44);await page.mouse.down();await settle();await page.mouse.move(b[0],b[1]+44,{steps:10});await settle();await page.mouse.up();await settle();};
    const ui = require('./editor-ui.cjs')(page, click, press, settle);
    const load=async(level)=>{await page.evaluate(({key,level})=>localStorage.setItem(key,JSON.stringify(level)),{key,level});await ui.load();};
    await page.locator('#glcanvas').focus();await settle();
    await click(1395,62); // Open the inspector for property checks.
    const original=await save();assert.equal(original.version,5);

    const kinds=['hedgehog','frog','bee','mushroom','moving_log','sinking_stone','leaf_lift','flower_bridge','duckling','key','gate','secret','checkpoint','sign','water','stone','waterfall'];
    for(let i=0;i<kinds.length;i++){

      await ui.choose(kinds[i] === 'stone' ? 'Stone' : kinds[i].replaceAll('_',' '));await click(800,250);
      const placed=await save();assert.equal(placed.objects.at(-1).kind,kinds[i]);
      assert.equal(placed.objects.length,1);
      await press('Control+z');assert.deepEqual(await save(),original);
    }

    await ui.choose('Hedgehog');await click(800,250);
    const placed=await save();const object=placed.objects[0];
    const screen=p=>[(p[0]-250)*1.4+720,(p[1]-368)*1.4+476];
    const anchor=screen(object.position);
    await drag(anchor,[anchor[0]+56,anchor[1]+28]);
    const moved=await save();assert.notDeepEqual(moved.objects[0].position,object.position);
    await press('Control+z');assert.deepEqual(await save(),placed);
    await press('Control+Shift+z');assert.deepEqual(await save(),moved);
    await click(...screen(moved.objects[0].position));
    await page.mouse.dblclick(1350,190+44);await press('Control+a');await page.keyboard.type('96');await press('Enter');await click(1250,130); // Increase patrol range.
    const tuned=await save();assert.equal(tuned.objects[0].travel[0],96);
    await press('Control+d');const duplicate=await save();assert.equal(duplicate.objects.length,2);assert.notEqual(duplicate.objects[0].id,duplicate.objects[1].id);
    await press('Delete');assert.equal((await save()).objects.length,1);await press('Control+z');assert.deepEqual(await save(),duplicate);
    await press('Tab');await press('e');await page.waitForTimeout(200);await press('r');await press('Tab');assert.deepEqual(await save(),duplicate);
    await load(original);

    await ui.choose('Sign');await click(800,250); // Sign.
    const sign=await save();assert.equal(sign.objects[0].kind,'sign');
    await click(1280,224);await press('End'); // Edit sign text.
    await page.keyboard.type(' hello',{delay:40});await press('Enter');
    const edited=await save();assert.equal(edited.objects[0].text,sign.objects[0].text+' hello');
    await press('Control+z');assert.deepEqual(await save(),sign);
    await click(...screen(sign.objects[0].position));await click(1280,224);await press('End');await page.keyboard.type('discard',{delay:40});await press('Escape');assert.deepEqual(await save(),sign);
    // A real version-2 save migrates in the existing browser storage slot.
    await load(old);assert.deepEqual(await save(),original);
    await ui.tour(); // Objects tour; one undo restores the user's document.
    const tour=await save();assert.equal(tour.objects.length,24);
    await press('Control+z');assert.deepEqual(await save(),original);await press('Control+Shift+z');assert.deepEqual(await save(),tour);
    const shots=path.resolve(__dirname,'../../screenshots');fs.mkdirSync(shots,{recursive:true});
    await page.screenshot({path:path.join(shots,'objects-editor.png')});
    await press('Tab');await page.keyboard.down('d');
    for(let i=0;i<8;i++){await press('e');await page.waitForTimeout(300);}
    await page.keyboard.up('d');await page.screenshot({path:path.join(shots,'objects-play.png')});
    await press('Tab');assert.deepEqual(await save(),tour);
    await page.reload();await page.locator('canvas[data-ready=true]').waitFor();await settle();assert.deepEqual(await save(),tour);
    assert.deepEqual(errors,[]);
    console.log('PASS: all 17 object tools, dragging, inspector settings, duplicate/delete, undo/redo, sign text commit/cancel, v2 migration, tour, bark/restart, snapshot isolation and reload');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
