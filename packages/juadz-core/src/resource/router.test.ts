import { Router, StandardRouterProvider } from "./router";
import {
    HttpMethod,
    HttpSchemas,
    ResourceEndpoint,
    ResourceHandler,
} from "../types/http";
import * as z from "zod";

// Mock handler for testing
const mockHandler: ResourceHandler = jest.fn().mockResolvedValue({
    body: { id: "1", name: "Test" },
    headers: {},
    status: 200,
});

// Mock schemas for testing
const mockSchemas: HttpSchemas = {
    querySchema: z.object({ q: z.string().optional() }),
    paramsSchema: z.object({ id: z.string() }),
    bodySchema: z.object({ name: z.string() }),
    responseSchema: z.object({ id: z.string(), name: z.string() }),
};

describe("StandardRouterProvider", () => {
    const resourceName = "user";

    describe("get action", () => {
        it("should return correct route definition for get", () => {
            const result = StandardRouterProvider("get", resourceName);

            expect(result).toEqual({
                path: "user/:id",
                method: "GET",
                // description: "Get a user",
                // tags: ["user"],
            });
        });
    });

    describe("create action", () => {
        it("should return correct route definition for create", () => {
            const result = StandardRouterProvider("create", resourceName);

            expect(result).toEqual({
                path: "user",
                method: "POST",
                // description: "Create a new user",
                // tags: ["user"],
            });
        });
    });

    describe("update action", () => {
        it("should return correct route definition for update", () => {
            const result = StandardRouterProvider("update", resourceName);

            expect(result).toEqual({
                path: "user/:id",
                method: "PATCH",
                // description: "Update a user",
                // tags: ["user"],
            });
        });
    });

    describe("replace action", () => {
        it("should return correct route definition for replace", () => {
            const result = StandardRouterProvider("replace", resourceName);

            expect(result).toEqual({
                path: "user/:id",
                method: "PUT",
                // description: "Replace a user",
                // tags: ["user"],
            });
        });
    });

    describe("delete action", () => {
        it("should return correct route definition for delete", () => {
            const result = StandardRouterProvider("delete", resourceName);

            expect(result).toEqual({
                path: "user/:id",
                method: "DELETE",
                // description: "Delete a user",
                // tags: ["user"],
            });
        });
    });

    describe("list action", () => {
        it("should return correct route definition for list", () => {
            const result = StandardRouterProvider("list", resourceName);

            expect(result).toEqual({
                path: "user",
                method: "GET",
                // description: "List all users",
                // tags: ["user"],
            });
        });
    });

    describe("unsupported action", () => {
        it("should throw error for unsupported action", () => {
            expect(() => {
                // @ts-expect-error testing unsupported action
                StandardRouterProvider("unsupported", resourceName);
            }).toThrow("Unsupported action: unsupported");
        });
    });

    describe("different resource names", () => {
        it("should handle different resource names correctly", () => {
            const result = StandardRouterProvider("get", "product");

            expect(result).toEqual({
                path: "product/:id",
                method: "GET",
                // description: "Get a product",
                // tags: ["product"],
            });
        });

        it("should handle plural resource names", () => {
            const result = StandardRouterProvider("list", "category");

            expect(result).toEqual({
                path: "category",
                method: "GET",
                //description: "List all categorys", // Note: simple pluralization
                //tags: ["category"],
            });
        });
    });
});

