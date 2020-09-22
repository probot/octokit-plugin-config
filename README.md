# octokit-plugin-config

> Get/set persisted configuration using YAML/JSON files in repositories

[![@latest](https://img.shields.io/npm/v/@probot/octokit-plugin-config.svg)](https://www.npmjs.com/package/@probot/octokit-plugin-config)
[![Build Status](https://github.com/probot/octokit-plugin-config/workflows/Test/badge.svg)](https://github.com/probot/octokit-plugin-config/actions?query=workflow%3ATest+branch%3Amain)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=probot/octokit-plugin-config)](https://dependabot.com/)

By default, this plugin loads configuration from `/.github/[filename]` in the provided repository. If the file doesn't exist, it looks for the same file in the same owner's `.github` repository.

Configuration can be loaded from multiple files by utilizing [the `_extends` key](#extends).

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
  import { config } from "https://cdn.pika.dev/@probot/octokit-plugin-config";
</script>
```

</td></tr>
<tr><th>

Node

</th><td>

Install with `npm install @octokit/core @probot/octokit-plugin-config`. Optionally replace `@octokit/core` with a compatible module

```js
const { Octokit } = require("@octokit/core");
const { config } = require("@probot/octokit-plugin-config");
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
  filename: "my-app.yml",
});
// config is now { comment: "Thank you for creating the issue!" }

// create or update a configuration
const { config } = await octokit.config.set({
  owner: "octocat",
  repo: "hello-world",
  filename: "my-app.yml",
  // can be either an object or a string
  content: {
    comment: "Welcome to octokit/hello-world!",
  },
});

// all options
const { config } = await octokit.config.get({
  owner: "octocat",
  repo: "hello-world",
  filename: "my-app.yml",
  defaults: {
    comment: "Thank you for creating the issue!",
  },
  path: "",
  branch: "develop",
});
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
        <strong>Required.</strong> Repository owner login
      </td>
    </tr>
    <tr>
      <th><code>repo</code></th>
      <td>String</td>
      <td>
        <strong>Required.</strong> Repository name
      </td>
    </tr>
    <tr>
      <th><code>filename</code></th>
      <td>String</td>
      <td>
        <strong>Required.</strong> Name of the configuration file. Supported file extensions are <code>.yml</code>, <code>.yaml</code>, and <code>.json</code>.
      </td>
    </tr>
    <tr>
      <th><code>defaults</code></th>
      <td>String</td>
      <td>
        Default options that are returned if the configuration file does not exist, or merged with the contents if it does exist. Defaults are merged using shallowly using <code>Object.assign</code>. For custom merge strategies, you can set <code>defaults</code> to a function, see <a href="#custom-configuration-merging">Merging configuration</a> below for more information. Defaults to <code>{}</code>
      </td>
    </tr>
    <tr>
      <th><code>path</code></th>
      <td>String</td>
      <td>
        Defaults to <code>.github/</code>
      </td>
    </tr>
    <tr>
      <th><code>branch</code></th>
      <td>String</td>
      <td>
        Defaults to the repository's default branch.
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

You can also disable merging with other configuration files by setting `_extends` to `false`.

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
  filename: "test.yml",
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

In order to achive the deeply merged configuration, the code needs to be changed to

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
  filename: "test.yml",
  defaults(config) {
    // start with the default shallwo merge
    const mergedConfig = Object.assign({}, defaults, config);
    if (config) {
      // now merge the properties from defaults.settings & config.settings
      mergedConfig.settings = Object.assign(
        {},
        defaults.settings,
        config.settings
      );
    }

    return mergedConfig;
  },
});
```

Or simpler, using a library such as [deepmerge](https://github.com/TehShrike/deepmerge)

```js
const { config } = await octokit.config.get({
  owner,
  repo,
  filename: "test.yml",
  defaults: (config) => deepmerge([defaults, config]),
});
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## Credits

The idea for this plugin and some of its code was extracted from [Probot](https://probot.github.io/). It originated as [probot-config](https://github.com/probot/probot-config), created by [Jan Michael Auer](https://github.com/jan-auer) and was later merged into [`probot`](https://github.com/probot/probot).

## License

[ISC](LICENSE)
