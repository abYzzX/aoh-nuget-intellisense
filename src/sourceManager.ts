import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import { execFileSync } from 'child_process';
import { formatError, log } from './logger';
import {
    applyCredentials,
    findNugetConfigs
} from './nugetConfig';
import {
    findNugetWorkingDirectory,
    parseDotnetNugetSources
} from './sourceDiscovery';
import { NugetSource } from './types';

let sources: NugetSource[] = [];

export function getSources():
readonly NugetSource[] {
    return sources;
}

export async function refreshSources():
Promise<void> {
    const workingDirectory =
        await findNugetWorkingDirectory();

    log(
        `Loading NuGet sources via dotnet in: ` +
        `${workingDirectory}`
    );

    let resolvedSources: NugetSource[] = [];

    try {
        const outputText =
            execFileSync(
                'dotnet',
                [
                    'nuget',
                    'list',
                    'source',
                    '--format',
                    'Detailed'
                ],
                {
                    cwd: workingDirectory,
                    encoding: 'utf8',
                    windowsHide: true,
                    stdio: [
                        'ignore',
                        'pipe',
                        'pipe'
                    ]
                }
            );

        resolvedSources =
            parseDotnetNugetSources(
                outputText
            );

        log(
            `dotnet resolved ` +
            `${resolvedSources.length} ` +
            `enabled source(s).`
        );
    } catch (error) {
        log(
            `dotnet nuget list source failed: ` +
            `${formatError(error)}`
        );

        sources = [];
        return;
    }

    await loadConfiguredCredentials(
        workingDirectory,
        resolvedSources
    );

    addConfiguredSources(
        resolvedSources
    );

    sources =
        resolvedSources.filter(
            source =>
                /^https?:\/\//i.test(
                    source.url
                )
        );

    log(`Loaded ${sources.length} source(s):`);

    for (const source of sources) {
        const hasAuth =
            source.username !== undefined &&
            source.password !== undefined;

        log(
            `  ${source.name} -> ${source.url} ` +
            `[auth: ${hasAuth ? 'yes' : 'no'}]`
        );
    }
}

async function loadConfiguredCredentials(
    workingDirectory: string,
    resolvedSources: NugetSource[]
): Promise<void> {
    const configs =
        await findNugetConfigs(
            workingDirectory
        );

    for (const configPath of configs) {
        try {
            const configText =
                await fs.readFile(
                    configPath,
                    'utf8'
                );

            applyCredentials(
                configText,
                resolvedSources
            );

            log(
                `Credential config checked: ` +
                `${configPath}`
            );
        } catch (error) {
            const code =
                (error as NodeJS.ErrnoException)
                    ?.code;

            if (code !== 'ENOENT') {
                log(
                    `Credential config skipped: ` +
                    `${configPath} ` +
                    `(${formatError(error)})`
                );
            }
        }
    }
}

function addConfiguredSources(
    resolvedSources: NugetSource[]
): void {
    const additional =
        vscode.workspace
            .getConfiguration(
                'aoh.nugetIntellisense'
            )
            .get<string[]>(
                'additionalSources',
                []
            );

    additional.forEach(
        (url: string, index: number) => {
            const trimmed =
                url?.trim();

            if (!trimmed) {
                return;
            }

            resolvedSources.push({
                name:
                    `Additional ${index + 1}`,
                url: trimmed
            });
        }
    );
}
