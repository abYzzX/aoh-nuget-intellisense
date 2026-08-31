import * as vscode from 'vscode';
import {
    CacheEntry,
    PackageHit
} from './types';
import {
    getCache,
    setCache
} from './cache';
import { getSources } from './sourceManager';
import {
    fetchJson,
    getServiceEndpoints
} from './nugetHttp';
import {
    formatError,
    log
} from './logger';

const packageCache =
    new Map<
        string,
        CacheEntry<PackageHit[]>
    >();

export function clearPackageCache(): void {
    packageCache.clear();
}

export async function searchPackages(
    query: string,
    token: vscode.CancellationToken
): Promise<PackageHit[]> {
    const sources =
        getSources();

    log(
        `Package search: "${query}" across ` +
        `${sources.length} source(s).`
    );

    const cfg =
        vscode.workspace
            .getConfiguration(
                'aoh.nugetIntellisense'
            );

    const includePrerelease =
        cfg.get<boolean>(
            'includePrerelease',
            false
        );

    const take =
        cfg.get<number>(
            'maxPackageResults',
            40
        );

    const cacheKey =
        `${query.toLowerCase()}|` +
        `${includePrerelease}|` +
        `${take}|` +
        sources
            .map(source => source.url)
            .join('|');

    const cached =
        getCache(
            packageCache,
            cacheKey
        );

    if (cached) {
        log(
            `Package search result: ` +
            `${cached.length} package(s) ` +
            `[cache].`
        );

        return cached;
    }

    const all =
        await Promise.all(
            sources.map(
                source =>
                    searchSource(
                        source,
                        query,
                        includePrerelease,
                        take,
                        token
                    )
            )
        );

    const merged =
        new Map<string, PackageHit>();

    for (const hit of all.flat()) {
        const key =
            hit.id.toLowerCase();

        if (!merged.has(key)) {
            merged.set(
                key,
                hit
            );
        }
    }

    const result =
        [...merged.values()]
            .sort(
                (a, b) =>
                    rankPackage(
                        a.id,
                        query
                    ) -
                    rankPackage(
                        b.id,
                        query
                    ) ||
                    a.id.localeCompare(
                        b.id
                    )
            )
            .slice(
                0,
                Math.max(
                    take,
                    50
                )
            );

    log(
        `Package search result: ` +
        `${result.length} package(s).`
    );

    setCache(
        packageCache,
        cacheKey,
        result
    );

    return result;
}

async function searchSource(
    source: ReturnType<typeof getSources>[number],
    query: string,
    includePrerelease: boolean,
    take: number,
    token: vscode.CancellationToken
): Promise<PackageHit[]> {
    try {
        const endpoints =
            await getServiceEndpoints(
                source
            );

        if (!endpoints.search ||
            token.isCancellationRequested) {
            log(
                `Package search source ` +
                `${source.name}: 0 package(s).`
            );

            return [];
        }

        const url =
            new URL(
                endpoints.search
            );

        url.searchParams.set(
            'q',
            query
        );
        url.searchParams.set(
            'prerelease',
            String(includePrerelease)
        );
        url.searchParams.set(
            'take',
            String(take)
        );
        url.searchParams.set(
            'semVerLevel',
            '2.0.0'
        );

        const json =
            await fetchJson(
                url.toString(),
                source,
                token
            );

        const data =
            Array.isArray(json?.data)
                ? json.data
                : [];

        const hits =
            data
                .map(
                    (pkg: any): PackageHit => ({
                        id:
                            String(
                                pkg.id ?? ''
                            ),
                        version:
                            pkg.version
                                ? String(
                                    pkg.version
                                )
                                : undefined,
                        description:
                            pkg.description
                                ? String(
                                    pkg.description
                                )
                                : undefined,
                        authors:
                            Array.isArray(
                                pkg.authors
                            )
                                ? pkg.authors
                                    .map(String)
                                : typeof pkg.authors ===
                                    'string'
                                    ? [pkg.authors]
                                    : undefined,
                        source:
                            source.name
                    })
                )
                .filter(
                    (hit: PackageHit) =>
                        !!hit.id
                );

        log(
            `Package search source ` +
            `${source.name}: ` +
            `${hits.length} package(s).`
        );

        return hits;
    } catch (error) {
        log(
            `Package search source ` +
            `${source.name}: 0 package(s) ` +
            `[${formatError(error)}].`
        );

        return [];
    }
}

function rankPackage(
    id: string,
    query: string
): number {
    const candidate =
        id.toLowerCase();
    const search =
        query.toLowerCase();

    if (candidate === search) return 0;
    if (candidate.startsWith(search)) return 1;
    if (candidate.includes(search)) return 2;

    return 3;
}
