import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { Dict, NugetSource } from './types';

export async function findNugetConfigs(
    workingDirectory: string
): Promise<string[]> {
    const result: string[] = [];

    // User-level config first, then workspace configs override it.
    if (process.platform === 'win32') {
        const appData = process.env.APPDATA;

        if (appData) {
            result.push(
                path.join(
                    appData,
                    'NuGet',
                    'NuGet.Config'
                )
            );
        }
    } else {
        result.push(
            path.join(
                os.homedir(),
                '.nuget',
                'NuGet',
                'NuGet.Config'
            )
        );
    }

    const chain: string[] = [];
    let current = workingDirectory;

    while (true) {
        chain.push(current);

        const parent = path.dirname(current);
        if (parent === current) break;

        current = parent;
    }

    chain.reverse();

    for (const directory of chain) {
        result.push(
            path.join(
                directory,
                'NuGet.Config'
            )
        );
        result.push(
            path.join(
                directory,
                'nuget.config'
            )
        );
    }

    return distinctPaths(result);
}

export function applyCredentials(
    xml: string,
    target: NugetSource[]
): void {
    const credBlock =
        /<packageSourceCredentials\b[^>]*>([\s\S]*?)<\/packageSourceCredentials>/i
            .exec(xml)?.[1];

    if (!credBlock) return;

    for (const source of target) {
        applySourceCredentials(
            credBlock,
            source
        );
    }
}

function applySourceCredentials(
    credBlock: string,
    source: NugetSource
): void {
    const escaped =
        escapeRegex(
            xmlTagName(source.name)
        );

    const block =
        new RegExp(
            `<${escaped}\\b[^>]*>` +
            `([\\s\\S]*?)` +
            `<\\/${escaped}>`,
            'i'
        ).exec(credBlock)?.[1];

    if (!block) return;

    const values =
        readCredentialValues(block);

    const username =
        values['Username'];
    const clearTextPassword =
        values['ClearTextPassword'];
    const encryptedPassword =
        values['Password'];
    const password =
        clearTextPassword ??
        decryptNugetPassword(
            encryptedPassword
        );

    if (username !== undefined &&
        password !== undefined) {
        source.username = username;
        source.password = password;
    }
}

function readCredentialValues(
    block: string
): Dict<string> {
    const values: Dict<string> = {};
    const addRe =
        /<add\b([^>]*?)\/?>/gi;

    let match: RegExpExecArray | null;

    while ((match = addRe.exec(block))) {
        const attrs =
            parseAttributes(match[1]);
        const key = attrs.key;
        const value = attrs.value;

        if (key === undefined ||
            value === undefined) {
            continue;
        }

        const expanded =
            expandEnv(value);

        if (expanded !== undefined) {
            values[key] = expanded;
        }
    }

    return values;
}

function decryptNugetPassword(
    value?: string
): string | undefined {
    if (value === undefined ||
        process.platform !== 'win32') {
        return undefined;
    }

    const script = [
        "$encrypted = [Console]::In.ReadToEnd(); $bytes = [Convert]::FromBase64String($encrypted)",
        "$entropy = [Text.Encoding]::UTF8.GetBytes('NuGet')",
        "$clear = [Security.Cryptography.ProtectedData]::Unprotect($bytes, $entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)",
        "[Console]::Out.Write([Text.Encoding]::UTF8.GetString($clear))"
    ].join('; ');

    try {
        const output =
            execFileSync(
                'powershell.exe',
                [
                    '-NoLogo',
                    '-NoProfile',
                    '-NonInteractive',
                    '-Command',
                    script
                ],
                {
                    encoding: 'utf8',
                    windowsHide: true,
                    input: value,
                    stdio: [
                        'pipe',
                        'pipe',
                        'ignore'
                    ]
                }
            );

        return output || undefined;
    } catch {
        return undefined;
    }
}

function parseAttributes(
    text: string
): Dict<string> {
    const result: Dict<string> = {};
    const regex =
        /([A-Za-z_][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

    let match: RegExpExecArray | null;

    while ((match = regex.exec(text))) {
        result[match[1]] =
            decodeXml(
                match[2] ??
                match[3] ??
                ''
            );
    }

    return result;
}

function decodeXml(
    value: string
): string {
    return value
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function expandEnv(
    value?: string
): string | undefined {
    if (value === undefined) {
        return undefined;
    }

    return value.replace(
        /%([^%]+)%|\$([A-Za-z_][A-Za-z0-9_]*)|\$\{([^}]+)\}/g,
        (_, a, b, c) => {
            const key =
                a ?? b ?? c;

            return process.env[key] ?? '';
        }
    );
}

function xmlTagName(
    name: string
): string {
    return name.replace(
        /[^A-Za-z0-9_.-]/g,
        char =>
            `_x${char
                .charCodeAt(0)
                .toString(16)
                .padStart(4, '0')}_`
    );
}

function escapeRegex(
    text: string
): string {
    return text.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
    );
}

function distinctPaths(
    paths: string[]
): string[] {
    const unique: string[] = [];
    const seen =
        new Set<string>();

    for (const candidate of paths) {
        const key =
            process.platform === 'win32'
                ? candidate.toLowerCase()
                : candidate;

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        unique.push(candidate);
    }

    return unique;
}
