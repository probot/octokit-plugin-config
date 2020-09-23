import { Octokit } from "@octokit/core";

import { VERSION } from "./version";
import { getConfigFiles } from "./util/get-config-files";

import type { Configuration, File } from "./types";

type defaultsFunction<T> = (files: Configuration[]) => T;

type GetOptions<T> = {
  owner: string;
  repo: string;
  filename: string;
  defaults?: T | defaultsFunction<T>;
  path?: string;
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
        filename,
        defaults,
        path,
      }: GetOptions<T>): Promise<GetResult<T>> {
        const files = await getConfigFiles(octokit, {
          owner,
          repo,
          filename,
          path,
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
