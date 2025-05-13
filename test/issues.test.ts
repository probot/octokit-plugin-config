import { describe, it, equal, assert } from "./testrunner.ts";
import { Octokit } from "@octokit/core";
import fetchMock from "fetch-mock";

import { config } from "../src/index.ts";

const TestOctokit = Octokit.plugin(config);

describe("issues", () => {
  it("#91 sets incorrect accept header when media type previews are set", async () => {
    const mock = fetchMock.sandbox().getOnce((_url: string, { headers }) => {
      // @ts-ignore TypeScript says we can't do this but turns out we can so there you go
      equal(headers["accept"], "application/vnd.github.v3.raw");
      return true;
    }, "foo: bar");
    const octokit = new TestOctokit({
      previews: ["luke-cage"],
      request: {
        fetch: mock,
      },
    });

    await octokit.config.get({
      owner: "ScottChapman",
      repo: "probot-config-plugin-bug",
      path: "config.yaml",
    });

    assert(mock.done());
  });
});
