import { describe, it, expect } from "vitest";
import { Octokit } from "@octokit/core";
import fetchMock from "fetch-mock";

import { config } from "../src/index.js";

const TestOctokit = Octokit.plugin(config);

describe("issues", () => {
  it("#91 sets incorrect accept header when media type previews are set", async () => {
    const mock = fetchMock.mockGlobal().getOnce({
      headers: {
        accept: "application/vnd.github.v3.raw",
      },
      response: "foo: bar",
    });
    const octokit = new TestOctokit({
      previews: ["luke-cage"],
    });

    await octokit.config.get({
      owner: "ScottChapman",
      repo: "probot-config-plugin-bug",
      path: "config.yaml",
    });

    fetchMock.unmockGlobal();
  });
});
