import * as vscode from 'vscode';
import * as path from 'path';
import { log } from './logger';
import { NugetSource } from './types';

export async function findNugetWorkingDirectory():
Promise<string> {
    const folders =
        vscode.workspace.workspaceFolders ?? [];

    if (folders.length === 0) {
        return process.cwd();
    }

    const solutionFiles =
        await vscode.workspace.findFiles(
            '**/*.{sln,slnx}',
            '**/{bin,obj,.git,node_modules}/**',
            50
        );

    if (solutionFiles.length === 0) {
        return folders[0].uri.fsPath;
    }

    const activeFile =
        vscode.window
            .activeTextEditor
            ?.document
            .uri
            .fsPath;

    if (activeFile) {
        const candidates =
            solutionFiles
                .map(
                    uri =>
                        path.dirname(
                            uri.fsPath
                        )
                )
                .filter(
                    directory =>
                        isPathInside(
                            activeFile,
                            directory
                        )
                )
                .sort(
                    (a, b) =>
                        b.length - a.length
                );

        if (candidates.length > 0) {
            return candidates[0];
        }
    }

    return solutionFiles
        .map(
            uri =>
                path.dirname(
                    uri.fsPath
                )
        )
        .sort(
            (a, b) =>
                a.length - b.length
        )[0];
}

export function parseDotnetNugetSources(
    outputText: string
): NugetSource[] {
    const lines =
        outputText
            .replace(/\r/g, '')
            .split('\n');

    const result: NugetSource[] = [];

    for (let i = 0; i < lines.length; i++) {
        const header =
            /^\s*\d+\.\s+(.+?)\s+\[([^\]]+)\]\s*$/
                .exec(lines[i]);

        if (!header) {
            continue;
        }

        const name =
            header[1].trim();
        const status =
            header[2].trim();

        const sourceUrl =
            findSourceUrl(
                lines,
                i + 1
            );

        if (!sourceUrl) {
            continue;
        }

        i = sourceUrl.line;

        if (/disabled|deaktiviert/i.test(status)) {
            log(
                `Ignoring disabled source: ${name}`
            );
            continue;
        }

        result.push({
            name,
            url: sourceUrl.url
        });
    }

    return result;
}

function findSourceUrl(
    lines: string[],
    start: number
): { url: string; line: number } | undefined {
    for (let i = start; i < lines.length; i++) {
        const candidate =
            lines[i].trim();

        if (!candidate) {
            continue;
        }

        if (/^\d+\.\s+/.test(candidate)) {
            return undefined;
        }

        return {
            url: candidate,
            line: i
        };
    }

    return undefined;
}

function isPathInside(
    filePath: string,
    directory: string
): boolean {
    const relative =
        path.relative(
            directory,
            filePath
        );

    return relative === '' ||
        (
            !relative.startsWith('..') &&
            !path.isAbsolute(relative)
        );
}
