import * as vscode from 'vscode';
import { getVersions, searchPackages } from './nugetClient';
import {
    detectAttributeContext,
    isNugetXml
} from './xmlContext';

export class NugetCompletionProvider
implements vscode.CompletionItemProvider {
    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<
        vscode.CompletionItem[] |
        vscode.CompletionList |
        undefined
    > {
        if (!isNugetXml(document.fileName)) {
            return;
        }

        const linePrefix =
            document
                .lineAt(position.line)
                .text
                .slice(0, position.character);

        const recentText =
            document.getText(
                new vscode.Range(
                    new vscode.Position(
                        Math.max(0, position.line - 12),
                        0
                    ),
                    position
                )
            );

        const attr =
            detectAttributeContext(
                linePrefix,
                recentText
            );

        if (!attr) {
            return;
        }

        if (attr.kind === 'package') {
            return await providePackageItems(
                attr.value,
                position,
                token
            );
        }

        if (attr.kind === 'version' &&
            attr.packageId) {
            return await provideVersionItems(
                attr.packageId,
                attr.value,
                position,
                token
            );
        }

        return;
    }
}

async function providePackageItems(
    value: string,
    position: vscode.Position,
    token: vscode.CancellationToken
): Promise<vscode.CompletionList | undefined> {
    const minChars =
        vscode.workspace
            .getConfiguration('aoh.nugetIntellisense')
            .get<number>('minSearchCharacters', 2);

    if (value.length < minChars) {
        return;
    }

    const hits =
        await searchPackages(value, token);
    const replaceRange =
        valueRange(position, value);

    const items =
        hits.map(hit => {
            const item =
                new vscode.CompletionItem(
                    hit.id,
                    vscode.CompletionItemKind.Module
                );

            item.textEdit =
                vscode.TextEdit.replace(
                    replaceRange,
                    hit.id
                );

            item.filterText = hit.id;
            item.sortText =
                `0_${hit.id.toLowerCase()}`;
            item.detail =
                hit.version
                    ? `${hit.version}  •  ${hit.source}`
                    : hit.source;

            const documentation =
                new vscode.MarkdownString(
                    undefined,
                    true
                );

            if (hit.description) {
                documentation.appendMarkdown(
                    hit.description.replace(
                        /\r?\n/g,
                        ' '
                    )
                );
            }

            if (hit.authors?.length) {
                documentation.appendMarkdown(
                    `\n\n**Authors:** ` +
                    hit.authors.join(', ')
                );
            }

            item.documentation = documentation;
            return item;
        });

    return new vscode.CompletionList(
        items,
        false
    );
}

async function provideVersionItems(
    packageId: string,
    value: string,
    position: vscode.Position,
    token: vscode.CancellationToken
): Promise<vscode.CompletionList> {
    const versions =
        await getVersions(packageId, token);
    const replaceRange =
        valueRange(position, value);

    const items =
        versions.map((version, index) => {
            const item =
                new vscode.CompletionItem(
                    version,
                    vscode.CompletionItemKind.Value
                );

            item.textEdit =
                vscode.TextEdit.replace(
                    replaceRange,
                    version
                );

            item.filterText = version;
            item.detail = packageId;
            item.sortText =
                index
                    .toString()
                    .padStart(6, '0');

            return item;
        });

    return new vscode.CompletionList(
        items,
        false
    );
}

function valueRange(
    position: vscode.Position,
    value: string
): vscode.Range {
    return new vscode.Range(
        position.translate(
            0,
            -value.length
        ),
        position
    );
}
