import { Octokit } from "@octokit/core";
import merge from "deepmerge";

import { VERSION } from "./version";
import { getConfig } from "./get-config";

type GetOptions = {
  owner: string;
  repo: string;
  filename: string;
  defaults?: Record<string, unknown>;
};

/**
 * @param octokit Octokit instance
 */
export function config(octokit: Octokit) {
  return {
    config: {
      async get({ owner, repo, filename, defaults }: GetOptions) {
        const path = `.github/${filename}`;

        const { config } = await getConfig(octokit, { owner, repo, path });

        return {
          config: merge.all([defaults, config].filter(Boolean) as object[]),
        };
      },
    },
  };
}

config.VERSION = VERSION;
