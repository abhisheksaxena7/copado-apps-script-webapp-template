# Design guidance

- Use a light canvas, one cyan accent, rounded cards, and one dark hero area.
- Keep text at readable contrast and preserve visible keyboard focus.
- Use semantic elements and labels; interactions must work without a mouse.
- Preserve `<meta name="viewport">` and test a 390-pixel viewport without horizontal overflow.
- Keep the page self-contained. Do not add CDN scripts, runtime fonts, analytics, trackers, or second-fetch dependencies without security review.
- Use fictional sample content. Never copy production rows or generated reports into fixtures.
- Parameterize the page title, application chrome, storage-key namespace, and smoke selector through `project.config.json`.

Copado names and visual assets may require brand approval before public release. Do not treat this starter as a substitute for the current internal design system.
