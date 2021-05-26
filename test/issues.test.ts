import { Octokit } from "@octokit/core";
import fetchMock from "fetch-mock";
import stripIndent from "strip-indent";

import { config } from "../src";

const TestOctokit = Octokit.plugin(config);

describe("issues", () => {
  it("#91 sets incorrect accept header when media type previews are set", async () => {
    const mock = fetchMock.sandbox().getOnce((url, { headers }) => {
      // @ts-ignore TypeScript says we can't do this but turns out we can so there you go
      expect(headers["accept"]).toEqual(
        "application/vnd.github.luke-cage-preview.raw"
      );
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

    expect(mock.done()).toBe(true);
  });
});
