import { Octokit } from "@octokit/core";
import fetchMock from "fetch-mock";
import stripIndent from "strip-indent";

import { config } from "../src";
import { Configuration, File } from "../src/types";

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
  configs: Configuration[]
) => {
  const allConfigs = [defaults, ...configs];
  const fileSettingsConfigs = allConfigs.map(
    (config: Configuration) => config.settings
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
        }
      );
    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      filename: "my-app.yml",
    });

    expect(result).toMatchSnapshot("result");
    expect(mock.done()).toBe(true);
  });

  it("config file missing", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        NOT_FOUND_RESPONSE
      )
      .getOnce(
        "https://api.github.com/repos/octocat/.github/contents/.github%2Fmy-app.yml",
        NOT_FOUND_RESPONSE
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      filename: "my-app.yml",
      defaults: {
        comment: "Thank you for creating the issue!",
      },
    });

    expect(result).toMatchSnapshot("result");
    expect(mock.done()).toBe(true);
  });

  it("defaults option when no config present", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        NOT_FOUND_RESPONSE
      )
      .getOnce(
        "https://api.github.com/repos/octocat/.github/contents/.github%2Fmy-app.yml",
        NOT_FOUND_RESPONSE
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      filename: "my-app.yml",
      defaults: {
        comment: "Thank you for creating the issue!",
      },
    });

    expect(result).toMatchSnapshot("result");
    expect(mock.done()).toBe(true);
  });

  it("merges defaults option", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        `config: 'value from .github/my-app.yml'`
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      filename: "my-app.yml",
      defaults: {
        config: "default value",
        otherConfig: "default value",
      },
    });

    expect(result).toMatchSnapshot("result");
    expect(mock.done()).toBe(true);
  });

  it("merges defaults option from .github repository", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        NOT_FOUND_RESPONSE
      )
      .getOnce(
        "https://api.github.com/repos/octocat/.github/contents/.github%2Fmy-app.yml",
        `config: 'value from octocat/.github:.github/my-app.yml'`
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });

    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      filename: "my-app.yml",
      defaults: {
        config: "default value",
        otherConfig: "default value",
      },
    });

    expect(result).toMatchSnapshot("result");
    expect(mock.done()).toBe(true);
  });

  it("merges deeply using defaults function", async () => {
    const mock = fetchMock.sandbox().getOnce(
      "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
      stripIndent(`
          settings:
            one: value from config file
          otherSetting1: value from config file`)
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
      filename: "my-app.yml",
      defaults: (configs) => deepMergeSettings(defaults, configs),
    });

    expect(result).toMatchSnapshot("result");
    expect(mock.done()).toBe(true);
  });

  it("_extends: base", async () => {
    const mock = fetchMock
      .sandbox()
      .getOnce(
        "https://api.github.com/repos/octocat/hello-world/contents/.github%2Fmy-app.yml",
        stripIndent(`
        setting1: value from repo config file
        _extends: base`)
      )
      .getOnce(
        "https://api.github.com/repos/octocat/base/contents/.github%2Fmy-app.yml",
        stripIndent(`
        setting1: value from base config file
        setting2: value from base config file`)
      );

    const octokit = new TestOctokit({
      request: {
        fetch: mock,
      },
    });
    const result = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      filename: "my-app.yml",
    });

    expect(result).toMatchSnapshot("result");
    expect(mock.done()).toBe(true);
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
        _extends: base`)
      )
      .getOnce(
        "https://api.github.com/repos/octocat/base/contents/.github%2Fmy-app.yml",
        stripIndent(`
        settings:
          one: value from base config file
          two: value from base config file
        otherSetting1: value from base config file
        otherSetting2: value from base config file`)
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
      filename: "my-app.yml",
      defaults: (configs) => deepMergeSettings(defaults, configs),
    });

    expect(result).toMatchSnapshot("result");
    expect(mock.done()).toBe(true);
  });
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
      }
    )
    .getOnce(
      "https://api.github.com/repos/octocat/.github/contents/.github%2Fmy-app.yml",
      NOT_FOUND_RESPONSE
    );

  const log = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const octokit = new TestOctokit({
    log,
    request: {
      fetch: mock,
    },
  });

  const result = await octokit.config.get({
    owner: "octocat",
    repo: "hello-world",
    filename: "my-app.yml",
  });

  expect(result).toMatchSnapshot("result");
  expect(log).toMatchSnapshot("log");
  expect(mock.done()).toBe(true);
});

//   it("merges the base and default config", async () => {
//     jest
//       .spyOn(github, "request")
//       .mockReturnValueOnce(responseFromString("boa: 6\nfoo: 0\n_extends: base"))
//       .mockReturnValueOnce(responseFromConfig("basic.yml"));

//     const config = await context.config("test-file.yml", {
//       bar: 1,
//       new: true,
//     });

//     expect(github.request).toHaveBeenCalledWith(
//       "GET /repos/{owner}/{repo}/contents/{path}",
//       {
//         owner: "bkeepers",
//         path: ".github/test-file.yml",
//         repo: "probot",
//       }
//     );
//     expect(github.request).toHaveBeenCalledWith(
//       "GET /repos/{owner}/{repo}/contents/{path}",
//       {
//         owner: "bkeepers",
//         path: ".github/test-file.yml",
//         repo: "base",
//       }
//     );
//     expect(config).toEqual({
//       bar: 7,
//       baz: 11,
//       boa: 6,
//       foo: 0,
//       new: true,
//     });
//   });

//   it("merges a base config from another organization", async () => {
//     jest
//       .spyOn(github, "request")
//       .mockReturnValueOnce(
//         responseFromString("boa: 6\nfoo: 0\n_extends: other/base")
//       )
//       .mockReturnValueOnce(responseFromConfig("basic.yml"));

//     const config = await context.config("test-file.yml");

//     expect(github.request).toHaveBeenCalledWith(
//       "GET /repos/{owner}/{repo}/contents/{path}",
//       {
//         owner: "bkeepers",
//         path: ".github/test-file.yml",
//         repo: "probot",
//       }
//     );
//     expect(github.request).toHaveBeenCalledWith(
//       "GET /repos/{owner}/{repo}/contents/{path}",
//       {
//         owner: "other",
//         path: ".github/test-file.yml",
//         repo: "base",
//       }
//     );
//     expect(config).toEqual({
//       bar: 7,
//       baz: 11,
//       boa: 6,
//       foo: 0,
//     });
//   });

//   it("merges a base config with a custom path", async () => {
//     jest
//       .spyOn(github, "request")
//       .mockReturnValueOnce(
//         responseFromString("boa: 6\nfoo: 0\n_extends: base:test.yml")
//       )
//       .mockReturnValueOnce(responseFromConfig("basic.yml"));

//     const config = await context.config("test-file.yml");

//     expect(github.request).toHaveBeenCalledWith(
//       "GET /repos/{owner}/{repo}/contents/{path}",
//       {
//         owner: "bkeepers",
//         path: ".github/test-file.yml",
//         repo: "probot",
//       }
//     );
//     expect(github.request).toHaveBeenCalledWith(
//       "GET /repos/{owner}/{repo}/contents/{path}",
//       {
//         owner: "bkeepers",
//         path: "test.yml",
//         repo: "base",
//       }
//     );
//     expect(config).toEqual({
//       bar: 7,
//       baz: 11,
//       boa: 6,
//       foo: 0,
//     });
//   });

//   it("ignores a missing base config", async () => {
//     jest
//       .spyOn(github, "request")
//       .mockReturnValueOnce(responseFromString("boa: 6\nfoo: 0\n_extends: base"))
//       .mockReturnValueOnce(Promise.reject(notFoundError));

//     const config = await context.config("test-file.yml");

//     expect(github.request).toHaveBeenCalledWith(
//       "GET /repos/{owner}/{repo}/contents/{path}",
//       {
//         owner: "bkeepers",
//         path: ".github/test-file.yml",
//         repo: "probot",
//       }
//     );
//     expect(github.request).toHaveBeenCalledWith(
//       "GET /repos/{owner}/{repo}/contents/{path}",
//       {
//         owner: "bkeepers",
//         path: ".github/test-file.yml",
//         repo: "base",
//       }
//     );
//     expect(config).toEqual({
//       boa: 6,
//       foo: 0,
//     });
//   });

//   it("throws when the configuration file is malformed", async () => {
//     jest
//       .spyOn(github, "request")
//       .mockReturnValue(responseFromConfig("malformed.yml"));

//     let e;
//     let contents;
//     try {
//       contents = await context.config("test-file.yml");
//     } catch (error) {
//       e = error;
//     }

//     expect(contents).toBeUndefined();
//     expect(e).toBeDefined();
//     expect(e.message).toMatch(/^end of the stream or a document separator/);
//   });

//   it("throws when loading unsafe yaml", async () => {
//     jest
//       .spyOn(github, "request")
//       .mockReturnValue(responseFromConfig("evil.yml"));

//     let e;
//     let config;
//     try {
//       config = await context.config("evil.yml");
//     } catch (error) {
//       e = error;
//     }

//     expect(config).toBeUndefined();
//     expect(e).toBeDefined();
//     expect(e.message).toMatch(/unknown tag/);
//   });

//   it("throws on a non-string base", async () => {
//     jest
//       .spyOn(github, "request")
//       .mockReturnValue(
//         responseFromString("boa: 6\nfoo: 0\n_extends: { nope }")
//       );

//     let e;
//     let config;
//     try {
//       config = await context.config("test-file.yml");
//     } catch (error) {
//       e = error;
//     }

//     expect(config).toBeUndefined();
//     expect(e).toBeDefined();
//     expect(e.message).toMatch(/invalid/i);
//   });

//   it("throws on an invalid base", async () => {
//     jest
//       .spyOn(github, "request")
//       .mockReturnValue(responseFromString('boa: 6\nfoo: 0\n_extends: "nope:"'));

//     let e;
//     let config;
//     try {
//       config = await context.config("test-file.yml");
//     } catch (error) {
//       e = error;
//     }

//     expect(config).toBeUndefined();
//     expect(e).toBeDefined();
//     expect(e.message).toMatch(/nope:/);
//   });

//   it("returns an empty object when the file is empty", async () => {
//     jest
//       .spyOn(github, "request")
//       .mockReturnValue(responseFromConfig("empty.yml"));

//     const contents = await context.config("test-file.yml");

//     expect(github.request).toHaveBeenCalledTimes(1);
//     expect(contents).toEqual({});
//   });

//   it("overwrites default config settings", async () => {
//     jest
//       .spyOn(github, "request")
//       .mockReturnValue(responseFromConfig("basic.yml"));
//     const config = await context.config("test-file.yml", { foo: 10 });

//     expect(github.request).toHaveBeenCalledTimes(1);
//     expect(config).toEqual({
//       bar: 7,
//       baz: 11,
//       foo: 5,
//     });
//   });

//   it("uses default settings to fill in missing options", async () => {
//     jest
//       .spyOn(github, "request")
//       .mockReturnValue(responseFromConfig("missing.yml"));
//     const config = await context.config("test-file.yml", { bar: 7 });

//     expect(github.request).toHaveBeenCalledTimes(1);
//     expect(config).toEqual({
//       bar: 7,
//       baz: 11,
//       foo: 5,
//     });
//   });

//   it("uses the .github directory on a .github repo", async () => {
//     jest
//       .spyOn(github, "request")
//       .mockReturnValueOnce(responseFromString("foo: foo\n_extends: .github"))
//       .mockReturnValueOnce(responseFromConfig("basic.yml"));
//     const config = await context.config("test-file.yml");

//     expect(github.request).toHaveBeenCalledWith(
//       "GET /repos/{owner}/{repo}/contents/{path}",
//       {
//         owner: "bkeepers",
//         path: ".github/test-file.yml",
//         repo: "probot",
//       }
//     );
//     expect(github.request).toHaveBeenCalledWith(
//       "GET /repos/{owner}/{repo}/contents/{path}",
//       {
//         owner: "bkeepers",
//         path: ".github/test-file.yml",
//         repo: ".github",
//       }
//     );
//     expect(config).toEqual({
//       bar: 7,
//       baz: 11,
//       foo: "foo",
//     });
//   });

//   it("defaults to .github repo if no config found", async () => {
//     jest
//       .spyOn(github, "request")
//       .mockReturnValueOnce(Promise.reject(notFoundError))
//       .mockReturnValueOnce(responseFromConfig("basic.yml"));
//     const config = await context.config("test-file.yml");

//     expect(github.request).toHaveBeenCalledWith(
//       "GET /repos/{owner}/{repo}/contents/{path}",
//       {
//         owner: "bkeepers",
//         path: ".github/test-file.yml",
//         repo: "probot",
//       }
//     );
//     expect(github.request).toHaveBeenCalledWith(
//       "GET /repos/{owner}/{repo}/contents/{path}",
//       {
//         owner: "bkeepers",
//         path: ".github/test-file.yml",
//         repo: ".github",
//       }
//     );
//     expect(config).toEqual({
//       bar: 7,
//       baz: 11,
//       foo: 5,
//     });
//   });

//   it("deep merges the base config", async () => {
//     jest
//       .spyOn(github, "request")
//       .mockReturnValueOnce(
//         responseFromString("obj:\n  foo:\n  - name: master\n_extends: .github")
//       )
//       .mockReturnValueOnce(
//         responseFromString("obj:\n  foo:\n  - name: develop")
//       );
//     const config = await context.config("test-file.yml");

//     expect(config).toEqual({
//       obj: {
//         foo: [{ name: "develop" }, { name: "master" }],
//       },
//     });
//   });

//   it("accepts deepmerge options", async () => {
//     jest
//       .spyOn(github, "request")
//       .mockReturnValueOnce(
//         responseFromString(
//           "foo:\n  - name: master\n    shouldChange: changed\n_extends: .github"
//         )
//       )
//       .mockReturnValueOnce(
//         responseFromString(
//           "foo:\n  - name: develop\n  - name: master\n    shouldChange: should"
//         )
//       );

//     const customMerge = jest.fn(
//       (
//         _target: any[],
//         _source: any[],
//         _options: MergeOptions | undefined
//       ): any[] => []
//     );
//     await context.config("test-file.yml", {}, { arrayMerge: customMerge });
//     expect(customMerge).toHaveBeenCalled();
//   });
// });
