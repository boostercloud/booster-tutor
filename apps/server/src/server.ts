#!/usr/bin/env node
import fastify from "fastify";
import fastifyFormbody from "@fastify/formbody";
import { importCSV } from "./core/database/importCSV";
require("dotenv").config();

import handler from "./pages/api/answer";

async function startServer() {
  const server = fastify();
  server.register(fastifyFormbody);

  // Initialize the SQLite database
  try {
    console.log("Initializing the SQLite database...");
    await importCSV();
    console.log("SQLite database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize the SQLite database:", error);
    process.exit(1); // Exit the process with an error code
  }

  server.post<{ Body: { question: string } }>(
    "/answer",
    async (request, response) => {
      const { question } = request.body;

      try {
        const answer = await fetch(
          "https://asktoai.boosterframework.com/api/answer",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: question }),
          }
        );

        if (!answer.ok) {
          throw new Error(`Error from API: ${answer.statusText}`);
        }

        return answer;
      } catch (error) {
        request.log.error(error);
        return response.code(500).send({
          error: `Yikes! It seems we've hit a snag on our side, causing a bit of a hiccup.
            This is a bit embarrassing, but not to worry, we're on it and hoping to smooth things out soon."`,
        });
      }
    }
  );

  server.post("/api/answer", async (request, response) => {
    try {
      const response = await handler(request);

      return response;
    } catch (error) {
      request.log.error(error);
      return response.code(500).send({
        error: `Yikes! It seems we've hit a snag on our side, causing a bit of a hiccup.
            This is a bit embarrassing, but not to worry, we're on it and hoping to smooth things out soon."`,
      });
    }
  });

  server.listen({ port: 8232 }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
}

startServer();
