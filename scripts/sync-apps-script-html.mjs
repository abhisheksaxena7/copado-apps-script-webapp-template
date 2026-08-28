import { copyFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const rootFlag = process.argv.indexOf('--root');
const root = resolve(rootFlag >= 0 ? process.argv[rootFlag + 1] : '.');
const config = JSON.parse(await readFile(resolve(root, 'project.config.json'), 'utf8'));

if (config.profile === 'canvas') {
  throw new Error('Canvas HTML must be generated with npm run build:canvas; direct copying can publish a stale bundle.');
}

await copyFile(resolve(root, 'index.html'), resolve(root, 'apps-script/index.html'));
console.log('Synchronized index.html to apps-script/index.html.');
