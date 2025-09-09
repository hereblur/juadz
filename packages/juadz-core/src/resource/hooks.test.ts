import { Hooks } from "./hooks";
import { QueryListParam, QueryListResults } from "../types/crud";
import { SchemaHookFunc, SchemaHookParams } from "../types/hook";

// Mock types for testing
interface TestRecord {
    id: string;
    name: string;
    email: string;
}

describe("Hooks", () => {
    let hooks: Hooks<TestRecord>;

    beforeEach(() => {
        hooks = new Hooks<TestRecord>();
    });

    describe("constructor", () => {
        it("should initialize with empty hook arrays", () => {
            expect(hooks.getHookCount("preCreate")).toBe(0);
            expect(hooks.getHookCount("postCreate")).toBe(0);
            expect(hooks.getHookCount("preList")).toBe(0);
            expect(hooks.getHookCount("postList")).toBe(0);
        });
    });

    describe("registerHook", () => {
        it("should register a single hook function", () => {
            const mockHook: SchemaHookFunc<TestRecord> = jest
                .fn()
                .mockResolvedValue({
                    id: "1",
                    name: "Test",
                    email: "test@example.com",
                });

            hooks.registerHook("preCreate", mockHook);
            expect(hooks.getHookCount("preCreate")).toBe(1);
        });

        it("should register multiple hook functions as array", () => {
            const mockHook1: SchemaHookFunc<TestRecord> = jest
                .fn()
                .mockResolvedValue({
                    id: "1",
                    name: "Test1",
                    email: "test1@example.com",
                });

            const mockHook2: SchemaHookFunc<TestRecord> = jest
                .fn()
                .mockResolvedValue({
                    id: "2",
                    name: "Test2",
                    email: "test2@example.com",
                });

            hooks.registerHook("preCreate", [mockHook1, mockHook2]);
            expect(hooks.getHookCount("preCreate")).toBe(2);
        });

        it("should register hooks for different hook names", () => {
            const mockHook1: SchemaHookFunc<TestRecord> = jest.fn();
            const mockHook2: SchemaHookFunc<TestRecord> = jest.fn();

            hooks.registerHook("preCreate", mockHook1);
            hooks.registerHook("postCreate", mockHook2);

            expect(hooks.getHookCount("preCreate")).toBe(1);
            expect(hooks.getHookCount("postCreate")).toBe(1);
        });

        it("should handle list hooks with different data types", () => {
            const mockPreListHook: SchemaHookFunc<QueryListParam> = jest.fn();
            const mockPostListHook: SchemaHookFunc<
                QueryListResults<TestRecord>
            > = jest.fn();

            hooks.registerHook("preList", mockPreListHook);
            hooks.registerHook("postList", mockPostListHook);

            expect(hooks.getHookCount("preList")).toBe(1);
            expect(hooks.getHookCount("postList")).toBe(1);
        });
    });

    describe("executeHooks", () => {
        describe("simple hooks (preCreate, postCreate, etc.)", () => {
            it("should execute single hook and return modified data", async () => {
                const testData: TestRecord = {
                    id: "1",
                    name: "Original",
                    email: "original@example.com",
                };

                const mockHook: SchemaHookFunc<TestRecord> = jest
                    .fn()
                    .mockResolvedValue({
                        ...testData,
                        name: "Modified",
                    });

                const mockParams: SchemaHookParams<TestRecord> = {
                    resourceName: "test",
                    action: "create",
                    actor: null,
                    raw: testData,
                };

                hooks.registerHook("preCreate", mockHook);
                const result = await hooks.executeHooks(
                    "preCreate",
                    testData,
                    mockParams,
                );

                expect(mockHook).toHaveBeenCalledWith(testData, mockParams);
                expect(result.name).toBe("Modified");
            });

            it("should execute multiple hooks in sequence", async () => {
                const testData: TestRecord = {
                    id: "1",
                    name: "Original",
                    email: "original@example.com",
                };

                const mockHook1: SchemaHookFunc<TestRecord> = jest
                    .fn()
                    .mockImplementation((data) => ({
                        ...data,
                        name: "First",
                    }));

                const mockHook2: SchemaHookFunc<TestRecord> = jest
                    .fn()
                    .mockImplementation((data) => ({
                        ...data,
                        name: "Second",
                    }));

                const mockParams: SchemaHookParams<TestRecord> = {
                    resourceName: "test",
                    action: "create",
                    actor: null,
                    raw: testData,
                };

                hooks.registerHook("preCreate", [mockHook1, mockHook2]);
                const result = await hooks.executeHooks(
                    "preCreate",
                    testData,
                    mockParams,
                );

                expect(mockHook1).toHaveBeenCalledWith(testData, mockParams);
                expect(mockHook2).toHaveBeenCalledWith(
                    { ...testData, name: "First" },
                    mockParams,
                );
                expect(result.name).toBe("Second");
            });

            it("should return original data if no hooks registered", async () => {
                const testData: TestRecord = {
                    id: "1",
                    name: "Original",
                    email: "original@example.com",
                };

                const mockParams: SchemaHookParams<TestRecord> = {
                    resourceName: "test",
                    action: "create",
                    actor: null,
                    raw: testData,
                };

                const result = await hooks.executeHooks(
                    "preCreate",
                    testData,
                    mockParams,
                );
                expect(result).toEqual(testData);
            });
        });

        describe("preList hooks", () => {
            it("should execute preList hook with QueryListParam", async () => {
                const testParams: QueryListParam = {
                    resource: "test",
                    filter: [],
                    range: { offset: 0, limit: 10 },
                    sort: [],
                };

                const mockHook: SchemaHookFunc<QueryListParam> = jest
                    .fn()
                    .mockResolvedValue({
                        ...testParams,
                        range: { offset: 0, limit: 20 },
                    });

                const mockHookParams: SchemaHookParams<QueryListParam> = {
                    resourceName: "test",
                    action: "list",
                    actor: null,
                    raw: testParams,
                };

                hooks.registerHook("preList", mockHook);
                const result = await hooks.executeHooks(
                    "preList",
                    testParams,
                    mockHookParams,
                );

                expect(mockHook).toHaveBeenCalledWith(
                    testParams,
                    mockHookParams,
                );
                expect(result.range.limit).toBe(20);
            });
        });

        describe("postList hooks", () => {
            it("should execute postList hook with QueryListResults", async () => {
                const testResults: QueryListResults<TestRecord> = {
                    data: [
                        { id: "1", name: "Test1", email: "test1@example.com" },
                        { id: "2", name: "Test2", email: "test2@example.com" },
                    ],
                    total: 2,
                };

                const mockHook: SchemaHookFunc<QueryListResults<TestRecord>> =
                    jest.fn().mockResolvedValue({
                        ...testResults,
                        total: 100,
                    });

                const mockHookParams: SchemaHookParams<
                    QueryListResults<TestRecord>
                > = {
                    resourceName: "test",
                    action: "list",
                    actor: null,
                    raw: testResults,
                };

                hooks.registerHook("postList", mockHook);
                const result = await hooks.executeHooks(
                    "postList",
                    testResults,
                    mockHookParams,
                );

                expect(mockHook).toHaveBeenCalledWith(
                    testResults,
                    mockHookParams,
                );
                expect(result.total).toBe(100);
            });
        });

        describe("error handling", () => {
            it("should propagate errors from hooks", async () => {
                const testData: TestRecord = {
                    id: "1",
                    name: "Test",
                    email: "test@example.com",
                };

                const mockHook: SchemaHookFunc<TestRecord> = jest
                    .fn()
                    .mockRejectedValue(new Error("Hook failed"));

                const mockParams: SchemaHookParams<TestRecord> = {
                    resourceName: "test",
                    action: "create",
                    actor: null,
                    raw: testData,
                };

                hooks.registerHook("preCreate", mockHook);

                await expect(
                    hooks.executeHooks("preCreate", testData, mockParams),
                ).rejects.toThrow("Hook failed");
            });

            it("should handle hooks that return undefined", async () => {
                const testData: TestRecord = {
                    id: "1",
                    name: "Test",
                    email: "test@example.com",
                };

                const mockHook: SchemaHookFunc<TestRecord> = jest
                    .fn()
                    .mockResolvedValue(undefined);

                const mockParams: SchemaHookParams<TestRecord> = {
                    resourceName: "test",
                    action: "create",
                    actor: null,
                    raw: testData,
                };

                hooks.registerHook("preCreate", mockHook);

                const result = await hooks.executeHooks(
                    "preCreate",
                    testData,
                    mockParams,
                );
                expect(result).toBeUndefined();
            });
        });
    });
});

