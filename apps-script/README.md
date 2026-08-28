# Apps Script setup

The files in this directory are the `clasp` root. `index.html` is generated from the root page or Canvas build and is intentionally ignored.

## Initial setup — human actions

1. Enable the Apps Script API for the owner account.
2. Run `clasp login` locally.
3. Create separate development and production Apps Script projects.
4. Copy `.clasp.json.example` to ignored `.clasp.json` and set the development script ID.
5. Run `npm test`, then `clasp push`.
6. Create each environment's web-app deployment once with access restricted to the Workspace domain and execution as the owner. Record the deployment ID.
7. Every later update must use `scripts/redeploy-stable.sh`.

For the Sheet profile:

1. Set the Script Property named by `project.config.json` to the Sheet ID.
2. Share the Sheet read-only with the script owner.
3. Enable the Advanced Sheets Service.
4. Run `setup()` in the Apps Script editor and approve the declared scopes.
5. After any profile/scope change, repeat consent and test before deployment.

Do not store IDs in `Code.gs`, add write scopes to read a Sheet, or upload `.clasprc.json` outside an explicitly approved GitHub secret workflow.
