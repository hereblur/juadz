import { ObjectId } from "mongodb";
import { QueryListParam } from "@juadz/core";
import { vi } from "vitest";

export const createMockCollection = () => ({
    find: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    toArray: vi.fn(),
    countDocuments: vi.fn(),
});

export const createQueryParams = (
    overrides: Partial<QueryListParam> = {},
): QueryListParam => ({
    filter: [],
    sort: [],
    range: { offset: 0, limit: 10 },
    ...overrides,
});

export const createMockDocument = (data: Record<string, unknown> = {}) => ({
    _id: new ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
});

