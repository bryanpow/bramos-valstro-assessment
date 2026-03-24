import { Socket } from "socket.io-client";

export interface SearchResult {
  page: number;
  resultCount: number;
  name: string;
  films: string[];
}

export interface SearchError {
  page: -1;
  resultCount: -1;
  error: string;
}

export type SearchResponse = SearchResult | SearchError;

export const isError = (msg: SearchResponse): msg is SearchError => {
  return msg.page === -1;
};

export const search = (socket: Socket, query: string): Promise<SearchResult[]> => {
  return new Promise((resolve, reject) => {
    const results: SearchResult[] = [];

    const handler = (...args: any[]) => {
      const raw = args[0];
      const msg: SearchResponse = Array.isArray(raw) ? raw[0] : raw;

      if (!msg || typeof msg.page === "undefined") {
        console.error("  Unexpected response shape:", args);
        socket.off("search", handler);
        reject(new Error("Unexpected response from server"));
        return;
      }

      if (isError(msg)) {
        socket.off("search", handler);
        reject(new Error(msg.error));
        return;
      }

      results.push(msg);
      console.log(`  ${msg.name} -- ${msg.films.join(", ")}`);

      if (msg.page === msg.resultCount) {
        socket.off("search", handler);
        resolve(results);
      }
    };

    socket.on("search", handler);
    socket.emit("search", { query });
  });
};
