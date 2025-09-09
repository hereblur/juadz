import {
    IDataRepositoryProvider,
    QueryListAdaptor,
    QueryListParam,
    QueryListResults,
    ResourceAction,
} from "../types/crud";
import ResourceSchema from "../schema";
import { mayi } from "../libs/acl";
import { IACLActor } from "../types/acl";
import {
    ErrorToHttp,
    IHttpJsonResponse,
    ResourceEndpoint,
    ResourceHandlerParams,
    RouterProvider,
} from "../types/http";
import { IDataRecord, TypeID } from "../types/common";
import { ValidateAction } from "../types/schema";
import CacheManager, { CacheNothing } from "../libs/cache";
import DefaultAdaptor from "../list/DefaultAdaptor";
import { array, object, string, ZodObject } from "zod";
import { HookNames, HookNamesSimple, Hooks } from "./hooks";
import { DataRepository } from "./repository";
import { Router } from "./router";
import { SchemaHook } from "../types/hook";

const endpointWithIDSchema = object({
    id: string().min(1),
});

export default class Resource<T extends IDataRecord = IDataRecord> {
    private _resourceName: string;
    private _permissionName: string;
    private schema: ResourceSchema<T>;

    private hooks: Hooks<T> = new Hooks<T>();
    private repository: DataRepository<T> = new DataRepository<T>();
    private routes: Router;

    private _listAdaptor: QueryListAdaptor<T> = DefaultAdaptor;
    private cache: CacheManager = new CacheManager(CacheNothing);

    private enabled: Set<ResourceAction> = new Set([]);

    constructor(
        dbProvider: IDataRepositoryProvider<T>,
        resourceName?: string,
        permissionName?: string,
    ) {
        // this.zod = schema;
        this._resourceName = resourceName || dbProvider.name;
        if (!this._resourceName) {
            // console.log(dbProvider)
            throw new Error(
                "Resource name is required. Please provide a valid resource name.",
            );
        }

        for (const action of [
            "get",
            "create",
            "update",
            "replace",
            "delete",
            "list",
        ] as ResourceAction[]) {
            if (dbProvider[action]) {
                this.enabled.add(action);
            }
        }

        this.routes = new Router(this._resourceName);
        this.repository.database = dbProvider;
        this.schema = new ResourceSchema(this._resourceName, dbProvider.schema);
        this._permissionName = permissionName || this._resourceName;
    }

    generateEndpoints(): ResourceEndpoint[] {
        if (this.enabled.has("get")) {
            this.routes.addRoute(
                "get",
                {
                    paramsSchema: endpointWithIDSchema,
                    responseSchema: this.schema.viewSchema!,
                },
                this.get,
            );
        }

        if (this.enabled.has("update")) {
            this.routes.addRoute(
                "update",
                {
                    paramsSchema: endpointWithIDSchema,
                    bodySchema: this.schema.updateSchema!,
                    responseSchema: this.schema.viewSchema!,
                },
                this.update,
            );
        }

        if (this.enabled.has("replace")) {
            this.routes.addRoute(
                "replace",
                {
                    paramsSchema: endpointWithIDSchema,
                    bodySchema: this.schema.replaceSchema!,
                    responseSchema: this.schema.viewSchema!,
                },
                this.replace,
            );
        }

        if (this.enabled.has("create")) {
            this.routes.addRoute(
                "create",
                {
                    bodySchema: this.schema.createSchema!,
                    responseSchema: this.schema.viewSchema!,
                },
                this.create,
            );
        }

        if (this.enabled.has("delete")) {
            this.routes.addRoute(
                "delete",
                {
                    paramsSchema: endpointWithIDSchema,
                    responseSchema: this.schema.viewSchema!,
                },
                this.delete,
            );
        }

        if (this.enabled.has("list") && this._listAdaptor) {
            this.routes.addRoute(
                "list",
                {
                    querySchema: this._listAdaptor.querySchema,
                    paramsSchema: this._listAdaptor.paramsSchema,
                    bodySchema: this._listAdaptor.bodySchema,
                    responseSchema:
                        this._listAdaptor.responseSchema ||
                        array(this.schema.viewSchema),
                },
                this.list,
            );
        }

        return this.routes.getAll();
    }

    addRoute(endpoint: ResourceEndpoint) {
        this.routes.addRoute(endpoint);
        return this;
    }

    checkPermission(
        actor: IACLActor | null,
        action: ValidateAction | "delete",
    ) {
        if (!actor || !mayi(actor, `${action}.${this._permissionName}`)) {
            throw new ErrorToHttp(
                `Permission denied ${action}.${this._permissionName}`,
                403,
                {
                    message: "Permission denied",
                    action,
                    // permissionAlias: this.permissionsAlias,
                    permissionName: this._permissionName,
                },
            );
        }
    }

