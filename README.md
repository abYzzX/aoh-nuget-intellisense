# AOH - NuGet IntelliSense

AOH - NuGet IntelliSense adds NuGet package and version completion to .NET project XML files in Visual Studio Code.

The extension is designed to work with real-world NuGet configurations, including multiple feeds, private package sources, Azure Artifacts, and central package management.

## Features

- Package ID completion in `.csproj`, `.props`, and `.targets` files
- Package version completion
- Support for `<PackageReference>`
- Support for `<PackageVersion>` and Central Package Management
- Stable and prerelease package filtering
- Multiple NuGet sources
- Automatic NuGet source discovery
- NuGet.Config hierarchy support
- Enabled and disabled source handling
- `<clear />` behavior delegated to the NuGet tooling
- Classic NuGet.Config credentials
- Azure Artifacts Credential Provider integration
- Caching for package searches, versions, and service endpoints
- Failure isolation between package sources
- Dedicated diagnostic output channel

## NuGet Source Discovery

Rather than implementing the NuGet.Config hierarchy independently, AOH asks the installed .NET/NuGet tooling for the effective source configuration:

```text
dotnet nuget list source --format Detailed
```

The command is executed from the most appropriate solution directory. This allows NuGet itself to resolve configuration inheritance, enabled and disabled sources, and `<clear />` behavior.

Additional sources can also be configured through the extension settings.

## Authentication

AOH supports credentials configured through NuGet.Config.

When a package source returns HTTP 401, the extension can also use the Azure Artifacts Credential Provider installed under the standard NuGet plugin directory. Credentials returned by the provider are cached in memory for subsequent requests.

AOH never logs passwords or access tokens.

For Azure Artifacts environments without an existing cached login, an interactive NuGet operation such as the following may be required once:

```text
dotnet restore --interactive
```

## Package Completion

While editing a supported XML file, AOH detects package-related attributes and provides matching package IDs from the configured sources.

Selecting a package replaces the complete attribute value, including partially typed package prefixes.

## Version Completion

For package version attributes, AOH retrieves available versions from the configured feeds and presents them through normal VS Code completion.

Prerelease versions can be enabled or disabled through the extension settings.

## Failure Isolation

A failing package source does not prevent other sources from providing completion results. This is particularly useful in environments containing private feeds, upstream feeds, or temporarily unavailable package servers.

## Diagnostics

The `AOH - NuGet IntelliSense` output channel contains source discovery, authentication attempts, searches, version lookups, result counts, and errors without exposing credentials.

## Requirements

- Visual Studio Code
- .NET SDK / `dotnet`

For Azure Artifacts authentication, the Azure Artifacts Credential Provider must be installed when the feed requires it.
