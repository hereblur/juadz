import { FastifyInstance, FastifyRequest } from "fastify";
import { IACLActor, IAuthProvider, Resource } from "@juadz/core";
import { Authentications } from "@juadz/core";

export interface AuthenticatedRequest extends FastifyRequest {
    user?: IACLActor | null;
}

export interface FastifyJuadz extends FastifyInstance {
    securityDefinitions?: Authentications;
}

export interface JuadzFastifyOptions {
    resources: Resource[];
    prefix?: string;
    authentication?: IAuthProvider;

    docs?:
        | false
        | {
              title?: string;
              description?: string;
              version?: string;
              url?: string[];
              prefix?: string;
          };
}
