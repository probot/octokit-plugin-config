import { Octokit } from "@octokit/core";
import yaml from "js-yaml";

type GetOptions = {
  owner: string;
  repo: string;
  path: string;
};

type Config = {
  config: Record<string, unknown> | null;
};

/**
 * Load configuration for a given repository and path. If the file does not exist,
 * it loads the configuration from the same file in the `.github` repository by the
 * same owner.
 *
 * @param octokit Octokit instance
 * @param options
 */
export async function getConfig(
  octokit: Octokit,
  { owner, repo, path }: GetOptions
): Promise<Config> {
  try {
    // https://docs.github.com/en/rest/reference/repos#get-repository-content
    const { data, headers } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo,
        path,
        mediaType: {
          format: "raw",
        },
      }
    );

    // If path is a submodule, or a folder, then a JSON string is returned with
    // the "Content-Type" header set to "application/json; charset=utf-8".
    //
    // - https://docs.github.com/en/rest/reference/repos#if-the-content-is-a-submodule
    // - https://docs.github.com/en/rest/reference/repos#if-the-content-is-a-directory
    //
    // symlinks just return the content of the linked file when requesting the raw formt,
    // so we are fine
    if (headers["content-type"] === "application/json; charset=utf-8") {
      return {
        config: null,
      };
    }

    return {
      config: (yaml.safeLoad(data) as Record<string, unknown>) || {},
    };
  } catch (error) {
    if (error.status === 404) {
      if (repo === ".github") {
        return {
          config: null,
        };
      }

      return getConfig(octokit, {
        owner,
        repo: ".github",
        path,
      });
    }

    throw error;
  }
}
