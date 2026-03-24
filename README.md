# Valstro Star Wars Character Search CLI

A TypeScript console application that searches for Star Wars characters by name using a Socket.IO streaming API.

## Prerequisites

- **Node.js** >= 18
- **Docker** (to run the backend server)

## Start the Server

```bash
docker run -p 3000:3000 aaronbate/socketio-backend
```

Leave this running in a separate terminal.

## Install & Run the Client

```bash
npm install
npm start
```

Type a character name (or partial name) at the `Search>` prompt. Results stream in as they arrive. Press `Ctrl+C` to exit.

## Example

```
Connecting to server at http://localhost:3000...
Connected!

Search> luke
  Luke Skywalker -- A New Hope, The Empire Strikes Back, Return of the Jedi, Revenge of the Sith

Found 1 result(s).

Search> dar
  Darth Vader -- A New Hope, The Empire Strikes Back, Return of the Jedi, Revenge of the Sith
  Darth Maul -- The Phantom Menace

Found 2 result(s).
```
