import * as vscode from 'vscode';
import { CacheEntry } from './types';
import {
    getCache,
    setCache
} from './cache';
import { getSources } from './sourceManager';
import {
    fetchJson,
    getServiceEndpoints
} from './nugetHttp';
import { log } from './logger';
import { compareVersionsDesc } from './versionUtils';

const versionCache =
    new Map<
        string,
        CacheEntry<string[]>
    >();

export function clearVersionCache(): void {
    versionCache.clear();
}

export async function getVersions(
    packageId: string,
    token: vscode.CancellationToken
): Promise<string[]> {
    const sources =
        getSources();

    log(
        `Version lookup: "${packageId}" ` +
        `across ${sources.length} source(s).`
    );

    const includePrerelease =
        vscode.workspace
            .getConfiguration(
                'aoh.nugetIntellisense'
            )
            .get<boolean>(
                'includePrerelease',
                false
            );

    const cacheKey =
        `${packageId.toLowerCase()}|` +
        `${includePrerelease}|` +
        sources
            .map(source => source.url)
            .join('|');

    const cached =
        getCache(
            versionCache,
            cacheKey
        );

    if (cached) {
        log(
            `Version lookup result: ` +
            `${cached.length} version(s) ` +
            `[cache].`
        );

        return cached;
    }

    const found =
        new Set<string>();

    await Promise.all(
        sources.map(
            source =>
                collectSourceVersions(
                    source,
                    packageId,
                    token,
                    found
                )
        )
    );

    let versions =
        [...found];

    if (!includePrerelease) {
        versions =
            versions.filter(
                version =>
                    !version.includes('-')
            );
    }

    versions.sort(
        compareVersionsDesc
    );

    log(
        `Version lookup result: ` +
        `${versions.length} version(s).`
    );

    setCache(
        versionCache,
        cacheKey,
        versions
    );

    return versions;
}

async function collectSourceVersions(
    source: ReturnType<typeof getSources>[number],
    packageId: string,
    token: vscode.CancellationToken,
    found: Set<string>
): Promise<void> {
    try {
        const endpoints =
            await getServiceEndpoints(
                source
            );

        if (token.isCancellationRequested) {
            return;
        }

        if (endpoints.flatContainer) {
            const base =
                ensureTrailingSlash(
                    endpoints.flatContainer
                );

            const url =
                `${base}` +
                `${encodeURIComponent(
                    packageId.toLowerCase()
                )}` +
                `/index.json`;

            const json =
                await fetchJson(
                    url,
                    source,
                    token
                );

            for (const version of
                Array.isArray(json?.versions)
                    ? json.versions
                    : []) {
                found.add(
                    String(version)
                );
            }

            return;
        }

        if (endpoints.registrations) {
            const base =
                ensureTrailingSlash(
                    endpoints.registrations
                );

            const url =
                `${base}` +
                `${encodeURIComponent(
                    packageId.toLowerCase()
                )}` +
                `/index.json`;

            const json =
                await fetchJson(
                    url,
                    source,
                    token
                );

            collectRegistrationVersions(
                json,
                found
            );
        }
    } catch {
        // One dead/private source should not break
        // IntelliSense from all other feeds.
    }
}

function collectRegistrationVersions(
    json: any,
    result: Set<string>
): void {
    const pages =
        Array.isArray(json?.items)
            ? json.items
            : [];

    for (const page of pages) {
        const leaves =
            Array.isArray(page?.items)
                ? page.items
                : [];

        for (const leaf of leaves) {
            const version =
                leaf?.catalogEntry?.version ??
                leaf?.version;

            if (version) {
                result.add(
                    String(version)
                );
            }
        }
    }
}

function ensureTrailingSlash(
    value: string
): string {
    return value.endsWith('/')
        ? value
        : value + '/';
}