    async viewAs(data: T, actor: IACLActor | null): Promise<T> {
        if (!data) {
            return data;
        }

        if (!mayi(actor, `view.${this._permissionName}`)) {
            // Edge case: User have right to update, but no right to view.
            return {} as T;
        }

        const output = (await this.schema.validate("view", data, actor)) as T;

        return await this.hooks.executeHooks("postView", output, {
            resourceName: this._resourceName,
            raw: data as T,
            actor,
            action: "get",
        });
    }

    private async _get(id: TypeID): Promise<T | null> {
        return await this.cache.get(this._resourceName, id, async () => {
            return await this.repository.get(id);
        });
    }

    get = async (
        params: ResourceHandlerParams,
    ): Promise<IHttpJsonResponse<T>> => {
        this.checkPermission(params.actor, "view");

        if (!params.params || !params.params.id) {
            throw new ErrorToHttp(
                `Resource ${this._resourceName} get requires id`,
                404,
                true,
            );
        }

        const data = (await this._get(params.params?.id || "undefined")) as T;
        if (!data) {
            throw new ErrorToHttp(
                `Resource ${this._resourceName} with id ${params.params.id} not found`,
                404,
                true,
            );
        }
        return { body: (await this.viewAs(data, params.actor)) as T };
    };

    private async _update(id: string | number, update: Partial<T>): Promise<T> {
        await this.cache.invalidate(this._resourceName, id);
        return await this.repository.update(id, update);
    }

    update = async (
        params: ResourceHandlerParams,
    ): Promise<IHttpJsonResponse<T>> => {
        this.checkPermission(params.actor, "update");
        if (!params.params || !params.params.id) {
            throw new ErrorToHttp(
                `Resource ${this._resourceName} update requires id`,
                404,
                true,
            );
        }

        let patch = await this.schema.validate(
            "update",
            params.body as Partial<T>,
            params.actor,
            //params.params.id,
        );

        patch = await this.hooks.executeHooks("preUpdate", patch as T, {
            resourceName: this._resourceName,
            raw: {
                ...(params.body as Partial<T>),
                id: (params.body as IDataRecord).id || params.params.id,
            } as T,
            actor: params.actor,
            action: "update",
            id: params.params.id,
        });

        const data = (await this._update(params.params.id, patch)) as T;

        await this.hooks.executeHooks("postUpdate", data, {
            resourceName: this._resourceName,
            raw: {
                ...(params.body as Partial<T>),
                id: (params.body as IDataRecord).id || params.params.id,
            } as T,
            action: "update",
            actor: params.actor,
            id: params.params.id,
        });

        return { body: await this.viewAs(data, params.actor) };
    };

    private async _create(params: T): Promise<T> {
        await this.cache.invalidate(this._resourceName, null);

        return await this.repository.create(params);
    }

    create = async (
        params: ResourceHandlerParams,
    ): Promise<IHttpJsonResponse<T>> => {
        this.checkPermission(params.actor, "create");

        let data = await this.schema.validate(
            "create",
            params.body as T,
            params.actor,
        );

        data = await this.hooks.executeHooks("preCreate", data as T, {
            resourceName: this._resourceName,
            raw: params.body as T,
            actor: params.actor,
            action: "create",
        });

        const result = await this._create(data as T);

        await this.hooks.executeHooks("postCreate", result, {
            resourceName: this._resourceName,
            action: "create",
            actor: params.actor,
            raw: data as T,
            id: data.id,
        });

        return {
            statusCode: 201,
            body: await this.viewAs(result, params.actor),
        };
    };

    private async _replace(id: string | number, params: T): Promise<T> {
        await this.cache.invalidate(this._resourceName, id);
        return await this.repository!.replace!(id, params);
    }

    replace = async (
        params: ResourceHandlerParams,
    ): Promise<IHttpJsonResponse<T>> => {
        this.checkPermission(params.actor, "replace");
        if (!params.params || !params.params.id) {
            throw new ErrorToHttp(
                `Resource ${this._resourceName} replace requires id`,
                404,
                true,
            );
        }

        let data = await this.schema.validate(
            "replace",
            params.body as T,
            params.actor,
        );

        data = await this.hooks.executeHooks("preReplace", data as T, {
            resourceName: this._resourceName,
            raw: params.body as T,
            actor: params.actor,
            action: "replace",
        });

        const result = await this._replace(params.params.id, data as T);

        await this.hooks.executeHooks("postReplace", result, {
            resourceName: this._resourceName,
            action: "replace",
            actor: params.actor,
            raw: data as T,
            id: (data as unknown as IDataRecord).id,
        });

        return { body: await this.viewAs(data as T, params.actor) };
    };

    private async _delete(id: string | number) {
        await this.cache.invalidate(this._resourceName, id);
        return await this.repository.delete(id);
    }

