import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { formatError, log } from './logger';

export interface Credentials {
    username: string;
    password: string;
}

export function getAzureArtifactsCredentials(
    uri: string,
    isRetry: boolean
): Credentials | undefined {
    if (process.platform !== 'win32') {
        log('Azure Artifacts Credential Provider standalone lookup is currently enabled on Windows only.');
        return undefined;
    }

    const provider = findAzureArtifactsCredentialProvider();

    if (!provider) {
        log('Azure Artifacts Credential Provider not found under ~/.nuget/plugins.');
        return undefined;
    }

    log(`Credential Provider: ${provider.kind} (${provider.path})`);

    const args = [
        '-Uri', uri,
        '-NonInteractive', 'true',
        '-CanShowDialog', 'false',
        '-IsRetry', isRetry ? 'true' : 'false',
        '-OutputFormat', 'Json',
        '-Verbosity', 'Error'
    ];

    const command = provider.kind === 'dll' ? 'dotnet' : provider.path;
    const commandArgs = provider.kind === 'dll'
        ? [provider.path, ...args]
        : args;

    const result = spawnSync(command, commandArgs, {
        encoding: 'utf8',
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    if (result.error) {
        log(`Credential Provider failed to start: ${result.error.message}`);
        return undefined;
    }

    if (result.status !== 0) {
        const stderr = (result.stderr ?? '').trim();
        log(
            `Credential Provider exited with code ${result.status}` +
            `${stderr ? `: ${redactProviderOutput(stderr)}` : ''}`
        );
        return undefined;
    }

    try {
        const payload = JSON.parse((result.stdout ?? '').trim()) as {
            Username?: string;
            Password?: string;
        };

        if (payload.Username !== undefined && payload.Password !== undefined) {
            log(`Credential Provider returned credentials for ${uri}.`);
            return {
                username: payload.Username,
                password: payload.Password
            };
        }

        log('Credential Provider JSON did not contain Username/Password.');
    } catch (error) {
        log(`Credential Provider returned invalid JSON: ${formatError(error)}`);
    }

    return undefined;
}

function findAzureArtifactsCredentialProvider():
    { path: string; kind: 'exe' | 'dll' } | undefined {
    const home = os.homedir();

    const candidates = [
        path.join(
            home,
            '.nuget',
            'plugins',
            'netfx',
            'CredentialProvider.Microsoft',
            'CredentialProvider.Microsoft.exe'
        ),
        path.join(
            home,
            '.nuget',
            'plugins',
            'netcore',
            'CredentialProvider.Microsoft',
            'CredentialProvider.Microsoft.exe'
        ),
        path.join(
            home,
            '.nuget',
            'plugins',
            'netcore',
            'CredentialProvider.Microsoft',
            'CredentialProvider.Microsoft.dll'
        )
    ];

    for (const candidate of candidates) {
        try {
            fs.accessSync(candidate);

            return {
                path: candidate,
                kind: candidate.toLowerCase().endsWith('.dll') ? 'dll' : 'exe'
            };
        } catch {
            // Try next known NuGet plugin location.
        }
    }

    return undefined;
}

function redactProviderOutput(value: string): string {
    return value
        .replace(/("Password"\s*:\s*")[^"]*(")/gi, '$1***$2')
        .replace(/(Password\s*:\s*)\S+/gi, '$1***');
}
