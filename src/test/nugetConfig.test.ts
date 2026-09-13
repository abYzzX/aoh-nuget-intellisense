import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCredentials } from '../nugetConfig';
import { NugetSource } from '../types';

test('applyCredentials applies clear-text credentials to a matching source', () => {
    const sources: NugetSource[] = [
        {
            name: 'Private Feed',
            url: 'https://packages.example.test/v3/index.json'
        }
    ];

    applyCredentials(
        `
        <configuration>
          <packageSourceCredentials>
            <Private_x0020_Feed>
              <add key="Username" value="build-user" />
              <add key="ClearTextPassword" value="secret" />
            </Private_x0020_Feed>
          </packageSourceCredentials>
        </configuration>
        `,
        sources
    );

    assert.equal(sources[0].username, 'build-user');
    assert.equal(sources[0].password, 'secret');
});

test('applyCredentials decodes XML entities in credential values', () => {
    const sources: NugetSource[] = [
        {
            name: 'Feed',
            url: 'https://packages.example.test/v3/index.json'
        }
    ];

    applyCredentials(
        `
        <packageSourceCredentials>
          <Feed>
            <add key="Username" value="a&amp;b" />
            <add key="ClearTextPassword" value="x&amp;y" />
          </Feed>
        </packageSourceCredentials>
        `,
        sources
    );

    assert.equal(sources[0].username, 'a&b');
    assert.equal(sources[0].password, 'x&y');
});

test('applyCredentials expands environment variables', () => {
    const previous = process.env.AOH_NUGET_TEST_PASSWORD;
    process.env.AOH_NUGET_TEST_PASSWORD = 'from-env';

    try {
        const sources: NugetSource[] = [
            {
                name: 'Feed',
                url: 'https://packages.example.test/v3/index.json'
            }
        ];

        applyCredentials(
            `
            <packageSourceCredentials>
              <Feed>
                <add key="Username" value="user" />
                <add key="ClearTextPassword" value="%AOH_NUGET_TEST_PASSWORD%" />
              </Feed>
            </packageSourceCredentials>
            `,
            sources
        );

        assert.equal(sources[0].password, 'from-env');
    } finally {
        if (previous === undefined) {
            delete process.env.AOH_NUGET_TEST_PASSWORD;
        } else {
            process.env.AOH_NUGET_TEST_PASSWORD = previous;
        }
    }
});

test('applyCredentials leaves unrelated sources untouched', () => {
    const sources: NugetSource[] = [
        {
            name: 'Other Feed',
            url: 'https://packages.example.test/v3/index.json'
        }
    ];

    applyCredentials(
        `
        <packageSourceCredentials>
          <Feed>
            <add key="Username" value="user" />
            <add key="ClearTextPassword" value="secret" />
          </Feed>
        </packageSourceCredentials>
        `,
        sources
    );

    assert.equal(sources[0].username, undefined);
    assert.equal(sources[0].password, undefined);
});
