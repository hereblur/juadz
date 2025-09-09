# Juadz

Juadz is an opinionated, schema-centric RESTful framework for Node.js. It enables rapid development of robust APIs by automating endpoint generation, validation, authentication, and documentation. Juadz is designed for extensibility and integrates seamlessly with SQL (Knex) and MongoDB databases.

---

## Features

- **Schema-first design:** Define resources using [Zod](https://zod.dev/) schemas.
- **Automatic RESTful endpoints:** CRUD routes are generated for each resource.
- **Built-in validation:** All input is validated against your schema.
- **Flexible authentication:** Pluggable authentication providers and fine-grained access control.
- **Extensible data providers:** Supports [Knex](https://knexjs.org/) (SQL), MongoDB, and custom providers.
- **Hooks:** Customize resource behavior with pre/post-operation hooks.
- **OpenAPI documentation:** Interactive API docs generated automatically.

---

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Define a resource schema:**

   ```ts
   import { z } from "zod";

   const userSchema = z.object({
     id: z.number(),
     name: z.string(),
     email: z.string().email(),
     password: z.string().min(8),
   });
   ```

3. **Connect to a database:**

   ```ts
   import { KnexProvider } from "@juadz/knex";
   import knex from "knex";

   const db = knex({ client: "sqlite3", connection: { filename: "./data.db" } });
   const userRepo = KnexProvider("users", userSchema, db);
   ```

4. **Create a resource:**

   ```ts
   import { Resource } from "@juadz/core";

   export const UserResource = new Resource(userRepo);
   ```

5. **Start the server:**

   ```ts
    const server = fastify({
        logger: true
    });

    await server.register(JuadzFastify, {
        prefix: "/api/v1",
        resources: [
            UserResource,
        ],
        authentication: authProvider,
        docs: {
            title: "Juadz Fastify Example",
            description: `Server api key is ${API_KEY}`,
            version: "0.0.1",
            url: ["http://localhost:3000"],
        },
    });

    await server.listen({ port: 3000 });
   ```

---

## Documentation

See the [docs](./packages/docs) for a full tutorial, API reference, and advanced usage.

---

## Contributing

Contributions are welcome! Please open issues or submit pull requests for bug fixes, features, or documentation improvements.

---

## License

MIT