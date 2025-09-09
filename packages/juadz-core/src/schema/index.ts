import { mayi } from "../libs/acl";
import { IACLActor } from "../types/acl";

import { ErrorToHttp } from "../types/http";
import * as builder from "./builder";
import Debug from "debug";
import {
    FieldValidationError,
    SchemaViewTransform,
    ValidateAction,
    ViewTransform,
} from "../types/schema";

import { IDataRecord } from "../types/common";
import { ZodObject, ZodType } from "zod";
import { $ZodIssue, $ZodIssueUnrecognizedKeys } from "zod/v4/core/errors.cjs";
// import  } from "zod/v4/core/errors.cjs";

const debug = Debug("juadz:core:schema");

export * from "./builder";

export default class ResourceSchema<T extends IDataRecord> {
    createSchema: ZodObject;
    replaceSchema: ZodObject;
    updateSchema: ZodObject;
    viewSchema: ZodObject;

    zod: ZodObject;

    //viewTransforms: SchemaViewTransform<T> = {} as SchemaViewTransform<T>;
    //private flags: SchemaFlagsRecord<T> = {} as SchemaFlagsRecord<T>;
    private _name: string = "untitled";

    constructor(name: string, schema: ZodObject) {
        if (!schema?.shape || !("id" in schema.shape)) {
            throw new Error("Invalid schema: Missing 'id' field");
        }

        this._name = name;
        this.zod = schema;
        this.createSchema = builder.copySchema("create", schema);
        this.replaceSchema = builder.copySchema("replace", schema);
        this.updateSchema = builder.copySchema("update", schema);
        this.viewSchema = builder.copySchema("view", schema);
    }

    makeDescription(
        $perm: string | boolean | SchemaViewTransform | undefined,
    ): string {
        return typeof $perm === "string" ? `#permission(${$perm})` : "";
    }

    makeError(issue: $ZodIssue): { [k: string]: FieldValidationError } {
        //console.log(issue)
        // Fix zod error message for better user experience
        if (
            issue.code === "invalid_type" &&
            (issue.message.endsWith("received undefined") ||
                issue.message.endsWith("received null"))
        ) {
            return {
                [issue.path.join(".")]: {
                    message: `Field "${issue.path.join(".")}" is required.`,
                    code: "required",
                },
            };
        }

        if (issue.code === "unrecognized_keys") {
            const { keys } = issue as $ZodIssueUnrecognizedKeys;
            return {
                [keys.join(".")]: {
                    message: `Field "${keys.join(".")}" is not allowed`,
                    code: "permission_denied",
                },
            };
        }

        return {
            [issue.path.join(".")]: {
                message: issue.message,
                code: issue.code,
            },
        };
    }

    async validateData(schema: ZodType, data: Partial<T>) {
        // console.log("Validating data against schema", schema, data);
        const resp = await schema.safeParseAsync(data);
        if (resp.success) {
            return {
                data: resp.data as T,
                errors: null,
            };
        } else {
            const errors: Record<string, FieldValidationError> = {};
            resp.error.issues.forEach((issue) => {
                Object.assign(errors, this.makeError(issue));
            });

            return {
                data: null,
                errors,
            };
        }
    }

    pickSchema = (action: ValidateAction): ZodObject => {
        switch (action) {
            case "create":
                return this.createSchema;
            case "replace":
                return this.replaceSchema;
            case "update":
                return this.updateSchema;
            case "view":
                return this.viewSchema;
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    };

    validateFlagsField = async <TX>(
        action: ValidateAction,
        path: string,
        fieldValue: TX,
        schema: ZodObject,
        record: T,
        actor: IACLActor | null,
    ): Promise<{ value: TX } | null> => {
        const fieldSchema = builder.getSchemaFromPath(schema, path);
        if (!fieldSchema) {
            if (action === "view") {
                return null;
            }

            throw new ErrorToHttp("Validate failed", 400, {
                message: `Field "${path}" not found in schema.`,
                errors: {
                    [path]: {
                        message: `Field "${path}" not found in schema.`,
                        code: "field_not_found",
                    } as FieldValidationError,
                },
            });
        }

        const flags = builder.getFieldFlags(fieldSchema);
        // console.log(`Validating ${action}/${flags[`$${action}`]} field "${path}" [${fieldValue}] with flags`, flags, actor.permissions.join(","));
        if (typeof flags[`$${action}`] === "string") {
            const permission = flags[`$${action}`] as string;

            if (flags.$virtual) {
                return null;
            }

            if (!mayi(actor, permission)) {
                if (action === "view" || flags.$virtual) {
                    return null;
                }

                throw new ErrorToHttp("Validate failed", 403, {
                    message: `You not allowed to ${action} "${path}".`,
                    errors: {
                        [path]: {
                            message: `You not allowed to ${action} "${path}".`,
                            code: "permission_denied",
                        } as FieldValidationError,
                    },
                });
            }
        }

        if (typeof flags[`$${action}`] === "function") {
            const func = flags[`$${action}`] as ViewTransform<TX>;
            return { value: (await func(fieldValue, actor, record)) as TX };
        }

        if (fieldSchema instanceof ZodObject && fieldValue) {
            return {
                value: await this.validateFlagsObject(
                    action,
                    path,
                    fieldValue as TX,
                    schema,
                    record,
                    actor,
                ),
            };
        }

        if (flags.$virtual) {
            return null;
        }

        return { value: fieldValue as TX };
    };

    validateFlagsObject = async <TX>(
        action: ValidateAction,
        path: string,
        fieldValue: TX,
        schema: ZodObject,
        record: T,
        actor: IACLActor | null,
    ): Promise<TX> => {
        if (typeof fieldValue !== "object" || fieldValue === null) {
            throw new ErrorToHttp("Validate failed", 400, {
                message: `Field "${path}" must be an object.`,
                errors: {
                    [path]: {
                        message: `Field "${path}" must be an object.`,
                        code: "invalid_type",
                    } as FieldValidationError,
                },
            });
        }

        const fieldNames = Object.keys(fieldValue as object);
        const output: Record<string, unknown> = {};

        await Promise.all(
            fieldNames.map(async (fname) => {
                const fullPath = path ? `${path}.${fname}` : fname;
                const value = (fieldValue as Record<string, unknown>)[fname];

                const result = await this.validateFlagsField(
                    action,
                    fullPath,
                    value,
                    schema,
                    record,
                    actor,
                );

                if (result) {
                    output[fname] = result.value;
                }
            }),
        );

        return output as TX;
    };

    async validate(
        action: ValidateAction,
        data: Partial<T>,
        actor: IACLActor | null,
    ) {
        // Validate againts zod.

        const schema = this.pickSchema(action);
        const resp = await this.validateData(schema, data);

        if (resp.errors) {
            debug(
                "Validation failed",
                JSON.stringify(resp.errors),
                JSON.stringify(data),
            );
            // console.log(resp)
            throw new ErrorToHttp("Validate failed", 400, {
                message: "Invalid input",
                errors: resp.errors || {},
            });
        }

        return await this.validateFlagsObject(
            action,
            "",
            data,
            schema,
            data as T,
            actor,
        );
    }

    set name(name: string) {
        this._name = name;
    }

    get name(): string {
        return this._name;
    }
}
