import type { Octokit } from "@octokit/core";
import yaml from "js-yaml";

import type { Configuration, ConfigFile } from "../types.js";

type Options = {
  owner: string;
  repo: string;
  path: string;
  ref?: string | undefined;
};

const SUPPORTED_FILE_EXTENSIONS = ["json", "yml", "yaml"];

/**
 * Load configuration from a given repository and path.
 *
 * @param octokit Octokit instance
 * @param options
 */
export async function getConfigFile(
  octokit: Octokit,
  { owner, repo, path, ref }: Options,
): Promise<ConfigFile> {
  const fileExtension = (path.split(".").pop() as string).toLowerCase();

  if (!SUPPORTED_FILE_EXTENSIONS.includes(fileExtension)) {
    throw new Error(
      `[@probot/octokit-plugin-config] .${fileExtension} extension is not support for configuration (path: "${path}")`,
    );
  }

  // https://docs.github.com/en/rest/reference/repos#get-repository-content
  const endpoint = {
    method: "GET",
    url: "/repos/{owner}/{repo}/contents/{path}",
    owner,
    repo,
    path,
    mediaType: {
      format: "raw",
    },
    // this can be just `ref` once https://github.com/octokit/endpoint.js/issues/206 is resolved
    ...(ref ? { ref } : {}),
  };
  const { url } = octokit.request.endpoint(endpoint);
  const emptyConfigResult = {
    owner,
    repo,
    path,
    url,
    config: null,
  };

  try {
    const { data, headers } = await octokit.request(endpoint);

    // If path is a submodule, or a folder, then a JSON string is returned with
    // the "Content-Type" header set to "application/json; charset=utf-8".
    //
    // - https://docs.github.com/en/rest/reference/repos#if-the-content-is-a-submodule
    // - https://docs.github.com/en/rest/reference/repos#if-the-content-is-a-directory
    //
    // symlinks just return the content of the linked file when requesting the raw formt,
    // so we are fine
    if (headers["content-type"] === "application/json; charset=utf-8") {
      throw new Error(
        `[@probot/octokit-plugin-config] ${url} exists, but is either a directory or a submodule. Ignoring.`,
      );
    }

    if (fileExtension === "json") {
      if (typeof data === "string") {
        throw new Error(
          `[@probot/octokit-plugin-config] Configuration could not be parsed from ${url} (invalid JSON)`,
        );
      }

      return {
        ...emptyConfigResult,
        config: data,
      };
    }

    const config = (yaml.load(data) || {}) as unknown as Configuration;

    if (typeof config === "string") {
      throw new Error(
        `[@probot/octokit-plugin-config] Configuration could not be parsed from ${url} (YAML is not an object)`,
      );
    }

    return {
      ...emptyConfigResult,
      config,
    };
  } catch (error: any) {
    if (error.status === 404) {
      return emptyConfigResult;
    }

    if (error.name === "YAMLException") {
      const reason = /unknown tag/.test(error.message)
        ? "unsafe YAML"
        : "invalid YAML";

      throw new Error(
        `[@probot/octokit-plugin-config] Configuration could not be parsed from ${url} (${reason})`,
      );
    }

    throw error;
  }
}
