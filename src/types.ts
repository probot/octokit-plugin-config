export type Configuration = Record<string, unknown>;

export type File = {
  owner: string;
  repo: string;
  path: string;
  config: Configuration | null;
};
