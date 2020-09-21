# octokit-plugin-config

> Get/set persisted configuration using YAML/JSON files in repositories

[![@latest](https://img.shields.io/npm/v/@probot/octokit-plugin-config.svg)](https://www.npmjs.com/package/@probot/octokit-plugin-config)
[![Build Status](https://github.com/probot/octokit-plugin-config/workflows/Test/badge.svg)](https://github.com/probot/octokit-plugin-config/actions?query=workflow%3ATest+branch%3Amain)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=probot/octokit-plugin-config)](https://dependabot.com/)

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
  // supported extensions: .yml, .yaml, .json
  filename: "my-app.yml",
  // optional
  defaults: {
    comment: "Thank you for creating the issue!",
  },
  // defaults to ".github/"
  path: "",
  // defaults to {}. See https://github.com/TehShrike/deepmerge#options
  deepmerge: {},
});
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

[MIT](LICENSE)
