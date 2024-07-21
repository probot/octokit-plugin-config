import type { Octokit } from "@octokit/core";
import type * as Types from "./types.js";
export type * from "./types.js";
import { VERSION } from "./version.js";
import { composeConfigGet } from "./compose-config-get.js";

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

export { composeConfigGet } from "./compose-config-get.js";

export namespace createPullRequest {
  export type GetOptions<T extends Types.Configuration = Types.Configuration> =
    Types.GetOptions<T>;
  export type GetResult<T extends Types.Configuration = Types.Configuration> =
    Types.GetResult<T>;
  export type ConfigFile = Types.ConfigFile;
}
