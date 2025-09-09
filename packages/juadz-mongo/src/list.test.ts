import { describe, it, expect, beforeEach, vi } from "vitest";
import { ObjectId } from "mongodb";
import { QueryListParam, QuerySort } from "@juadz/core";
import {
    MongoQueryList,
    MongoQueryListBuildConditions,
    convertToSort,
    MongoQueryListOptions,
} from "./list";

// Mock MongoDB Collection
const mockCollection = {
    find: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    toArray: vi.fn(),
    countDocuments: vi.fn(),
};

describe("MongoQueryListBuildConditions", () => {
    const defaultOptions: MongoQueryListOptions = {
        searchable: ["name", "description"],
        filterable: ["status", "category"],
        sortable: ["createdAt", "name"],
        mongoIds: ["userId", "categoryId"],
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Basic operators", () => {
        it("should handle equality operator", () => {
            const params: QueryListParam = {
                filter: [{ field: "status", op: "=", value: "active" }],
                sort: [],
                range: { offset: 0, limit: 10 },
            };

            const result = MongoQueryListBuildConditions(
                params,
                defaultOptions,
            );

            expect(result).toEqual({
                status: { $eq: "active" },
            });
        });

        it("should handle not equal operator", () => {
            const params: QueryListParam = {
                filter: [{ field: "status", op: "!=", value: "deleted" }],
                sort: [],
                range: { offset: 0, limit: 10 },
            };

            const result = MongoQueryListBuildConditions(
                params,
                defaultOptions,
            );

            expect(result).toEqual({
                status: { $ne: "deleted" },
            });
        });

        it("should handle comparison operators", () => {
            const params: QueryListParam = {
                filter: [
                    { field: "age", op: ">", value: 18 },
                    { field: "score", op: ">=", value: 80 },
                    { field: "count", op: "<", value: 100 },
                    { field: "rating", op: "<=", value: 5 },
                ],
                sort: [],
                range: { offset: 0, limit: 10 },
            };

            const result = MongoQueryListBuildConditions(
                params,
                defaultOptions,
            );

            expect(result).toEqual({
                age: { $gt: 18 },
                score: { $gte: 80 },
                count: { $lt: 100 },
                rating: { $lte: 5 },
            });
        });

        it("should handle in and not in operators", () => {
            const params: QueryListParam = {
                filter: [
                    { field: "status", op: "in", value: ["active", "pending"] },
                    { field: "type", op: "!in", value: ["spam", "deleted"] },
                ],
                sort: [],
                range: { offset: 0, limit: 10 },
            };

            const result = MongoQueryListBuildConditions(
                params,
                defaultOptions,
            );

            expect(result).toEqual({
                status: { $in: ["active", "pending"] },
                type: { $nin: ["spam", "deleted"] },
            });
        });

        it("should handle contains operator", () => {
            const params: QueryListParam = {
                filter: [
                    { field: "name", op: "contains", value: "john" },
                    { field: "email", op: "!contains", value: "spam" },
                ],
                sort: [],
                range: { offset: 0, limit: 10 },
            };

            const result = MongoQueryListBuildConditions(
                params,
                defaultOptions,
            );

            expect(result).toEqual({
                name: { $regex: "john", $options: "i" },
                email: { $not: { $regex: "spam", $options: "i" } },
            });
        });

        it("should handle between operator", () => {
            const params: QueryListParam = {
                filter: [
                    { field: "age", op: "between", value: [18, 65] },
                    { field: "score", op: "!between", value: [0, 50] },
                ],
                sort: [],
                range: { offset: 0, limit: 10 },
            };

            const result = MongoQueryListBuildConditions(
                params,
                defaultOptions,
            );

            expect(result).toEqual({
                age: { $gte: 18, $lte: 65 },
                score: { $not: { $gte: 0, $lte: 50 } },
            });
        });

        it("should handle null operators", () => {
            const params: QueryListParam = {
                filter: [
                    { field: "deletedAt", op: "null", value: null },
                    { field: "updatedAt", op: "!null", value: null },
                ],
                sort: [],
                range: { offset: 0, limit: 10 },
            };

            const result = MongoQueryListBuildConditions(
                params,
                defaultOptions,
            );

            expect(result).toEqual({
                deletedAt: { $eq: null },
                updatedAt: { $ne: null },
            });
        });
    });

    describe("ObjectId handling", () => {
        it("should convert values to ObjectId for mongoId fields", () => {
            const params: QueryListParam = {
                filter: [
                    {
                        field: "userId",
                        op: "=",
                        value: "507f1f77bcf86cd799439011",
                    },
                    {
                        field: "categoryId",
                        op: "in",
                        value: [
                            "507f1f77bcf86cd799439012",
                            "507f1f77bcf86cd799439013",
                        ],
                    },
                ],
                sort: [],
                range: { offset: 0, limit: 10 },
            };

            const result = MongoQueryListBuildConditions(
                params,
                defaultOptions,
            );

            expect(result.userId).toEqual({
                $eq: new ObjectId("507f1f77bcf86cd799439011"),
            });
            expect(result.categoryId).toEqual({
                $in: [
                    new ObjectId("507f1f77bcf86cd799439012"),
                    new ObjectId("507f1f77bcf86cd799439013"),
                ],
            });
        });

        it("should convert id field to _id", () => {
            const params: QueryListParam = {
                filter: [
                    { field: "id", op: "=", value: "507f1f77bcf86cd799439011" },
                ],
                sort: [],
                range: { offset: 0, limit: 10 },
            };

            const result = MongoQueryListBuildConditions(
                params,
                defaultOptions,
            );

            expect(result._id).toEqual({ $eq: "507f1f77bcf86cd799439011" });
            expect(result.id).toBeUndefined();
        });
    });

    describe("Free text search", () => {
        it("should handle free text search", () => {
            const params: QueryListParam = {
                filter: [{ field: "_search", op: "=", value: "john doe" }],
                sort: [],
                range: { offset: 0, limit: 10 },
            };

            const result = MongoQueryListBuildConditions(
                params,
                defaultOptions,
            );

            expect(result).toEqual({
                name: { $regex: "john doe", $options: "i" },
                description: { $regex: "john doe", $options: "i" },
            });
        });
    });

    describe("Multiple conditions on same field", () => {
        it("should merge conditions for same field", () => {
            const params: QueryListParam = {
                filter: [
                    { field: "age", op: ">=", value: 18 },
                    { field: "age", op: "<", value: 65 },
                ],
                sort: [],
                range: { offset: 0, limit: 10 },
            };

            const result = MongoQueryListBuildConditions(
                params,
                defaultOptions,
            );

            expect(result).toEqual({
                age: { $gte: 18, $lt: 65 },
            });
        });
    });

    describe("Ignore fields", () => {
        it("should ignore specified fields", () => {
            const options: MongoQueryListOptions = {
                ...defaultOptions,
                ignoreFields: ["internalField"],
            };

            const params: QueryListParam = {
                filter: [
                    { field: "status", op: "=", value: "active" },
                    { field: "internalField", op: "=", value: "secret" },
                ],
                sort: [],
                range: { offset: 0, limit: 10 },
            };

            const result = MongoQueryListBuildConditions(params, options);

            expect(result).toEqual({
                status: { $eq: "active" },
            });
            expect(result.internalField).toBeUndefined();
        });
    });
});

