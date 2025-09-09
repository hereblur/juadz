import { object, string } from "zod";
import {
    QueryFilter,
    QueryListAdaptor,
    QueryListParam,
    QueryListResults,
} from "../types/crud";

function strToInt(s: string | undefined, def: number) {
    if (s === null || s === undefined) return def;

    const n: number = parseInt(s, 10);
    if (isNaN(n)) return def;
    return n;
}

const DefaultAdaptor: QueryListAdaptor<unknown> = {
    parser: (resource: string, queryString?: Record<string, string> | null) => {
        const filter: QueryFilter[] = (queryString?.filter || "")
            .split(",")
            .map((f: string) => {
                if (f.trim() === "") {
                    return null;
                }
                const [field, value] = f.split(":");
                return {
                    field,
                    op: "=",
                    value,
                };
            })
            .filter((f) => f !== null) as QueryFilter[];
        return {
            resource,
            filter,
            range: {
                limit: strToInt(queryString?.limit, 10),
                offset: strToInt(queryString?.offset, 0),
            },
            sort: queryString?.sort
                ? [
                      {
                          field: queryString?.sort.replace(/^-/, ""),
                          direction: queryString?.sort.startsWith("-")
                              ? "DESC"
                              : "ASC",
                      },
                  ]
                : [],
        };
    },

    response: (
        result: QueryListResults<unknown>,
        params: QueryListParam,
        name: string,
    ) => {
        return {
            body: result.data,
            headers: {
                [`X-total-${name}`]: `${result.total}`,
            },
        };
    },

    params: [],

    querySchema: object({
        filter: string()
            .optional()
            .meta({ examples: ["status:ACTIVE"] }),
        limit: string()
            .optional()
            .meta({ examples: ["20"] }),
        offset: string()
            .optional()
            .meta({ examples: ["0"] }),
        sort: string()
            .optional()
            .meta({ examples: ["-id", "id", "age", "-age"] }),
    }),
};

export default DefaultAdaptor;
