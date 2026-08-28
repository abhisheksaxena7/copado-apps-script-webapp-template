import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const recipeDir = dirname(fileURLToPath(import.meta.url));
const rootFlag = process.argv.indexOf('--root');
const root = rootFlag >= 0 ? resolve(process.argv[rootFlag + 1]) : resolve(recipeDir, '../..');
const configPath = resolve(root, 'project.config.json');
const templatePath = resolve(root, 'recipes/canvas-publish/index.template.html');
const entryPath = resolve(root, 'recipes/canvas-publish/src/canvas-adapter.tsx');

const config = JSON.parse(await readFile(configPath, 'utf8'));
if (config.profile !== 'canvas') {
  throw new Error('Canvas build requires project.config.json profile "canvas". Run npm run init -- --profile canvas first.');
}

let output;
try {
  const result = await build({
    entryPoints: [entryPath],
    bundle: true,
    write: false,
    minify: true,
    platform: 'browser',
    format: 'iife',
    target: ['es2020'],
    define: {
      __APP_CONFIG__: JSON.stringify({ storageKey: config.storageKey }),
      'process.env.NODE_ENV': '"production"'
    }
  });
  output = result.outputFiles[0].text;
} catch (error) {
  throw new Error('Canvas build failed. Ensure src/App.tsx exists and default-exports a React component.\n' + error.message);
}

const smokeAttribute = selectorToAttribute(config.smokeSelector);
const html = (await readFile(templatePath, 'utf8'))
  .replaceAll('{{TITLE}}', escapeHtml(config.title))
  .replaceAll('{{APP_CHROME}}', escapeHtml(config.appChrome))
  .replaceAll('{{SMOKE_ATTRIBUTE}}', smokeAttribute)
  .replace('{{BUNDLE}}', output.replace(/<\/script/gi, '<\\/script'));

await writeFile(resolve(root, 'index.html'), html);
await writeFile(resolve(root, 'apps-script/index.html'), html);
console.log('Built self-contained Canvas HTML and synchronized apps-script/index.html.');

function selectorToAttribute(selector) {
  const match = /^\[([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:=["']([^"']*)["'])?\]$/.exec(selector || '');
  if (!match) throw new Error('smokeSelector must be a simple attribute selector, for example [data-smoke-ready].');
  return match[2] === undefined ? match[1] : `${match[1]}="${escapeHtml(match[2])}"`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}