describe("convertToSort", () => {
    it("should convert ASC to 1", () => {
        const sort: QuerySort[] = [
            { field: "name", direction: "ASC" },
            { field: "createdAt", direction: "asc" },
        ];

        const result = convertToSort(sort);

        expect(result).toEqual({
            name: 1,
            createdAt: 1,
        });
    });

    it("should convert DESC to -1", () => {
        const sort: QuerySort[] = [
            { field: "name", direction: "DESC" },
            { field: "createdAt", direction: "desc" },
        ];

        const result = convertToSort(sort);

        expect(result).toEqual({
            name: -1,
            createdAt: -1,
        });
    });

    it("should default to DESC (-1) for unknown directions", () => {
        const sort: QuerySort[] = [
            { field: "name", direction: "UNKNOWN" as unknown },
            { field: "createdAt" }, // No direction
        ];

        const result = convertToSort(sort);

        expect(result).toEqual({
            name: -1,
            createdAt: -1,
        });
    });

    it("should handle empty sort array", () => {
        const result = convertToSort([]);
        expect(result).toEqual({});
    });
});

describe("MongoQueryList", () => {
    const mockData = [
        {
            _id: new ObjectId("507f1f77bcf86cd799439011"),
            name: "John",
            age: 25,
        },
        {
            _id: new ObjectId("507f1f77bcf86cd799439012"),
            name: "Jane",
            age: 30,
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockCollection.toArray.mockResolvedValue(mockData);
        mockCollection.countDocuments.mockResolvedValue(2);
    });

    it("should execute query with correct parameters", async () => {
        const options: MongoQueryListOptions = {
            searchable: ["name"],
            filterable: ["age"],
            sortable: ["name"],
            mongoIds: [],
        };

        const params: QueryListParam = {
            filter: [{ field: "age", op: ">", value: 20 }],
            sort: [{ field: "name", direction: "ASC" }],
            range: { offset: 10, limit: 5 },
        };

        const queryFunc = MongoQueryList(options, mockCollection as unknown);
        // const result =
        await queryFunc(params);

        expect(mockCollection.find).toHaveBeenCalledWith({
            age: { $gt: 20 },
        });
        expect(mockCollection.skip).toHaveBeenCalledWith(10);
        expect(mockCollection.limit).toHaveBeenCalledWith(5);
        expect(mockCollection.sort).toHaveBeenCalledWith({ name: 1 });
        expect(mockCollection.countDocuments).toHaveBeenCalledWith({
            age: { $gt: 20 },
        });
    });

    it("should transform _id to id in results", async () => {
        const options: MongoQueryListOptions = {};
        const params: QueryListParam = {
            filter: [],
            sort: [],
            range: { offset: 0, limit: 10 },
        };

        const queryFunc = MongoQueryList(options, mockCollection as unknown);
        const result = await queryFunc(params);

        expect(result.data).toEqual([
            {
                id: "507f1f77bcf86cd799439011",
                _id: new ObjectId("507f1f77bcf86cd799439011"),
                name: "John",
                age: 25,
            },
            {
                id: "507f1f77bcf86cd799439012",
                _id: new ObjectId("507f1f77bcf86cd799439012"),
                name: "Jane",
                age: 30,
            },
        ]);
        expect(result.total).toBe(2);
    });

    it("should handle empty results", async () => {
        mockCollection.toArray.mockResolvedValue([]);
        mockCollection.countDocuments.mockResolvedValue(0);

        const options: MongoQueryListOptions = {};
        const params: QueryListParam = {
            filter: [],
            sort: [],
            range: { offset: 0, limit: 10 },
        };

        const queryFunc = MongoQueryList(options, mockCollection as unknown);
        const result = await queryFunc(params);

        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
    });

    it("should handle complex query with all features", async () => {
        const options: MongoQueryListOptions = {
            searchable: ["name", "description"],
            filterable: ["status", "category"],
            sortable: ["createdAt", "name"],
            mongoIds: ["userId"],
        };

        const params: QueryListParam = {
            filter: [
                { field: "_search", op: "=", value: "john" },
                { field: "status", op: "in", value: ["active", "pending"] },
                { field: "userId", op: "=", value: "507f1f77bcf86cd799439013" },
            ],
            sort: [
                { field: "createdAt", direction: "DESC" },
                { field: "name", direction: "ASC" },
            ],
            range: { offset: 20, limit: 50 },
        };

        const queryFunc = MongoQueryList(options, mockCollection as unknown);
        await queryFunc(params);

        expect(mockCollection.find).toHaveBeenCalledWith({
            name: { $regex: "john", $options: "i" },
            description: { $regex: "john", $options: "i" },
            status: { $in: ["active", "pending"] },
            userId: { $eq: new ObjectId("507f1f77bcf86cd799439013") },
        });
        expect(mockCollection.skip).toHaveBeenCalledWith(20);
        expect(mockCollection.limit).toHaveBeenCalledWith(50);
        expect(mockCollection.sort).toHaveBeenCalledWith({
            createdAt: -1,
            name: 1,
        });
    });
});

