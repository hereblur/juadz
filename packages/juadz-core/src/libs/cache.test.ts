import { ICacheAdaptor } from "../types/cache";
import CacheManager, { CacheNothing } from "./cache";
import { consistentStringifyDeep } from "./cache";

describe("consistentStringifyDeep", () => {
    // const { consistentStringifyDeep } = jest.requireActual('./cache');

    it("stringifies objects with sorted keys", () => {
        const a = { b: 2, a: 1 };
        const b = { a: 1, b: 2 };
        expect(consistentStringifyDeep(a)).toBe(consistentStringifyDeep(b));
    });

    it("handles arrays and nested objects", () => {
        const obj = { arr: [{ z: 2, y: 1 }, { a: 3 }] };
        expect(typeof consistentStringifyDeep(obj)).toBe("string");
    });

    it("handles primitives", () => {
        expect(consistentStringifyDeep(42)).toBe("42");
        expect(consistentStringifyDeep(null)).toBe("null");
        expect(consistentStringifyDeep("foo")).toBe('"foo"');
    });
});

describe("CacheManager", () => {
    let cache: ICacheAdaptor;
    let manager: CacheManager;

    beforeEach(() => {
        cache = {
            get: jest.fn().mockResolvedValue(null),
            put: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined),
        };
        manager = new CacheManager(cache);
        manager.itemAgeSeconds = 60;
        manager.listAgeSeconds = 120;
    });

    it("fetches from cache if present", async () => {
        (cache.get as jest.Mock).mockResolvedValueOnce("cached");
        const result = await manager.fetch("key", 60, async () => "fresh");
        expect(result).toBe("cached");
        expect(cache.get).toHaveBeenCalledWith("key");
    });

    it("calls fn and puts in cache if not present", async () => {
        (cache.get as jest.Mock).mockResolvedValueOnce(null);
        const result = await manager.fetch("key", 60, async () => "fresh");
        expect(result).toBe("fresh");
        expect(cache.put).toHaveBeenCalledWith("key", "fresh", 60);
    });

    it("get() uses itemAgeSeconds and correct key", async () => {
        (cache.get as jest.Mock).mockResolvedValueOnce(null);
        await manager.get("users", 123, async () => "user");
        expect(cache.get).toHaveBeenCalledWith("users:get:123");
        expect(cache.put).toHaveBeenCalledWith("users:get:123", "user", 60);
    });

    it("list() uses listAgeSeconds and correct key", async () => {
        (cache.get as jest.Mock).mockResolvedValueOnce(null);
        const query = {
            resource: "users",
            filter: [],
            range: { offset: 0, limit: 10 },
            sort: [],
        };
        await manager.list("users", query, async () => ["user"]);
        expect(cache.get).toHaveBeenCalledWith(
            expect.stringContaining("users:list:"),
        );
        expect(cache.put).toHaveBeenCalled();
    });

    it("get() bypasses cache if itemAgeSeconds < 0", async () => {
        manager.itemAgeSeconds = -1;
        const fn = jest.fn().mockResolvedValue("direct");
        const result = await manager.get("users", 1, fn);
        expect(result).toBe("direct");
        expect(fn).toHaveBeenCalled();
        expect(cache.get).not.toHaveBeenCalled();
    });

    it("list() bypasses cache if listAgeSeconds < 0", async () => {
        manager.listAgeSeconds = -1;
        const fn = jest.fn().mockResolvedValue(["direct"]);
        const query = {
            resource: "users",
            filter: [],
            range: { offset: 0, limit: 10 },
            sort: [],
        };
        const result = await manager.list("users", query, fn);
        expect(result).toEqual(["direct"]);
        expect(fn).toHaveBeenCalled();
        expect(cache.get).not.toHaveBeenCalled();
    });

    it("invalidate deletes item and list keys", async () => {
        await manager.invalidate("users", 1);
        expect(cache.delete).toHaveBeenCalledWith("users:get:1");
        expect(cache.delete).toHaveBeenCalledWith("users:list:*");
    });

    it("invalidate deletes only list if id is null", async () => {
        await manager.invalidate("users", null);
        expect(cache.delete).toHaveBeenCalledWith("users:list:*");
    });
});

describe("CacheNothing", () => {
    it("all methods resolve as expected", async () => {
        await expect(CacheNothing.get("x")).resolves.toBeNull();
        await expect(CacheNothing.put("x", 1, 1)).resolves.toBeUndefined();
        await expect(CacheNothing.delete("x")).resolves.toBeUndefined();
    });
});
