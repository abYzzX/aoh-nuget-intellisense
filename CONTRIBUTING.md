# Contributing to AOH - NuGet IntelliSense

Thanks for taking the time to improve AOH - NuGet IntelliSense.

Before making a larger change, read [AOH-RULES.md](AOH-RULES.md) for the shared AOH workflow and [EXTENSION-DESIGN.md](EXTENSION-DESIGN.md) for this extension's goals, boundaries, architecture, and intentional design decisions.

## Workflow

`master` is the stable/releasable branch and should not receive direct development pushes.

1. Create a branch from `master`.
2. Make the smallest focused change that solves the problem.
3. Add or update tests for deterministic behavior.
4. Run the build and tests locally.
5. Open a pull request against `master`.
6. Make the semantic-version impact explicit in the merge/commit message.

Suggested branch names:

```text
feature/<name>
fix/<name>
```

Branch names are organizational only. They do not determine the release version.

## Version impact

Every change merged to `master` must explicitly declare its semantic-version impact:

| Marker | Use for |
| --- | --- |
| `+semver: none` | Documentation, comments, CI maintenance, or other changes that do not require a new extension release |
| `+semver: patch` | Backwards-compatible bug fixes |
| `+semver: minor` | Backwards-compatible features |
| `+semver: major` | Breaking changes |

Examples:

```text
Fix version completion for private feeds +semver: patch
Add packages.config support +semver: minor
Update README wording +semver: none
```

GitVersion calculates release versions from Git history and these markers. Do not manually bump the extension version for normal development changes.

## Build and tests

Install dependencies:

```text
npm install
```

Compile:

```text
npm run compile
```

Run the automated test suite:

```text
npm test
```

Pull requests must compile and pass the automated tests before merge.

Tests live under `src/test/` and are compiled to `out/test/`. Prefer small deterministic tests over large mocks of the VS Code API.

New supported NuGet/MSBuild file formats must include tests that prove the relevant package syntax is actually understood. Adding a filename or extension to a selector alone is not sufficient.

## Design expectations

- Keep the extension focused on NuGet IntelliSense.
- Prefer existing NuGet/.NET behavior over reimplementing NuGet semantics.
- Keep deterministic parsing, ranking, and version logic independent from the VS Code API where practical.
- Preserve failure isolation between package sources.
- Never log credentials, access tokens, or passwords.
- Avoid provider-specific dependencies unless they solve a concrete requirement and fit the existing design.
- Do not silently change public commands or settings.

For the reasoning behind these decisions, see [EXTENSION-DESIGN.md](EXTENSION-DESIGN.md).

## Documentation

Update documentation when behavior visible to users or contributors changes:

- `README.md` for user-facing features, settings, commands, requirements, and usage.
- `AOH-RULES.md` for shared AOH development, testing, versioning, release, changelog, and documentation rules.
- `EXTENSION-DESIGN.md` for architectural decisions, requirements, limitations, and supported formats.
- `CHANGELOG.md` for user-visible release changes.
- `AGENT.md` when development rules or coding-agent expectations change.

## Changelog

User-visible changes belong under the appropriate section in `CHANGELOG.md` → `Unreleased`.

Use the categories from Keep a Changelog where they fit: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, and `Security`.

Documentation-only changes do not need a release merely to move them out of `Unreleased`; use `+semver: none` when no extension package should be published.

## License

By contributing, you agree that your contribution is provided under the repository's [MIT License](LICENSE).
