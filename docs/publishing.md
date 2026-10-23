# Publishing releases and HACS updates

Repository: https://github.com/nd4y/ha-material3. HACS category: Dashboard (backend `plugin`). Minimum supported HA: 2026.9.0.

## Release procedure

1. Create a feature branch from the default branch. Change the code, bump `package.json` and `package-lock.json` with `npm version patch --no-git-tag-version`, and update `CHANGELOG.md`.
2. Run `npm ci`, `npm run check`, and `python3 scripts/package.py`. Commit the matching complete `dist/` and generated theme, including fonts and licenses. Use LF endings from `.gitattributes`.
3. Open a pull request. After the checks pass and the PR is merged, tag the merged commit with the package version: `git tag v0.1.2` then `git push origin v0.1.2`.
4. The Release workflow verifies the version, reachability from the default branch, tests/audit and byte-exact committed distribution. `scripts/stage-hacs-release.py` stages flat runtime files, archives and `SHA256SUMS` in the `verified-release` workflow artifact. The publish job alone has repository write permission.
5. Stable releases from v0.15.1 have no attached assets. HACS 2.0.5 otherwise downloads every release asset through a GitHub redirect whose CSP header can exceed its parser limit. Without attached assets, native HACS falls back to the complete `dist` tree at the release tag via raw.githubusercontent.com. This keeps immutable versioned installs and update tracking without patching HACS. Do not attach a bare JS or ZIP to these stable releases. Tag source archives and CI packages remain available. Historical v0.1.3-v0.15.0 used flat release assets.