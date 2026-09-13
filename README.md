# AOH - NuGet IntelliSense

NuGet package and version IntelliSense for Visual Studio Code.

AOH - NuGet IntelliSense adds completion for NuGet package IDs and versions directly inside supported MSBuild XML files. It is designed around real-world NuGet setups: multiple feeds, private sources, `NuGet.Config` inheritance, Central Package Management, Azure Artifacts authentication, and temporarily unavailable package servers.

> **AOH — Making VS Code grow up.**  
> Fix the annoying shit. Keep the good shit.

## Features

- Package ID completion for `PackageReference` and `PackageVersion`
- Version completion for the selected package
- Central Package Management support through `Directory.Packages.props`
- Stable/prerelease filtering
- Multiple NuGet sources
- Automatic source discovery through the installed NuGet/.NET tooling
- `NuGet.Config` hierarchy support
- Enabled/disabled source handling
- `<clear />` behavior resolved by NuGet itself
- Classic `NuGet.Config` credentials
- Azure Artifacts Credential Provider integration
- Additional manually configured NuGet v3 feeds
- Caching for package searches, version lookups, and service endpoints
- Failure isolation between package sources
- Dedicated diagnostic output channel

## Supported files

The current `0.1.x` implementation activates completion for:

| File | Support |
| --- | --- |
| `.csproj` | ✅ |
| `.props` | ✅ |
| `.targets` | ✅ |
| `Directory.Build.props` | ✅ via `.props` |
| `Directory.Build.targets` | ✅ via `.targets` |
| `Directory.Packages.props` | ✅ via `.props` |

Additional NuGet/MSBuild formats are planned. See [EXTENSION-DESIGN.md](EXTENSION-DESIGN.md) for the roadmap and design notes.

## Package completion

Inside a package declaration, start typing the package ID:

```xml
<ItemGroup>
  <PackageReference Include="Newtonsoft.J" Version="13.0.3" />
</ItemGroup>
```

AOH queries the configured NuGet sources and offers matching package IDs through normal VS Code completion. Selecting a package replaces the complete current attribute value.

`Include` and `Update` are supported on both `PackageReference` and `PackageVersion` elements.

## Version completion

When editing the `Version` attribute of a package declaration, AOH resolves the package ID from the current XML tag and loads available versions from the configured feeds.

```xml
<PackageReference Include="Serilog" Version="3." />
```

Versions are sorted descending. Prerelease versions are hidden by default and can be enabled through settings.

## Central Package Management

Because `Directory.Packages.props` is a normal `.props` file, Central Package Management works without a separate mode:

```xml
<ItemGroup>
  <PackageVersion Include="Serilog" Version="4.2.0" />
</ItemGroup>
```

## NuGet source discovery

AOH deliberately does **not** reimplement NuGet's configuration hierarchy.

Instead, it asks the installed .NET/NuGet tooling for the effective source configuration:

```text
dotnet nuget list source --format Detailed
```

The command is executed from the most appropriate solution/workspace directory. NuGet itself therefore remains responsible for configuration inheritance, enabled and disabled sources, and `<clear />` behavior.

Additional NuGet v3 service-index URLs can be configured through `aoh.nugetIntellisense.additionalSources`.

## Authentication

AOH can use credentials configured in `NuGet.Config`.

When a package source returns HTTP 401, the extension can also use an Azure Artifacts Credential Provider installed in the standard NuGet plugin location. Credentials returned by the provider are cached in memory for subsequent requests.

AOH does not log passwords or access tokens.

For Azure Artifacts environments without an existing cached login, an interactive NuGet operation may be required once:

```text
dotnet restore --interactive
```

## Failure isolation

Package sources are queried independently. One dead, private, misconfigured, or temporarily unavailable source should not prevent working feeds from providing IntelliSense results.

## Commands

Open the Command Palette and use:

- `AOH - NuGet IntelliSense: Refresh Sources`
- `AOH - NuGet IntelliSense: Clear Cache`

Saving a `NuGet.Config` file also refreshes source discovery and clears cached package data.

## Settings

| Setting | Default | Description |
| --- | ---: | --- |
| `aoh.nugetIntellisense.includePrerelease` | `false` | Include prerelease package versions. |
| `aoh.nugetIntellisense.cacheMinutes` | `10` | Cache lifetime for package/version results. |
| `aoh.nugetIntellisense.maxPackageResults` | `40` | Maximum package completion results per feed. |
| `aoh.nugetIntellisense.minSearchCharacters` | `2` | Characters required before package search starts. |
| `aoh.nugetIntellisense.additionalSources` | `[]` | Additional NuGet v3 service-index URLs. |

## Diagnostics

The `AOH - NuGet IntelliSense` output channel contains information about source discovery, authentication attempts, searches, version lookups, result counts, and failures.

Credentials are not written to the log.

## Requirements

- Visual Studio Code `1.96` or newer
- .NET SDK / `dotnet`

Azure Artifacts feeds that require plugin-based authentication additionally need the Azure Artifacts Credential Provider.

## Development

Install dependencies and compile:

```text
npm install
npm run compile
```

Run the automated tests:

```text
npm test
```

The current test suite covers XML context detection, NuGet credential parsing, environment-variable expansion, and package version ordering.

Shared AOH repository rules are documented in [AOH-RULES.md](AOH-RULES.md). Extension architecture and design decisions are documented in [EXTENSION-DESIGN.md](EXTENSION-DESIGN.md). Contribution guidelines are in [CONTRIBUTING.md](CONTRIBUTING.md), release history in [CHANGELOG.md](CHANGELOG.md), and repository-specific coding-agent guidance in [AGENT.md](AGENT.md).

## License

MIT - See [LICENSE](LICENSE)
