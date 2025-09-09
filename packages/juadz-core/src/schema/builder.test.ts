import * as z from "zod";

import {
    copyFields,
    copySchema,
    flagPaths,
    getFieldFlags,
    getSchemaFromPath,
} from "./builder";

describe("getFieldFlags", () => {
    it("should return default flags when no metadata is set", () => {
        const field = z.string();
        const flags = getFieldFlags(field);

        expect(flags).toEqual({
            $virtual: false,
            $create: true,
            // $replace: true,
            $update: true,
            $view: true,
            $search: false,
            $filter: false,
            $sort: false,
        });
    });

    it("should return custom flags when metadata is set", () => {
        const field = z.string().meta({
            $virtual: true,
            $create: false,
            $search: true,
            $filter: true,
        });

        const flags = getFieldFlags(field);

        expect(flags).toEqual({
            $virtual: true,
            $create: false,
            // $replace: true,
            $update: true,
            $view: true,
            $search: true,
            $filter: true,
            $sort: false,
        });
    });
});

describe("getSchemaFromPath", () => {
    it("should return field for simple path", () => {
        const schema = z.object({
            name: z.string(),
            age: z.number(),
        });

        const result = getSchemaFromPath(schema, "name");
        expect(result).toBe(schema.shape.name);
    });

    it("should return field for nested path", () => {
        const schema = z.object({
            user: z.object({
                profile: z.object({
                    name: z.string(),
                }),
            }),
        });

        const result = getSchemaFromPath(schema, "user.profile.name");
        expect(result).toBe(schema.shape.user.shape.profile.shape.name);
    });

    it("should return null for non-existent path", () => {
        const schema = z.object({
            name: z.string(),
        });

        const result = getSchemaFromPath(schema, "nonexistent");
        expect(result).toBeNull();
    });

    it("should return null for invalid nested path", () => {
        const schema = z.object({
            name: z.string(),
        });

        const result = getSchemaFromPath(schema, "name.invalid");
        expect(result).toBeNull();
    });
});

describe("flagPaths", () => {
    it("should collect flag paths from schema", () => {
        const schema = z.object({
            searchable: z.string().meta({ $search: true }),
            filterable: z.string().meta({ $filter: true }),
            normal: z.string(),
        });

        const result = flagPaths(schema);
        // console.log(result);
        expect(result.$search).toContain("searchable");
        expect(result.$filter).toContain("filterable");
    });

    it("should handle nested objects", () => {
        const schema = z.object({
            searchable: z.string().meta({ $search: true }),
            filterable: z.string().meta({ $filter: true }),
            user: z.object({
                name: z.string().meta({ $search: true }),
            }),
            normal: z.string(),
        });

        const result = flagPaths(schema);
        // console.log(result);
        expect(result.$search).toContain("user.name");
        expect(result.$search).toContain("searchable");
    });

    it("should include path prefix when provided", () => {
        const schema = z.object({
            name: z.string().meta({ $search: true }),
        });

        const result = flagPaths(schema, "prefix");
        expect(result.$search).toContain("prefix.name");
    });
});

describe("copyFields", () => {
    it("should copy fields for create action", () => {
        const schema = z.object({
            name: z.string(),
            virtual: z.string().meta({ $virtual: true }),
        });

        const result = copyFields("create", schema);
        expect(result.shape.name).toBeDefined();
        expect(result.shape.virtual).toBeDefined();
    });

    it("should exclude fields marked as false for action", () => {
        const schema = z.object({
            name: z.string(),
            excluded: z.string().meta({ $create: false }),
        });

        const result = copyFields("create", schema);
        expect(result.shape.name).toBeDefined();
        expect(result.shape.excluded).toBeUndefined();
    });

    it("should make fields optional for update action", () => {
        const schema = z.object({
            name: z.string(),
        });

        const result = copyFields("update", schema);
        // console.log(result.shape.name._def);
        expect(result.shape.name._def.type).toBe("optional");
    });

    it("should exclude virtual fields for view action", () => {
        const schema = z.object({
            name: z.string(),
            virtual: z.string().meta({ $virtual: true }),
        });

        const result = copyFields("view", schema);
        expect(result.shape.name).toBeDefined();
        expect(result.shape.virtual).toBeUndefined();
    });

    it("should handle nested objects", () => {
        const schema = z.object({
            user: z.object({
                name: z.string(),
            }),
        });

        const result = copyFields("create", schema);
        expect(result.shape.user).toBeDefined();
        expect(result.shape.user.shape.name).toBeDefined();
    });
});

describe("copySchema", () => {
    it("should copy schema with action prefix in title", () => {
        const schema = z
            .object({
                name: z.string(),
            })
            .meta({ title: "User" });

        const result = copySchema("create", schema);
        expect(result.meta().title).toBe("[create] User");
    });

    it("should copy schema without title prefix when no title", () => {
        const schema = z.object({
            name: z.string(),
        });

        const result = copySchema("view", schema);
        expect(result.meta().title).toBeUndefined();
    });

    it("should preserve other metadata", () => {
        const schema = z
            .object({
                name: z.string(),
            })
            .meta({ description: "A user schema" });

        const result = copySchema("update", schema);
        expect(result.meta().description).toBe("A user schema");
    });
});
