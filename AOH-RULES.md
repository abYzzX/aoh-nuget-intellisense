# AOH — Repository Rules

This document contains the shared development and release rules for AOH repositories.
It is intentionally extension-independent and should be reusable across AOH extension repositories without project-specific changes.

Repository-specific behavior, architecture, supported formats, integrations, and limitations belong in the extension-specific documentation, not in this file.

## AOH development philosophy

- Keep changes small and scoped to the requested problem.
- Preserve existing behavior unless a change is explicitly intended.
- Prefer existing platform APIs and ecosystem tooling over parallel implementations.
- Prefer simple, understandable solutions over speculative abstraction.
- Integrate where useful; introduce dependencies only where they provide clear value.
- Do not perform unrelated cleanup as part of a focused change.
- Treat a known-good version as a stable baseline. Continue development from that baseline through normal branches and pull requests.

## Required project documentation

Every AOH extension repository should keep the following documentation roles separate:

- `AOH-RULES.md` — shared AOH-wide development, versioning, release, documentation, and agent rules.
- `AGENT.md` — repository-specific instructions for coding agents.
- `EXTENSION-DESIGN.md` — repository-specific requirements, architecture, deliberate trade-offs, supported behavior, and limitations.
- `README.md` — user-facing documentation.
- `CONTRIBUTING.md` — contribution and pull-request workflow.
- `CHANGELOG.md` — released changes and current `Unreleased` work.

Do not put extension-specific implementation details into `AOH-RULES.md`. The goal is that this file can be copied unchanged between AOH repositories.

## Before changing code

A coding agent or contributor should:

1. Read the issue or request completely.
2. Read `AOH-RULES.md`.
3. Read `AGENT.md`.
4. Read `EXTENSION-DESIGN.md`.
5. Read `CHANGELOG.md`, especially the `Unreleased` section.
6. Inspect the existing implementation before proposing a replacement.
7. Identify the smallest existing responsibility that should own the change.

## Development workflow

For a normal code change:

1. Implement the smallest reasonable change.
2. Add or update tests for behavior that can be tested deterministically.
3. Run the repository's documented test command.
4. Ensure the project compiles successfully.
5. Update `README.md` when user-facing behavior, settings, commands, requirements, or supported features change.
6. Update `EXTENSION-DESIGN.md` when architecture, requirements, trade-offs, limitations, integrations, or planned behavior change.
7. Add user-visible changes to the `Unreleased` section of `CHANGELOG.md`.
8. Do not modify build, release, or publishing infrastructure unless the task explicitly requires it.

## Testing

Tests should protect behavior that is valuable and reasonably deterministic.

Prefer tests for:

- parsers and context detection,
- path and filename handling,
- ranking, sorting, and state transitions,
- configuration parsing,
- pure transformation logic,
- regression cases for fixed bugs.

Avoid large mocks of the complete VS Code API merely to increase coverage numbers. Use focused integration tests when behavior cannot reasonably be protected as pure logic.

A real-world test in VS Code remains valuable, but it does not replace automated tests for deterministic logic.

## Security

- Never commit or log passwords, bearer tokens, PATs, private keys, credential-provider responses containing secrets, or other authentication material.
- Do not add a new secret store casually.
- Keep credentials scoped to the service or host they belong to.
- Prefer existing platform or ecosystem authentication mechanisms where possible.

## Versioning

AOH repositories use GitVersion and explicit `+semver:` markers to determine release impact.

Supported markers:

- `+semver: patch` — backwards-compatible fixes and corrections.
- `+semver: minor` — backwards-compatible features.
- `+semver: major` — breaking changes.
- `+semver: none` — no extension release is required, for example documentation-only changes.

Branch names such as `feature/*` and `fix/*` organize work but do not determine release impact. The semantic impact must be declared explicitly through the commit or merge message.

Do not manually bump the extension version in normal development. The release pipeline applies the version calculated from Git history.

For changes merged to `master`, the resulting commit must carry the intended semantic-version marker according to the repository's release workflow.

## Build and release pipeline

The repository's Gitea Actions workflows are the canonical CI/release implementation.

General rules:

- Pull requests must build and test the code but must not create a release.
- `+semver: none` must not create a package, tag, Gitea release, Marketplace release, or Open VSX release.
- Release builds use the version calculated by GitVersion.
- Release and publishing infrastructure must not be changed as an unrelated side effect of feature work.
- Public publishing should remain an explicit, controlled step when the repository workflow is designed that way.

## Changelog and release notes

`CHANGELOG.md` is part of the release process, not optional housekeeping.

Before starting work, inspect the `Unreleased` section so existing changes are not duplicated or contradicted.

Every user-visible change must be added under the appropriate `Unreleased` category, typically:

- `Added`
- `Changed`
- `Fixed`
- `Removed`

Write entries for users. Describe the observable improvement or correction rather than low-level implementation details unless those details are important to users.

The release pipeline may use the `Unreleased` changelog content as the Gitea release description. Changelog entries must therefore be meaningful release notes, not internal scratch notes.

## Documentation ownership

Use the documents according to their role:

- User-facing usage and feature documentation → `README.md`
- Shared AOH-wide rules → `AOH-RULES.md`
- Agent instructions specific to this repository → `AGENT.md`
- Extension architecture and design → `EXTENSION-DESIGN.md`
- Contribution process → `CONTRIBUTING.md`
- Release history and pending release notes → `CHANGELOG.md`

When information belongs to more than one audience, keep the authoritative detail in the most appropriate document and link to it rather than duplicating large sections.

## Definition of done

A change is complete when:

- the requested behavior is implemented,
- relevant automated tests exist and pass,
- the project compiles successfully,
- documentation matches the actual behavior,
- user-visible changes are recorded in `CHANGELOG.md`,
- no secrets are exposed,
- and unrelated behavior has not been changed.
