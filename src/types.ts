export type Configuration = Record<string, unknown>;

export type File = {
  owner: string;
  repo: string;
  path: string;
  url: string;
  config: Configuration | null;
};
