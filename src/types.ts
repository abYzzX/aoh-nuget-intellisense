export type Dict<T = unknown> = Record<string, T>;

export interface NugetSource {
    name: string;
    url: string;
    username?: string;
    password?: string;
}

export interface ServiceEndpoints {
    search?: string;
    registrations?: string;
    flatContainer?: string;
}

export interface CacheEntry<T> {
    expires: number;
    value: T;
}

export interface PackageHit {
    id: string;
    version?: string;
    description?: string;
    authors?: string[];
    source: string;
}

export type AttrContext =
    | { kind: 'package'; value: string }
    | { kind: 'version'; value: string; packageId?: string };
