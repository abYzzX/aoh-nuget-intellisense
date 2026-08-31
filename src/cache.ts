import * as vscode from 'vscode';
import { CacheEntry } from './types';

export function getCache<T>(map: Map<string, CacheEntry<T>>, key: string): T | undefined {
    const entry = map.get(key);
    if (!entry) return;

    if (entry.expires < Date.now()) {
        map.delete(key);
        return;
    }

    return entry.value;
}

export function setCache<T>(
    map: Map<string, CacheEntry<T>>,
    key: string,
    value: T,
    minutes?: number
): void {
    const cacheMinutes = minutes ??
        vscode.workspace.getConfiguration('aoh.nugetIntellisense').get<number>('cacheMinutes', 10);

    map.set(key, {
        expires: Date.now() + cacheMinutes * 60_000,
        value
    });
}
