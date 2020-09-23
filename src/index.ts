import { Octokit } from "@octokit/core";

import { VERSION } from "./version";
import { getConfigFiles } from "./util/get-config-files";

import type { Configuration, File } from "./types";

type defaultsFunction<T> = (files: Configuration[]) => T;

type GetOptions<T> = {
  owner: string;
  repo: string;
  path: string;
  defaults?: T | defaultsFunction<T>;
  branch?: string;
};

type GetResult<T> = {
  config: T;
  files: File[];
};

/**
 * @param octokit Octokit instance
 */
export function config(octokit: Octokit) {
  return {
    config: {
      async get<T extends Configuration = Configuration>({
        owner,
        repo,
        defaults,
        path,
        branch,
      }: GetOptions<T>): Promise<GetResult<T>> {
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
      },
    },
  };
}

config.VERSION = VERSION;
