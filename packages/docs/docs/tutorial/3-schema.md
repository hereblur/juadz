---
sidebar_position: 3
---

# Resource Schema

Juadz is a schema-centric framework: you define a schema for each resource, and Juadz automatically generates the necessary API endpoints, validation, and documentation.

---

## Defining Your First Schema

Juadz uses [`zod`](https://zod.dev/) for schema definition. Simply describe your resource structure using Zod, and Juadz will handle the rest.

```ts title="database/user.ts"
import { z } from "zod";

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  age: z.number().min(18),
  password: z.string().min(8),
});
```

This example demonstrates a minimal schema for a user resource.  
**Note:** The `id` field is required for all schemas.

---

## Field Flags

Juadz uses flags to control the behavior of resource fields. Flags are set using Zod’s `.meta()` method and allow you to customize how each field is handled by the API.

```ts title="database/user.ts"
const userSchema = z.object({
  id: z.number().meta({ $create: false, $update: false }),
    // "id" is auto-incremented and cannot be set or changed via the API.

  name: z.string().meta({ $search: true }),
    // Enables free-text search on the "name" field.

  age: z.number().min(18),

  salary: z.number().meta({ $view: 'manager', $update: 'manager' }),
    // Only users with the "manager" permission can view or update "salary".

  password: z.string().min(8).meta({ $view: false }),
    // "password" will never be included in API responses.
});

type TUser = z.infer<typeof userSchema>;
//You can use Zod's type inference to automatically generate TypeScript types, such as `TUser`, for type-safe coding throughout your application.

```

---

### Flag Reference

- **$create**: `boolean` (default: `true`)  
  Controls whether the field can be set during creation.

- **$update**: `boolean | string` (default: `true`)  
  Controls whether the field can be updated. If set to a string, only users with the specified permission can update.

- **$view**: `boolean | string` (default: `true`)  
  Controls whether the field is visible in API responses. If set to a string, only users with the specified permission can view.

- **$virtual**: `boolean` (default: `false`)  
  Marks the field as virtual; it will not be persisted to the database.

- **$search**: `boolean` (default: `false`)  
  Includes the field in free-text search queries. Use with caution and ensure proper indexing.

- **$filter**: `boolean` (default: `true`)  
  Allows the field to be used in filter queries.

- **$sort**: `boolean` (default: `true`)  
  Allows the field to be used in sort queries.

---

### Flag Behavior

- If a flag is set to `false`, the field is excluded from the corresponding API operation.
- If a flag is set to a string (e.g., a permission name), only users with that permission can access or modify the field.
- Attempting to update a field with `$update: false` will result in a `400 Bad Request` error.

---

By leveraging schemas and flags, Juadz enables you to precisely control resource behavior, validation, and access control—all from a single, unified configuration. This approach simplifies API development and ensures consistent, secure handling of data across your application.

