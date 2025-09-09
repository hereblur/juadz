import { ZodError } from "zod";
import DefaultAdaptor from "./DefaultAdaptor";
import { QueryListParam } from "../types/crud";

// packages/kapi-core/src/list/DefaultAdaptor.test.ts

describe("DefaultAdaptor", () => {
    describe("parser", () => {
        it("parses all query params correctly", () => {
            const query = {
                filter: "name:John,age:25",
                limit: "20",
                offset: "5",
                sort: "-createdAt",
            };
            const result = DefaultAdaptor.parser("users", query);
            expect(result).toEqual({
                resource: "users",
                filter: [
                    { field: "name", op: "=", value: "John" },
                    { field: "age", op: "=", value: "25" },
                ],
                range: { limit: 20, offset: 5 },
                sort: [{ field: "createdAt", direction: "DESC" }],
            });
        });

        it("defaults limit and offset if missing or invalid", () => {
            const result = DefaultAdaptor.parser("users", {
                filter: "",
                limit: "abc",
            });
            expect(result.range).toEqual({ limit: 10, offset: 0 });
        });

        it("handles empty filter and sort", () => {
            const result = DefaultAdaptor.parser("users", {});
            expect(result.filter).toEqual([]);
            expect(result.sort).toEqual([]);
        });
        it("handles empty filter and sort", () => {
            const result = DefaultAdaptor.parser("users", {
                filters: "",
                sort: "",
            });
            expect(result.filter).toEqual([]);
            expect(result.sort).toEqual([]);
        });

        it("parses ascending sort", () => {
            const result = DefaultAdaptor.parser("users", { sort: "name" });
            expect(result.sort).toEqual([{ field: "name", direction: "ASC" }]);
        });
    });

    describe("response", () => {
        it("formats response with correct headers and body", () => {
            const result = DefaultAdaptor.response(
                { data: [{ id: 1 }], total: 42 },
                {} as QueryListParam,
                "users",
            );
            expect(result.body).toEqual([{ id: 1 }]);
            expect(result.headers).toEqual({ "X-total-users": "42" });
        });
    });

    describe("querySchema", () => {
        const schema = DefaultAdaptor.querySchema;

        it("validates correct query params", async () => {
            await expect(
                schema!.parseAsync({
                    filter: "name:John",
                    limit: "10",
                    offset: "0",
                    sort: "-age",
                }),
            ).resolves.toBeDefined();
        });

        it("fails validation on wrong types", async () => {
            await expect(
                schema!.parseAsync({
                    filter: 123,
                    limit: [],
                    offset: {},
                    sort: null,
                }),
            ).rejects.toBeInstanceOf(ZodError);
        });
    });
});
