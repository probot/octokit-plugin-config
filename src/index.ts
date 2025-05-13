import type { Octokit } from "@octokit/core";
import type * as Types from "./types.ts";
export type * from "./types.ts";
import { VERSION } from "./version.ts";
import { composeConfigGet } from "./compose-config-get.ts";

/**
 * @param octokit Octokit instance
 */
export function config(octokit: Octokit): Types.API {
  return {
    config: {
      async get(options) {
        return composeConfigGet(octokit, options);
      },
    },
  };
}

config.VERSION = VERSION;

export { composeConfigGet } from "./compose-config-get.ts";

export namespace createPullRequest {
  export type GetOptions<T extends Types.Configuration = Types.Configuration> =
    Types.GetOptions<T>;
  export type GetResult<T extends Types.Configuration = Types.Configuration> =
    Types.GetResult<T>;
  export type ConfigFile = Types.ConfigFile;
}
