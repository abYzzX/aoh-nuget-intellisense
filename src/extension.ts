import * as vscode from 'vscode';
import { NugetCompletionProvider } from './completionProvider';
import { clearCaches } from './nugetClient';
import { initializeLogger, log } from './logger';
import { getSources, refreshSources } from './sourceManager';

export async function activate(
    context: vscode.ExtensionContext
): Promise<void> {
    const output =
        vscode.window.createOutputChannel(
            'AOH - NuGet IntelliSense'
        );

    initializeLogger(output);
    context.subscriptions.push(output);

    log('Extension activated.');
    await refreshSources();

    const selector: vscode.DocumentSelector = [
        {
            language: 'xml',
            scheme: 'file',
            pattern: '**/*.csproj'
        },
        {
            language: 'xml',
            scheme: 'file',
            pattern: '**/*.props'
        },
        {
            language: 'xml',
            scheme: 'file',
            pattern: '**/*.targets'
        }
    ];

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            selector,
            new NugetCompletionProvider(),
            '"',
            "'",
            '.',
            '-',
            '_'
        ),

        vscode.commands.registerCommand(
            'aoh.nugetIntellisense.refreshSources',
            async () => {
                log('Manual source refresh requested.');

                await refreshSources();
                clearCaches();

                vscode.window.showInformationMessage(
                    `AOH - NuGet IntelliSense: ` +
                    `${getSources().length} source(s) loaded.`
                );
            }
        ),

        vscode.commands.registerCommand(
            'aoh.nugetIntellisense.clearCache',
            () => {
                clearCaches();

                vscode.window.showInformationMessage(
                    'AOH - NuGet IntelliSense cache cleared.'
                );
            }
        ),

        vscode.workspace.onDidChangeConfiguration(
            event => {
                if (event.affectsConfiguration(
                    'aoh.nugetIntellisense'
                )) {
                    refreshSources()
                        .then(clearCaches);
                }
            }
        ),

        vscode.workspace.onDidSaveTextDocument(
            document => {
                if (/nuget\.config$/i.test(
                    document.fileName
                )) {
                    refreshSources()
                        .then(clearCaches);
                }
            }
        )
    );
}

export function deactivate(): void {}
