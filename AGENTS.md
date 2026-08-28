# Apps Script web-app playbook

This file is the source of truth for every coding agent. IDE-specific rules may reinforce it but must not replace it.

## Before changing code

1. Read `project.config.json` and classify the project as `static`, `sheet`, or `canvas`.
2. Keep the selected profile's backend and OAuth scopes; do not add services speculatively.
3. Treat authentication, Script Properties, Sheet sharing, GitHub secrets, production promotion, and public visibility as human gates.

## Security invariants

- `apps-script/appsscript.json` must use `webapp.access: "DOMAIN"` and `executeAs: "USER_DEPLOYING"`. Reject `ANYONE` and `ANYONE_ANONYMOUS`.
- Static and Canvas profiles declare no OAuth scopes. Sheet uses only `spreadsheets.readonly` and `script.scriptapp`.
- Sheet reads use `Sheets.Spreadsheets.Values.get`, never `SpreadsheetApp`.
- IDs belong in Script Properties, repository variables, or local ignored files—not source.
- Serialize only explicitly whitelisted fields. Escape closing-script sequences before inline injection.
- Never commit, print, upload, or request `CLASPRC_JSON` without explicit user authorization.
- Keep local sample data fictional and safe.

## Source and tests

- Static/Sheet: root `index.html` is authoritative; run `npm run sync`.
- Canvas: `src/App.tsx` is authoritative; run `npm run build:canvas`.
- Keep pages self-contained with no external runtime scripts or stylesheets.
- Preserve the configured smoke selector, mobile viewport metadata, local sample path, and basic interaction.
- Run `npm test` after substantive changes. It validates every profile, the manifest, browser behavior, and deployment workflow contracts.

## Deployment invariants

- Create one web-app deployment per environment manually, then keep its `/exec` URL forever.
- Updates must run `create-version`, `redeploy <stable-id> -V <new-version>`, and verify the stable deployment now points to that version.
- Never replace an environment by calling `create-deployment`.
- Development deploys only after tests. Production is `workflow_dispatch`, confirmation-protected, and should use required environment reviewers.
- Scope changes require human review, OAuth re-consent, and a direct domain-user test before promotion.

## Data and embeds

- Treat externally owned Sheets as read-only. Ask the owner for schema changes.
- Match columns by normalized header name, parse defensively, and skip malformed rows.
- Keep `ALLOWALL` for approved iframe/SalesHood embedding; access remains protected by Workspace domain authentication.
- Test the stable `/exec` URL directly before troubleshooting iframe cookies or host configuration.

End work with synchronized generated HTML and a passing `npm test`. Do not publish, deploy, alter repository visibility, or create credentials unless the user explicitly requests that gate.
