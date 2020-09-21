import { config } from "../src";

describe("Smoke test", () => {
  it("is a function", () => {
    expect(config).toBeInstanceOf(Function);
  });

  it("config.VERSION is set", () => {
    expect(config.VERSION).toEqual("0.0.0-development");
  });
});
