import fastify from "fastify";

const server = fastify();

server.get("/ping", async () => {
  return "pong\n";
});

server.post("/answer", async (req: any) => {
  const { question } = req.body;
  return `Hello from local the server! Your question is: ${question}`;
});

server.listen({ port: 8232 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
