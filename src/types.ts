// Payload types for the Socket.IO `search` event (success rows vs error).

/** One streamed result row. */
export interface SearchResult {
  page: number;
  resultCount: number;
  name: string;
  films: string[];
}

/** Error row from the server (`page` / `resultCount` always -1). */
export interface SearchError {
  page: -1;
  resultCount: -1;
  error: string;
}

export type SearchResponse = SearchResult | SearchError;

/** True when `msg` is a `SearchError` (server uses `page === -1`). */
export const isError = (msg: SearchResponse): msg is SearchError => msg.page === -1;
