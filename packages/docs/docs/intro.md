---
sidebar_position: 1
---

# Introduction to Juadz

*<span style={{ color: "grey"}}>"จ๊วด" is a Thai slang. It generally conveys a sense of speed, intensity, maximum effort, or doing something to the extreme.[gemini]</span>*

Juadz is a rapid REST API framework built for developers who want to get their servers up and running quickly. Built on top of proven open-source tools, Built with TypeScript for enhanced developer experience and type safety. Juadz provides an opinionated yet extensible foundation for creating robust REST APIs with minimal configuration.

## Why 

Why build another REST API framework when there are so many great options already? The answer is simple: **developer productivity**.

When starting a new REST API project, you inevitably need to implement the same foundational pieces: database connections, web servers, authentication, authorization, caching, documentation, and more. While excellent open-source libraries exist for each of these components, integrating them together can be a tedious and time-consuming process.

Juadz was born from this frustration. Instead of spending valuable development time on repetitive setup tasks, we created a framework that handles the boring integration work for you. This allows your team to focus on what truly matters: **building your actual business logic**.

### Schema centric
Juadz takes a schema-first approach to API development. Define your database schema once using Zod, and Juadz automatically generates:

- **RESTful endpoints** for all CRUD operations
- **API documentation** with OpenAPI/Swagger specs
- **Request/response validation** for type safety
- **Access control rules** for fine-grained permissions

This eliminates the need to manually write repetitive controller code, validation logic, and documentation. Your schema becomes the single source of truth that powers your entire API layer.

```typescript
// Define once
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'user'])
});

// Get automatically:
// GET /users, POST /users, GET /users/:id, PUT /users/:id, DELETE /users/:id
// Complete OpenAPI documentation
// Request validation and type safety
// ACL rules based on role field
```


### Our Goals

- **Rapid Development**: Get CRUD REST APIs running in minutes, not hours
- **Minimal Configuration**: Sensible defaults that work out of the box
- **Maximum Productivity**: Let developers focus on business logic instead of boilerplate
- **Team Efficiency**: Reduce time-to-market for API projects across your organization

## It's not 

a full-featured application server for complex business logic. Juadz is specifically designed for **CRUD RESTful APIs** that power dashboards and administrative interfaces.

### What Juadz Excels At

- **CRUD Operations**: Create, read, update, and delete resources with minimal code
- **Dashboard APIs**: Perfect for admin panels, content management systems, and data visualization
- **Access Control**: Built-in ACL support for managing user permissions
- **Simple Workflows**: Ideal for basic operations like approving, cancelling, or status updates

### What Juadz Is Not Designed For

While technically possible, Juadz is **not recommended** for:

- **Queue Processing**: Background job processing and task queues
- **Scheduled Jobs**: Cron jobs and time-based task execution
- **Complex Business Logic**: Heavy computational workflows or complex data processing
- **Monolithic Applications**: Large, tightly-coupled systems with multiple responsibilities

### Architecture Recommendation

For maintainability and scalability, we strongly recommend a **microservices approach**:

- Use Juadz for your **API layer** and dashboard interfaces
- Delegate complex business logic to **dedicated microservices**
- Keep your Juadz applications focused and lightweight
- This separation ensures better maintainability and allows each service to scale independently

