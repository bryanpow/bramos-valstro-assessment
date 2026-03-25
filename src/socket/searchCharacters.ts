// Emits `search` with `{ query }`, listens for `search` until `page === resultCount`, resolves with collected rows.
// Rejects on error payload, disconnect before completion, or `SEARCH_TIMEOUT_MS` of inactivity.
import { Socket } from "socket.io-client";
import { SEARCH_TIMEOUT_MS } from "../config";
import { printSearching, printResult } from "../ui";
import { isError, type SearchResult, type SearchResponse } from "../types";

export const searchCharacters = (
  socket: Socket,
  query: string,
): Promise<SearchResult[]> => {
  return new Promise((resolve, reject) => {
    const results: SearchResult[] = [];
    let timeoutId: ReturnType<typeof setTimeout>;

    // Removes listeners and clears the timeout when the promise settles.
    const cleanup = () => {
      socket.off("search", onBackendSearchResponse);
      socket.off("disconnect", onBackendDisconnect);
      clearTimeout(timeoutId);
    };

    const resetIdleTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const received = results.length;
        cleanup();
        reject(
          new Error(
            received > 0
              ? `Search timed out (received ${received} result${received !== 1 ? "s" : ""} before server stopped responding)`
              : "Search timed out (no response from server)",
          ),
        );
      }, SEARCH_TIMEOUT_MS);
    };

    const onBackendSearchResponse = (...args: unknown[]) => {
      const responseRow = args[0] as SearchResponse;
      if (!responseRow || typeof responseRow.page === "undefined") {
        console.error("  Unexpected response shape:", args);
        cleanup();
        reject(new Error("Unexpected response from server"));
        return;
      }
      if (isError(responseRow)) {
        cleanup();
        reject(new Error(responseRow.error));
        return;
      }

      results.push(responseRow);
      printResult(responseRow);
      // Reset the timer each time we receive a new chunk.
      resetIdleTimeout();
      if (responseRow.page === responseRow.resultCount) {
        cleanup();
        resolve(results);
      }
    };

    const onBackendDisconnect = () => {
      cleanup();
      reject(new Error("Connection lost during search"));
    };

    socket.on("search", onBackendSearchResponse);
    socket.on("disconnect", onBackendDisconnect);
    printSearching(query);
    socket.emit("search", { query });
    resetIdleTimeout();
  });
};
