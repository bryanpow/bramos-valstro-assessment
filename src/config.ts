// Defaults for server URL, search wait time, and terminal box width.

/** Socket.IO server base URL. */
export const SERVER_URL = "http://localhost:3000";

/** Idle timeout for `search` responses: rejects if the server goes quiet. */
export const SEARCH_TIMEOUT_MS = 20_000;

/** Inner text width (characters) for bordered UI lines. */
export const BOX_CONTENT_WIDTH = 52;

export const DOCKER_HINT =
  "Is the Docker server running? (docker run -p 3000:3000 aaronbate/socketio-backend)";
