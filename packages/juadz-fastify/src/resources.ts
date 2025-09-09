import { ErrorToHttp, HttpMethod, ResourceEndpoint } from "@juadz/core";
import {
    FastifyInstance,
    FastifySchema,
    RouteHandler,
    RouteShorthandOptions,
} from "fastify";
import { looseObject, object, string, toJSONSchema, ZodType } from "zod";
import {
    AuthenticatedRequest,
    FastifyJuadz,
    JuadzFastifyOptions,
} from "./types";
import { IncomingHttpHeaders } from "http";
import Debug from "debug";

const debug = Debug("juadz:fastify:resources");

function removeFlags(jsonSchema: object): object {
    if (Array.isArray(jsonSchema)) {
        return jsonSchema.map(removeFlags);
    } else if (typeof jsonSchema === "object" && jsonSchema !== null) {
        const result: Record<string, object> = {};
        for (const key in jsonSchema) {
            if (Object.prototype.hasOwnProperty.call(jsonSchema, key)) {
                if (!key.startsWith("$")) {
                    // Remove flags that start with $
                    result[key] = removeFlags(jsonSchema[key]);
                }
            }
        }
        return result;
    }
    return jsonSchema; // Return the value as is if it's not an object or array
}

function convertToJsonSchema(schema: ZodType) {
    const jsonSchema = toJSONSchema(schema);
    if (jsonSchema.$schema) {
        delete jsonSchema.$schema; // Remove $schema to avoid conflicts with Fastify
    }

    return removeFlags(jsonSchema);
}

const httpErrorBody = convertToJsonSchema(
    looseObject({
        message: string().optional(),
    }),
);
const httpValidateErrorBody = convertToJsonSchema(
    looseObject({
        message: string().optional(),
        errors: looseObject({
            code: string().optional(),
            message: string().optional(),
        }).optional(),
    }),
);

const httpErrors = {
    400: httpValidateErrorBody,
    401: httpErrorBody,
    403: httpErrorBody,
    500: httpErrorBody,
};

function makeParamSchemaFromPath(path: string) {
    const pathParts = path.split("/");
    const paramsSchema: Record<string, ZodType> = {};
    pathParts.forEach((p) => {
        if (p.charAt(0) === ":") {
            const paramName = p.substring(1);
            paramsSchema[paramName] = string();
        }
    });

    if (Object.keys(paramsSchema).length === 0) {
        return undefined;
    }

    return object(paramsSchema);
}

function route(
    fastify: FastifyInstance,
    method: string,
    path: string,
    schema: RouteShorthandOptions,
    handler: RouteHandler,
) {
    debug(`Registering route: [${method.toUpperCase()} ${path}]`);
    switch (method.toLowerCase()) {
        case "get":
            fastify.get(path, schema, handler);
            break;
        case "post":
            fastify.post(path, schema, handler);
            break;
        case "put":
            fastify.put(path, schema, handler);
            break;
        case "patch":
            fastify.patch(path, schema, handler);
            break;
        case "delete":
            fastify.delete(path, schema, handler);
            break;
        case "head":
            fastify.head(path, schema, handler);
            break;
        default:
            throw new Error(`HTTP method ${method} is not supported.`);
    }
}

function makeSchema(
    endpoint: ResourceEndpoint,
    resourceName: string,
): FastifySchema {
    const schema = {
        tags: endpoint.tags,
        operationId: endpoint.action
            ? `${endpoint.action}_${resourceName}`
            : `${endpoint.path.replace(/\//g, "_")}`,
        summary: endpoint.description,
        description: endpoint.description,
        security: endpoint.authentication
            ? endpoint.authentication.map((auth) => ({ [auth]: [] }))
            : [],
        response: {
            200: endpoint.responseSchema
                ? convertToJsonSchema(endpoint.responseSchema)
                : { type: "object", additionalProperties: true },
            ...httpErrors,
        },
    } as FastifySchema;

    if (endpoint.querySchema) {
        schema.querystring = convertToJsonSchema(endpoint.querySchema);
    }
    if (endpoint.bodySchema) {
        schema.body = convertToJsonSchema(endpoint.bodySchema);
    }
    if (endpoint.paramsSchema) {
        schema.params = convertToJsonSchema(endpoint.paramsSchema);
    } else {
        const paramsSchema = makeParamSchemaFromPath(endpoint.path);
        if (paramsSchema) {
            schema.params = convertToJsonSchema(paramsSchema);
        }
    }

    return schema;
}