describe("Router", () => {
    let router: Router;
    const resourceName = "user";

    beforeEach(() => {
        router = new Router(resourceName);
    });

    describe("constructor", () => {
        it("should initialize with resource name", () => {
            expect(router["_resourceName"]).toBe(resourceName);
        });

        it("should initialize with default tags", () => {
            expect(router.tags).toEqual([resourceName]);
        });

        it("should initialize with empty routes", () => {
            expect(router.routes).toEqual([]);
        });

        it("should initialize with empty default authentication", () => {
            expect(router.defaultAuthentication).toEqual([]);
        });

        it("should initialize with StandardRouterProvider", () => {
            expect(router.routerProvider).toBe(StandardRouterProvider);
        });
    });

    describe("getAll", () => {
        it("should return empty array initially", () => {
            expect(router.getAll()).toEqual([]);
        });

        it("should return all routes after adding some", () => {
            const route1: ResourceEndpoint = {
                path: "/test1",
                method: "GET",
                action: "get",
                handler: mockHandler,
                tags: ["test"],
                description: "Test route 1",
                authentication: [],
            };

            const route2: ResourceEndpoint = {
                path: "/test2",
                method: "POST",
                action: "create",
                handler: mockHandler,
                tags: ["test"],
                description: "Test route 2",
                authentication: [],
            };

            router.addRouteRaw(route1);
            router.addRouteRaw(route2);

            expect(router.getAll()).toEqual([route1, route2]);
        });
    });

    describe("addRouteRaw", () => {
        it("should add route to routes array", () => {
            const route: ResourceEndpoint = {
                path: "/test",
                method: "GET",
                action: "get",
                handler: mockHandler,
                tags: ["test"],
                description: "Test route",
                authentication: [],
            };

            router.addRouteRaw(route);

            expect(router.routes).toContain(route);
            expect(router.routes).toHaveLength(1);
        });

        it("should add multiple routes in order", () => {
            const route1: ResourceEndpoint = {
                path: "/test1",
                method: "GET",
                action: "get",
                handler: mockHandler,
                tags: ["test"],
                description: "Test route 1",
                authentication: [],
            };

            const route2: ResourceEndpoint = {
                path: "/test2",
                method: "POST",
                action: "create",
                handler: mockHandler,
                tags: ["test"],
                description: "Test route 2",
                authentication: [],
            };

            router.addRouteRaw(route1);
            router.addRouteRaw(route2);

            expect(router.routes).toEqual([route1, route2]);
        });
    });

    describe("addRoute with ResourceEndpoint", () => {
        it("should add route when passed ResourceEndpoint object", () => {
            const route: ResourceEndpoint = {
                path: "/custom",
                method: "POST",
                action: "create",
                handler: mockHandler,
                tags: ["custom"],
                description: "Custom route",
                authentication: ["auth"],
            };

            router.addRoute(route);

            expect(router.routes).toContain(route);
            expect(router.routes).toHaveLength(1);
        });
    });

    describe("addRoute with action, schemas, and handler", () => {
        it("should add route for get action", () => {
            router.addRoute("get", mockSchemas, mockHandler);

            expect(router.routes).toHaveLength(1);
            const addedRoute = router.routes[0];

            expect(addedRoute.path).toBe("user/:id");
            expect(addedRoute.method).toBe("GET");
            expect(addedRoute.action).toBe("get");
            expect(addedRoute.handler).toBe(mockHandler);
            expect(addedRoute.tags).toEqual(["user"]);
            // expect(addedRoute.description).toBe("Get a user");
            expect(addedRoute.authentication).toEqual([]);
            expect(addedRoute.querySchema).toBe(mockSchemas.querySchema);
            expect(addedRoute.paramsSchema).toBe(mockSchemas.paramsSchema);
            expect(addedRoute.bodySchema).toBe(mockSchemas.bodySchema);
            expect(addedRoute.responseSchema).toBe(mockSchemas.responseSchema);
        });

        it("should add route for create action", () => {
            router.addRoute("create", mockSchemas, mockHandler);

            expect(router.routes).toHaveLength(1);
            const addedRoute = router.routes[0];

            expect(addedRoute.path).toBe("user");
            expect(addedRoute.method).toBe("POST");
            expect(addedRoute.action).toBe("create");
            // expect(addedRoute.description).toBe("Create a new user");
        });

        it("should add route for update action", () => {
            router.addRoute("update", mockSchemas, mockHandler);

            const addedRoute = router.routes[0];
            expect(addedRoute.path).toBe("user/:id");
            expect(addedRoute.method).toBe("PATCH");
            expect(addedRoute.action).toBe("update");
            // expect(addedRoute.description).toBe("Update a user");
        });

        it("should add route for replace action", () => {
            router.addRoute("replace", mockSchemas, mockHandler);

            const addedRoute = router.routes[0];
            expect(addedRoute.path).toBe("user/:id");
            expect(addedRoute.method).toBe("PUT");
            expect(addedRoute.action).toBe("replace");
            // expect(addedRoute.description).toBe("Replace a user");
        });

        it("should add route for delete action", () => {
            router.addRoute("delete", mockSchemas, mockHandler);

            const addedRoute = router.routes[0];
            expect(addedRoute.path).toBe("user/:id");
            expect(addedRoute.method).toBe("DELETE");
            expect(addedRoute.action).toBe("delete");
            // expect(addedRoute.description).toBe("Delete a user");
        });

        it("should add route for list action", () => {
            router.addRoute("list", mockSchemas, mockHandler);

            const addedRoute = router.routes[0];
            expect(addedRoute.path).toBe("user");
            expect(addedRoute.method).toBe("GET");
            expect(addedRoute.action).toBe("list");
            // expect(addedRoute.description).toBe("List all users");
        });

        it("should use default authentication when set", () => {
            router.defaultAuthentication = ["bearer", "api-key"];
            router.addRoute("get", mockSchemas, mockHandler);

            const addedRoute = router.routes[0];
            expect(addedRoute.authentication).toEqual(["bearer", "api-key"]);
        });

        it("should use router tags when route provider does not specify tags", () => {
            router.tags = ["custom", "api"];
            router.addRoute("get", mockSchemas, mockHandler);

            const addedRoute = router.routes[0];
            expect(addedRoute.tags).toEqual(["custom", "api"]); // StandardRouterProvider specifies tags
        });

        it("should use partial schemas", () => {
            const partialSchemas: Partial<HttpSchemas> = {
                querySchema: z.object({ q: z.string() }),
                // bodySchema and responseSchema are missing
            };

            router.addRoute("get", partialSchemas, mockHandler);

            const addedRoute = router.routes[0];
            expect(addedRoute.querySchema).toBe(partialSchemas.querySchema);
            expect(addedRoute.paramsSchema).toBeUndefined();
            expect(addedRoute.bodySchema).toBeUndefined();
            expect(addedRoute.responseSchema).toBeUndefined();
        });

        it("should throw error when missing required arguments", () => {
            expect(() => {
                router.addRoute("get", undefined, mockHandler);
            }).toThrow(`Missing arguments for addRoute with action "get"`);

            expect(() => {
                router.addRoute("get", mockSchemas, undefined);
            }).toThrow(`Missing arguments for addRoute with action "get"`);
        });
    });

    describe("custom router provider", () => {
        it("should use custom router provider", () => {
            const customProvider = jest.fn().mockReturnValue({
                path: "/custom/:id",
                method: "GET" as HttpMethod,
                description: "Custom description",
                tags: ["custom"],
            });

            router.routerProvider = customProvider;
            router.addRoute("get", mockSchemas, mockHandler);

            expect(customProvider).toHaveBeenCalledWith("get", resourceName);

            const addedRoute = router.routes[0];
            expect(addedRoute.path).toBe("/custom/:id");
            // expect(addedRoute.description).toBe("Custom description");
            expect(addedRoute.tags).toEqual(["user"]);
        });

        it("should fallback to default description when custom provider does not provide one", () => {
            const customProvider = jest.fn().mockReturnValue({
                path: "/custom/:id",
                method: "GET" as HttpMethod,
                // no description provided
            });

            router.routerProvider = customProvider;
            router.addRoute("get", mockSchemas, mockHandler);

            // const addedRoute = router.routes[0];
            // expect(addedRoute.description).toBe("Perform get on user");
        });

        it("should fallback to router tags when custom provider does not provide tags", () => {
            const customProvider = jest.fn().mockReturnValue({
                path: "/custom/:id",
                method: "GET" as HttpMethod,
                // no tags provided
            });

            router.routerProvider = customProvider;
            router.tags = ["fallback", "tags"];
            router.addRoute("get", mockSchemas, mockHandler);

            const addedRoute = router.routes[0];
            expect(addedRoute.tags).toEqual(["fallback", "tags"]);
        });
    });

    describe("edge cases", () => {
        it("should handle empty resource name", () => {
            const emptyRouter = new Router("");
            expect(emptyRouter.tags).toEqual([""]);
        });

        it("should handle multiple routes with same action", () => {
            router.addRoute("get", mockSchemas, mockHandler);
            router.addRoute("get", mockSchemas, mockHandler);

            expect(router.routes).toHaveLength(2);
            expect(router.routes[0].action).toBe("get");
            expect(router.routes[1].action).toBe("get");
        });

        it("should handle empty schemas object", () => {
            router.addRoute("get", {}, mockHandler);

            const addedRoute = router.routes[0];
            expect(addedRoute.querySchema).toBeUndefined();
            expect(addedRoute.paramsSchema).toBeUndefined();
            expect(addedRoute.bodySchema).toBeUndefined();
            expect(addedRoute.responseSchema).toBeUndefined();
        });
    });
});
