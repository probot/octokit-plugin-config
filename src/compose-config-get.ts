import type { Octokit } from "@octokit/core";
import type {
  Configuration,
  GetOptions,
  GetResult,
  mergeFunction,
} from "./types.js";
import { getConfigFiles } from "./util/get-config-files.js";
import { deepmerge } from "@fastify/deepmerge";

const defaultMerge = deepmerge({ all: true });

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
  {
    owner,
    repo,
    defaults = {} as T,
    merge = defaultMerge as mergeFunction<T>,
    path,
    branch,
  }: GetOptions<T>,
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
    config: merge(defaults, ...(configs as Configuration[])) as T,
  };
}
