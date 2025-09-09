import { IDataRepositoryProvider } from "../types/crud";
import {
    HttpMethod,
    HttpSchemas,
    ResourceEndpoint,
    ResourceHandler,
} from "../types/http";

import Debug from "debug";
const debug = Debug("juadz:core:resource:router");

interface RouterDef {
    path: string;
    method: HttpMethod;
}
export function StandardRouterProvider(
    action: keyof IDataRepositoryProvider,
    resourceName: string,
): RouterDef {
    switch (action) {
        case "get":
            return {
                path: `${resourceName}/:id`,
                method: "GET",
            };
        case "create":
            return {
                path: `${resourceName}`,
                method: "POST",
            };
        case "update":
            return {
                path: `${resourceName}/:id`,
                method: "PATCH",
            };
        case "replace":
            return {
                path: `${resourceName}/:id`,
                method: "PUT",
            };
        case "delete":
            return {
                path: `${resourceName}/:id`,
                method: "DELETE",
            };
        case "list":
            return {
                path: `${resourceName}`,
                method: "GET",
            };
        default:
            throw new Error(`Unsupported action: ${action}`);
    }
}

export class Router {
    routes: ResourceEndpoint[] = [];
    routerProvider = StandardRouterProvider;
    defaultAuthentication: string[] = [];
    tags: string[] = [];
    private _resourceName = "";

    constructor(resourceName: string) {
        this._resourceName = resourceName;
        this.tags = [resourceName];
    }

    getAll(): ResourceEndpoint[] {
        return this.routes;
    }

    addRouteRaw(r: ResourceEndpoint) {
        this.routes.push(r);
    }

    addRoute(r: ResourceEndpoint): void;
    addRoute(
        action: keyof IDataRepositoryProvider,
        schemas: Partial<HttpSchemas>,
        handler: ResourceHandler,
    ): void;
    addRoute(
        actionOrEndpoint: keyof IDataRepositoryProvider | ResourceEndpoint,
        schemas?: Partial<HttpSchemas>,
        handler?: ResourceHandler,
    ): void {
        if (typeof actionOrEndpoint !== "string") {
            this.addRouteRaw(actionOrEndpoint as ResourceEndpoint);
            return;
        }

        const action = actionOrEndpoint as keyof Omit<
            IDataRepositoryProvider,
            "schema" | "name"
        >;

        if (!this._resourceName || !schemas || !handler) {
            throw new Error(
                `Missing arguments for addRoute with action "${action}"`, // [${typeof action}] on resource "${this._resourceName}" ${schemas? 's':'no s'}.`
            );
            // throw new Error("Missing arguments for addRoute with action.");
        }

        const def = this.routerProvider(action, this._resourceName);

        if (!def) {
            debug(`Route ${action} ${this._resourceName} is disabled by router provider`);
            return;
        }

        this.addRouteRaw({
            path: def.path,
            method: def.method,
            action,
            tags: [...this.tags],
            summary: `[${action}] ${this._resourceName}`,

            querySchema: schemas.querySchema,
            paramsSchema: schemas.paramsSchema,
            bodySchema: schemas.bodySchema,
            responseSchema: schemas.responseSchema,

            authentication: this.defaultAuthentication || [],
            handler,
        });
    }
}
