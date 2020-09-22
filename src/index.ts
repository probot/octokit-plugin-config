import { Octokit } from "@octokit/core";

import { VERSION } from "./version";
import { getConfig } from "./get-config";

import type { Configuration } from "./types";

type defaultsFunction<T> = (config: T | null) => T;

type GetOptions<T> = {
  owner: string;
  repo: string;
  filename: string;
  defaults?: T | defaultsFunction<T>;
};

type GetResult<T> = {
  config: T;
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
      }: GetOptions<T>): Promise<GetResult<T>> {
        const path = `.github/${filename}`;

        const { config } = await getConfig<T>(octokit, { owner, repo, path });

        return {
          config:
            typeof defaults === "function"
              ? defaults(config)
              : Object.assign({}, defaults, config),
        };
      },
    },
  };
}

config.VERSION = VERSION;
