import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const options = parseArgs(process.argv.slice(2));
const root = resolve(options.root || '.');
const existing = JSON.parse(await readFile(resolve(root, 'project.config.json'), 'utf8'));
const config = {
  name: options.name || existing.name,
  title: options.title || existing.title,
  profile: options.profile || existing.profile,
  storageKey: options.storageKey || existing.storageKey,
  appChrome: options.appChrome || existing.appChrome,
  smokeSelector: options.smokeSelector || existing.smokeSelector,
  sheetProperty: options.sheetProperty || 'APP_SHEET_ID'
};

if (!['static', 'sheet', 'canvas'].includes(config.profile)) {
  throw new Error('--profile must be static, sheet, or canvas.');
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(config.name)) throw new Error('--name must be a lowercase package/repository slug.');
if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(config.sheetProperty)) throw new Error('--sheet-property must be a Script Property identifier.');
if (!/^[a-z0-9][a-z0-9._-]*$/i.test(config.storageKey)) throw new Error('--storage-key contains unsupported characters.');
if (!/^\[[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:=["'][^"']*["'])?\]$/.test(config.smokeSelector)) {
  throw new Error('--smoke-selector must be a simple attribute selector.');
}

await writeFile(resolve(root, 'project.config.json'), JSON.stringify(config, null, 2) + '\n');

const packagePath = resolve(root, 'package.json');
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
packageJson.name = config.name;
packageJson.private = true;
await writeFile(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
try {
  const lockPath = resolve(root, 'package-lock.json');
  const packageLock = JSON.parse(await readFile(lockPath, 'utf8'));
  packageLock.name = config.name;
  if (packageLock.packages?.['']) packageLock.packages[''].name = config.name;
  await writeFile(lockPath, JSON.stringify(packageLock, null, 2) + '\n');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const replacements = {
  '{{TITLE}}': config.title,
  '{{APP_CHROME}}': config.appChrome,
  '{{STORAGE_KEY}}': config.storageKey,
  '{{SHEET_PROPERTY}}': config.sheetProperty,
  '{{SMOKE_ATTRIBUTE}}': selectorToAttribute(config.smokeSelector)
};
for (const file of ['Code.gs', 'appsscript.json']) {
  const source = await readFile(resolve(root, 'profiles', config.profile, file), 'utf8');
  await writeFile(resolve(root, 'apps-script', file), replaceAll(source, replacements));
}

if (config.profile === 'canvas') {
  execFileSync(process.execPath, [resolve(root, 'recipes/canvas-publish/build.mjs'), '--root', root], { stdio: 'inherit' });
} else {
  const source = await readFile(resolve(root, 'profiles', config.profile, 'index.html'), 'utf8');
  const html = replaceAll(source, replacements);
  await writeFile(resolve(root, 'index.html'), html);
  await writeFile(resolve(root, 'apps-script/index.html'), html);
}

execFileSync(process.execPath, [resolve(root, 'scripts/validate-config.mjs'), '--root', root], { stdio: 'inherit' });
console.log(`Initialized ${config.name} with the ${config.profile} profile.`);
console.log('Human gate: authenticate clasp, create Script Properties/secrets, and approve any deployment separately.');

function parseArgs(args) {
  const result = {};
  const names = {
    '--root': 'root', '--profile': 'profile', '--name': 'name', '--title': 'title',
    '--storage-key': 'storageKey', '--app-chrome': 'appChrome',
    '--smoke-selector': 'smokeSelector', '--sheet-property': 'sheetProperty'
  };
  for (let index = 0; index < args.length; index++) {
    const key = names[args[index]];
    if (!key) throw new Error(`Unknown argument: ${args[index]}`);
    if (!args[index + 1]) throw new Error(`Missing value for ${args[index]}`);
    result[key] = args[++index];
  }
  return result;
}

function replaceAll(source, replacements) {
  return Object.entries(replacements).reduce((value, [token, replacement]) => value.replaceAll(token, replacement), source);
}

function selectorToAttribute(selector) {
  const match = /^\[([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:=["']([^"']*)["'])?\]$/.exec(selector);
  return match[2] === undefined ? match[1] : `${match[1]}="${match[2].replace(/"/g, '&quot;')}"`;
}
