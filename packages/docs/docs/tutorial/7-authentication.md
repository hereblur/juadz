---
sidebar_position: 7
---

# Authentication

Every Juadz application requires an authentication provider, which transforms incoming requests into an `ACLActor`. This actor object is used throughout the framework to enforce access control.

---

## AuthenticationProvider

An `AuthenticationProvider` is a module that verifies requests and returns an `ACLActor`. You can implement authentication using API keys, JWT tokens, sessions, or any custom logic.

Here is an example of an API key authentication provider:

```ts
const API_KEY = 'example-api-key';

const myAuthProvider = {
    apiKey: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        func: async (headers) => {
            // Extract the API key from request headers
            const token = headers ? headers['x-api-key'] : null;

            // If the token is missing or invalid, return null (authentication fails)
            if (!token || token !== API_KEY) {
                return null;
            }

            // If valid, return an ACLActor with permissions
            return {
                permissions: [
                    'view.users',
                    'update.users',
                    'create.users'
                ]
            };
        }
    }
} as IAuthProvider;

// Assign the authentication provider to your resource
UserResource.setAuthentication(['apiKey']);
```

You can define multiple authentication providers for a resource. The first provider that successfully authenticates the request will be used.

---

## ACLActor

An `ACLActor` is a simple object that holds a list of permissions:

```ts
const acl: ACLActor = {
    permissions: ['create.users', 'update.users', 'create.orders']
};
```

This object is passed through the Juadz ecosystem to verify access before any resource operation.

You can extend `ACLActor` to include additional fields, such as `username` or `user_id`, if you need them in hooks or other parts of your application:

```ts
interface MyActor extends ACLActor {
    username: string;
}

const acl: MyActor = {
    permissions: ['create.users', 'update.users', 'create.orders'],
    username: 'root'
};
```

---

By implementing custom authentication providers and using the ACLActor pattern, Juadz gives you fine-grained control over access to your

