import { ZodType } from "zod";
import { IACLActor } from "./acl";
import { IDataRecord } from "./common";

export interface BaseSchema {
    [key: string]: ZodType;
}

type PermissionName = string;

export type ViewTransform<T> = (
    value: T,
    actor?: IACLActor | null,
    record?: IDataRecord,
) => T;

export type SchemaViewTransform<T extends IDataRecord = IDataRecord> = {
    [field in keyof T]:
        | ViewTransform<T[field]>
        | boolean
        | PermissionName
        | undefined;
};

export type ValidateAction = "create" | "update" | "view" | "replace";

export interface SchemaFlags<T = unknown> {
    $virtual?: boolean;
    $create?: boolean;
    $update?: boolean | PermissionName;
    // $replace?: boolean | PermissionName;
    $view?: boolean | PermissionName | ViewTransform<T>;

    $search?: boolean;
    $filter?: boolean;
    $sort?: boolean;
}
export type SchemaFlagsRecord<T extends IDataRecord = IDataRecord> = {
    [field in keyof T]: SchemaFlags<T[field]>; //  | boolean | PermissionName | undefined;
};

export type PermissionMap = {
    [action in ValidateAction | "delete"]?: string | string[];
};

export interface FieldValidationError {
    message: string;
    code: string;
}