function mergePath(prefix: string | undefined, path: string): string {
    if (!prefix) return path;
    let prefixWithoutSlash = prefix;
    if (prefixWithoutSlash.endsWith("/")) {
        prefixWithoutSlash = prefixWithoutSlash.slice(0, -1);
    }

    if (path === "/" || path === "") {
        return prefixWithoutSlash; // If path is root, return just the prefix
    }

    if (path.startsWith("/")) {
        return prefixWithoutSlash + path;
    } else {
        return prefixWithoutSlash + "/" + path;
    }
}

function flatternHeader(headers: IncomingHttpHeaders): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key in headers) {
        if (Object.prototype.hasOwnProperty.call(headers, key)) {
            const value = headers[key];
            if (Array.isArray(value)) {
                result[key] = value[0]; // Take the first value if it's an array
            } else if (value !== undefined && value !== null) {
                result[key] = String(value);
            }
        }
    }
    return result;
}

function getPrevalidationHooks(
    fastify: FastifyJuadz,
    authentication: string[],
): { preValidation?: RouteShorthandOptions["preValidation"] } {
    if (!authentication || authentication.length === 0) {
        return {};
    }

    const securityDefinitions = fastify.securityDefinitions;
    if (!securityDefinitions) {
        throw new Error(
            "Security definitions are not defined, make sure to call useAuthentication() before useResource().",
        );
    }

    for (const auth of authentication) {
        if (!securityDefinitions.providers[auth]) {
            throw new Error(
                `Authentication method "${auth}" is not defined in authentication provider.`,
            );
        }
    }

    const preValidation: RouteShorthandOptions["preValidation"] = async (
        request: AuthenticatedRequest,
        reply,
    ) => {
        try {
            const actor = await securityDefinitions.tryAuthenticate(
                authentication,
                flatternHeader(request.headers),
                request.query as Record<string, string>,
                request.params as Record<string, string>,
                request.body,
                request,
            );

            request.user = actor;
        } catch (err) {
            if (err instanceof ErrorToHttp) {
                reply
                    .status(err.statusCode)
                    .headers(err.headers || {})
                    .send(err.body);
            } else {
                debug("Authentication error:", err);
                reply.status(401).send({ message: "Unauthorized" });
            }
        }
    };

    return { preValidation };
}

export default async function useResource(
    fastify: FastifyJuadz,
    options: JuadzFastifyOptions,
) {
    for (const resource of options.resources) {
        const endpoints = resource.generateEndpoints();

        for (const r of endpoints) {
            debug(`Registering route: rpath: ${r.path}, method: ${r.method}`);
            route(
                fastify,
                r.method,
                // Fastify already take care of `prefix`: https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
                //mergePath( options.prefix || '/', r.path),
                mergePath("/", r.path),
                {
                    schema: makeSchema(r, resource.resourceName),
                    ...getPrevalidationHooks(fastify, r.authentication || []),
                },
                async (request: AuthenticatedRequest, reply) => {
                    try {
                        const response = await r.handler({
                            method: request.method.toUpperCase() as HttpMethod,
                            path: request.url,
                            query: request.query as Record<
                                string,
                                string
                            > | null,
                            params: request.params as Record<
                                string,
                                string
                            > | null,
                            body: request.body || null,
                            headers: request.headers as Record<
                                string,
                                string
                            > | null,
                            actor: request.user,
                            request,
                        });
                        reply
                            .headers(response.headers || {})
                            .status(response.statusCode || 200)
                            .send(response.body);
                    } catch (err) {

                        console.log(err)
                        debug("Error in resource handler:", err);
                        if (err instanceof ErrorToHttp) {
                            reply
                                .status(err.statusCode)
                                .headers(err.headers || {})
                                .send(err.body);
                        } else {
                            debug("Unhandled error:", err);
                            reply.status(500).send({
                                message: "Internal Server Error",
                                ...(process.env.NODE_ENV === "test"
                                    ? {
                                          error:
                                              err instanceof Error
                                                  ? err.message
                                                  : String(err),
                                          stack:
                                              err instanceof Error
                                                  ? err.stack
                                                  : undefined,
                                          body: request.body,
                                      }
                                    : {}),
                            });
                        }
                    }
                },
            );
        }
    }
}
