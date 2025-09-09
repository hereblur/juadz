---
sidebar_position: 2
---

# Juadz Concepts and Architecture

Juadz is an opinionated RESTful framework designed for rapid development. It provides a fully configured environment out of the box, allowing you to focus on customization and extension as needed.

---

## Schema-Centric Design

Juadz resources are defined using schemas. Simply describe your resource structure with [`zod`](https://zod.dev/), and Juadz automates the creation of endpoints, validation, and documentation. This schema-first approach ensures consistency and reliability throughout your application.

---

## Authentication

Every incoming request is processed by Juadz’s authentication module. The system resolves the request to an `ACLActor` (authenticated user or entity), which is then used to enforce access control for resource operations. Juadz supports multiple authentication strategies, enabling you to tailor security to your application’s needs.

---

## Routing

Defining a resource in Juadz automatically generates RESTful routes for standard operations (CRUD). The framework follows best practices for REST API design, ensuring predictable and maintainable endpoints.

---

## Validation

Juadz validates all incoming data against your resource’s schema before executing any business logic. This guarantees that only well-formed and expected data reaches your resource methods, reducing errors and improving security.

---

## Data Repository

Juadz seamlessly connects your resources to your database. Use `@juadz/knex` for SQL databases supported by Knex, or `@juadz/mongo` for MongoDB. The framework is extensible, allowing you to implement custom data providers for other databases with minimal effort.

---

## Hooks

Extend and customize resource behavior with hooks. Hooks allow you to execute custom logic before or after resource methods, such as encrypting passwords on `preCreate` or managing related data on `preUpdate`. This flexibility enables you to adapt Juadz to complex business requirements.

---

## Documentation

Juadz automatically generates OpenAPI documentation for your resources. Integrated with SwaggerUI, this feature provides interactive API documentation, making it easy for developers and stakeholders to explore and test your endpoints.

---

## Extensibility

Juadz is designed to be highly extensible. Consult the documentation for guidance on customizing authentication, routing, data providers, hooks, and more. Whether you need to modify default behaviors or integrate new functionality, Juadz provides the tools to adapt the framework