import * as z from "zod";
import { SchemaFlags } from "../types/schema";

declare module "zod" {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface GlobalMeta extends SchemaFlags {}
}

const defaultFlags: SchemaFlags = {
    $virtual: false,
    $create: true,
    $update: true,
    $view: true,
    $search: false,
    $filter: true,
    $sort: true,
};

export function getFieldFlags(field: z.ZodType): SchemaFlags {
    const {
        $virtual,
        $create,
        // $replace,
        $update,
        $view,
        $search,

        $filter,
        $sort,
    } = { ...defaultFlags, ...(z.globalRegistry.get(field) || {})};

    return {
        $virtual,
        $create,
        // $replace,
        $update,
        $view,
        $search,
        $filter,
        $sort,
    };
}

export function getSchemaFromPath(
    schema: z.ZodObject,
    path: string,
): z.ZodType | null {
    const parts = path.split(".");
    let currentSchema: z.ZodType = schema;

    for (const part of parts) {
        if (currentSchema instanceof z.ZodObject) {
            currentSchema = currentSchema.shape[part] || null;
        } else {
            return null; // Not an object schema, can't traverse further
        }

        if (!currentSchema) {
            return null; // Path does not exist in the schema
        }
    }

    return currentSchema;
}

export function flagPaths(
    schema: z.ZodObject,
    path: string = "",
): Record<keyof SchemaFlags, string[]> {
    const flags: Record<string, string[]> = {};

    for (const key in schema.shape) {
        const fieldFlags = { ...defaultFlags, ...schema.shape[key].meta() };

        const ppath = path ? `${path}.${key}` : key;

        //console.log(
        //    `Processing field "${key}" with path "${ppath}" and flags`,
        //    fieldFlags,
        //);
        for (const flag in fieldFlags) {
            if (!flag.startsWith("$")) {
                continue;
            }

            if (!flags[flag]) {
                flags[flag] = [];
            }

            if (fieldFlags[flag] !== false) {
                flags[flag].push(ppath);
            }
        }

        if (schema.shape[key] instanceof z.ZodObject) {
            const nestedFlags = flagPaths(
                schema.shape[key] as z.ZodObject,
                ppath,
            );

            for (const nestedFlag in nestedFlags) {
                if (!flags[nestedFlag]) {
                    flags[nestedFlag] = [];
                }
                flags[nestedFlag].push(...nestedFlags[nestedFlag]);
            }
        }
    }

    return flags;
}

function splitMeta(meta: Record<string, unknown>) {
    const flags: Record<string, unknown> = {};
    const onlyMeta: Record<string, unknown> = {};

    for (const key in meta) {
        if (key.startsWith("$")) {
            flags[key] = meta[key];
        } else {
            onlyMeta[key] = meta[key];
        }
    }

    return {
        flags: flags as SchemaFlags,
        meta: onlyMeta as z.GlobalMeta,
    };
}

export function copyFields(
    action: "create" | "replace" | "update" | "view",
    schema: z.ZodObject,
): z.ZodObject {
    const fields = {} as Record<string, z.ZodType>;
    const actionType = action === "replace" ? "create" : action;

    for (const key in schema.shape) {
        const field = schema.shape[key];

        if (!field) {
            console.warn(`Field "${key}" is not defined in schema.`);
            continue; // Skip if field is not defined
        }

        const isObject = field instanceof z.ZodObject;

        // console.log (` isObject ${isObject} for field ${key} with action ${action}`);

        let clonedField = (
            isObject ? copyFields(action, field) : field.clone()
        ) as z.ZodType<z.output<typeof field>, z.input<typeof field>>;

        const { meta, flags } = splitMeta(field.meta());

        if (flags[`$${actionType}`] === false) {
            continue;
        }

        if (action === "view") {
            if (flags.$virtual) {
                continue;
            }

            clonedField = clonedField.optional().catch(undefined);
            // clonedField = clonedField.catch((ctx) => {
            //     return `${ctx.value || ""}`;
            // });
        }

        if (action === "update") {
            clonedField = clonedField.optional();
        }

        // console.log(
        //     `Cloning field "${key}" for action "${action}" with flags`,
        //     { ...meta, ...flags },
        // );
        fields[key] = clonedField.meta({ ...meta, ...flags });
    }

    switch (action) {
        case "view":
            return z.object(fields);
    }

    return z.strictObject(fields);
}

export function copySchema(
    action: "create" | "replace" | "update" | "view",
    schema: z.ZodObject,
): z.ZodObject {
    const newSchema = copyFields(action, schema);
    const { meta } = splitMeta(schema.meta());
    return newSchema.meta({
        ...meta,
        ...(meta.title ? { title: `[${action}] ${meta.title}` } : {}),
    });
}
