---
sidebar_position: 6
---

# Routing

Juadz provides built-in routing for all resources, automatically generating standard RESTful endpoints. For example:

- `GET /users` — List all users
- `GET /users/:id` — Retrieve a single user
- `POST /users` — Create a new user
- `PATCH /users/:id` — Update user fields
- `PUT /users/:id` — Replace a user resource
- `DELETE /users/:id` — Delete a user

You can easily disable specific routes for a resource:

```ts
userResource.disable(['delete']);
```

---

## Custom Route Providers

If you need more control over your routes, you can implement a custom route provider. This allows you to override the default routing logic for any resource.

```ts
export function myCustomProvider(
    action: keyof IDataRepositoryProvider,
    resourceName: string,
): RouterDef {
    switch (action) {
        case "get":
            return { path: `${resourceName}/:id`, method: "GET" };
        case "create":
            return { path: `${resourceName}`, method: "POST" };
        case "update":
            return { path: `${resourceName}/:id`, method: "PUT" }; // Use PUT for update
        case "replace":
            return null; // Disable replace route
        case "delete":
            return { path: `${resourceName}/:id`, method: "DELETE" };
        case "list":
            return { path: `${resourceName}`, method: "GET" };
        default:
            throw new Error(`Unsupported action: ${action}`);
    }
}

userResource.setRouterProvider(myCustomProvider);
```

---

## ListAdaptor

Different frontends or organizations may require custom formats for listing resources. Juadz uses a `QueryListAdaptor` to transform incoming query data into a standard format (`QueryListParam`) and to convert results (`QueryListResults`) into the desired response format.

Juadz includes a default `QueryListAdaptor` that accepts queries like:

```
?filter=field1:value1,field2:value2&limit=10&offset=0&sort=-id
```

This is parsed into standard `QueryFilter`, `QueryRange`, and `QuerySort` objects for the data provider.

After the database processes the query, results are returned as `QueryListResults`. The default adaptor transforms this into a response such as:

```json
{
  "body": [{...user_1}, {...user_2}, ...],
  "headers": {
    "X-total-user": "100"
  }
}
```

If your frontend requires a different format, you can implement your own ListAdaptor by providing the following structure:

```ts
export type QueryListAdaptor<T> = {
    parser: (
        resource: string,
        queryString?: Record<string, string> | null,
        params?: Record<string, string> | null,
        body?: unknown,
        headers?: Record<string, string> | null,
    ) => QueryListParam;

    response: (
        result: QueryListResults<T>,
        params: QueryListParam,
        name: string,
    ) => QueryListResponse;

    params: string[];

    // Optional schemas for documentation
    querySchema?: ZodObject;
    paramsSchema?: ZodObject;
    bodySchema?: ZodType;
    headersSchema?: ZodObject;
    responseSchema?: ZodType;
    responseHeadersSchema?: ZodObject;
};
```

To use your custom adaptor:

```ts
userResource.setListAdaptor(myCustomListAdaptor);
```

---

Juadz’s routing system is designed for flexibility, allowing you to quickly set up standard endpoints or customize them to fit