    delete = async (
        params: ResourceHandlerParams,
    ): Promise<IHttpJsonResponse<Partial<T>>> => {
        this.checkPermission(params.actor, "delete");
        if (!params.params || !params.params.id) {
            throw new ErrorToHttp(
                `Resource ${this._resourceName} delete requires id`,
                404,
                true,
            );
        }

        this.checkPermission(params.actor, "delete");
        const id = params.params.id;

        await this.hooks.executeHooks("preDelete", { id } as T, {
            resourceName: this._resourceName,
            action: "delete",
            actor: params.actor,
            id,
            raw: { id } as T,
        });

        await this._delete(id);
        await this.hooks.executeHooks("postDelete", { id } as T, {
            resourceName: this._resourceName,
            action: "delete",
            actor: params.actor,
            raw: { id } as T,
            id: id,
        });

        return {
            body: { id } as Partial<T>,
        };
    };

    private async _list(params: QueryListParam) {
        return (
            (await this.cache.list(this._resourceName, params, async () => {
                const { total, data } = await this.repository!.list!(params);

                return { total, data };
            })) || { total: 0, data: [] }
        );
    }

    list = async (
        request: ResourceHandlerParams,
    ): Promise<IHttpJsonResponse<unknown>> => {
        const { actor, query: queryString, params, body, headers } = request;
        this.checkPermission(actor, "view");

        if (!this._listAdaptor) {
            throw new ErrorToHttp(
                "Resource invalid configuration(no adaptor) ",
                500,
            );
        }
        let qparams = this._listAdaptor.parser(
            this._resourceName,
            queryString,
            params,
            body,
            headers,
        );

        qparams = await this.hooks.executeHooks("preList", qparams, {
            resourceName: this._resourceName,
            raw: qparams,
            actor,
            action: "list",
        });

        const results = await this._list(qparams);

        const { total, data } = await this.hooks.executeHooks(
            "postList",
            results,
            {
                resourceName: this._resourceName,
                action: "list",
                actor,
                raw: results,
                id: 0,
            },
        );

        const data_ = await Promise.all(
            data.map(async (row) => {
                return (await this.viewAs(row, actor)) as T;
            }),
        );

        return this._listAdaptor.response(
            {
                total,
                data: data_,
            },
            qparams,
            this._resourceName,
        );
    };

    // set databaseProvider(d: IDataRepositoryProvider<T>) {
    //     this.repository.database = d;
    //
    //     if (d.init) {
    //         d.init(this.schema);
    //     }
    // }


    setPermissionName(p: string) {
        this._permissionName = p;
        return this;
    }
    set permissionName(p: string) {
        this._permissionName = p;
    }

    get permissionName(): string {
        return this._permissionName;
    }

    get tags(): string[] {
        return [...this.routes.tags];
    }

    setTags(t: string[]) {
        this.routes.tags = t;
        return this;
    }
    set tags(t: string[]) {
        this.routes.tags = t;
    }


    setRouterProvider(router: RouterProvider) {
        this.routes.routerProvider = router;
        return this;
    }
    set routerProvider(router: RouterProvider) {
        this.routes.routerProvider = router;
    }

    get resourceName(): string {
        return this._resourceName;
    }


    setAuthentication(auth: string[]) {
        this.routes.defaultAuthentication = auth;
        return this;
    }
    set authentication(auth: string[]) {
        this.routes.defaultAuthentication = auth;
    }

    get authentication(): string[] {
        return [...this.routes.defaultAuthentication];
    }

    get createSchema(): ZodObject | undefined {
        return this.schema.createSchema;
    }
    get replaceSchema(): ZodObject | undefined {
        return this.schema.replaceSchema;
    }
    get updateSchema(): ZodObject | undefined {
        return this.schema.updateSchema;
    }
    get viewSchema(): ZodObject | undefined {
        return this.schema.viewSchema;
    }
    get originalSchema(): ZodObject | undefined {
        return this.schema.zod;
    }

    setListAdaptor(adaptor: QueryListAdaptor<T>) {
        this._listAdaptor = adaptor;
        return this;
    }
    set listAdaptor(adaptor: QueryListAdaptor<T>) {
        this._listAdaptor = adaptor;
    }

    disabled(action: ResourceAction | ResourceAction[]) {
        if (Array.isArray(action)) {
            for (const a of action) {
                this.disabled(a);
            }
            return this;
        }
        if (this.enabled.has(action)) {
            this.enabled.delete(action);
        }

        return this;
    }

    addHook(hookName: "preList", hookFunc: SchemaHook<QueryListParam>);
    addHook(
        hookName: "postList",
        hookFunc: SchemaHook<QueryListResults<T>>,
    );
    addHook(hookName: HookNamesSimple, hookFunc: SchemaHook<T>);
    addHook(
        hookName: HookNames,
        hookFunc:
            | SchemaHook<T>
            | SchemaHook<QueryListParam>
            | SchemaHook<QueryListResults<T>>,
    ) {
        this.hooks.registerHook(hookName, hookFunc);

        return this;
    }
}
