import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';

const rootFlag = process.argv.indexOf('--root');
const root = resolve(rootFlag >= 0 ? process.argv[rootFlag + 1] : '.');
const config = JSON.parse(await readFile(resolve(root, 'project.config.json'), 'utf8'));
const manifest = JSON.parse(await readFile(resolve(root, 'apps-script/appsscript.json'), 'utf8'));
const code = await readFile(resolve(root, 'apps-script/Code.gs'), 'utf8');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const synchronized = await readFile(resolve(root, 'apps-script/index.html'), 'utf8');
const problems = [];

if (!['static', 'sheet', 'canvas'].includes(config.profile)) problems.push('unknown profile');
if (manifest.webapp?.access !== 'DOMAIN') problems.push('webapp.access must be DOMAIN');
if (manifest.webapp?.executeAs !== 'USER_DEPLOYING') problems.push('webapp.executeAs must be USER_DEPLOYING');
if (/ANYONE(?:_ANONYMOUS)?/.test(JSON.stringify(manifest))) problems.push('public web-app access is forbidden');
if (html !== synchronized) problems.push('apps-script/index.html is not synchronized with index.html');
if (!html.includes('name="viewport"')) problems.push('viewport metadata is required');
if (!html.includes(config.title)) problems.push('configured title is missing from index.html');
if (/<script[^>]+src=|<link[^>]+href=/i.test(html)) problems.push('external runtime dependencies are not allowed');
if (config.profile === 'sheet') {
  const scopes = manifest.oauthScopes || [];
  const expected = [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/script.scriptapp'
  ];
  if (JSON.stringify(scopes) !== JSON.stringify(expected)) problems.push('sheet profile scopes are not the approved minimal set');
  if (!code.includes('Sheets.Spreadsheets.Values.get')) problems.push('sheet profile must use the Advanced Sheets Service');
  if (/SpreadsheetApp\./.test(code)) problems.push('sheet profile must not use SpreadsheetApp');
  if (!code.includes('JSON.stringify(items)')) problems.push('sheet profile must whitelist and serialize parsed items');
} else {
  if ((manifest.oauthScopes || []).length) problems.push(`${config.profile} profile must not declare OAuth scopes`);
  if (/Sheets\.|SpreadsheetApp\.|PropertiesService\./.test(code)) problems.push(`${config.profile} profile must not use Sheet services`);
}
if (config.profile === 'canvas') {
  if (html.includes('</script></script>')) problems.push('Canvas bundle contains an unescaped closing-script sequence');
  if (!html.includes('canvas-root')) problems.push('Canvas output is missing its root element');
}

for (const forbidden of ['.clasprc.json', '.env']) {
  try {
    await access(resolve(root, forbidden), constants.F_OK);
    problems.push(`${forbidden} must not exist in the project`);
  } catch {}
}

if (problems.length) {
  console.error('Configuration validation failed:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log(`Configuration valid: ${config.profile}, DOMAIN, USER_DEPLOYING, profile-minimal scopes.`);
