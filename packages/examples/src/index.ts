import { createServer } from "./server";


;(async () => {
    const server = await createServer();
    await server.listen({ port: 3000 });
    const address = server.server.address();
    const port = typeof address === "string" ? address : address?.port;
    server.log.info(`Server listening on http://localhost:${port}`);
})();
