import { vi } from "vitest";

// Mock ObjectId for consistent testing
vi.mock("mongodb", async () => {
    const actual = await vi.importActual("mongodb");
    return {
        ...actual,
        ObjectId: vi.fn().mockImplementation((id) => ({
            toString: () => id || "507f1f77bcf86cd799439011",
            toHexString: () => id || "507f1f77bcf86cd799439011",
        })),
    };
});
