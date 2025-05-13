import { describe, it, assert, equal, deepEqual } from "./testrunner.ts";
import { Octokit } from "@octokit/core";
import fetchMock from "fetch-mock";
import stripIndent from "strip-indent";

import { config } from "../src/index.ts";
import type { Configuration } from "../src/types.ts";

const TestOctokit = Octokit.plugin(config);

const NOT_FOUND_RESPONSE = {
  status: 404,
  body: {
    message: "Not Found",
    documentation_url:
      "https://docs.github.com/rest/reference/repos#get-repository-content",
  },
};

const deepMergeSettings = (
  defaults: Configuration,
  configs: Configuration[],
) => {
  const allConfigs = [defaults, ...configs];
  const fileSettingsConfigs = allConfigs.map(
    (config: Configuration) => config.settings,
  );
  return Object.assign({}, ...allConfigs, {
    settings: Object.assign({}, ...fileSettingsConfigs),
  });
};

describe("octokit.config.get", () => {
  it("README simple usage example", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        `comment: 'Thank you for creating the issue!'`,
        {
          headers: {
            accept: "application/vnd.github.v3.raw",
          },
        },
      );
    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.yml",
    });

    deepEqual(result, {
      config: {
        comment: "Thank you for creating the issue!",
      },
      files: [
        {
          config: {
            comment: "Thank you for creating the issue!",
          },
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        },
      ],
    });
    assert(mock.done());
  });

  it("config file missing", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        NOT_FOUND_RESPONSE,
      )
      .getOnce(
        "https://api.github.com/repos/octocat/.github/contents/.github%2Fmy-app.yml",
        NOT_FOUND_RESPONSE,
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.yml",
      defaults: {
        comment: "Thank you for creating the issue!",
      },
    });

    deepEqual(result, {
      config: {
        comment: "Thank you for creating the issue!",
      },
      files: [
        {
          config: null,
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        },
        {
          config: null,
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: ".github",
          url: "https://api.github.com/repos/octocat/.github/contents/.github%2Fmy-app.yml",
        },
      ],
    });
    assert(mock.done());
  });

  it("returns defaults option when no config files exist", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        NOT_FOUND_RESPONSE,
      )
      .getOnce(
        "https://api.github.com/repos/octocat/.github/contents/.github%2Fmy-app.yml",
        NOT_FOUND_RESPONSE,
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.yml",
      defaults: {
        comment: "Thank you for creating the issue!",
      },
    });

    deepEqual(result, {
      config: {
        comment: "Thank you for creating the issue!",
      },
      files: [
        {
          config: null,
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        },
        {
          config: null,
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: ".github",
          url: "https://api.github.com/repos/octocat/.github/contents/.github%2Fmy-app.yml",
        },
      ],
    });
    assert(mock.done());
  });

  it("merges defaults option", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        `config: 'value from .github/my-app.yml'`,
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.yml",
      defaults: {
        config: "default value",
        otherConfig: "default value",
      },
    });

    deepEqual(result, {
      config: {
        config: "value from .github/my-app.yml",
        otherConfig: "default value",
      },
      files: [
        {
          config: {
            config: "value from .github/my-app.yml",
          },
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        },
      ],
    });
    assert(mock.done());
  });

  it("merges defaults option from .github repository", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        NOT_FOUND_RESPONSE,
      )
      .getOnce(
        "https://api.github.com/repos/octocat/.github/contents/.github%2Fmy-app.yml",
        `config: 'value from octocat/.github:.github/my-app.yml'`,
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.yml",
      defaults: {
        config: "default value",
        otherConfig: "default value",
      },
    });

    deepEqual(result, {
      config: {
        config: "value from octocat/.github:.github/my-app.yml",
        otherConfig: "default value",
      },
      files: [
        {
          config: null,
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        },
        {
          config: {
            config: "value from octocat/.github:.github/my-app.yml",
          },
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: ".github",
          url: "https://api.github.com/repos/octocat/.github/contents/.github%2Fmy-app.yml",
        },
      ],
    });
    assert(mock.done());
  });

  it("resolves _extends in .github repository file", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        NOT_FOUND_RESPONSE,
      )
      .getOnce(
        "https://api.github.com/repos/octocat/.github/contents/.github%2Fmy-app.yml",
        `_extends: '.github:.github/my-second-app.yml'`,
      )
      .getOnce(
        "https://api.github.com/repos/octocat/.github/contents/.github%2Fmy-second-app.yml",
        stripIndent(`
        config: value from octocat/.github:.github/my-second-app.yml
        _extends: hello-world:.github/my-third-app.yml`),
      )
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-third-app.yml",
        `otherConfig: 'value from octocat/hello-world:.github/my-third-app.yml'`,
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.yml",
      defaults: {
        config: "default value",
        otherConfig: "default value",
      },
    });

    deepEqual(result, {
      config: {
        config: "value from octocat/.github:.github/my-second-app.yml",
        otherConfig: "value from octocat/hello-world:.github/my-third-app.yml",
      },
      files: [
        {
          config: null,
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        },
        {
          config: {},
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: ".github",
          url: "https://api.github.com/repos/octocat/.github/contents/.github%2Fmy-app.yml",
        },
        {
          config: {
            config: "value from octocat/.github:.github/my-second-app.yml",
          },
          owner: "octocat",
          path: ".github/my-second-app.yml",
          repo: ".github",
          url: "https://api.github.com/repos/octocat/.github/contents/.github%2Fmy-second-app.yml",
        },
        {
          config: {
            otherConfig:
              "value from octocat/hello-world:.github/my-third-app.yml",
          },
          owner: "octocat",
          path: ".github/my-third-app.yml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-third-app.yml",
        },
      ],
    });
    assert(mock.done());
  });

  it("merges deeply using defaults function", async () => {
    const mock = fetchMock.sandbox().getOnce(
      "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
      stripIndent(`
          settings:
            one: value from config file
          otherSetting1: value from config file`),
    );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    const defaults = {
      settings: {
        one: "default value",
        two: "default value",
      },
      otherSetting1: "default value",
      otherSetting2: "default value",
    };
    const result = await octokit.config.get<typeof defaults>({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.yml",
      defaults: (configs) => deepMergeSettings(defaults, configs),
    });

    deepEqual(result, {
      config: {
        otherSetting1: "value from config file",
        otherSetting2: "default value",
        settings: {
          one: "value from config file",
          two: "default value",
        },
      },
      files: [
        {
          config: {
            otherSetting1: "value from config file",
            settings: {
              one: "value from config file",
            },
          },
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        },
      ],
    });
    assert(mock.done());
  });

  it("branch option", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml?ref=my-branch",
        `comment: 'Thank you for creating the issue!'`,
        {
          headers: {
            accept: "application/vnd.github.v3.raw",
          },
        },
      );
    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.yml",
      branch: "my-branch",
    });

    deepEqual(result, {
      config: {
        comment: "Thank you for creating the issue!",
      },
      files: [
        {
          config: {
            comment: "Thank you for creating the issue!",
          },
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml?ref=my-branch",
        },
      ],
    });
    assert(mock.done());
  });

  it("_extends: base", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        stripIndent(`
        setting1: value from repo config file
        _extends: base`),
      )
      .getOnce(
        "https://api.github.com/repos/octocat/base/contents/.github%2Fmy-app.yml",
        stripIndent(`
        setting1: value from base config file
        setting2: value from base config file`),
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });
    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.yml",
    });

    deepEqual(result, {
      config: {
        setting1: "value from repo config file",
        setting2: "value from base config file",
      },
      files: [
        {
          config: {
            setting1: "value from repo config file",
          },
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        },
        {
          config: {
            setting1: "value from base config file",
            setting2: "value from base config file",
          },
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "base",
          url: "https://api.github.com/repos/octocat/base/contents/.github%2Fmy-app.yml",
        },
      ],
    });
    assert(mock.done());
  });

  it("_extends: base -> _extends: base2", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        stripIndent(`
        setting1: value from repo config file
        _extends: base`),
      )
      .getOnce(
        "https://api.github.com/repos/octocat/base/contents/.github%2Fmy-app.yml",
        stripIndent(`
        setting1: value from base1 config file
        setting2: value from base1 config file
        _extends: base2`),
      )
      .getOnce(
        "https://api.github.com/repos/octocat/base2/contents/.github%2Fmy-app.yml",
        stripIndent(`
        setting1: value from base2 config file
        setting2: value from base2 config file
        setting3: value from base2 config file`),
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });
    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.yml",
    });

    deepEqual(result, {
      config: {
        setting1: "value from repo config file",
        setting2: "value from base1 config file",
        setting3: "value from base2 config file",
      },
      files: [
        {
          config: {
            setting1: "value from repo config file",
          },
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        },
        {
          config: {
            setting1: "value from base1 config file",
            setting2: "value from base1 config file",
          },
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "base",
          url: "https://api.github.com/repos/octocat/base/contents/.github%2Fmy-app.yml",
        },
        {
          config: {
            setting1: "value from base2 config file",
            setting2: "value from base2 config file",
            setting3: "value from base2 config file",
          },
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "base2",
          url: "https://api.github.com/repos/octocat/base2/contents/.github%2Fmy-app.yml",
        },
      ],
    });
    assert(mock.done());
  });

  it("_extends: base with defaults and custom merge", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        stripIndent(`
        settings:
          one: value from repo config file
        otherSetting1: value from repo config file
        _extends: base`),
      )
      .getOnce(
        "https://api.github.com/repos/octocat/base/contents/.github%2Fmy-app.yml",
        stripIndent(`
        settings:
          one: value from base config file
          two: value from base config file
        otherSetting1: value from base config file
        otherSetting2: value from base config file`),
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });
    const defaults = {
      settings: {
        one: "default value",
        two: "default value",
        three: "default value",
      },
      otherSetting1: "default value",
      otherSetting2: "default value",
      otherSetting3: "default value",
    };
    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.yml",
      defaults: (configs) => deepMergeSettings(defaults, configs),
    });

    deepEqual(result, {
      config: {
        otherSetting1: "value from repo config file",
        otherSetting2: "value from base config file",
        otherSetting3: "default value",
        settings: {
          one: "value from repo config file",
          three: "default value",
          two: "value from base config file",
        },
      },
      files: [
        {
          config: {
            otherSetting1: "value from repo config file",
            settings: {
              one: "value from repo config file",
            },
          },
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        },
        {
          config: {
            otherSetting1: "value from base config file",
            otherSetting2: "value from base config file",
            settings: {
              one: "value from base config file",
              two: "value from base config file",
            },
          },
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "base",
          url: "https://api.github.com/repos/octocat/base/contents/.github%2Fmy-app.yml",
        },
      ],
    });
    assert(mock.done());
  });

  it("config file is a submodule", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        {
          body: {},
          headers: {
            "content-type": "application/json; charset=utf-8",
          },
        },
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    try {
      await octokit.config.get({
        owner: "octocat",
        repo: "hello-world",
        path: ".github/my-app.yml",
      });
    } catch (error: any) {
      equal(
        error.message,
        `[@probot/octokit-plugin-config] https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml exists, but is either a directory or a submodule. Ignoring.`,
      );
    }

    assert(mock.done());
  });

  it("config file is empty", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        "",
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.yml",
    });

    deepEqual(result, {
      config: {},
      files: [
        {
          config: {},
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        },
      ],
    });
    assert(mock.done());
  });

  it("repo is .github", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/.github/contents/.github%2Fmy-app.yml",
        NOT_FOUND_RESPONSE,
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    const result = await octokit.config.get({
      owner: "octocat",
      repo: ".github",
      path: ".github/my-app.yml",
    });

    deepEqual(result, {
      config: {},
      files: [
        {
          config: null,
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: ".github",
          url: "https://api.github.com/repos/octocat/.github/contents/.github%2Fmy-app.yml",
        },
      ],
    });
    assert(mock.done());
  });

  it("_extends file is missing", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        stripIndent(`
      setting1: value from repo config file
      _extends: base`),
      )
      .getOnce(
        "https://api.github.com/repos/octocat/base/contents/.github%2Fmy-app.yml",
        NOT_FOUND_RESPONSE,
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });
    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.yml",
    });

    deepEqual(result, {
      config: {
        setting1: "value from repo config file",
      },
      files: [
        {
          config: {
            setting1: "value from repo config file",
          },
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        },
        {
          config: null,
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "base",
          url: "https://api.github.com/repos/octocat/base/contents/.github%2Fmy-app.yml",
        },
      ],
    });
    assert(mock.done());
  });

  it("request error", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        {
          status: 500,
        },
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    try {
      await octokit.config.get({
        owner: "octocat",
        repo: "hello-world",
        path: ".github/my-app.yml",
      });
    } catch (error: any) {
      equal(error.status, 500);
    }

    assert(mock.done());
  });

  it("recursion", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        stripIndent(`
        settings:
          one: value from repo config file
        otherSetting1: value from repo config file
        _extends: base`),
      )
      .getOnce(
        "https://api.github.com/repos/octocat/base/contents/.github%2Fmy-app.yml",
        stripIndent(`
        settings:
          one: value from base config file
          two: value from base config file
        otherSetting1: value from base config file
        otherSetting2: value from base config file
        _extends: hello-world`),
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });
    try {
      await octokit.config.get({
        owner: "octocat",
        repo: "hello-world",
        path: ".github/my-app.yml",
      });
    } catch (error: any) {
      equal(
        error.message,
        `[@probot/octokit-plugin-config] Recursion detected. Ignoring  "_extends: undefined" from https://api.github.com/repos/octocat/base/contents/.github%2Fmy-app.yml because https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml was already loaded.`,
      );
    }

    assert(mock.done());
  });

  it(".yaml extension", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yaml",
        `comment: 'Thank you for creating the issue!'`,
        {
          headers: {
            accept: "application/vnd.github.v3.raw",
          },
        },
      );
    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.yaml",
    });

    deepEqual(result, {
      config: {
        comment: "Thank you for creating the issue!",
      },
      files: [
        {
          config: {
            comment: "Thank you for creating the issue!",
          },
          owner: "octocat",
          path: ".github/my-app.yaml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yaml",
        },
      ],
    });
    assert(mock.done());
  });

  it(".json extension", async () => {
    const mock = fetchMock.sandbox().getOnce(
      "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.json",
      { comment: "Thank you for creating the issue!" },
      {
        headers: {
          accept: "application/vnd.github.v3.raw",
        },
      },
    );
    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.json",
    });

    deepEqual(result, {
      config: {
        comment: "Thank you for creating the issue!",
      },
      files: [
        {
          config: {
            comment: "Thank you for creating the issue!",
          },
          owner: "octocat",
          path: ".github/my-app.json",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.json",
        },
      ],
    });
    assert(mock.done());
  });

  it(".unknown extension", async () => {
    const octokit = new TestOctokit();

    try {
      await octokit.config.get({
        owner: "octocat",
        repo: "hello-world",
        path: ".github/my-app.unknown",
      });
    } catch (error: any) {
      equal(
        error.message,
        '[@probot/octokit-plugin-config] .unknown extension is not support for configuration (path: ".github/my-app.unknown")',
      );
    }
  });

  it("malformed json", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.json",
        "malformed json",
        {
          headers: {
            accept: "application/vnd.github.v3.raw",
          },
        },
      );
    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    try {
      await octokit.config.get({
        owner: "octocat",
        repo: "hello-world",
        path: ".github/my-app.json",
      });
    } catch (error: any) {
      equal(
        error.message,
        `[@probot/octokit-plugin-config] Configuration could not be parsed from https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.json (invalid JSON)`,
      );
    }

    assert(mock.done());
  });

  it("malformed yaml", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yaml",
        "malformed yaml",
        {
          headers: {
            accept: "application/vnd.github.v3.raw",
          },
        },
      );
    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    try {
      await octokit.config.get({
        owner: "octocat",
        repo: "hello-world",
        path: ".github/my-app.yaml",
      });
    } catch (error: any) {
      equal(
        error.message,
        `[@probot/octokit-plugin-config] Configuration could not be parsed from https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yaml (YAML is not an object)`,
      );
    }

    assert(mock.done());
  });

  it("malformed yaml: @", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yaml",
        "@",
        {
          headers: {
            accept: "application/vnd.github.v3.raw",
          },
        },
      );
    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    try {
      await octokit.config.get({
        owner: "octocat",
        repo: "hello-world",
        path: ".github/my-app.yaml",
      });
    } catch (error: any) {
      equal(
        error.message,
        `[@probot/octokit-plugin-config] Configuration could not be parsed from https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yaml (invalid YAML)`,
      );
    }

    assert(mock.done());
  });
  it("unsafe yaml", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yaml",
        'evil: !<tag:yaml.org,2002:js/function> "function () {}"',
        {
          headers: {
            accept: "application/vnd.github.v3.raw",
          },
        },
      );
    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    try {
      await octokit.config.get({
        owner: "octocat",
        repo: "hello-world",
        path: ".github/my-app.yaml",
      });
    } catch (error: any) {
      equal(
        error.message,
        `[@probot/octokit-plugin-config] Configuration could not be parsed from https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yaml (unsafe YAML)`,
      );
    }

    assert(mock.done());
  });

  it("_extends: other-owner/base", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        stripIndent(`
        setting1: value from repo config file
        _extends: other-owner/base
      `),
      )
      .getOnce(
        "https://api.github.com/repos/other-owner/base/contents/.github%2Fmy-app.yml",
        stripIndent(`
        setting1: value from base config file
        setting2: value from base config file
      `),
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });
    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.yml",
    });

    deepEqual(result, {
      config: {
        setting1: "value from repo config file",
        setting2: "value from base config file",
      },
      files: [
        {
          config: {
            setting1: "value from repo config file",
          },
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        },
        {
          config: {
            setting1: "value from base config file",
            setting2: "value from base config file",
          },
          owner: "other-owner",
          path: ".github/my-app.yml",
          repo: "base",
          url: "https://api.github.com/repos/other-owner/base/contents/.github%2Fmy-app.yml",
        },
      ],
    });
    assert(mock.done());
  });

  it("_extends: base:test.yml", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        stripIndent(`
        setting1: value from repo config file
        _extends: base:test.yml
      `),
      )
      .getOnce(
        "https://api.github.com/repos/octocat/base/contents/test.yml",
        stripIndent(`
        setting1: value from base config file
        setting2: value from base config file
      `),
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });
    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.yml",
    });

    deepEqual(result, {
      config: {
        setting1: "value from repo config file",
        setting2: "value from base config file",
      },
      files: [
        {
          config: {
            setting1: "value from repo config file",
          },
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        },
        {
          config: {
            setting1: "value from base config file",
            setting2: "value from base config file",
          },
          owner: "octocat",
          path: "test.yml",
          repo: "base",
          url: "https://api.github.com/repos/octocat/base/contents/test.yml",
        },
      ],
    });
    assert(mock.done());
  });

  it("_extends: other-owner/base:test.yml", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        stripIndent(`
        setting1: value from repo config file
        _extends: other-owner/base:test.yml
      `),
      )
      .getOnce(
        "https://api.github.com/repos/other-owner/base/contents/test.yml",
        stripIndent(`
        setting1: value from base config file
        setting2: value from base config file
      `),
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });
    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      path: ".github/my-app.yml",
    });

    deepEqual(result, {
      config: {
        setting1: "value from repo config file",
        setting2: "value from base config file",
      },
      files: [
        {
          config: {
            setting1: "value from repo config file",
          },
          owner: "octocat",
          path: ".github/my-app.yml",
          repo: "hello-world",
          url: "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        },
        {
          config: {
            setting1: "value from base config file",
            setting2: "value from base config file",
          },
          owner: "other-owner",
          path: "test.yml",
          repo: "base",
          url: "https://api.github.com/repos/other-owner/base/contents/test.yml",
        },
      ],
    });
    assert(mock.done());
  });

  it("_extends: invalid!", async () => {
    const mock = fetchMock.sandbox().getOnce(
      "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
      stripIndent(`
        setting1: value from repo config file
        _extends: invalid!
      `),
    );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    try {
      await octokit.config.get({
        owner: "octocat",
        repo: "hello-world",
        path: ".github/my-app.yml",
      });
    } catch (error: any) {
      equal(
        error.message,
        `[@probot/octokit-plugin-config] Invalid value "invalid!" for _extends in https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml`,
      );
    }

    assert(mock.done());
  });

  it("_extends: { nope }", async () => {
    const mock = fetchMock.sandbox().getOnce(
      "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
      stripIndent(`
        setting1: value from repo config file
        _extends: { nope }
      `),
    );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    try {
      await octokit.config.get({
        owner: "octocat",
        repo: "hello-world",
        path: ".github/my-app.yml",
      });
    } catch (error: any) {
      equal(
        error.message,
        `[@probot/octokit-plugin-config] Invalid value {"nope":null} for _extends in https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml`,
      );
    }

    assert(mock.done());
  });
});
