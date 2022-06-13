import { Octokit } from "@octokit/core";

import type { ConfigFile } from "../types";
import { getConfigFile } from "./get-config-file";
import { extendsToGetContentParams } from "./extends-to-get-content-params";

type Options = {
  owner: string;
  repo: string;
  path: string;
  branch?: string;
};

/**
 * Load configuration from selected repository file. If the file does not exist
 * it loads configuration from the owners `.github` repository.
 *
 * If the repository file configuration includes an `_extends` key, that file
 * is loaded. Same with the target file until no `_extends` key is present.
 *
 * @param octokit Octokit instance
 * @param options
 */
export async function getConfigFiles(
  octokit: Octokit,
  { owner, repo, path, branch }: Options
): Promise<ConfigFile[]> {
  const requestedRepoFile = await getConfigFile(octokit, {
    owner,
    repo,
    path,
    ref: branch,
  });

  const files = [requestedRepoFile];

  // if no configuration file present in selected repository,
  // try to load it from the `.github` repository
  if (!requestedRepoFile.config) {
    if (repo === ".github") {
      return files;
    }

    const defaultRepoConfig = await getConfigFile(octokit, {
      owner,
      repo: ".github",
      path,
    });

    files.push(defaultRepoConfig);
  }

  const file = files[files.length - 1];

  // if the configuration has no `_extends` key, we are done here.
  if (!file.config || !file.config._extends) {
    return files;
  }

  // parse the value of `_extends` into request parameters to
  // retrieve the new configuration file
  let extendConfigOptions = extendsToGetContentParams({
    owner,
    path,
    url: file.url,
    extendsValue: file.config._extends as string,
  });

  // remove the `_extends` key from the configuration that is returned
  delete file.config._extends;

  // now load the configuration linked from the `_extends` key. If that
  // configuration also includes an `_extends` key, then load that configuration
  // as well, until the target configuration has no `_extends` key
  do {
    const extendRepoConfig = await getConfigFile(octokit, extendConfigOptions);
    files.push(extendRepoConfig);
    if (!extendRepoConfig.config || !extendRepoConfig.config._extends) {
      return files;
    }

    extendConfigOptions = extendsToGetContentParams({
      owner,
      path,
      url: extendRepoConfig.url,
      extendsValue: extendRepoConfig.config._extends as string,
    });
    delete extendRepoConfig.config._extends;

    // Avoid loops
    const alreadyLoaded = files.find(
      (file) =>
        file.owner === extendConfigOptions.owner &&
        file.repo === extendConfigOptions.repo &&
        file.path === extendConfigOptions.path
    );

    if (alreadyLoaded) {
      throw new Error(
        `[@probot/octokit-plugin-config] Recursion detected. Ignoring  "_extends: ${extendRepoConfig.config._extends}" from ${extendRepoConfig.url} because ${alreadyLoaded.url} was already loaded.`
      );
    }
  } while (true);
}
