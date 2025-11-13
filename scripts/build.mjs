// @ts-check
import esbuild from "esbuild";
import { copyFile, readFile, writeFile, rm } from "fs/promises";

/**
 * @type {esbuild.BuildOptions}
 */
const sharedOptions = {
  sourcemap: false,
  sourcesContent: true,
  minify: false,
  allowOverwrite: true,
  packages: "external",
  platform: "neutral",
  format: "esm",
};

async function main() {
  // Start with a clean slate
  await rm("pkg", { recursive: true, force: true });
  // Build the source code for a neutral platform as ESM
  await esbuild.build({
    entryPoints: ["./src/*.ts", "./src/**/*.ts"],
    outdir: "pkg/dist-src",
    bundle: false,
    ...sharedOptions,
  });

  // Remove the types file from the dist-src folder
  await rm("./pkg/dist-src/types.js");

  const entryPoints = ["./pkg/dist-src/index.js"];

  // Copy the README, LICENSE to the pkg folder
  await copyFile("LICENSE", "pkg/LICENSE");
  await copyFile("README.md", "pkg/README.md");

  // Handle the package.json
  let pkg = JSON.parse((await readFile("package.json", "utf8")).toString());
  // Remove unnecessary fields from the package.json
  delete pkg.scripts;
  delete pkg.prettier;
  delete pkg.release;
  delete pkg.jest;
  await writeFile(
    "pkg/package.json",
    JSON.stringify(
      {
        ...pkg,
        files: ["dist-*/**", "bin/**"],
        // Tooling currently are having issues with the "exports" field, ex: TypeScript, eslint
        // We add a `main` and `types` field to the package.json for the time being
        main: "dist-src/index.js",
        types: "dist-types/index.d.ts",
        exports: {
          ".": {
            types: "./dist-types/index.d.ts",
            import: "./dist-src/index.js",
          },
        },
        sideEffects: false,
      },
      null,
      2
    )
  );
}
main();