import * as vscode from 'vscode';

let output: vscode.OutputChannel | undefined;

export function initializeLogger(channel: vscode.OutputChannel): void {
    output = channel;
}

export function log(message: string): void {
    const timestamp = new Date().toISOString();
    output?.appendLine(`[${timestamp}] ${message}`);
}

export function formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
