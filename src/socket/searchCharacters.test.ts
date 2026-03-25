import { EventEmitter } from "events";
import { SEARCH_TIMEOUT_MS } from "../config";
import { searchCharacters } from "./searchCharacters";
import { isError, SearchResult, SearchError } from "../types";

const createFakeSocket = () => {
  const emitter = new EventEmitter();
  const fake = {
    on: (event: string, fn: (...args: unknown[]) => void) => {
      emitter.on(event, fn);
      return fake;
    },
    off: (event: string, fn: (...args: unknown[]) => void) => {
      emitter.off(event, fn);
      return fake;
    },
    emit: (event: string, ...args: unknown[]) => {
      emitter.emit(event, ...args);
      return false;
    },
    serverEmit: (event: string, ...args: unknown[]) => {
      emitter.emit(event, ...args);
    },
  };
  return fake;
};

describe("isError", () => {
  it("returns true for error responses", () => {
    const err: SearchError = { page: -1, resultCount: -1, error: "Not found" };
    expect(isError(err)).toBe(true);
  });

  it("returns false for valid results", () => {
    const result: SearchResult = {
      page: 1,
      resultCount: 1,
      name: "Luke",
      films: ["A New Hope"],
    };
    expect(isError(result)).toBe(false);
  });
});

describe("searchCharacters", () => {
  it("resolves with a single result", async () => {
    const fake = createFakeSocket();

    fake.emit = (event: string) => {
      if (event === "search") {
        setTimeout(() => {
          fake.serverEmit("search", {
            page: 1,
            resultCount: 1,
            name: "Luke Skywalker",
            films: ["A New Hope"],
          });
        }, 10);
      }
      return false;
    };

    const results = await searchCharacters(fake as never, "luke");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Luke Skywalker");
    expect(results[0].films).toEqual(["A New Hope"]);
  });

  it("resolves with multiple streamed results", async () => {
    const fake = createFakeSocket();

    fake.emit = (event: string) => {
      if (event === "search") {
        setTimeout(() => {
          fake.serverEmit("search", {
            page: 1,
            resultCount: 2,
            name: "Darth Vader",
            films: ["A New Hope"],
          });
        }, 10);
        setTimeout(() => {
          fake.serverEmit("search", {
            page: 2,
            resultCount: 2,
            name: "Darth Maul",
            films: ["The Phantom Menace"],
          });
        }, 20);
      }
      return false;
    };

    const results = await searchCharacters(fake as never, "dar");
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("Darth Vader");
    expect(results[1].name).toBe("Darth Maul");
  });

  it("rejects on error response", async () => {
    const fake = createFakeSocket();

    fake.emit = (event: string) => {
      if (event === "search") {
        setTimeout(() => {
          fake.serverEmit("search", {
            page: -1,
            resultCount: -1,
            error: "No results found",
          });
        }, 10);
      }
      return false;
    };

    await expect(searchCharacters(fake as never, "zzzzz")).rejects.toThrow(
      "No results found",
    );
  });

  it("rejects on disconnect mid-search", async () => {
    const fake = createFakeSocket();

    fake.emit = (event: string) => {
      if (event === "search") {
        setTimeout(() => {
          fake.serverEmit("disconnect", "transport close");
        }, 10);
      }
      return false;
    };

    await expect(searchCharacters(fake as never, "luke")).rejects.toThrow(
      "Connection lost during search",
    );
  });

  it("rejects on timeout when server stops responding", async () => {
    jest.useFakeTimers();
    const fake = createFakeSocket();

    fake.emit = () => false;

    const promise = searchCharacters(fake as never, "luke");

    jest.advanceTimersByTime(SEARCH_TIMEOUT_MS);

    await expect(promise).rejects.toThrow(
      "Search timed out (no response from server)",
    );

    jest.useRealTimers();
  });

  it("rejects on timeout with partial results", async () => {
    jest.useFakeTimers();
    const fake = createFakeSocket();

    fake.emit = (event: string) => {
      if (event === "search") {
        setTimeout(() => {
          fake.serverEmit("search", {
            page: 1,
            resultCount: 3,
            name: "Darth Vader",
            films: ["A New Hope"],
          });
        }, 10);
      }
      return false;
    };

    const promise = searchCharacters(fake as never, "dar");

    jest.advanceTimersByTime(10);
    jest.advanceTimersByTime(SEARCH_TIMEOUT_MS);

    await expect(promise).rejects.toThrow(
      "received 1 result before server stopped responding",
    );

    jest.useRealTimers();
  });
});
