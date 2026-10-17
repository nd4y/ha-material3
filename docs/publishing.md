# Publishing releases and HACS updates

Repository: https://github.com/nd4y/ha-material3. HACS category: Dashboard (backend `plugin`). Minimum supported HA: 2026.9.0.

## Release procedure

1. Create a feature branch from the default branch. Change the code, bump `package.json` and `package-lock.json` with `npm version patch --no-git-tag-version`, and update `CHANGELOG.md`.
2. Run `npm ci`, `npm run check`, and `python3 scripts/package.py`. Commit the matching complete `dist/` and generated theme, including fonts and licenses. Use LF endings from `.gitattributes`.
3. Open a pull request. After the checks pass and the PR is merged, tag the merged commit with the package version: `git tag v0.1.2` then `git push origin v0.1.2`.
4. The Release workflow verifies the version, reachability from the default branch, the test/audit results and byte-exact committed distribution. `scripts/stage-hacs-release.py` stages the raw JS, fonts, licenses and manifest as flat release assets, alongside frontend/source archives and `SHA256SUMS`. The publish job alone has repository write permission.
5. HACS 2.0.5 downloads release assets directly. The flat raw files are the runtime; the ZIP files are additional manual/source downloads. ZIP-only Dashboard releases do not work. The plugin does not use integration-only `zip_release`.

The workflow intentionally does not commit, merge PRs or create version tags itself. Publishing an existing tag is idempotent only while its release is absent; do not move a published tag to new source. Fix a failed release with a new version after correcting the underlying problem.

## HACS behavior

The stable release is the update boundary. HACS offers updates through its repository page and HA update entity. Users install an update explicitly and refresh their clients. A loaded page cannot replace already-registered custom elements without reload.

`hide_default_branch: true` prevents the development branch from appearing as an installable version. It does not merge code or make an unpublished tag into a release. Custom-repository installation does not imply inclusion in the default HACS catalog.

For manual-to-HACS migration, first download the HACS repository, then replace the existing module resource with `/hacsfiles/ha-material3/ha-material3.js`, retaining the original files as a temporary rollback. Do not delete or regenerate the user's dashboard YAML or backend helpers. To roll back a release, use HACS Redownload and choose an earlier version, then refresh.
