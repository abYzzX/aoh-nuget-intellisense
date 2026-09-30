# Changelog

All notable changes to AOH - NuGet IntelliSense will be documented in this file.

## 0.1.4

- Update GitHub links
- Update icon

## 0.1.3

- Marketplace release

## 0.1.2

- Split shared AOH repository rules from NuGet IntelliSense-specific agent and extension design documentation.

## 0.1.1

- NuGet package ID completion for `PackageReference` and `PackageVersion` declarations.
- NuGet package version completion with descending version ordering.
- Support for `.csproj`, `.props`, and `.targets` MSBuild XML files, including `Directory.Build.props`, `Directory.Build.targets`, and `Directory.Packages.props`.
- Central Package Management completion through `PackageVersion` declarations.
- NuGet source discovery using the installed .NET/NuGet tooling.
- Support for additional manually configured NuGet v3 feeds.
- `NuGet.Config` credentials and environment-variable expansion.
- Azure Artifacts Credential Provider integration.
- Stable/prerelease filtering and configurable package-result limits.
- Caching for package searches, version lookups, and service endpoints.
- Failure isolation between package sources.
- Diagnostic output channel plus source-refresh and cache-clear commands.
- Automated tests for XML context detection, NuGet configuration handling, credential parsing, and package-version ordering.
- Project documentation for users, design decisions, contributors, and coding agents.
- GitVersion-based semantic versioning and Gitea CI/release workflow.

[Unreleased]: https://github.com/Abyzz/aoh-nuget-intellisense/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Abyzz/aoh-nuget-intellisense/releases/tag/v0.1.0
