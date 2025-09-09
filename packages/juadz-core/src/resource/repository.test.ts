import { DataRepository } from "./repository";
import {
    IDataRepositoryProvider,
    QueryListParam,
    QueryListResults,
} from "../types/crud";
import { TypeID } from "../types/common";

// Mock data interface for testing
interface TestRecord {
    id: TypeID;
    name: string;
    email: string;
    createdAt: Date;
    [key: string]: unknown;
}

describe("DataRepository", () => {
    let repository: DataRepository<TestRecord>;
    let mockDatabase: IDataRepositoryProvider<TestRecord>;

    beforeEach(() => {
        repository = new DataRepository<TestRecord>();

        // Create a complete mock database provider
        mockDatabase = {
            schema: null,
            name: "test",
            get: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            replace: jest.fn(),
            delete: jest.fn(),
            list: jest.fn(),
        };
    });

    describe("constructor", () => {
        it("should initialize with null database", () => {
            expect(repository.database).toBeNull();
        });
    });

    describe("setDatabase", () => {
        it("should set the database provider", () => {
            repository.setDatabase(mockDatabase);
            expect(repository.database).toBe(mockDatabase);
        });
    });

    describe("has method", () => {
        it("should return false when no database is set", () => {
            expect(repository.has("get")).toBe(false);
            expect(repository.has("create")).toBe(false);
            expect(repository.has("update")).toBe(false);
            expect(repository.has("replace")).toBe(false);
            expect(repository.has("delete")).toBe(false);
            expect(repository.has("list")).toBe(false);
        });

        it("should return true when database supports the method", () => {
            repository.setDatabase(mockDatabase);

            expect(repository.has("get")).toBe(true);
            expect(repository.has("create")).toBe(true);
            expect(repository.has("update")).toBe(true);
            expect(repository.has("replace")).toBe(true);
            expect(repository.has("delete")).toBe(true);
            expect(repository.has("list")).toBe(true);
        });

        it("should return false when database does not support the method", () => {
            const partialDatabase: IDataRepositoryProvider<TestRecord> = {
                schema: null,
                name: "test",
                get: jest.fn(),
                create: jest.fn(),
                // Missing other methods
            };

            repository.setDatabase(partialDatabase);

            expect(repository.has("get")).toBe(true);
            expect(repository.has("create")).toBe(true);
            expect(repository.has("update")).toBe(false);
            expect(repository.has("replace")).toBe(false);
            expect(repository.has("delete")).toBe(false);
            expect(repository.has("list")).toBe(false);
        });

        it("should return false when method exists but is not a function", () => {
            const invalidDatabase = {
                get: "not a function",
                create: jest.fn(),
            } as unknown as IDataRepositoryProvider<TestRecord>;

            repository.setDatabase(invalidDatabase);

            expect(repository.has("get")).toBe(false);
            expect(repository.has("create")).toBe(true);
        });
    });

    describe("get method", () => {
        it("should throw error when no database is set", async () => {
            await expect(() => repository.get("123xxx")).toThrow(
                "Database provider not set or does not support 'get' operation",
            );
        });

        it("should throw error when database does not support get", async () => {
            const partialDatabase: IDataRepositoryProvider<TestRecord> = {
                schema: null,
                name: "test",
                create: jest.fn(),
            };

            repository.setDatabase(partialDatabase);

            await expect(() => repository.get("123zzz")).toThrow(
                "Database provider not set or does not support 'get' operation",
            );
        });

        it("should call database.get with correct parameters", async () => {
            const mockRecord: TestRecord = {
                id: "123",
                name: "Test User",
                email: "test@example.com",
                createdAt: new Date(),
            };

            (mockDatabase.get as jest.Mock).mockResolvedValue(mockRecord);
            repository.setDatabase(mockDatabase);

            const result = await repository.get("123");

            expect(mockDatabase.get).toHaveBeenCalledWith("123");
            expect(result).toBe(mockRecord);
        });

        it("should return null when record not found", async () => {
            (mockDatabase.get as jest.Mock).mockResolvedValue(null);
            repository.setDatabase(mockDatabase);

            const result = await repository.get("nonexistent");

            expect(mockDatabase.get).toHaveBeenCalledWith("nonexistent");
            expect(result).toBeNull();
        });
    });

    describe("create method", () => {
        it("should throw error when no database is set", async () => {
            const testData: TestRecord = {
                id: "123",
                name: "Test User",
                email: "test@example.com",
                createdAt: new Date(),
            };

            await expect(() => repository.create(testData)).toThrow(
                "Database provider not set or does not support 'create' operation",
            );
        });

        it("should call database.create with correct parameters", async () => {
            const testData: TestRecord = {
                id: "123",
                name: "Test User",
                email: "test@example.com",
                createdAt: new Date(),
            };

            (mockDatabase.create as jest.Mock).mockResolvedValue(testData);
            repository.setDatabase(mockDatabase);

            const result = await repository.create(testData);

            expect(mockDatabase.create).toHaveBeenCalledWith(testData);
            expect(result).toBe(testData);
        });
    });

    describe("update method", () => {
        it("should throw error when no database is set", async () => {
            const patch = { name: "Updated Name" };

            await expect(() => repository.update("123", patch)).toThrow(
                "Database provider not set or does not support 'update' operation",
            );
        });

        it("should call database.update with correct parameters", async () => {
            const patch = { name: "Updated Name" };
            const updatedRecord: TestRecord = {
                id: "123",
                name: "Updated Name",
                email: "test@example.com",
                createdAt: new Date(),
            };

            (mockDatabase.update as jest.Mock).mockResolvedValue(updatedRecord);
            repository.setDatabase(mockDatabase);

            const result = await repository.update("123", patch);

            expect(mockDatabase.update).toHaveBeenCalledWith("123", patch);
            expect(result).toBe(updatedRecord);
        });
    });

    describe("replace method", () => {
        it("should throw error when no database is set", async () => {
            const testData: TestRecord = {
                id: "123",
                name: "Test User",
                email: "test@example.com",
                createdAt: new Date(),
            };

            await expect(() => repository.replace("123", testData)).toThrow(
                "Database provider not set or does not support 'replace' operation",
            );
        });

        it("should call database.replace with correct parameters", async () => {
            const testData: TestRecord = {
                id: "123",
                name: "Test User",
                email: "test@example.com",
                createdAt: new Date(),
            };

            (mockDatabase.replace as jest.Mock).mockResolvedValue(testData);
            repository.setDatabase(mockDatabase);

            const result = await repository.replace("123", testData);

            expect(mockDatabase.replace).toHaveBeenCalledWith("123", testData);
            expect(result).toBe(testData);
        });
    });

    describe("delete method", () => {
        it("should throw error when no database is set", async () => {
            await expect(() => repository.delete("123")).toThrow(
                "Database provider not set or does not support 'delete' operation",
            );
        });

        it("should call database.delete with correct parameters", async () => {
            const deletedCount = 1;

            (mockDatabase.delete as jest.Mock).mockResolvedValue(deletedCount);
            repository.setDatabase(mockDatabase);

            const result = await repository.delete("123");

            expect(mockDatabase.delete).toHaveBeenCalledWith("123");
            expect(result).toBe(deletedCount);
        });
    });

    describe("list method", () => {
        it("should throw error when no database is set", async () => {
            const query: QueryListParam = {
                resource: "test",
                filter: [],
                range: { offset: 0, limit: 10 },
                sort: [],
            };

            await expect(() => repository.list(query)).toThrow(
                "Database provider not set or does not support 'list' operation",
            );
        });

        it("should call database.list with correct parameters", async () => {
            const query: QueryListParam = {
                resource: "test",
                filter: [],
                range: { offset: 0, limit: 10 },
                sort: [],
            };

            const mockResults: QueryListResults<TestRecord> = {
                data: [
                    {
                        id: "1",
                        name: "User 1",
                        email: "user1@example.com",
                        createdAt: new Date(),
                    },
                ],
                total: 1,
            };

            (mockDatabase.list as jest.Mock).mockResolvedValue(mockResults);
            repository.setDatabase(mockDatabase);

            const result = await repository.list(query);

            expect(mockDatabase.list).toHaveBeenCalledWith(query);
            expect(result).toBe(mockResults);
        });
    });
});
