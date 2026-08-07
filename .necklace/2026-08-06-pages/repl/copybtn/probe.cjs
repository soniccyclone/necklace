const { chromium } = require('/tmp/claude-1000/-home-nathan-code-stuff-necklace/19dc4a4b-1661-4ac5-937b-5998e20639f7/scratchpad/shot/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chromium' });
  const ctx = await b.newContext({ viewport: { width: 760, height: 300 }, deviceScaleFactor: 3 });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  const p = await ctx.newPage();
  await p.goto('file://' + process.argv[2]);
  const box = p.locator('.org-src-container').first();
  const btn = p.locator('.copy-btn').first();

  await box.scrollIntoViewIfNeeded();
  await box.hover();
  await p.waitForTimeout(250);
  await box.screenshot({ path: process.argv[3] });

  await btn.click();
  await p.waitForSelector('.copy-btn.copied', { timeout: 2000 });  // wait for the class, not a guess
  await p.waitForTimeout(90);                                      // land mid-ring
  await box.screenshot({ path: process.argv[4] });

  console.log('clipboard:', JSON.stringify(await p.evaluate(() => navigator.clipboard.readText())));
  await p.waitForTimeout(700);
  console.log('class settles to:', await btn.getAttribute('class'));
  await b.close();
})();
