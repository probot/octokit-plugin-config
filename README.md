# octokit-plugin-config

> Get/set persisted configuration using YAML/JSON files in repositories

[![@latest](https://img.shields.io/npm/v/@probot/octokit-plugin-config.svg)](https://www.npmjs.com/package/@probot/octokit-plugin-config)
[![Build Status](https://github.com/probot/octokit-plugin-config/workflows/Test/badge.svg)](https://github.com/probot/octokit-plugin-config/actions?query=workflow%3ATest+branch%3Amain)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=probot/octokit-plugin-config)](https://dependabot.com/)

By default, this plugin loads configuration from a given repository file. If the file doesn't exist, it loads configuration from the same path in the same owner's `.github` repository.

Configuration can be extended across multiple files using [the `_extends` key](#extends).

## Usage

<table>
<tbody valign=top align=left>
<tr><th>

Browsers

</th><td width=100%>

Load `@probot/octokit-plugin-config` and [`@octokit/core`](https://github.com/octokit/core.js) (or core-compatible module) directly from [cdn.pika.dev](https://cdn.pika.dev)

```html
<script type="module">
  import { Octokit } from "https://cdn.pika.dev/@octokit/core";
  import {
    config,
    composeConfigGet,
  } from "https://cdn.pika.dev/@probot/octokit-plugin-config";
</script>
```

</td></tr>
<tr><th>

Node

</th><td>

Install with `npm install @octokit/core @probot/octokit-plugin-config`. Optionally replace `@octokit/core` with a compatible module

```js
const { Octokit } = require("@octokit/core");
const { config, composeConfigGet } = require("@probot/octokit-plugin-config");
```

</td></tr>
</tbody>
</table>

```js
// given that `.github/my-app.yml` in `octocat/hello-world` has the following ocntent
//
// comment: 'Thank you for creating the issue!'
//
const { config } = await octokit.config.get({
  owner: "octocat",
  repo: "hello-world",
  path: ".github/my-app.yml",
});
// config is now { comment: "Thank you for creating the issue!" }

// all options and returns
const { config, files } = await octokit.config.get({
  owner: "octocat",
  repo: "hello-world",
  path: ".github/my-app.yml",
  defaults: {
    comment: "Thank you for creating the issue!",
  },
  branch: "develop",
});
// files is an array of { owner, repo, path, config } objects
```

## Options

<table>
  <thead align=left>
    <tr>
      <th>
        option
      </th>
      <th>
        type
      </th>
      <th width=100%>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th><code>owner</code></th>
      <td>String</td>
      <td>
        <strong>Required.</strong> Repository owner login.
      </td>
    </tr>
    <tr>
      <th><code>repo</code></th>
      <td>String</td>
      <td>
        <strong>Required.</strong> Repository name.
      </td>
    </tr>
    <tr>
      <th><code>path</code></th>
      <td>String</td>
      <td>
        <strong>Required.</strong> Path of the configuration file. Supported file extensions are <code>.yml</code>, <code>.yaml</code>, and <code>.json</code>.
      </td>
    </tr>
    <tr>
      <th><code>defaults</code></th>
      <td>String</td>
      <td>
        Default options that are returned if the configuration file does not exist, or merged with the contents if it does exist. Defaults are merged shallowly using <code>Object.assign</code>. For custom merge strategies, you can set <code>defaults</code> to a function, see <a href="#custom-configuration-merging">Merging configuration</a> below for more information. Defaults to <code>{}</code>.
      </td>
    </tr>
    <tr>
      <th><code>branch</code></th>
      <td>String</td>
      <td>
        Defaults to the repository's default branch. The branch is only used for the provided repository, not for the <code>.github</code> repository or other configurations linked using <a href="extends">the <code>_extends</code> key</a>.
      </td>
    </tr>
  </tbody>
</table>

<a name="extends"></a>

### The `_extends` key

`octokit.config.get()` supports sharing configs between repositories. If configuration for your app is not available in the target repository, it will be loaded from the `.github` directory of the same owner's `.github` repository.

You can choose own shared location. Use the `_extends` option in the configuration file to extend settings from another repository.

For example, given `.github/test.yml`:

```yml
_extends: github-settings
# Override values from the extended config or define new values
name: myrepo
```

This configuration will be merged with the `.github/test.yml` file from the `github-settings` repository, which might look like this:

```yml
shared1: will be merged
shared2: will also be merged
```

Just put common configuration keys in a repository within your organization. Then reference this repository from config files with the same name.

You can also reference configurations from other owners:

```yml
_extends: other/probot-settings
other: DDD
```

Additionally, you can specify a specific path for the configuration by appending a colon after the project.

```yml
_extends: probot-settings:.github/other_test.yml
other: FFF
```

<a name="custom-configuration-merging"></a>

### Merging configuration

Given `.github/test.yml`:

```yml
settings:
  one: value from configuration
```

And

```js
const { config } = await octokit.config.get({
  owner,
  repo,
  path: ".github/test.yml",
  defaults: {
    settings: {
      one: "default value",
      two: "default value",
    },
  },
});
```

The resulting `config` object is

```js
{
  settings: {
    one: "value from configuration";
  }
}
```

And not as you might expect

```js
{
  settings: {
    one: "value from configuration";
    two: "default value";
  }
}
```

The reason for that behavior is that merging objects deeply is not supported in JavaScript by default, and there are different strategies and many pitfals. There are many libraries that support deep merging in different ways, but instead making that decision for and significantly increasing the bundle size of this plugin, we let you pass a custom merge strategy instead.

In order to achive the deeply merged configuration, the `defaults` option can be set to a function. The function receives one `configs` argument, which is an array of configurations loaded from files in reverse order, so that the latter items should take precedence over the former items. The `configs` array can have more than one object if [the `_extends` key](#extends) is used.

```js
const defaults = {
  settings: {
    one: "default value",
    two: "default value",
  },
};
const { config } = await octokit.config.get({
  owner,
  repo,
  path: ".github/test.yml",
  defaults(configs) {
    const allConfigs = [defaults, ...configs];
    const fileSettingsConfigs = allConfigs.map(
      (config: Configuration) => config.settings
    );
    return Object.assign({}, ...allConfigs, {
      settings: Object.assign({}, ...fileSettingsConfigs),
    });
  },
});
```

Or simpler, using a library such as [deepmerge](https://github.com/TehShrike/deepmerge)

```js
const { config } = await octokit.config.get({
  owner,
  repo,
  path: ".github/test.yml",
  defaults: (configs) => deepmerge.all([defaults, ...configs]),
});
```

## Testing

Writing tests for your app's usage of `octokit.config.get` can be tricky. It's tempting to just mock the method directly, e.g. using [a Jest mock function](https://jestjs.io/docs/en/mock-functions)

```js
octokit.config.get = jest.fn().mockResolvedValue({
  comment: "Thank you for creating the issue!",
});
```

The problem with this approach is that in future releases of `@probot/octokit-plugin-config`, the method name or parameters might change. Before that happens, we will log a deprecation message, to make the upgrade to the next breaking version easier. If all your tests mock the `.config.get()` method, then you won't see this deprecation message. Even worse, your tests will continue to pass, but fail in production, because the mock will revert any future changes to `.config.get()`.

We recommend you have at least one test that does not mock the method, but instead mocks the http responses. You can achiev that with [nock](https://github.com/nock/nock/) or [fetch-mock](https://github.com/wheresrhys/fetch-mock)

### Testing with `nock`

With configuration

```js
async function myTest() {
  nock("https://api.github.com")
    .get("/repos/octocat/hello-world/contents/.github%2Fmy-app.yml")
    .reply(200, "comment: Thank you for creating the issue");

  const octokit = new Octokit();

  const { config } = await octokit.config.get({
    owner: "octocat",
    repo: "hello-world",
    path: ".github/my-app.yml",
  });

  assert.deepStrictEqual(config, {
    comment: "Thank you for creating the issue!",
  });
}
```

Without configuration

```js
async function myTest() {
  nock("https://api.github.com")
    .get("/repos/octocat/hello-world/contents/.github%2Fmy-app.yml")
    .reply(404)
    .get("/repos/octocat/.github/contents/.github%2Fmy-app.yml")
    .reply(404);

  const octokit = new Octokit();

  const { config } = await octokit.config.get({
    owner: "octocat",
    repo: "hello-world",
    path: ".github/my-app.yml",
  });

  assert.deepStrictEqual(config, {});
}
```

### Testing with `fetch-mock`

With configuration

```js
async function myTest() {
  const fetch = fetchMock
    .sandbox()
    .getOnce(
      "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
      "comment: 'Thank you for creating the issue!'",
    );
  const octokit = new TestOctokit({
    request: { fetch },
  });

  const { config } = await octokit.config.get({
    owner: "octocat",
    repo: "hello-world",
    path: ".github/my-app.yml",
  });

  assert.deepStrictEqual(config, {
    comment: "Thank you for creating the issue!",
  });
}
```

Without configuration

```js
async function myTest() {
  const fetch = fetchMock
    .sandbox()
    .getOnce(
      "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
      404,
    )
    .getOnce(
      "https://api.github.com/repos/octocat/.github/contents/.github%2Fmy-app.yml",
      404,
    );
  const octokit = new TestOctokit({
    request: { fetch },
  });

  const { config } = await octokit.config.get({
    owner: "octocat",
    repo: "hello-world",
    path: ".github/my-app.yml",
  });

  assert.deepStrictEqual(config, {});
}
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## Credits

The idea for this plugin and some of its code was extracted from [Probot](https://probot.github.io/). It originated as [probot-config](https://github.com/probot/probot-config), created by [Jan Michael Auer](https://github.com/jan-auer) and was later merged into [`probot`](https://github.com/probot/probot).

## License

[ISC](LICENSE)
