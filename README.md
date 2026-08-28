# Copado Apps Script Web App Template

A flattened, private-by-default starter for domain-restricted Copado internal pages on Google Apps Script. It supports three deliberate profiles:

- `static`: self-contained HTML and no OAuth scopes.
- `sheet`: sample-data fallback, server-side Advanced Sheets Service reads, and read-only Sheet access.
- `canvas`: vendored React source bundled into one self-contained HTML file.

Public template code must not contain business data, account emails, script/deployment IDs, Sheet IDs, OAuth files, or generated reports. Repositories created from this public template should remain private unless an authorized reviewer approves otherwise.

## Start a project

Use GitHub's **Use this template** flow and choose **Private**, or clone a pinned release. Then:

```bash
npm ci
npm run init -- \
  --profile static \
  --name my-internal-tool \
  --title "My Internal Tool" \
  --storage-key my-internal-tool
npx playwright install chromium
npm test
```

For Sheet projects, also pass `--sheet-property MY_TOOL_SHEET_ID`. For Canvas projects, replace `src/App.tsx`; the build fails clearly if the default export is missing.

The initializer never creates a GitHub repository, uploads credentials, authenticates Google, or deploys production. Those are human gates.

## Local workflow

```bash
npm run validate
npm test
npm run sync          # static/sheet after editing index.html
npm run build:canvas  # canvas after editing src/App.tsx
```

`index.html` and `apps-script/index.html` must be identical. The generated Apps Script copy is ignored because it is build output.

## Google and GitHub setup — human gates

1. Enable the Apps Script API in the intended owner account.
2. Run `clasp login` yourself; never paste OAuth JSON into chat or logs.
3. Create separate Apps Script projects and one stable web-app deployment per environment.
4. Keep web-app access at `DOMAIN` and execution at `USER_DEPLOYING`.
5. For `sheet`, set the configured Script Property, enable the Advanced Sheets Service, share the Sheet read-only, run `setup()` in the editor, and complete OAuth consent.
6. Store `CLASPRC_JSON` in GitHub Actions secrets only with explicit authorization.
7. Configure repository variables `DEV_SCRIPT_ID`, `DEV_DEPLOYMENT_ID`, `PROD_SCRIPT_ID`, and `PROD_DEPLOYMENT_ID`.
8. Protect the `production` environment with required reviewers.

The workflows create an immutable version, `redeploy` the existing deployment ID, and verify its version pointer. They never call `create-deployment`. Production is manual and confirmation-protected.

## Scope changes

Changing profiles after deployment can change OAuth scopes. A human must review the manifest, re-run `setup()` where applicable, complete re-consent, test with a domain account, and only then approve deployment.

## Embedding

The backend uses `ALLOWALL` so the domain-restricted `/exec` page can render in an approved iframe such as SalesHood. Domain authentication and third-party cookie policies still apply. Test direct access before debugging an embed.

See `docs/PROJECT.md`, `docs/DESIGN.md`, `apps-script/README.md`, and `AGENTS.md` before implementation or deployment.

## Release status

The repository owner confirmed provenance, Copado branding/republication approval, personal-account publication, and MIT compatibility. The public template is released as `v0.1.1`; promotion to `v1.0.0` still requires the live Google Apps Script canary.
