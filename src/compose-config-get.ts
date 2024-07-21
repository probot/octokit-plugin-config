import type { Octokit } from "@octokit/core";
import type { Configuration, GetOptions, GetResult } from "./types.js";
import { getConfigFiles } from "./util/get-config-files.js";

/**
 * Loads configuration from one or multiple files and resolves with
 * the combined configuration as well as the list of files the configuration
 * was loaded from
 *
 * @param octokit Octokit instance
 * @param options
 */
export async function composeConfigGet<T extends Configuration = Configuration>(
  octokit: Octokit,
  { owner, repo, defaults, path, branch }: GetOptions<T>,
): Promise<GetResult<T>> {
  const files = await getConfigFiles(octokit, {
    owner,
    repo,
    path,
    branch,
  });

  const configs = files
    .map((file) => file.config)
    .reverse()
    .filter(Boolean) as Configuration[];

  return {
    files,
    config:
      typeof defaults === "function"
        ? defaults(configs)
        : Object.assign({}, defaults, ...configs),
  };
}
