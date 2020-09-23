type Options = {
  owner: string;
  path: string;
  url: string;
  extendsValue: string;
};

const EXTENDS_REGEX = new RegExp(
  "^" +
    "(?:([a-z\\d](?:[a-z\\d]|-(?=[a-z\\d])){0,38})/)?" + // org
    "([-_.\\w\\d]+)" + // project
    "(?::([-_./\\w\\d]+\\.ya?ml))?" + // filename
    "$",
  "i"
);

/**
 * Computes parameters to retrieve the configuration file specified in _extends
 *
 * Base can either be the name of a repository in the same organization or
 * a full slug "organization/repo".
 *
 * @param options
 * @return The params needed to retrieve a configuration file
 */
export function extendsToGetContentParams({
  owner,
  path,
  url,
  extendsValue,
}: Options) {
  if (typeof extendsValue !== "string") {
    throw new Error(
      `[@probot/octokit-plugin-config] Invalid value ${JSON.stringify(
        extendsValue
      )} for _extends in ${url}`
    );
  }

  const match = extendsValue.match(EXTENDS_REGEX);

  if (match === null) {
    throw new Error(
      `[@probot/octokit-plugin-config] Invalid value "${extendsValue}" for _extends in ${url}`
    );
  }

  return {
    owner: match[1] || owner,
    repo: match[2],
    path: match[3] || path,
  };
}
