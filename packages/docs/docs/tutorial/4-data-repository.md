---
sidebar_position: 4
---

# Data Repository

The data repository is the bridge between your resource schema and your database. Juadz uses a provider pattern to abstract database operations, making it easy to swap or extend data sources.

---

## Using existing provider
Juadz supports several ready-to-use data providers, such as `@juadz/knex` for SQL databases. These providers implement the required interface and handle common database operations for you.

To use an existing provider, simply import it and pass your resource schema and database connection:

```ts title="database/user.ts"
import { KnexProvider } from "@juadz/knex";
import { z } from "zod";
import knexConnection from "./knexConnection";

const userSchema = z.object({
  id: z.number().meta({ $create: false, $update: false }),
  name: z.string().meta({ $search: true }),
  age: z.number().min(18),
  salary: z.number().meta({ $view: 'manager', $update: 'manager' }),
  password: z.string().min(8).meta({ $view: false }),
});

const userRepository = KnexProvider("users", userSchema, knexConnection);
```

This gives you a fully functional `IDataRepositoryProvider` for your resource, ready to use with Juadz REST endpoints. You can swap providers or customize them as needed for different databases.


## Data Provider Overview

A data provider connects your resource schema to the underlying database. It implements a standard interface, ensuring consistent behavior across different database engines.

```ts title="IDataRepositoryProvider"
export interface IDataRepositoryProvider<T> {
    schema: ZodObject<any>;
    name: string;

    get?: (id: TypeID) => Promise<T | null>;
    update?: (id: TypeID, patch: Partial<T>) => Promise<T | null>;
    replace?: (id: TypeID, data: T) => Promise<T | null>;
    create?: (data: Omit<T, "id">) => Promise<T>;
    delete?: (id: TypeID) => Promise<number>;
    list?: QueryListFunction<T>;
}
```

- **schema**: The Zod schema for your resource, as defined in the previous chapter.
- **name**: The name of the resource, typically matching the database table or collection.
- **get**: Retrieves a single record by its ID.
- **update**: Updates fields of an existing record.
- **replace**: Replaces an entire record.
- **create**: Inserts a new record.
- **delete**: Removes a record by ID.
- **list**: Returns a filtered, sorted, and paginated list of records.

---

## Example: Implementing a Data Provider

Here’s a simple example using an in-memory array:

```ts
import { z } from "zod";

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  age: z.number(),
});

let users: Array<z.infer<typeof userSchema>> = [];
type TUser = z.infer<typeof userSchema>;

export const UserProvider: IDataRepositoryProvider<TUser> = {
  schema: userSchema,
  name: "users",

  get: async (id) => users.find(u => u.id === id) || null,
  create: async (data) => {
    const newUser = { ...data, id: users.length + 1 };
    users.push(newUser);
    return newUser;
  },
  // Implement update, replace, delete, list as needed...
};
```

---

## List Function

The `list` method enables advanced querying, including filtering, sorting, and pagination. It accepts a `QueryListParam` object and returns a `QueryListResults<T>`.

### QueryListParam

```ts
export type QueryListParam = {
    resource: string;           // Resource name (e.g., "users")
    filter: QueryFilter[];      // Array of filter conditions
    range: QueryRange;          // Pagination info
    sort: QuerySort[];          // Sorting instructions
};
```

### QueryFilter

Defines a filter condition for a field.

```ts
export type QueryFilter = {
    field: string;              // Field to filter on
    op: QueryFilterOperator;    // Operator (e.g., '=', '>', 'in')
    value: number | string | Date | Array<number | string | Date>;
};
```

### QueryRange

Specifies pagination details.

```ts
export type QueryRange = {
    offset: number;             // Starting index
    limit: number;              // Maximum number of records to return
};
```

### QuerySort

Defines sorting for a field.

```ts
export type QuerySort = {
    field: string;              // Field to sort by
    direction: "ASC" | "DESC";  // Sort direction
};
```

### QueryListResults

The result of a list query.

```ts
export type QueryListResults<T> = {
    data: T[];                  // Array of records
    total: number;              // Total number of matching records
};
```

---

## Example: List Implementation

```ts
async function list(query: QueryListParam): Promise<QueryListResults<User>> {
  // Example: filter, sort, and paginate users array
  let result = users;

  // Apply filters
  for (const f of query.filter) {
    result = result.filter(user => user[f.field] === f.value);
  }

  // Apply sorting
  for (const s of query.sort) {
    result = result.sort((a, b) =>
      s.direction === "ASC"
        ? a[s.field] > b[s.field] ? 1 : -1
        : a[s.field] < b[s.field] ? 1 : -1
    );
  }

  // Apply pagination
  const paged = result.slice(query.range.offset, query.range.offset + query.range.limit);

  return {
    data: paged,
    total: result.length,
  };
}
```

---

## Summary

Juadz’s data repository pattern makes it easy to connect your resource schemas to any database. By implementing the standard provider interface, you gain powerful querying, validation, and extensibility with minimal boilerplate.