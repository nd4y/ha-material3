# Reproduce the public documentation media

All preview data is hardcoded, synthetic and independent of HA. No camera, household configuration, session, host address or production log is loaded. Screenshots show only the page content, without browser chrome. The page has generic device labels and a visible demonstration notice.

Use a project-scoped environment on the build host. Do not reuse a personal browser profile. The validated renderer uses Node24, `playwright-core@1.64.0`, `mermaid@11.12.0` and the existing `mcr.microsoft.com/playwright:v1.64.0-noble` browser image. Install the two renderer packages into a separate tool prefix, not the module's production dependencies. Jinja requirements are in `tests/controller/requirements.txt`.

```sh
python3 docs/tools/generate-condition-index.py
npm install --prefix /work/tools --no-save --no-package-lock playwright-core@1.64.0 mermaid@11.12.0
node docs/tools/render-public-media.mjs /work/src /work/tools
```

The module's committed `dist/` must match its release and have its normal build dependencies available for generating the shared theme. The renderer binds a temporary loopback-only server, uses a fresh browser context, blocks nonlocal requests and closes both server and browser. It renders every `.mmd` diagram, captures desktop/mobile/menu/fault states, validates component counts and mobile overflow, and rejects text/EXIF PNG metadata. `privacy-report.json` records hashes and checks, without browsing history or personal state. A visual inspection is still required before publishing.

Normal documentation reproduction does not contact a live HA instance, change hardware or rebuild the frontend. Regenerate diagrams and the condition inventory after policy changes. The generated conditional-tag inventory is the exact source reference for compact flowchart summaries.
