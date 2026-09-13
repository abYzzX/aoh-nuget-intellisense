import assert from 'node:assert/strict';
import test from 'node:test';
import {
    compareVersions,
    compareVersionsDesc
} from '../versionUtils';

test('compareVersions orders numeric version parts numerically', () => {
    assert.ok(compareVersions('1.10.0', '1.9.0') > 0);
    assert.ok(compareVersions('2.0.0', '10.0.0') < 0);
    assert.equal(compareVersions('1.2', '1.2.0'), 0);
});

test('compareVersions places stable versions after prerelease versions', () => {
    assert.ok(compareVersions('1.0.0', '1.0.0-rc.1') > 0);
    assert.ok(compareVersions('1.0.0-beta.2', '1.0.0') < 0);
});

test('compareVersions compares prerelease labels using numeric ordering', () => {
    assert.ok(compareVersions('1.0.0-beta.10', '1.0.0-beta.2') > 0);
});

test('compareVersionsDesc can be used directly with Array.sort', () => {
    const versions = [
        '1.0.0-beta.2',
        '2.0.0',
        '1.10.0',
        '1.0.0',
        '1.9.0'
    ];

    versions.sort(compareVersionsDesc);

    assert.deepEqual(
        versions,
        [
            '2.0.0',
            '1.10.0',
            '1.9.0',
            '1.0.0',
            '1.0.0-beta.2'
        ]
    );
});
