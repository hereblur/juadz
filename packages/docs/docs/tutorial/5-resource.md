---
sidebar_position: 5
---

# Resource

A Juadz Resource represents a RESTful endpoint for your data model. By combining a schema and a data provider, you can quickly expose CRUD operations with built-in validation, authentication, and documentation.

---

## Creating a Resource

To create a resource, connect your schema to a data provider (such as KnexProvider for SQL databases):

```ts
const userRepository = KnexProvider("users", userSchema, knexConnection);
export const UserResource = new Resource<TUser>(userRepository);
```

Your `UserResource` is now ready to serve RESTful API endpoints.

---

## Disabling Routes

You can disable specific routes to restrict access. Disabled routes will return HTTP 404 when called:

```ts
UserResource.disable(['delete', 'replace']); // Prevent deletion or replacement of user data
```

---

## Setting Permissions

By default, permissions are derived from the resource name. For example, a resource named `users` will require permissions like `create.users`, `update.users`, `view.users`, and `delete.users`.

If you want to share permissions with another resource (e.g., `AddressResource` should use `users` permissions), you can set a custom permission name:

```ts
AddressResource.setPermissionName('users');
```

This will check for permissions such as `*.users` instead of `*.address`, simplifying permission management.

---

## Tags

Resources are automatically tagged by their schema name (e.g., `users`). You can customize tags to group API endpoints in your documentation:

```ts
UserResource.setTags(['admin', 'accounts']);
```

Tags affect only documentation and do not impact API behavior.

---

## Authentication

Set authentication providers to control access to your resource:

```ts
UserResource.setAuthentication(['admin', 'merchant']);
```

Refer to the Authentication chapter for more details.

---

## Hooks

Hooks allow you to customize resource behavior before and after standard operations. Available hooks include:

- `preCreate`
- `preUpdate`
- `preReplace`
- `preDelete`
- `postCreate`
- `postUpdate`
- `postReplace`
- `postDelete`
- `preList`
- `postList`
- `postView`

**Pre-hooks** receive input data and can modify or validate it before the operation proceeds. Throwing an exception in a pre-hook will abort the operation (useful for tasks like password encryption or validation).

**Post-hooks** run after the operation completes and can be used for side effects, such as creating related records, calling callback hook or saving audit logs. Exceptions in post-hooks will result in an HTTP error but will not undo the completed operation.

`postView` is used to transform data before sending it to the client.

---

By combining schema, provider, permissions, authentication, tags, and hooks, Juadz Resources offer a flexible and secure way to build robust






