import { FastifyInstance } from "fastify";
import { Authentications } from "@juadz/core";
import { JuadzFastifyOptions } from "./types";
import fp from "fastify-plugin";

export default fp(async function (
    fastify: FastifyInstance,
    options: JuadzFastifyOptions,
) {
    const authen = new Authentications();
    authen.providers = options.authentication;

    fastify.decorate("securityDefinitions", authen);
    fastify.decorateRequest("user", null);
}, "5.x");
