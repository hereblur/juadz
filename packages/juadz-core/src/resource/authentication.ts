import { AuthMethodType, IACLActor, IAuthProvider } from "../types/acl";
import { ErrorToHttp } from "../types/http";
import Debug from "debug";
const debug = Debug("juadz:core:auth");

export class Authentications {
    providers: IAuthProvider = {};

    registerAuthMethod(name: string, authMethod: AuthMethodType) {
        if (this.providers[name]) {
            throw new Error(`Auth Method ${name} already registered`);
        }

        this.providers[name] = authMethod;
    }

    async tryAuthenticate(
        authMethods: string[],
        headers?: Record<string, string>,
        query?: Record<string, string>,
        params?: Record<string, string>,
        body?: unknown,
        request?: unknown,
    ): Promise<IACLActor | null> {
        for (const authMethod of authMethods) {
            const provider = this.providers[authMethod];
            if (!provider) {
                throw new Error(
                    `Authentication Method ${authMethod} not registered`,
                );
            }

            if (!provider.func || typeof provider.func !== "function") {
                throw new Error(
                    `Authentication Method ${authMethod} does not have a valid function`,
                );
            }

            debug(`Trying to authenticate with method: ${authMethod}`);
            const acl = await provider.func(
                headers,
                query,
                params,
                body,
                request,
            );
            if (acl) {
                debug(
                    `Authentication successful for method ${authMethod}`,
                    acl,
                );
                return acl;
            }

            debug(`Authentication failed for method ${authMethod}`);
        }

        debug("All authentication methods failed, throwing error 401");

        throw new ErrorToHttp("Unauthorized", 401, true);
    }
}

/*
export class ResourceAuthentication {
    authMethods: string[] = [];

    async authenticate(headers?: Record<string, string>,
        query?: Record<string, string>,
        params?: Record<string, string>,
        body?: unknown) {

        if (!this.authMethods || this.authMethods.length === 0) {
            return { permissions: [], _: "No authenticated" } as IACLActor;
        }

    for (const authMethod of this.authMethods) {
      const acl = await Authentications.tryAuthenticate(authMethod, headers, query, params, body);
      if (acl) {
        return acl;
      }
    }

    throw new ErrorToHttp('Unauthorized', 401, true);
  }

  setAuthMethod(authMethod: string|string[]|null) {
    if (Array.isArray(authMethod)) {

      for (const method of authMethod) {
        if (!Authentications.AuthMethods[method]) {
          throw new Error(`Authentication Method ${method} not registered`);
        }
      }

      this.authMethods = authMethod;
    }
    if (typeof authMethod === 'string') {
      this.setAuthMethod([authMethod]);
    }
    if (authMethod === null) {
      this.setAuthMethod([]);
    }
  }
}
*/
