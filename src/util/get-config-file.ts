import { Octokit } from "@octokit/core";
import yaml from "js-yaml";

import type { Configuration, File } from "../types";

type Options = {
  owner: string;
  repo: string;
  path: string;
};

/**
 * Load configuration from a given repository and path.
 *
 * @param octokit Octokit instance
 * @param options
 */
export async function getConfigFile(
  octokit: Octokit,
  { owner, repo, path }: Options
): Promise<File> {
  // https://docs.github.com/en/rest/reference/repos#get-repository-content
  const requestOptions = await octokit.request.endpoint(
    "GET /repos/{owner}/{repo}/contents/{path}",
    {
      owner,
      repo,
      path,
      mediaType: {
        format: "raw",
      },
    }
  );

  try {
    const { data, headers } = await octokit.request(requestOptions);

    // If path is a submodule, or a folder, then a JSON string is returned with
    // the "Content-Type" header set to "application/json; charset=utf-8".
    //
    // - https://docs.github.com/en/rest/reference/repos#if-the-content-is-a-submodule
    // - https://docs.github.com/en/rest/reference/repos#if-the-content-is-a-directory
    //
    // symlinks just return the content of the linked file when requesting the raw formt,
    // so we are fine
    if (headers["content-type"] === "application/json; charset=utf-8") {
      octokit.log.warn(
        `[@probot/octokit-plugin-config] ${requestOptions.url} exists, but is either a directory or a submodule. Ignoring.`
      );

      return {
        owner,
        repo,
        path,
        url: requestOptions.url,
        config: null,
      };
    }

    if (/\.json/.test(path)) {
      return {
        owner,
        repo,
        path,
        url: requestOptions.url,
        config: data,
      };
    }

    return {
      owner,
      repo,
      path,
      url: requestOptions.url,
      config: ((yaml.safeLoad(data) || {}) as unknown) as Configuration,
    };
  } catch (error) {
    if (error.status === 404) {
      return {
        owner,
        repo,
        path,
        url: requestOptions.url,
        config: null,
      };
    }

    throw error;
  }
}
