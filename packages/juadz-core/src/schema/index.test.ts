import * as z from "zod";
import ResourceSchema from ".";
import { FieldValidationError } from "../types/schema";
import { ErrorToHttp } from "../types/http";

interface ValidateErrorBody {
    [field: string]: FieldValidationError;
}

function omitKeys(
    data: Record<string, unknown>,
    keys: string[],
): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(data).filter(([key]) => !keys.includes(key)),
    );
}
/*
describe("makeDescription", () => {
    // const str = z.string()
    // str.parse('test');
    // str.parse(undefined)

    const validSchema = z.object({
        id: z.uuid(),
    });
    const resourceSchema = new ResourceSchema(validSchema);

    it("should return an empty string for undefined permission", () => {
        expect(resourceSchema.makeDescription(undefined)).toBe("");
    });

    it("should return an empty string for boolean true permission", () => {
        expect(resourceSchema.makeDescription(true)).toBe("");
    });

    it("should return a formatted permission string for a string permission", () => {
        expect(resourceSchema.makeDescription("can_do_something")).toBe(
            "#permission(can_do_something)",
        );
    });
});

describe("validateData", () => {
    const testSchema = z.object({
        id: z.string(),
        name: z.string().min(3),
        age: z.number().positive(),
    });
    const resourceSchema = new ResourceSchema(z.object({ id: z.string() }));

    it("should return data and null errors for valid data", async () => {
        const data = {
            name: "John Doe",
            age: 30,
            id: "123e4567-e89b-12d3-a456-426614174000",
        };
        const result = await resourceSchema.validateData(testSchema, data);
        expect(result.data).toEqual(data);
        expect(result.errors).toBeNull();
    });

    it("should return null data and an error object for invalid data", async () => {
        const data = {
            name: "Jo",
            age: -5,
            id: "123e4567-e89b-12d3-a456-426614174000",
        };
        const result = await resourceSchema.validateData(testSchema, data);
        expect(result.data).toBeNull();
        expect(result.errors).toEqual({
            name: {
                message: "Too small: expected string to have >=3 characters",
                code: "too_small",
            },
            age: {
                message: "Too small: expected number to be >0",
                code: "too_small",
            },
        });
    });

    it("should handle nested object validation errors", async () => {
        const nestedSchema = z.object({
            user: z.object({
                name: z.string().min(1),
                email: z.email(),
            }),
        });
        const data = {
            user: { name: "", email: "invalid-email" },
            id: "123e4567-e89b-12d3-a456-426614174000",
        };
        const result = await resourceSchema.validateData(nestedSchema, data);
        expect(result.data).toBeNull();
        expect(result.errors).toEqual({
            "user.name": {
                message: "Too small: expected string to have >=1 characters",
                code: "too_small",
            },
            "user.email": {
                message: "Invalid email address",
                code: "invalid_format",
            },
        });
    });
});
*/
describe("defineResourceSchema", () => {
    const testSchema = z.object({
        id: z.string().meta({ $create: false, $update: false }),
        name: z.string().min(3),
        age: z.number().positive().meta({ $update: false }),
        title: z.string().meta({ $view: (s: string) => s.toUpperCase() }),

        password: z.string().min(3).meta({ $view: false }),
        virtual: z.string().meta({ $virtual: true }), // fields required for create, but will not save to database.
        role: z.string().meta({
            title: "User Role",
            $view: "can_view_role",
            $update: "can_update_role",
        }),
        note: z.string().optional(),
    });

    const adminActor = {
        id: "admin",
        permissions: ["can_view_role", "can_update_role"],
    };

    const userActor = {
        id: "user",
        permissions: [],
    };

    const createData = {
        name: "John Doe",
        age: 30,
        password: "secret",
        virtual: "This is a virtual field",
        role: "admin",
        note: "This is a note",
        title: "Mr.",
    };

    const resourceSchema = new ResourceSchema("test", testSchema);
    it("should create a valid resource schema", () => {
        expect(resourceSchema).toBeDefined();
        expect(resourceSchema.createSchema).toBeDefined();
        expect(resourceSchema.replaceSchema).toBeDefined();
        expect(resourceSchema.updateSchema).toBeDefined();
        expect(resourceSchema.viewSchema).toBeDefined();

        expect(resourceSchema.createSchema.shape.id).toBeUndefined();
        expect(resourceSchema.replaceSchema.shape.id).toBeUndefined();
        expect(resourceSchema.updateSchema.shape.id).toBeUndefined();
        expect(resourceSchema.viewSchema.shape.id).toBeDefined();

        expect(resourceSchema.updateSchema.shape.age).toBeUndefined();
        expect(resourceSchema.viewSchema.shape.title).toBeDefined();
        expect(resourceSchema.viewSchema.shape.password).toBeUndefined();
        expect(resourceSchema.viewSchema.shape.virtual).toBeUndefined();

        expect(resourceSchema.updateSchema.shape.role.meta()).toEqual({
            $view: "can_view_role",
            $update: "can_update_role",
            title: "User Role",
        });
    });

    it("should validate create data", async () => {
        const { virtual, note, ...created } = createData;

        expect(virtual).toBeDefined();

        await expect(
            resourceSchema
                .validate("create", createData, adminActor)
                .catch((e) => {
                    console.error("Validation error:", e, e.body?.errors);
                    throw e;
                }),
        ).resolves.toEqual({ note, ...omitKeys(created, ["virtual"]) });

        const { note: _, ...withoutOptional } = createData;
        expect(_).toBeDefined();

        await expect(
            resourceSchema.validate("create", withoutOptional, adminActor),
        ).resolves.toEqual({ ...created });
    });

    it("should throw when create with invalid data", async () => {
        try {
            await resourceSchema.validate(
                "create",
                { id: "1999", ...createData },
                adminActor,
            );
            fail("Expected validation to fail");
        } catch (e) {
            const error = e as ErrorToHttp;
            expect(error.message).toBe("Validate failed");
            expect((error.body as ValidateErrorBody).errors).toEqual({
                id: {
                    message: 'Field "id" is not allowed',
                    code: "permission_denied",
                },
            });
        }

        const { role, ...invalidData } = createData;
        expect(role).toBeDefined();
        try {
            await resourceSchema.validate("create", invalidData, adminActor);
            fail("Expected validation to fail");
        } catch (e) {
            const error = e as ErrorToHttp;
            expect(error.message).toBe("Validate failed");
            expect((error.body as ValidateErrorBody).errors).toEqual({
                role: {
                    message: 'Field "role" is required.',
                    code: "required",
                },
            });
        }
        //expect(await resourceSchema.validate('create', invalidData, adminActor))
        //    .toThrow('Field "role" is not allowed for create.');
    });

    it("should validate update data", async () => {
        const data = { name: "Jane Doe", title: "Ms." };
        await expect(
            resourceSchema.validate("update", data, adminActor).catch((e) => {
                console.error("Validation error:", e, e.body?.errors);
                throw e;
            }),
        ).resolves.toEqual(data);
    });

    it("should throw when update with invalid data", async () => {
        try {
            await resourceSchema.validate(
                "update",
                { id: "123", name: "Jane Doe" },
                adminActor,
            );
            fail("Expected validation to fail");
        } catch (e) {
            const error = e as ErrorToHttp;
            expect(error.message).toBe("Validate failed");
            expect((error.body as ValidateErrorBody).errors).toEqual({
                id: {
                    message: 'Field "id" is not allowed',
                    code: "permission_denied",
                },
            });
        }

        try {
            await resourceSchema.validate(
                "update",
                { age: 11, name: "Jane Doe" },
                adminActor,
            );
            fail("Expected validation to fail");
        } catch (e) {
            const error = e as ErrorToHttp;
            expect(error.message).toBe("Validate failed");
            expect((error.body as ValidateErrorBody).errors).toEqual({
                age: {
                    message: 'Field "age" is not allowed',
                    code: "permission_denied",
                },
            });

            try {
                await resourceSchema.validate(
                    "update",
                    { role: "god", name: "Janie Jones" },
                    userActor,
                );
                throw new Error("Expected validation to fail");
            } catch (e) {
                const error = e as ErrorToHttp;
                expect(error.message).toBe("Validate failed");
                expect((error.body as ValidateErrorBody).errors).toEqual({
                    role: {
                        message: 'You not allowed to update "role".',
                        code: "permission_denied",
                    },
                });
            }
        }
    });

    function omitFields(
        data: Record<string, unknown>,
        fields: string[],
    ): Record<string, unknown> {
        return Object.fromEntries(
            Object.entries(data).filter(([key]) => !fields.includes(key)),
        );
    }

    it("should validate view data", async () => {
        const data = { ...createData, id: "1234567890" };
        await expect(
            resourceSchema.validate("view", data, adminActor).catch((e) => {
                console.error("Validation error:", e, e.body?.errors);
                throw e;
            }),
        ).resolves.toEqual({
            ...omitFields(data, ["password", "virtual"]),
            title: "MR.",
        });

        await expect(
            resourceSchema.validate("view", data, userActor),
        ).resolves.toEqual({
            ...omitFields(data, ["password", "virtual", "role"]),
            title: "MR.",
        });
    });
});
/* */
