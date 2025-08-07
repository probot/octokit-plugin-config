export type Configuration = Record<string, unknown>;

export type API = {
  config: {
    get<T extends Configuration = Configuration>(
      options: GetOptions<T>,
    ): Promise<GetResult<T>>;
  };
};

export type GetOptions<T> = {
  /**
   * Repository owner login
   */
  owner: string;
  /**
   * Repository name
   */
  repo: string;
  /**
   * Path to configuration file
   */
  path: string;
  /**
   * Default settings that the loaded configuration will be merged into.
   *
   * An object will be merged shallowly. Pass a function for deep merges and custom merge strategies,
   * @see https://github.com/probot/octokit-plugin-config/#merging-configuration
   */
  defaults?: T | defaultsFunction<T> | undefined;
  branch?: string | undefined;
};

export type GetResult<T> = {
  /**
   * combined combination from all loaded files and passed `defaults` option
   */
  config: T;
  /**
   * List of files that configuration was loaded from.
   */
  files: ConfigFile[];
};

export type ConfigFile = {
  /**
   * Repository owner login
   */
  owner: string;
  /**
   * Repository name
   */
  repo: string;
  /**
   * Path to configuration file
   */
  path: string;
  /**
   * API URL for configuration file
   */
  url: string;
  /**
   * Configuration data object. Set to null if the file does not exist.
   */
  config: Configuration | null;
};

export type defaultsFunction<T> = (files: Configuration[]) => T;