describe("Integration tests", () => {
    it("should work end-to-end with realistic data", async () => {
        const mockUsers = [
            {
                _id: new ObjectId("507f1f77bcf86cd799439011"),
                name: "John Doe",
                email: "john@example.com",
                age: 25,
                status: "active",
                createdAt: new Date("2023-01-01"),
            },
            {
                _id: new ObjectId("507f1f77bcf86cd799439012"),
                name: "Jane Smith",
                email: "jane@example.com",
                age: 30,
                status: "pending",
                createdAt: new Date("2023-01-02"),
            },
        ];

        mockCollection.toArray.mockResolvedValue(mockUsers);
        mockCollection.countDocuments.mockResolvedValue(2);

        const options: MongoQueryListOptions = {
            searchable: ["name", "email"],
            filterable: ["status", "age"],
            sortable: ["name", "createdAt"],
            mongoIds: [],
        };

        const params: QueryListParam = {
            filter: [
                { field: "status", op: "in", value: ["active", "pending"] },
                { field: "age", op: ">=", value: 18 },
            ],
            sort: [{ field: "createdAt", direction: "DESC" }],
            range: { offset: 0, limit: 10 },
        };

        const queryFunc = MongoQueryList(options, mockCollection as unknown);
        const result = await queryFunc(params);

        expect(result.total).toBe(2);
        expect(result.data).toHaveLength(2);
        expect(result.data[0].id).toBe("507f1f77bcf86cd799439011");
        expect(result.data[0].name).toBe("John Doe");
    });
});
