# AOH - NuGet IntelliSense — Extension Design

This document contains the extension-specific requirements, architectural decisions, solved problems, and current limitations of AOH - NuGet IntelliSense.

Shared AOH development, versioning, release, changelog, security, and agent rules live in `AOH-RULES.md`. Repository-specific coding-agent instructions live in `AGENT.md`.

It exists so future development does not accidentally replace deliberate NuGet IntelliSense decisions with more complicated implementations simply because the original reasoning was no longer visible.

## Goals

AOH - NuGet IntelliSense should make NuGet package editing in VS Code feel native and unsurprising.

The core goals are:

- Provide package ID IntelliSense in NuGet/MSBuild files.
- Provide package version IntelliSense for the package currently being edited.
- Work with multiple public and private package sources.
- Respect the user's real NuGet configuration instead of maintaining a second configuration model inside the extension.
- Support Central Package Management.
- Keep unavailable package sources isolated so one broken feed does not break all completion.
- Support common private-feed authentication without storing credentials itself.
- Keep the implementation small enough to understand and maintain.

## Non-goals

The extension is not intended to become:

- a NuGet package manager UI,
- a replacement for `dotnet restore`,
- a replacement for NuGet's own configuration resolution,
- a provider-specific Azure DevOps extension,
- or a complete MSBuild language server.

Those responsibilities already have better owners.

## Requirements and solutions

### Package ID completion

**Requirement:** When the user edits a package declaration, matching package IDs should be offered through normal VS Code IntelliSense.

**Solution:** `NugetCompletionProvider` detects the current XML attribute context and delegates package search to `packageSearch.ts`. Results from all configured sources are merged, ranked, deduplicated, and returned as VS Code completion items.

Supported package elements today:

- `PackageReference`
- `PackageVersion`

Supported package-ID attributes today:

- `Include`
- `Update`

### Version completion

**Requirement:** When the user edits a package version, available versions for that package should be offered.

**Solution:** The current XML tag is inspected to resolve the package ID. `versionLookup.ts` then queries NuGet v3 flat-container or registration endpoints and combines the results from all configured feeds.

Version ordering is intentionally kept in the pure `versionUtils.ts` module so it can be tested without a VS Code runtime.

### Central Package Management

**Requirement:** `Directory.Packages.props` should work naturally.

**Solution:** Central Package Management uses `PackageVersion` elements inside a `.props` file. The same XML completion logic therefore works without a separate Central Package Management subsystem.

### Source discovery

**Requirement:** Respect the effective NuGet source configuration including inherited `NuGet.Config` files, disabled sources, and `<clear />`.

**Rejected approach:** Reimplement the complete NuGet configuration-merging algorithm inside the extension.

**Chosen solution:** Run:

```text
dotnet nuget list source --format Detailed
```

from the most appropriate working directory and let NuGet itself resolve the effective configuration.

This deliberately makes the installed NuGet/.NET tooling the source of truth.

### Additional sources

**Requirement:** Allow a feed to be added without editing a user's NuGet configuration.

**Solution:** `aoh.nugetIntellisense.additionalSources` accepts additional NuGet v3 service-index URLs. These sources are appended after normal discovery.

### Credentials

**Requirement:** Private feeds configured with normal NuGet credentials should work.

**Solution:** AOH reads the applicable NuGet configuration files only for credential lookup and applies matching `packageSourceCredentials` entries to already-discovered sources.

Supported credential forms include clear-text credentials and, on Windows, NuGet's protected password format when it can be decrypted for the current user.

Environment-variable references in credential values are expanded.

### Azure Artifacts

**Requirement:** Azure Artifacts feeds should be usable without embedding Azure-specific login flows into AOH.

**Solution:** If normal HTTP authentication is insufficient, AOH can delegate credential acquisition to an installed Azure Artifacts Credential Provider.

This keeps authentication ownership with the existing NuGet ecosystem instead of introducing another token store.

### Failure isolation

**Requirement:** A dead or unauthorized feed must not kill package completion from healthy feeds.

**Solution:** Feed operations are executed independently and source-specific failures are caught. Successful sources can still contribute results.

### Caching

**Requirement:** IntelliSense must not issue unnecessary network requests on every keystroke.

**Solution:** Package searches, versions, service endpoints, and temporary authentication data are cached. The normal cache duration is configurable. Manual refresh and relevant configuration changes clear caches.

### Logging

