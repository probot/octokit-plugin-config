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
  // See https://github.com/tehshrike/deepmerge#options
  deepmerge: {},
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
        Default options that are returned if the configuration file does not exist, or merged with the contents if it does exist. Defaults to <code>{}</code>
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
    <tr>
      <th><code>deepmerge</code></th>
      <td>String</td>
      <td>
        Options for merging contents of the configuration files and <code>defaults</code>. See <a href="https://github.com/TehShrike/deepmerge#options"><code>deepmerge</code> options</a> for details.
      </td>
    </tr>
  </tbody>
</table>

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## Credits

The idea for this plugin and some of its code was extracted from [Probot](https://probot.github.io/). It originated as [probot-config](https://github.com/probot/probot-config), created by [Jan Michael Auer](https://github.com/jan-auer) and was later merged into [`probot`](https://github.com/probot/probot).

## License

[ISC](LICENSE)
