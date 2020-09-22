import { Octokit } from "@octokit/core";
import fetchMock from "fetch-mock";
import { config } from "../src";

const TestOctokit = Octokit.plugin(config);

const NOT_FOUND_RESPONSE = {
  status: 404,
  body: {
    message: "Not Found",
    documentation_url:
      "https://docs.github.com/rest/reference/repos#get-repository-content",
  },
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

    const { config } = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      filename: "my-app.yml",
    });

    expect(config).toStrictEqual({
      comment: "Thank you for creating the issue!",
    });
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

    const { config } = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      filename: "my-app.yml",
      defaults: {
        comment: "Thank you for creating the issue!",
      },
    });

    expect(config).toStrictEqual({
      comment: "Thank you for creating the issue!",
    });
    //github.com/probot/octokit-plugin-config
    https: expect(mock.done()).toBe(true);
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

    const { config } = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      filename: "my-app.yml",
      defaults: {
        comment: "Thank you for creating the issue!",
      },
    });

    expect(config).toStrictEqual({
      comment: "Thank you for creating the issue!",
    });
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

    const { config } = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      filename: "my-app.yml",
      defaults: {
        config: "default value",
        otherConfig: "default value",
      },
    });

    expect(config).toStrictEqual({
      config: "value from .github/my-app.yml",
      otherConfig: "default value",
    });
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

    const { config } = await octokit.config.get({
      owner: "octocat",
      repo: "hello-world",
      filename: "my-app.yml",
      defaults: {
        config: "default value",
        otherConfig: "default value",
      },
    });

    expect(config).toStrictEqual({
      config: "value from octocat/.github:.github/my-app.yml",
      otherConfig: "default value",
    });
    expect(mock.done()).toBe(true);
  });
});
