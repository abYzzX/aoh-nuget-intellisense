import * as vscode from 'vscode';
import {
    CacheEntry,
    NugetSource,
    ServiceEndpoints
} from './types';
import {
    Credentials,
    getAzureArtifactsCredentials
} from './credentialProvider';
import {
    getCache,
    setCache
} from './cache';
import { log } from './logger';

const serviceCache =
    new Map<
        string,
        CacheEntry<ServiceEndpoints>
    >();

const providerCredentials =
    new Map<string, Credentials>();

export function clearHttpCaches(): void {
    serviceCache.clear();
}

export async function getServiceEndpoints(
    source: NugetSource
): Promise<ServiceEndpoints> {
    const cached =
        getCache(
            serviceCache,
            source.url
        );

    if (cached) {
        return cached;
    }

    const json =
        await fetchJson(
            source.url,
            source
        );

    const resources =
        Array.isArray(json?.resources)
            ? json.resources
            : [];

    const endpoints: ServiceEndpoints = {};

    for (const resource of resources) {
        const type =
            String(
                resource['@type'] ?? ''
            );
        const id =
            String(
                resource['@id'] ?? ''
            );

        if (!id) {
            continue;
        }

        if (!endpoints.search &&
            /^SearchQueryService/i.test(type)) {
            endpoints.search = id;
        }

        if (!endpoints.registrations &&
            /^RegistrationsBaseUrl/i.test(type)) {
            endpoints.registrations = id;
        }

        if (!endpoints.flatContainer &&
            /^PackageBaseAddress/i.test(type)) {
            endpoints.flatContainer = id;
        }
    }

    setCache(
        serviceCache,
        source.url,
        endpoints,
        60
    );

    return endpoints;
}

export async function fetchJson(
    url: string,
    source: NugetSource,
    token?: vscode.CancellationToken
): Promise<any> {
    let username =
        source.username;
    let password =
        source.password;

    const cached =
        providerCredentials.get(
            source.url
        );

    if ((username === undefined ||
        password === undefined) &&
        cached) {
        username = cached.username;
        password = cached.password;
    }

    let response =
        await request(
            url,
            username,
            password,
            token
        );

    if (response.status === 401) {
        response =
            await retryWithAzureCredentials(
                url,
                source,
                token
            );
    }

    if (!response.ok) {
        const message =
            `${source.name}: HTTP ` +
            `${response.status} ` +
            `${response.statusText}`;

        log(
            `Request failed: ${url} -> ` +
            `${message}`
        );

        throw new Error(message);
    }

    return await response.json();
}

async function retryWithAzureCredentials(
    url: string,
    source: NugetSource,
    token?: vscode.CancellationToken
): Promise<Response> {
    log(
        `401 from ${source.name}; asking ` +
        `Azure Artifacts Credential Provider.`
    );

    const credentials =
        getAzureArtifactsCredentials(
            source.url,
            false
        );

    if (!credentials) {
        return await request(
            url,
            source.username,
            source.password,
            token
        );
    }

    providerCredentials.set(
        source.url,
        credentials
    );

    let response =
        await request(
            url,
            credentials.username,
            credentials.password,
            token
        );

    if (response.status !== 401) {
        return response;
    }

    log(
        `Cached/provider credential rejected for ` +
        `${source.name}; retrying provider with ` +
        `IsRetry=true.`
    );

    const retryCredentials =
        getAzureArtifactsCredentials(
            source.url,
            true
        );

    if (!retryCredentials) {
        return response;
    }

    providerCredentials.set(
        source.url,
        retryCredentials
    );

    return await request(
        url,
        retryCredentials.username,
        retryCredentials.password,
        token
    );
}

async function request(
    url: string,
    username?: string,
    password?: string,
    token?: vscode.CancellationToken
): Promise<Response> {
    const controller =
        new AbortController();

    const subscription =
        token?.onCancellationRequested(
            () => controller.abort()
        );

    try {
        const headers:
        Record<string, string> = {
            'Accept': 'application/json',
            'User-Agent':
                'AOH-NuGet-IntelliSense/1.0.0'
        };

        if (username !== undefined &&
            password !== undefined) {
            headers['Authorization'] =
                `Basic ${Buffer.from(
                    `${username}:${password}`
                ).toString('base64')}`;
        }

        return await fetch(
            url,
            {
                headers,
                signal: controller.signal
            }
        );
    } finally {
        subscription?.dispose();
    }
}
