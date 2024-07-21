import { describe, it, expect } from "vitest";
import { config, composeConfigGet } from "../src/index.js";

describe("Smoke test", () => {
  it("config is a function", () => {
    expect(config).toBeInstanceOf(Function);
  });

  it("config.VERSION is set", () => {
    expect(config.VERSION).toEqual("0.0.0-development");
  });

  it("composeConfigGet is a function", () => {
    expect(composeConfigGet).toBeInstanceOf(Function);
  });
});
