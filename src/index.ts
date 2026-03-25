// Entry point: runs `runApp`; uncaught errors log to stderr and exit with code 1.
import { runApp } from "./app";

runApp().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