**Requirement:** Problems with source discovery and private feeds must be diagnosable without leaking secrets.

**Solution:** A dedicated `AOH - NuGet IntelliSense` output channel records source discovery, requests, authentication attempts, result counts, and failures. Passwords and access tokens must never be logged.

## Current file-format support

The current `0.1.x` implementation activates on:

| Format | Current support | Notes |
| --- | --- | --- |
| `.csproj` | ✅ | Primary project format. |
| `.props` | ✅ | Includes `Directory.Build.props` and `Directory.Packages.props`. |
| `.targets` | ✅ | Includes `Directory.Build.targets`. |

## Planned file-format support

The following formats are candidates for broader NuGet IntelliSense support. They are intentionally documented as planned rather than silently claimed as supported.

| Format | Purpose | Priority / note |
| --- | --- | --- |
| `.fsproj` | F# project | High |
| `.vbproj` | VB.NET project | High |
| `.vcxproj` | C++ / C++/CLI MSBuild project | Supported by NuGet/MSBuild patterns; validate behavior first |
| `.props` | MSBuild properties/items | Already supported |
| `.targets` | MSBuild targets/items | Already supported |
| `Directory.Build.props` | Central MSBuild configuration | Already supported through `.props` |
| `Directory.Build.targets` | Central MSBuild configuration | Already supported through `.targets` |
| `Directory.Packages.props` | Central Package Management | Already supported through `.props` |
| `packages.config` | Legacy NuGet package format | Legacy; needs separate XML-context logic |
| `.nuspec` | NuGet package specification | Useful, but semantics differ from `PackageReference` |
| `.nuproj` | Legacy/rare NuGet packaging project | Low priority / legacy |

Adding a filename to the document selector is not sufficient by itself. Each format must be checked for the XML structures in which package IDs and versions actually appear, and tests should be added before claiming support.

## Architecture

The extension is intentionally split into small responsibilities:

```text
VS Code Completion Provider
        │
        ├── XML context detection
        │
        ├── Package search
        │      └── NuGet v3 service endpoints
        │
        ├── Version lookup
        │      └── Flat container / registrations
        │
        └── Source manager
               ├── dotnet source discovery
               ├── NuGet.Config credentials
               ├── additional configured feeds
               └── credential provider integration
```

Relevant modules:

- `extension.ts` — activation, commands, completion registration, refresh hooks
- `completionProvider.ts` — VS Code completion mapping
- `xmlContext.ts` — package/version attribute detection
- `sourceDiscovery.ts` — determines the NuGet working directory and invokes source discovery
- `sourceManager.ts` — manages the effective source list
- `nugetConfig.ts` — finds config files and resolves configured credentials
- `credentialProvider.ts` — external credential-provider integration
- `nugetHttp.ts` — HTTP/service-index handling
- `packageSearch.ts` — package ID search
- `versionLookup.ts` — package version retrieval
- `versionUtils.ts` — pure version ordering logic
- `cache.ts` — shared cache helpers
- `logger.ts` — diagnostic output

## Testing strategy

Tests should focus on deterministic behavior that can fail silently and is valuable to protect during refactoring.

The initial suite covers:

- supported/unsupported XML filename detection,
- package-context detection,
- version-context detection,
- credential matching,
- XML entity decoding in credentials,
- environment-variable expansion,
- and package version ordering.

Network behavior and VS Code UI integration are deliberately not mocked heavily in the first test pass. If those areas become unstable, add focused integration tests rather than building a large fake VS Code/NuGet environment.

## Known limitations

- Completion currently activates only for `.csproj`, `.props`, and `.targets` files.
- XML context detection is intentionally targeted at package-related attributes rather than being a full XML/MSBuild parser.
- Version comparison is sufficient for current NuGet completion ordering but is not intended to replace a complete SemVer/NuGet versioning library.
- Some private feeds require an external credential provider or an interactive login before background requests can succeed.
- Source discovery requires the `dotnet` CLI.

## Extension-specific design principles

When extending AOH - NuGet IntelliSense:

1. Prefer existing NuGet/.NET behavior over reimplementing it.
2. Keep provider-specific code at integration boundaries.
3. Do not allow one source failure to break all sources.
4. Never log secrets.
5. Keep pure logic separate from VS Code APIs where practical so it remains testable.
6. Add support for formats based on their actual package semantics, not only their file extension.
7. Prefer a small understandable implementation over speculative abstraction.
