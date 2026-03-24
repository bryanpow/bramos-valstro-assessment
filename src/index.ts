import { io } from "socket.io-client";
import * as readline from "readline";
import { search, SearchResult } from "./search";

const SERVER_URL = "http://localhost:3000";

const prompt = (rl: readline.Interface): Promise<string> => {
  return new Promise((resolve) => {
    rl.question("\nSearch> ", (answer) => resolve(answer.trim()));
  });
};

const main = async (): Promise<void> => {
  console.log(`Connecting to server at ${SERVER_URL}...`);

  const socket = io(SERVER_URL, { reconnection: true });

  socket.on("connect", () => console.log("Connected!\n"));
  socket.on("disconnect", (reason) => console.log(`\nDisconnected: ${reason}`));
  socket.on("connect_error", (err) => {
    console.error(`Connection error: ${err.message}`);
    console.error("Is the Docker server running? (docker run -p 3000:3000 aaronbate/socketio-backend)");
  });

  await new Promise<void>((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", (err) => {
      reject(new Error(`Could not connect to ${SERVER_URL}: ${err.message}`));
    });
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("close", () => {
    console.log("\nDisconnected. Goodbye!");
    socket.disconnect();
    process.exit(0);
  });

  while (true) {
    const query = await prompt(rl);
    if (!query) continue;

    try {
      const results = await search(socket, query);
      console.log(`\nFound ${results.length} result(s).`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`\n  Error: ${message}`);
    }
  }
};

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
