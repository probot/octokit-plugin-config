declare global {
  var Bun: any;
}

let describe: Function,
  it: Function,
  assert: Function,
  equal: Function,
  deepEqual: Function,
  expect: Function;
if ("Bun" in globalThis) {
  describe = function describe(name: string, fn: Function) {
    return globalThis.Bun.jest(caller()).describe(name, fn);
  };
  it = function it(name: string, fn: Function) {
    return globalThis.Bun.jest(caller()).it(name, fn);
  };
  assert = function assert(value: unknown, message?: string) {
    return globalThis.Bun.jest(caller()).expect(value, message);
  };
  equal = function equal(actual: unknown, expected: unknown, message?: string) {
    return globalThis.Bun.jest(caller())
      .expect(actual, message)
      .toEqual(expected);
  };
  deepEqual = function deepEqual(
    actual: unknown,
    expected: unknown,
    message?: string,
  ) {
    return globalThis.Bun.jest(caller())
      .expect(actual, message)
      .toEqual(expected);
  };
  /** Retrieve caller test file. */
  function caller() {
    const Trace = Error as unknown as {
      prepareStackTrace: (error: Error, stack: CallSite[]) => unknown;
    };
    const _ = Trace.prepareStackTrace;
    Trace.prepareStackTrace = (_, stack) => stack;
    const { stack } = new Error();
    Trace.prepareStackTrace = _;
    const caller = (stack as unknown as CallSite[])[2];
    return caller.getFileName().replaceAll("\\", "/");
  }

  /** V8 CallSite (subset). */
  type CallSite = { getFileName: () => string };
} else if ("Deno" in globalThis) {
  const nodeTest = await import("node:test");
  const nodeAssert = await import("node:assert");

  describe = nodeTest.describe;
  it = nodeTest.it;
  assert = nodeAssert.strict;
  equal = nodeAssert.strict.equal;
  deepEqual = nodeAssert.strict.deepEqual;
} else if (process.env.VITEST_WORKER_ID) {
  describe = await import("vitest").then((module) => module.describe);
  it = await import("vitest").then((module) => module.it);
  assert = await import("vitest").then((module) => module.assert);
  expect = await import("vitest").then((module) => module.expect);
  equal = (value: unknown, message?: string) => {
    return expect(value, message).toEqual(value, true);
  };
  deepEqual = (value: unknown, message?: string) => {
    return expect(value, message).toStrictEqual(value, true);
  };
} else {
  const nodeTest = await import("node:test");
  const nodeAssert = await import("node:assert");

  describe = nodeTest.describe;
  it = nodeTest.it;
  assert = nodeAssert.strict;
  equal = nodeAssert.strict.equal;
  deepEqual = nodeAssert.strict.deepEqual;
}

export { describe, it, assert, equal, deepEqual };
