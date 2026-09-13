import assert from 'node:assert/strict';
import test from 'node:test';
import {
    detectAttributeContext,
    isNugetXml
} from '../xmlContext';

test('isNugetXml accepts the currently supported project XML formats', () => {
    assert.equal(isNugetXml('Example.csproj'), true);
    assert.equal(isNugetXml('Directory.Build.props'), true);
    assert.equal(isNugetXml('Directory.Build.targets'), true);
    assert.equal(isNugetXml('example.CSPROJ'), true);
});

test('isNugetXml rejects formats that are not supported yet', () => {
    assert.equal(isNugetXml('Example.fsproj'), false);
    assert.equal(isNugetXml('Directory.Packages.props.json'), false);
    assert.equal(isNugetXml('packages.config'), false);
    assert.equal(isNugetXml('Example.nuspec'), false);
});

test('detectAttributeContext recognizes package Include values', () => {
    assert.deepEqual(
        detectAttributeContext(
            '<PackageReference Include="Newtonsoft.J',
            '<PackageReference Include="Newtonsoft.J'
        ),
        {
            kind: 'package',
            value: 'Newtonsoft.J'
        }
    );
});

test('detectAttributeContext recognizes PackageVersion Update values', () => {
    assert.deepEqual(
        detectAttributeContext(
            '<PackageVersion Update="Seri',
            '<PackageVersion Update="Seri'
        ),
        {
            kind: 'package',
            value: 'Seri'
        }
    );
});

test('detectAttributeContext resolves the package id for a version attribute', () => {
    const tag =
        '<PackageReference Include="Serilog" Version="3.';

    assert.deepEqual(
        detectAttributeContext(tag, tag),
        {
            kind: 'version',
            value: '3.',
            packageId: 'Serilog'
        }
    );
});

test('detectAttributeContext handles Version before Include without guessing a package id', () => {
    const tag =
        '<PackageReference Version="3.';

    assert.deepEqual(
        detectAttributeContext(tag, tag),
        {
            kind: 'version',
            value: '3.',
            packageId: undefined
        }
    );
});

test('detectAttributeContext ignores unrelated XML attributes', () => {
    assert.equal(
        detectAttributeContext(
            '<PropertyGroup Condition="Debug',
            '<PropertyGroup Condition="Debug'
        ),
        undefined
    );
});
