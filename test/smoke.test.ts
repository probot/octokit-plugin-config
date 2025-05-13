import { describe, it, assert, equal } from "./testrunner.ts";
import { config, composeConfigGet } from "../src/index.ts";

describe("Smoke test", () => {
  it("config is a function", () => {
    assert(config instanceof Function);
  });

  it("config.VERSION is set", () => {
    equal(config.VERSION, "0.0.0-development");
  });

  it("composeConfigGet is a function", () => {
    assert(composeConfigGet instanceof Function);
  });
});
