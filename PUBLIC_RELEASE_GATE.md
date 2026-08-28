# Public release gate

Confirmed by the repository owner on 2026-08-28: republication authority, Copado-branded/adapted material approval, personal-account publication, MIT compatibility, and required attribution.

Do not publish this repository until an authorized human confirms:

- Copado-specific documentation, naming, visual guidance, and deployment patterns may be republished from the intended personal public account.
- Adapted source has known provenance and license compatibility.
- MIT is the approved outbound license and required attribution is present.
- A staged-content secret/privacy scan finds no credentials, IDs, owner emails, live URLs, business data, generated reports, or machine paths.
- GitHub CLI is authenticated as the intended owner.
- The local static, Sheet, and Canvas test matrix passes.
- A live domain-restricted canary proves stable-URL redeployment before a `v1.0.0` release.

The live canary requirement passed on 2026-08-28: fictional read-only Sheet data, domain rejection, and one unchanged `/exec` URL advancing from version 1 to version 2. The paired skill's cross-agent and embed gates still govern the `v1.0.0` release.

Record approval in the authorized internal system; do not put private approver details here.
