import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import { join, resolve } from 'node:path';

test('all profiles initialize, validate, and pass browser smoke tests', () => {
  const originalProfile = JSON.parse(readFileSync('project.config.json', 'utf8')).profile;
  try {
    for (const profile of ['static', 'sheet', 'canvas']) {
      execFileSync(process.execPath, ['scripts/init-project.mjs', '--profile', profile], { stdio: 'inherit' });
      execFileSync(process.execPath, ['test/smoke.mjs'], { stdio: 'inherit' });
      const manifest = JSON.parse(readFileSync('apps-script/appsscript.json', 'utf8'));
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      const packageLock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
      assert.equal(packageLock.name, packageJson.name);
      assert.equal(packageLock.packages[''].name, packageJson.name);
      assert.equal(manifest.webapp.access, 'DOMAIN');
      assert.equal(manifest.webapp.executeAs, 'USER_DEPLOYING');
      if (profile === 'sheet') {
        assert.deepEqual(manifest.oauthScopes, [
          'https://www.googleapis.com/auth/spreadsheets.readonly',
          'https://www.googleapis.com/auth/script.scriptapp'
        ]);
      } else {
        assert.equal(manifest.oauthScopes, undefined);
      }
    }
  } finally {
    execFileSync(process.execPath, ['scripts/init-project.mjs', '--profile', originalProfile], { stdio: 'inherit' });
  }
});

test('deployment workflows preserve and verify stable deployment pointers', () => {
  for (const file of ['.github/workflows/deploy-dev.yml', '.github/workflows/deploy-prod.yml']) {
    const workflow = readFileSync(resolve(file), 'utf8');
    assert.match(workflow, /scripts\/redeploy-stable\.sh/);
    assert.doesNotMatch(workflow, /^\s*run:\s*clasp create-deployment/m);
  }
  const deploymentScript = readFileSync('scripts/redeploy-stable.sh', 'utf8');
  assert.match(deploymentScript, /create-version/);
  assert.match(deploymentScript, /\bredeploy\b/);
  assert.match(deploymentScript, /EXPECTED_VERSION/);
  assert.doesNotMatch(deploymentScript, /\bcreate-deployment\b/);
});

test('Canvas build reports its portable source contract', () => {
  const build = readFileSync('recipes/canvas-publish/build.mjs', 'utf8');
  const adapter = readFileSync('recipes/canvas-publish/src/canvas-adapter.tsx', 'utf8');
  assert.match(build, /Ensure src\/App\.tsx exists and default-exports/);
  assert.match(adapter, /from '\.\.\/\.\.\/\.\.\/src\/App'/);
  assert.doesNotMatch(adapter, /\/Users\/|[A-Za-z]:\\/);
});

test('stable redeploy helper supports default and explicit clasp project files', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'clasp-redeploy-'));
  const fakeClasp = join(fixture, 'clasp');
  const state = join(fixture, 'redeployed');
  const log = join(fixture, 'calls.log');
  writeFileSync(fakeClasp, `#!/usr/bin/env bash
set -eu
if [[ "\${1:-}" == "-P" ]]; then printf 'project:%s\\n' "$2" >> "${log}"; shift 2; fi
case "$1" in
  deployments) if [[ -f "${state}" ]]; then echo "stable-id @2"; else echo "stable-id @1"; fi ;;
  create-version) echo "Created version 2" ;;
  redeploy) touch "${state}" ;;
  *) exit 2 ;;
esac
`);
  chmodSync(fakeClasp, 0o755);
  const environment = {
    ...process.env,
    PATH: `${fixture}:${process.env.PATH}`,
    DEPLOYMENT_ID: 'stable-id',
    DEPLOY_DESCRIPTION: 'fixture update'
  };
  execFileSync('bash', ['scripts/redeploy-stable.sh'], { env: environment, stdio: 'inherit' });
  rmSync(state);
  execFileSync('bash', ['scripts/redeploy-stable.sh'], {
    env: { ...environment, CLASP_PROJECT_FILE: '.clasp-prod.json' },
    stdio: 'inherit'
  });
  assert.match(readFileSync(log, 'utf8'), /project:\.clasp-prod\.json/);
});
