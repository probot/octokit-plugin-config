import { Octokit } from "@octokit/core";

import type { File } from "../types";
import { getConfigFile } from "./get-config-file";

type GetOptions = {
  owner: string;
  repo: string;
  filename: string;
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
  { owner, repo, filename }: GetOptions
): Promise<File[]> {
  const path = `.github/${filename}`;

  const requestedRepoFile = await getConfigFile(octokit, {
    owner,
    repo,
    path,
  });

  if (!requestedRepoFile.config) {
    if (repo === ".github") {
      return [requestedRepoFile];
    }

    const defaultRepoConfig = await getConfigFile(octokit, {
      owner,
      repo: ".github",
      path,
    });

    return [requestedRepoFile, defaultRepoConfig];
  }

  if (!requestedRepoFile.config._extends) {
    return [requestedRepoFile];
  }

  let extendRepoName: string = requestedRepoFile.config._extends as string;
  delete requestedRepoFile.config._extends;
  const files = [requestedRepoFile];

  do {
    const extendRepoConfig = await getConfigFile(octokit, {
      owner,
      repo: extendRepoName,
      path,
    });
    if (extendRepoConfig.config) {
      extendRepoName = extendRepoConfig.config._extends as string;
      delete extendRepoConfig.config._extends;
    } else {
      extendRepoName = "";
    }

    files.push(extendRepoConfig);

    const alreadyLoaded = files.find((file) => file.repo === extendRepoName);
    if (alreadyLoaded) {
      octokit.log.warn(
        `[@probot/octokit-plugin-config] Recursion detected. Ignoring  "_extends: ${extendRepoName}" from ${extendRepoConfig.url} because ${alreadyLoaded.url} was already loaded.`
      );
      extendRepoName = "";
    }
  } while (extendRepoName);

  return files;
}
