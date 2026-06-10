import { test, expect, type Page } from '@playwright/test';
// @ts-ignore — plain ESM module without types
import { startServer } from '../scripts/hb-editor/serve.mjs';

const PORT = 4793;
const URL_ = `http://127.0.0.1:${PORT}/web/editor/`;

let server: { close: () => void };

test.beforeAll(async () => {
  server = await startServer(PORT);
});

test.afterAll(() => {
  server.close();
});

async function open(page: Page, text?: string) {
  await page.goto(URL_);
  await page.waitForFunction(() => (window as any).__edReady === true, undefined, {
    timeout: 30_000,
  });
  if (text !== undefined) {
    await page.evaluate((t) => {
      const ed = (window as any).__ed;
      ed.doc.setText(t);
      ed.doc.moveEnd();
      ed.draw();
      ed.focus();
    }, text);
  } else {
    await page.evaluate(() => (window as any).__ed.focus());
  }
}

function state(page: Page) {
  return page.evaluate(() => (window as any).__ed.getState());
}

test('typing inserts text and renders it', async ({ page }) => {
  await open(page, '');
  await page.keyboard.type('hello world');
  expect((await state(page)).text).toBe('hello world');
  const stats = await page.evaluate(() => {
    const ed = (window as any).__ed;
    ed.draw();
    return ed.renderer.readStats();
  });
  expect(stats.inked).toBeGreaterThan(200);
});

test('enter splits lines, backspace at line start rejoins', async ({ page }) => {
  await open(page, 'ab');
  await page.keyboard.press('Enter');
  await page.keyboard.type('cd');
  expect((await state(page)).text).toBe('ab\ncd');
  await page.keyboard.press('Home');
  await page.keyboard.press('Backspace');
  expect((await state(page)).text).toBe('abcd');
});

test('arrows, shift-selection, and typing over a selection', async ({ page }) => {
  await open(page, 'abcd');
  await page.keyboard.press('Home');
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Shift+ArrowRight');
  expect(await state(page)).toMatchObject({ cursor: 2, anchor: 0 });
  await page.keyboard.type('X');
  expect((await state(page)).text).toBe('Xcd');
});

test('caret steps inside the fi ligature (EB Garamond)', async ({ page }) => {
  await open(page, 'fi');
  // Precondition: this font ligates.
  const glyphs = await page.evaluate(() => (window as any).__ed.doc.layout()[0].shaped.length);
  expect(glyphs).toBe(1);
  await page.keyboard.press('ArrowLeft');
  expect((await state(page)).cursor).toBe(1);
  await page.keyboard.press('Backspace');
  expect((await state(page)).text).toBe('i');
});

test('partial-ligature selection renders two-tone', async ({ page }) => {
  await open(page, 'fi');
  await page.keyboard.press('Home');
  await page.keyboard.press('Shift+ArrowRight'); // select the f half of the ligature glyph
  const counts = await page.evaluate(() => {
    const ed = (window as any).__ed;
    ed.draw();
    const { data } = ed.renderer.readPixels();
    let blue = 0;
    let dark = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (b > r + 60 && b > 150) blue++; // selection background
      else if (r < 100 && g < 100 && b < 100) dark++; // unselected ink
    }
    return { blue, dark };
  });
  // Both halves of the single ligature glyph are visible: highlight covers
  // part of it (blue background present) while the rest stays dark ink.
  expect(counts.blue).toBeGreaterThan(50);
  expect(counts.dark).toBeGreaterThan(20);
});

test('click moves the caret', async ({ page }) => {
  await open(page, 'mmmm mmmm');
  const before = (await state(page)).cursor;
  expect(before).toBe(9);
  const box = await page.locator('#canvas').boundingBox();
  await page.mouse.click(box!.x + 14, box!.y + 14 + 14); // near the text start
  const after = (await state(page)).cursor;
  expect(after).toBeLessThan(3);
});

test('caret-follow scrolling keeps long lines editable', async ({ page }) => {
  await open(page, '');
  // Type far past the visible width, then jump around the line.
  await page.keyboard.type('m'.repeat(120));
  let s = await state(page);
  expect(s.scroll.x).toBeGreaterThan(0);
  await page.keyboard.press('Home');
  s = await state(page);
  expect(s.scroll.x).toBe(0);
  await page.keyboard.press('End');
  s = await state(page);
  expect(s.scroll.x).toBeGreaterThan(0);
  // Vertical: enough lines to overflow the 360px canvas.
  for (let i = 0; i < 12; i++) await page.keyboard.press('Enter');
  s = await state(page);
  expect(s.scroll.y).toBeGreaterThan(0);
});

test('drag-selecting past the edge auto-scrolls', async ({ page }) => {
  await open(page, 'm'.repeat(200));
  await page.evaluate(() => {
    (window as any).__ed.doc.setCursorIndex(0);
    (window as any).__ed.draw();
  });
  const box = (await page.locator('#canvas').boundingBox())!;
  await page.mouse.move(box.x + 50, box.y + 30);
  await page.mouse.down();
  for (let x = 60; x <= box.width + 80; x += 40) {
    await page.mouse.move(box.x + x, box.y + 30);
  }
  await page.mouse.up();
  const s = await state(page);
  expect(s.scroll.x).toBeGreaterThan(0);
  expect(s.cursor).toBeGreaterThan(s.anchor);
});

test('font switch preserves text and stays interactive', async ({ page }) => {
  await open(page, 'fix');
  await page.locator('#font').selectOption('Inter');
  expect((await state(page)).text).toBe('fix');
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  expect((await state(page)).text).toBe('fix!');
});
