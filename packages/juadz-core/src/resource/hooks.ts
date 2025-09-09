import { QueryListParam, QueryListResults } from "../types/crud";
import { SchemaHook, SchemaHookFunc, SchemaHookParams } from "../types/hook";

export type HookNamesSimple =
    | "preCreate"
    | "preUpdate"
    | "preReplace"
    | "preDelete"
    | "postView"
    | "postCreate"
    | "postReplace"
    | "postUpdate"
    | "postDelete";
type HookNamesPreList = "preList";
type HookNamesPostList = "postList";

export type HookNames = HookNamesSimple | HookNamesPreList | HookNamesPostList;

export class Hooks<T> {
    private hooks: Record<HookNames, SchemaHookFunc<unknown>[]> = {
        preCreate: [],
        preUpdate: [],
        preReplace: [],
        preDelete: [],
        preList: [],
        postView: [],
        postCreate: [],
        postReplace: [],
        postUpdate: [],
        postDelete: [],
        postList: [],
    };

    private async executeHookChain<TX>(
        hooks: SchemaHookFunc<TX>[],
        data: TX,
        params: SchemaHookParams<TX>,
    ): Promise<TX> {
        if (!hooks || hooks.length === 0) {
            return data;
        }

        let result = data;
        for (const hook of hooks) {
            result = await hook(result, params);
        }
        return result;
    }

    async executeHooks(
        hookName: "preList",
        data: QueryListParam,
        params: SchemaHookParams<QueryListParam>,
    ): Promise<QueryListParam>;
    async executeHooks(
        hookName: "postList",
        data: QueryListResults<T>,
        params: SchemaHookParams<QueryListResults<T>>,
    ): Promise<QueryListResults<T>>;
    async executeHooks(
        hookName: HookNamesSimple,
        data: T,
        params: SchemaHookParams<T>,
    ): Promise<T>;
    async executeHooks(
        hookName: HookNames,
        data: unknown,
        params: SchemaHookParams<unknown>,
    ): Promise<unknown> {
        const hookArray = this.hooks[hookName];
        return await this.executeHookChain(hookArray, data, params);
    }

    registerHook(
        hookName: HookNames,
        hookFunc:
            | SchemaHook<T>
            | SchemaHook<QueryListParam>
            | SchemaHook<QueryListResults<T>>,
    ): void {
        this.hooks[hookName].push(...makeArray(hookFunc));
    }

    getHookCount(hookName: HookNames): number {
        return this.hooks[hookName].length;
    }
}

function makeArray(item: unknown | unknown[]) {
    if (Array.isArray(item)) {
        return item;
    }
    return [item];
}
