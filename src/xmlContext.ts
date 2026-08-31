import { AttrContext } from './types';

export function isNugetXml(fileName: string): boolean {
    return /\.(csproj|props|targets)$/i.test(fileName);
}

export function detectAttributeContext(
    linePrefix: string,
    recentText: string
): AttrContext | undefined {
    const packageAttr =
        /<(?:PackageReference|PackageVersion)\b[^>]*\b(?:Include|Update)\s*=\s*["']([^"']*)$/i.exec(linePrefix);

    if (packageAttr) {
        return { kind: 'package', value: packageAttr[1] };
    }

    const versionAttr =
        /<(?:PackageReference|PackageVersion)\b[^>]*\bVersion\s*=\s*["']([^"']*)$/i.exec(linePrefix);

    if (versionAttr) {
        const currentTag = getCurrentTag(recentText);
        const packageId = currentTag
            ? /\b(?:Include|Update)\s*=\s*["']([^"']+)["']/i.exec(currentTag)?.[1]
            : undefined;

        return {
            kind: 'version',
            value: versionAttr[1],
            packageId
        };
    }

    // Handles Version before Include in the same tag.
    if (/\bVersion\s*=\s*["'][^"']*$/i.test(linePrefix)) {
        const currentTag = getCurrentTag(recentText);

        if (currentTag && /<(?:PackageReference|PackageVersion)\b/i.test(currentTag)) {
            const packageId =
                /\b(?:Include|Update)\s*=\s*["']([^"']+)["']/i.exec(currentTag)?.[1];
            const value =
                /\bVersion\s*=\s*["']([^"']*)$/i.exec(linePrefix)?.[1] ?? '';

            return {
                kind: 'version',
                value,
                packageId
            };
        }
    }

    return;
}

function getCurrentTag(text: string): string | undefined {
    const lt = text.lastIndexOf('<');
    const gt = text.lastIndexOf('>');

    if (lt < 0 || gt > lt) return;
    return text.slice(lt);
}
