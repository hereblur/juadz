import FPAuthentication from "./authentication";
import FPOpenApi from "./docs";
import useResource from "./resources";
import { FastifyJuadz, JuadzFastifyOptions } from "./types";
import Debug from "debug";
import fp from "fastify-plugin";
const debug = Debug("juadz:fastify");

export * from "./types";

export default fp(async function (
    fastify: FastifyJuadz,
    options: JuadzFastifyOptions,
) {
    if (options.docs) {
        debug("OpenAPI documentation is enabled");
        fastify.register(FPOpenApi, options);
    } else {
        debug("OpenAPI documentation is disabled");
    }

    if (options.authentication) {
        debug("Authentication is provided");
        fastify.register(FPAuthentication, options);
    } else {
        debug("No authentication provided");
    }

    fastify.register(useResource, options);
});
