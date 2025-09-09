export interface IACLActor {
    permissions: Array<string>;
}

export interface IAuthFunction {
    (
        headers?: Record<string, string>,
        query?: Record<string, string>,
        params?: Record<string, string>,
        body?: unknown,
        request?: unknown,
    ): Promise<IACLActor | null>;
}

type AuthMethodTypeHTTP = {
    type: "http";
    scheme: "basic" | "bearer";
    bearerFormat?: string;
    func: IAuthFunction;
};

type AuthMethodTypeAPIKey = {
    type: "apiKey";
    in: "header" | "query";
    name: string;
    func: IAuthFunction;
};

export type AuthMethodType = AuthMethodTypeHTTP | AuthMethodTypeAPIKey;
export interface IAuthProvider {
    [authMethod: string]: AuthMethodTypeHTTP | AuthMethodTypeAPIKey;
}
