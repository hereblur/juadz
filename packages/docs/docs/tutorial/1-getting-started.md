---
sidebar_position: 1
---

# Getting Started

Get started by **creating a new project**.
```bash
npx @juadz/cli create [rootDir]
cd [rootDir]
yarn
```

Replace `[rootDir]` with your desired project directory name.
You can use any package manager you prefer (npm, yarn, pnpm, bun, etc.).

Then run the development server:
```bash
yarn dev
```

Your server will start on `http://localhost:3000`. You can then access the API documentation at `http://localhost:3000/documentations`.

### What happen
When you create a new Juadz project, it comes pre-configured with a powerful stack of proven technologies:

- **Fastify**: High-performance web framework for handling HTTP requests and responses
- **Knex**: SQL query builder for database operations and migrations
- **Zod**: TypeScript-first schema validation for request/response validation and type inference

This combination provides you with everything needed to build type-safe, performant REST APIs with minimal setup.

### Extensibility

While Juadz comes with **@juadz/fastify** and **@juadz/knex** modules for simplicity and immediate productivity, the framework is designed to be flexible. You can easily swap out or extend these modules to fit your specific needs:

- Replace Fastify with **Express** or **Elysia** for different performance characteristics
- Switch from SQL databases to **MongoDB** or other NoSQL solutions
- Implement custom modules that integrate seamlessly with the Juadz ecosystem

This modular approach ensures that Juadz grows with your project requirements while maintaining the rapid development experience.

