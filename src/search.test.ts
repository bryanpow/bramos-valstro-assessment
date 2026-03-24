import { EventEmitter } from "events";
import { search, isError, SearchResult, SearchError } from "./search";

/**
 * Creates a fake socket that behaves like a Socket.IO client
 * but is just an EventEmitter we control from tests.
 */
const createFakeSocket = () => {
  const emitter = new EventEmitter();
  const fake = {
    on: (event: string, fn: (...args: any[]) => void) => { emitter.on(event, fn); return fake; },
    off: (event: string, fn: (...args: any[]) => void) => { emitter.off(event, fn); return fake; },
    emit: (event: string, ...args: any[]) => { emitter.emit(event, ...args); return false; },
    serverEmit: (event: string, ...args: any[]) => { emitter.emit(event, ...args); },
  };
  return fake;
};

describe("isError", () => {
  it("returns true for error responses", () => {
    const err: SearchError = { page: -1, resultCount: -1, error: "Not found" };
    expect(isError(err)).toBe(true);
  });

  it("returns false for valid results", () => {
    const result: SearchResult = { page: 1, resultCount: 1, name: "Luke", films: ["A New Hope"] };
    expect(isError(result)).toBe(false);
  });
});

describe("search", () => {
  it("resolves with a single result", async () => {
    const fake = createFakeSocket();

    const originalEmit = fake.emit;
    fake.emit = (event: string, ...args: any[]) => {
      if (event === "search") {
        setTimeout(() => {
          fake.serverEmit("search", [{ page: 1, resultCount: 1, name: "Luke Skywalker", films: ["A New Hope"] }]);
        }, 10);
      }
      return false;
    };

    const results = await search(fake as any, "luke");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Luke Skywalker");
    expect(results[0].films).toEqual(["A New Hope"]);
  });

  it("resolves with multiple streamed results", async () => {
    const fake = createFakeSocket();

    fake.emit = (event: string, ...args: any[]) => {
      if (event === "search") {
        setTimeout(() => {
          fake.serverEmit("search", [{ page: 1, resultCount: 2, name: "Darth Vader", films: ["A New Hope"] }]);
        }, 10);
        setTimeout(() => {
          fake.serverEmit("search", [{ page: 2, resultCount: 2, name: "Darth Maul", films: ["The Phantom Menace"] }]);
        }, 20);
      }
      return false;
    };

    const results = await search(fake as any, "dar");
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("Darth Vader");
    expect(results[1].name).toBe("Darth Maul");
  });

  it("rejects on error response", async () => {
    const fake = createFakeSocket();

    fake.emit = (event: string, ...args: any[]) => {
      if (event === "search") {
        setTimeout(() => {
          fake.serverEmit("search", [{ page: -1, resultCount: -1, error: "No results found" }]);
        }, 10);
      }
      return false;
    };

    await expect(search(fake as any, "zzzzz")).rejects.toThrow("No results found");
  });
});
