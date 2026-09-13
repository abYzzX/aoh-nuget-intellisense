# AOH - NuGet IntelliSense — Agent Instructions

These instructions contain the repository-specific rules for AI/coding agents working on AOH - NuGet IntelliSense.

Before making changes, read the shared rules in `AOH-RULES.md`, the extension design in `EXTENSION-DESIGN.md`, and the current `Unreleased` section in `CHANGELOG.md`.

## Project intent

AOH - NuGet IntelliSense provides lightweight NuGet package and version completion in Visual Studio Code.

The extension should use the existing .NET/NuGet ecosystem wherever possible rather than reproducing it internally.

## Extension-specific rules

- Prefer VS Code APIs for VS Code behavior.
- Prefer NuGet/.NET tooling for NuGet behavior.
- Do not introduce provider-specific SDKs when an existing NuGet integration point solves the problem.
- Do not build a second NuGet configuration-merging implementation.
- Keep failures isolated per package source.
- Keep deterministic parsing, ranking, and version logic independent from `vscode` where practical so it can be tested with Node alone.
- New supported file formats must have tests that prove their relevant package syntax is handled.

## Responsibility boundaries

Before implementing a change, determine whether it belongs to:

- VS Code activation or commands,
- NuGet source discovery,
- authentication,
- XML context detection,
- package search,
- version lookup,
- caching,
- or logging.

Prefer extending the existing responsibility instead of creating a parallel subsystem.

## Tests

The project uses Node's built-in test runner. Tests live under `src/test/` and are compiled to `out/test/`.

Run:

```text
npm test
```

Favor tests for:

- XML context detection,
- filename/format support,
- NuGet.Config parsing,
- credential matching and environment expansion,
- package-result ranking/deduplication when extracted into pure logic,
- version ordering,
- cache-key or source-resolution behavior that can be made deterministic.

The general AOH testing rules in `AOH-RULES.md` also apply.

## File-format support

Current support is intentionally limited to `.csproj`, `.props`, and `.targets`.

Do not claim support for `.fsproj`, `.vbproj`, `.vcxproj`, `packages.config`, `.nuspec`, or `.nuproj` merely by adding them to a selector. Their relevant NuGet XML semantics must be understood and tested first.

The planned format list and rationale are maintained in `EXTENSION-DESIGN.md`.

## Authentication

Authentication changes deserve extra care.

- Prefer credentials already configured for NuGet.
- Keep Azure Artifacts support behind the existing credential-provider boundary.
- Never persist new secrets unless explicitly designed and reviewed.
- Never include secrets in logs or thrown diagnostic messages.
- Do not silently send credentials to a different host/source than the one they belong to.

The shared security rules in `AOH-RULES.md` also apply.

## Documentation

For this repository:

- Update `README.md` when NuGet IntelliSense behavior visible to users changes.
- Update `EXTENSION-DESIGN.md` when NuGet-specific architecture, requirements, supported formats, integrations, trade-offs, or limitations change.
- Update `AGENT.md` only when repository-specific coding-agent guidance changes.
- Follow `AOH-RULES.md` for changelog, release, versioning, testing, and general documentation rules.
