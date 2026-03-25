// Creates a Socket.IO client, waits for an initial connection, then runs a readline loop that calls `searchCharacters` per query until stdin closes.
import { io } from "socket.io-client";
import * as readline from "readline";
import { SERVER_URL, DOCKER_HINT } from "./config";
import { searchCharacters } from "./socket";
import {
  printBanner,
  printSummary,
  printError,
  printGoodbye,
  formatPrompt,
} from "./ui";

const askForQuery = (rl: readline.Interface): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(formatPrompt(), (answer) => resolve(answer.trim()));
  });
};

export const runApp = async (): Promise<void> => {
  console.log(`Connecting to server at ${SERVER_URL}...`);

  const socket = io(SERVER_URL, { reconnection: true });

  socket.on("connect", () => {
    printBanner(SERVER_URL);
  });
  socket.on("disconnect", (reason) => console.log(`\nDisconnected: ${reason}`));

  // Await first successful connect (or fail startup) before creating the readline interface.
  try {
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("connect_error", (err) => {
        reject(new Error(`Could not connect to ${SERVER_URL}: ${err.message}`));
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    printError(message);
    console.error(DOCKER_HINT);
    socket.disconnect();
    process.exit(1);
  }

  // After we're connected, log reconnect failures when they happen (For example, if the socket disconnects while client app is running and its trying to reconnect).
  socket.on("connect_error", (err) => {
    printError(`Reconnect failed: ${err.message}`);
    console.error(DOCKER_HINT);
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("close", () => {
    printGoodbye();
    socket.disconnect();
    process.exit(0);
  });

  while (true) {
    const query = await askForQuery(rl);
    if (!query) continue;

    try {
      const results = await searchCharacters(socket, query);
      printSummary(results.length);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      printError(message);
    }
  }
};
