import { ZodType } from "zod";
import { IDataRepositoryProvider, ResourceAction } from "./crud";
import { IACLActor } from "./acl";

export interface IHttpJsonResponse<T = unknown> {
    headers?: Record<string, string>;
    statusCode?: number;
    body: T;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpSchemas = {
    querySchema: ZodType;
    paramsSchema: ZodType;
    bodySchema: ZodType;
    responseSchema: ZodType;
};

export type ResourceHandler = (
    request: ResourceHandlerParams,
) => Promise<IHttpJsonResponse>;

export type ResourceHandlerParams = {
    method: string;
    path: string;

    query?: Record<string, string> | null;
    params?: Record<string, string> | null;
    body?: unknown | null;
    headers?: Record<string, string> | null;

    actor: IACLActor | null;

    request?: unknown;
};

export interface ResourceEndpoint extends Partial<HttpSchemas> {
    path: string;
    method: string;
    action?: ResourceAction;
    authentication?: string[];

    tags?: Array<string>;
    description?: string;
    summary?: string;

    handler: ResourceHandler;
}

export type RouteDef = {
    path: string;
    method: HttpMethod;
}

export type RouterProvider = (
    action: keyof IDataRepositoryProvider,
    resourceName: string,
) => RouteDef | null;

export class ErrorToHttp extends Error {
    headers: object;
    statusCode: number;
    body: object;

    constructor(
        msg: string,
        statusCode = 500,
        body: object | string | null | boolean = null,
        headers: object = {},
    ) {
        super(msg);

        this.headers = headers;
        this.statusCode = statusCode;

        if (body === true) {
            this.body = { message: msg };
        } else if (typeof body === "string") {
            this.body = { message: body };
        } else {
            this.body = body || { message: "Internal server error!" };
        }
        Object.setPrototypeOf(this, ErrorToHttp.prototype);
    }
}
