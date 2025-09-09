import { ZodObject, ZodType } from "zod";
import { IDataRecord, TypeID } from "./common";
// import ResourceSchema from "../schema";

export type QueryFilterOperator =
    | "="
    | "!="
    | ">"
    | ">="
    | "<"
    | "<="
    | "in"
    | "!in"
    | "contains"
    | "!contains"
    | "between"
    | "!between"
    | "null"
    | "!null";

export type ResourceAction =
    | "create"
    | "get"
    | "update"
    | "delete"
    | "list"
    | "replace";

export type QueryFilter = {
    field: string;
    op: QueryFilterOperator;
    value: number | string | Date | Array<number | string | Date>;
};

export type QueryRange = {
    offset: number;
    limit: number;
};

export type QuerySort = {
    field: string;
    direction: "ASC" | "DESC";
};

export type QueryListParam = {
    resource: string;
    filter: QueryFilter[];
    range: QueryRange;
    sort: QuerySort[];
};

export type QueryListResults<T> = {
    data: T[];
    total: number;
};
export type QueryListFunction<T> = {
    (params: QueryListParam): Promise<QueryListResults<T>>;
};

export type QueryListResponse = {
    body: unknown;
    headers?: Record<string, string>;
};

export interface IDataRepositoryProvider<T extends IDataRecord = IDataRecord> {
    schema: ZodObject;
    name: string;

    get?: (id: TypeID) => Promise<T>;
    update?: (id: TypeID, patch: Partial<T>) => Promise<T>;
    replace?: (id: TypeID, data: T) => Promise<T>;
    create?: (data: T) => Promise<T>;
    delete?: (id: TypeID) => Promise<number>;
    list?: QueryListFunction<T>;
}

export type QueryListAdaptor<T> = {
    parser: (
        resource: string,
        queryString?: Record<string, string> | null,
        params?: Record<string, string> | null,
        body?: unknown,
        headers?: Record<string, string> | null,
    ) => QueryListParam;
    response: (
        result: QueryListResults<T>,
        params: QueryListParam,
        name: string,
    ) => QueryListResponse;
    params: string[];

    querySchema?: ZodObject; // for documentation
    paramsSchema?: ZodObject; // for documentation
    bodySchema?: ZodType; // for documentation
    headersSchema?: ZodObject; // for documentation
    responseSchema?: ZodType; // for documentation
    responseHeadersSchema?: ZodObject; // for documentation
};
