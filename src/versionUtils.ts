export function compareVersionsDesc(
    a: string,
    b: string
): number {
    return -compareVersions(a, b);
}

export function compareVersions(
    a: string,
    b: string
): number {
    const left =
        parseVersion(a);
    const right =
        parseVersion(b);

    const max =
        Math.max(
            left.nums.length,
            right.nums.length
        );

    for (let i = 0; i < max; i++) {
        const diff =
            (left.nums[i] ?? 0) -
            (right.nums[i] ?? 0);

        if (diff) {
            return diff;
        }
    }

    if (!left.pre && right.pre) return 1;
    if (left.pre && !right.pre) return -1;

    return (left.pre ?? '')
        .localeCompare(
            right.pre ?? '',
            undefined,
            {
                numeric: true,
                sensitivity: 'base'
            }
        );
}

function parseVersion(
    version: string
): {
    nums: number[];
    pre?: string;
} {
    const [main, pre] =
        version.split(
            '-',
            2
        );

    return {
        nums:
            main
                .split('.')
                .map(
                    part =>
                        Number.parseInt(
                            part,
                            10
                        ) || 0
                ),
        pre
    };
}
