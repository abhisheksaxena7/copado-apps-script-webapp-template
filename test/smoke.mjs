import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const config = JSON.parse(await readFile(resolve('project.config.json'), 'utf8'));
const html = await readFile(resolve('index.html'));
const server = createServer((request, response) => {
  if (request.url !== '/' && request.url !== '/index.html') {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(html);
});
await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
const { port } = server.address();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
  await page.locator(config.smokeSelector).waitFor({ state: 'visible' });
  const text = (await page.locator('body').innerText()).trim();
  if (!text.includes(config.title)) throw new Error('configured title is not visible');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (overflow) throw new Error('page overflows the mobile viewport');

  if (config.profile === 'static') {
    const before = await page.locator('#message').innerText();
    await page.locator('#action').click();
    const after = await page.locator('#message').innerText();
    if (before === after) throw new Error('static interaction did not update the page');
  } else if (config.profile === 'sheet') {
    const total = await page.locator('.card').count();
    if (total < 2) throw new Error('sheet sample-data fallback did not render');
    await page.locator('#search').fill('Linked sample');
    if (await page.locator('.card').count() !== 1) throw new Error('sheet search did not narrow sample data');
  } else {
    const button = page.locator('#canvas-action');
    const before = await button.innerText();
    await button.click();
    const after = await button.innerText();
    if (before === after) throw new Error('Canvas interaction did not update');
  }
  if (errors.length) throw new Error('uncaught browser errors: ' + errors.join(' | '));
  console.log(`Browser smoke passed: ${config.profile}, interaction, mobile overflow, no uncaught errors.`);
} finally {
  await browser.close();
  server.close();
}