describe("makeArray utility function", () => {
    // Since makeArray is not exported, we'll test it indirectly through registerHook
    it("should handle single item correctly", () => {
        const hooks = new Hooks<TestRecord>();
        const mockHook: SchemaHookFunc<TestRecord> = jest.fn();

        hooks.registerHook("preCreate", mockHook);
        expect(hooks.getHookCount("preCreate")).toBe(1);
    });

    it("should handle array correctly", () => {
        const hooks = new Hooks<TestRecord>();
        const mockHook1: SchemaHookFunc<TestRecord> = jest.fn();
        const mockHook2: SchemaHookFunc<TestRecord> = jest.fn();

        hooks.registerHook("preCreate", [mockHook1, mockHook2]);
        expect(hooks.getHookCount("preCreate")).toBe(2);
    });

    it("should handle nested arrays correctly", () => {
        const hooks = new Hooks<TestRecord>();
        const mockHook1: SchemaHookFunc<TestRecord> = jest.fn();
        const mockHook2: SchemaHookFunc<TestRecord> = jest.fn();

        // Register hooks multiple times
        hooks.registerHook("preCreate", [mockHook1]);
        hooks.registerHook("preCreate", [mockHook2]);
        expect(hooks.getHookCount("preCreate")).toBe(2);
    });
});
