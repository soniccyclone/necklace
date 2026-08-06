// REPL: screenshot the built page so layout and colour can be argued about
// from the render rather than from the CSS.
const { chromium } = require('/tmp/claude-1000/-home-nathan-code-stuff-necklace/19dc4a4b-1661-4ac5-937b-5998e20639f7/scratchpad/shot/node_modules/playwright-core');
(async () => {
  const [file, out, w = 1000, h = 1400] = process.argv.slice(2);
  const b = await chromium.launch({ channel: 'chromium' });
  const p = await b.newPage({ viewportSize: { width: +w, height: +h }, deviceScaleFactor: 2 });
  await p.goto('file://' + file);
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
  console.log('shot', out);
})();
