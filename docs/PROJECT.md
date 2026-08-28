# Project decisions

Complete this file before the first deployment.

- Purpose and audience:
- Profile (`static`, `sheet`, or `canvas`):
- Maintainer team (no personal email required):
- Data owner:
- Whitelisted fields:
- Script Properties:
- Development Apps Script project owner:
- Production Apps Script project owner:
- Stable `/exec` URLs (record in an approved internal system, not public template history):
- Approved iframe/SalesHood host:
- OAuth scopes and justification:
- Production reviewers:

## Human-gate checklist

- [ ] Apps Script API enabled by the intended owner.
- [ ] `clasp login` completed locally without sharing credentials.
- [ ] Manifest reviewed for `DOMAIN`, `USER_DEPLOYING`, and minimal scopes.
- [ ] Sheet access is read-only and the source owner approved the fields.
- [ ] Script Properties configured.
- [ ] OAuth consent/re-consent completed after the last scope change.
- [ ] GitHub Actions secrets and variables created by an authorized maintainer.
- [ ] One stable deployment created for each environment and IDs recorded.
- [ ] Direct domain-user access tested.
- [ ] Iframe/SalesHood behavior tested.
- [ ] Production promotion explicitly approved.
