import fastify from "fastify";

const server = fastify();

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

server.listen({ port: 8232 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
