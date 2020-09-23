import { join } from "path";

import { Octokit } from "@octokit/core";

import type { File } from "../types";
import { getConfigFile } from "./get-config-file";
import { extendsToGetContentParams } from "./extends-to-get-content-params";

type Options = {
  owner: string;
  repo: string;
  filename: string;
  path?: string;
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
  { owner, repo, filename, path = ".github/" }: Options
): Promise<File[]> {
  const fullPath = join(path, filename);

  const requestedRepoFile = await getConfigFile(octokit, {
    owner,
    repo,
    path: fullPath,
  });

  // if no configuration file present in selected repository,
  // try to load it from the `.github` repository
  if (!requestedRepoFile.config) {
    if (repo === ".github") {
      return [requestedRepoFile];
    }

    const defaultRepoConfig = await getConfigFile(octokit, {
      owner,
      repo: ".github",
      path: fullPath,
    });

    return [requestedRepoFile, defaultRepoConfig];
  }

  // if the configuration has no `_extends` key, we are done here.
  if (!requestedRepoFile.config._extends) {
    return [requestedRepoFile];
  }

  // parse the value of `_extends` into request parameters to
  // retrieve the new configuration file
  let extendConfigOptions = extendsToGetContentParams({
    owner,
    path: fullPath,
    url: requestedRepoFile.url,
    extendsValue: requestedRepoFile.config._extends as string,
  });

  // remove the `_extends` key from the configuration that is returned
  delete requestedRepoFile.config._extends;
  const files = [requestedRepoFile];

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
      path: fullPath,
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
